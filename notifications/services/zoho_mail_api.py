# notifications/services/zoho_mail_api.py
"""Read Zoho mailboxes via the Zoho Mail REST API (OAuth).

Why not IMAP? Zoho blocks IMAP/POP logins from Render's datacenter IPs
("[ALERT] LOGIN DENIED -- COUNTRY IS BLACKLISTED"). The REST API is not
geo-blocked the same way, so we sync the in-app inbox through it instead.

Auth: OAuth2 refresh-token flow. Set ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET /
ZOHO_REFRESH_TOKEN (scope ZohoMail.messages.READ, ZohoMail.accounts.READ) in the
environment. See core.management.commands.zoho_oauth_exchange to mint the
refresh token from a grant code.
"""

import logging
from datetime import datetime, timezone as dt_timezone

import requests
from django.conf import settings
from django.db.models import Q as models_Q
from django.utils import timezone

logger = logging.getLogger(__name__)


def _accounts_base():
    return getattr(settings, 'ZOHO_ACCOUNTS_BASE', 'https://accounts.zoho.com')


def _mail_base():
    return getattr(settings, 'ZOHO_MAIL_BASE', 'https://mail.zoho.com/api')


def is_configured():
    return all([
        getattr(settings, 'ZOHO_CLIENT_ID', ''),
        getattr(settings, 'ZOHO_CLIENT_SECRET', ''),
        getattr(settings, 'ZOHO_REFRESH_TOKEN', ''),
    ])


def get_access_token(refresh_token=None, client_id=None, client_secret=None):
    """Exchange a refresh token for a short-lived access token.

    Defaults to the org-wide credentials in settings; a mailbox connected from
    its own Zoho login passes its own token *and* its own client credentials
    (a Self Client belongs to the account that created it).
    """
    r = requests.post(f'{_accounts_base()}/oauth/v2/token', data={
        'refresh_token': refresh_token or settings.ZOHO_REFRESH_TOKEN,
        'client_id': client_id or settings.ZOHO_CLIENT_ID,
        'client_secret': client_secret or settings.ZOHO_CLIENT_SECRET,
        'grant_type': 'refresh_token',
    }, timeout=20)
    r.raise_for_status()
    data = r.json()
    token = data.get('access_token')
    if not token:
        raise RuntimeError(f'Zoho token refresh failed: {data}')
    return token


def _auth(token):
    return {'Authorization': f'Zoho-oauthtoken {token}'}


def get_accounts(token):
    """Mailboxes this token can read.

    With an organization scope (ZohoMail.organization.accounts.READ) an admin
    token sees every mailbox in the org — that's what powers the per-staff
    inboxes. Without it, Zoho returns just the authorising user's own mailbox,
    which is still enough for a single shared inbox.
    """
    accounts = []
    try:
        r = requests.get(f'{_mail_base()}/organization/accounts',
                         headers=_auth(token), timeout=20)
        if r.ok:
            accounts = r.json().get('data', []) or []
    except Exception as e:
        logger.info('Zoho org accounts unavailable (%s) — using own account', e)

    if not accounts:
        r = requests.get(f'{_mail_base()}/accounts', headers=_auth(token), timeout=20)
        r.raise_for_status()
        accounts = r.json().get('data', []) or []
    return accounts


# Folders worth mirroring into the app, mapped to the names the UI uses.
# Anything else in the mailbox (custom folders) is skipped.
FOLDER_MAP = {
    'inbox': 'inbox',
    'sent': 'sent',
    'drafts': 'drafts',
    'draft': 'drafts',
    'spam': 'spam',
    'junk': 'spam',
    'trash': 'trash',
    'deleted': 'trash',
    'archive': 'archive',
}


def get_folders(token, account_id):
    """The account's folders, so the app can mirror Sent/Drafts/Spam/... and
    not just the inbox."""
    try:
        r = requests.get(f'{_mail_base()}/accounts/{account_id}/folders',
                         headers=_auth(token), timeout=20)
        r.raise_for_status()
        return r.json().get('data', []) or []
    except Exception as e:
        # Usually just means this token doesn't own that mailbox — the org
        # token can list far more than it may read, and each mailbox fetches
        # its own folders on its own pass. Only worth noting at debug level.
        logger.debug('Zoho folders unavailable for %s (needs ZohoMail.folders.READ '
                     'on that mailbox token): %s', account_id, e)
        return []


# Zoho caps a single messages/view response; walk pages with `start` to read a
# whole mailbox rather than just the most recent slice.
PAGE_SIZE = 200


def _list_page(token, account_id, start, limit, folder_id=None):
    params = {'limit': limit, 'start': start}
    if folder_id:
        params['folderId'] = folder_id
    r = requests.get(
        f'{_mail_base()}/accounts/{account_id}/messages/view',
        headers=_auth(token), params=params, timeout=30,
    )
    r.raise_for_status()
    return r.json().get('data', []) or []


def list_messages(token, account_id, limit=None, folder_id=None):
    """Every message in the account (or one folder), newest first.

    `limit` caps the total when you deliberately want a sample; left as None it
    pages through the whole mailbox, because a business inbox mirrored into the
    system should be complete, not a recent slice.
    """
    out, start = [], 1
    while True:
        want = PAGE_SIZE if limit is None else min(PAGE_SIZE, limit - len(out))
        if want <= 0:
            break
        page = _list_page(token, account_id, start, want, folder_id)
        out.extend(page)
        if len(page) < want:       # last page
            break
        start += len(page)
    return out


def get_content(token, account_id, folder_id, message_id):
    r = requests.get(
        f'{_mail_base()}/accounts/{account_id}/folders/{folder_id}/messages/{message_id}/content',
        headers=_auth(token), timeout=30,
    )
    r.raise_for_status()
    return r.json().get('data', {}) or {}


def _parse_ts(ms):
    try:
        return datetime.fromtimestamp(int(ms) / 1000, tz=dt_timezone.utc)
    except Exception:
        return timezone.now()


def sync(limit=None, fetch_bodies=True):
    """Pull recent messages into IncomingEmail rows (what the dashboard inbox
    renders). Idempotent — messages already stored (by message_id) are skipped.

    Zoho only lets a token read its own owner's mail, so this runs once per
    token: the org token in settings (covers its own mailbox and discovers the
    others), plus each mailbox that has connected its own refresh token.

    `limit` is a deliberate sample size; by default every message is mirrored,
    since the point of holding mail here is to have all of it. Returns total
    saved."""
    if not is_configured():
        logger.warning('Zoho API not configured — skipping sync')
        return 0

    from notifications.models import EmailAccount, IncomingEmail

    # Mail synced before its mailbox row existed has no account, which makes it
    # admin-only. Re-attach it by recipient so it shows in the right inbox.
    for ea in EmailAccount.objects.all():
        IncomingEmail.objects.filter(
            account__isnull=True, recipient__iexact=ea.email_address
        ).update(account=ea)

    total = _sync_one(None, limit, fetch_bodies)
    for ea in EmailAccount.objects.exclude(oauth_refresh_token='').filter(is_active=True):
        try:
            total += _sync_one(ea.oauth_refresh_token, limit, fetch_bodies,
                               only_address=ea.email_address.lower(),
                               client_id=ea.oauth_client_id or None,
                               client_secret=ea.oauth_client_secret or None)
        except Exception as e:
            logger.warning('Zoho sync failed for %s: %s', ea.email_address, e)
            # Tell someone the first time a mailbox breaks. A dead token is
            # otherwise silent — mail simply stops arriving, and the first sign
            # is a colleague asking where their messages went.
            if not ea.last_sync_error:
                _alert_admins(ea.email_address, str(e))
            EmailAccount.objects.filter(pk=ea.pk).update(last_sync_error=str(e)[:500])
    logger.info('Zoho API sync: saved %d new email(s)', total)
    return total


def _alert_admins(mailbox, error):
    """Raise an in-app notice for admins when a mailbox stops syncing."""
    try:
        from django.contrib.auth import get_user_model
        from notifications.models import Notification
        reconnect = ('Reconnect with: python manage.py zoho_connect_mailbox '
                     f'--email={mailbox} --code=… --client-id=… --client-secret=…')
        for admin in get_user_model().objects.filter(is_active=True).filter(
                models_Q(is_superuser=True) | models_Q(role__name__iexact='admin')).distinct():
            Notification.objects.create(
                recipient=admin, notification_type='system',
                title=f'{mailbox} stopped syncing',
                message=f'{error[:200]}\n\n{reconnect}',
                related_link='/email-inbox',
            )
    except Exception as e:
        logger.warning('Could not raise mailbox alert: %s', e)


def _sync_one(refresh_token, limit=None, fetch_bodies=True, only_address=None,
              client_id=None, client_secret=None):
    """Sync the mailboxes readable by one token. `only_address` restricts it to
    that mailbox (used for per-mailbox tokens)."""
    from notifications.models import IncomingEmail, EmailAccount

    token = get_access_token(refresh_token, client_id, client_secret)
    accounts = get_accounts(token)
    if not accounts:
        logger.warning('Zoho API returned no accounts')
        return 0

    saved = 0
    for acc in accounts:
        account_id = acc.get('accountId') or acc.get('account_id')
        primary = (acc.get('primaryEmailAddress') or acc.get('mailboxAddress')
                   or acc.get('incomingUserName') or '').lower()
        if not account_id:
            continue
        if only_address and primary != only_address:
            continue
        # Map every Zoho mailbox to an EmailAccount so mail lands in the right
        # inbox. New mailboxes are created unassigned (not shared, no owner) —
        # admin-only until someone maps them, so nothing leaks by default.
        ea = None
        if primary:
            ea = EmailAccount.objects.filter(email_address__iexact=primary).first()
            if ea is None:
                ea = EmailAccount.objects.create(
                    email_address=primary, provider='zoho_api', is_active=True, is_shared=False,
                )
                logger.info('Created EmailAccount for %s (unassigned — map an owner or mark shared)', primary)

        # Every folder, not a chosen few. The six standard names keep their
        # own labels so the mail page can offer Sent/Drafts/Spam/Trash the way
        # a mail client does; anything else — a folder someone made, or one a
        # migration created — is mirrored under its own name rather than
        # skipped. A message we never look at is a message that does not exist
        # as far as search is concerned.
        targets = []
        for f in get_folders(token, account_id):
            raw = (f.get('folderName') or '').strip()
            name = raw.lower()
            fid = f.get('folderId') or f.get('folderID')
            if not fid or not raw:
                continue
            mapped = FOLDER_MAP.get(name)
            if not mapped:
                # Outbox holds mail Zoho is still sending; it becomes a real
                # message in Sent a moment later, so mirroring it would only
                # produce duplicates that never resolve.
                if name in ('outbox',):
                    continue
                mapped = name.replace(' ', '_')[:100]
            targets.append((mapped, fid))
        if not targets:
            targets = [('inbox', None)]

        messages = []
        for folder_name, folder_id in targets:
            try:
                for m in list_messages(token, account_id, limit=limit, folder_id=folder_id):
                    m['_folder'] = folder_name
                    messages.append(m)
            except Exception as e:
                logger.warning('Zoho list_messages failed for %s/%s: %s',
                               primary or account_id, folder_name, e)

        for msg in messages:
            mid = str(msg.get('messageId') or msg.get('messageID') or '')
            if not mid or IncomingEmail.objects.filter(message_id=mid).exists():
                continue

            body = ''
            if fetch_bodies:
                folder_id = msg.get('folderId') or msg.get('folderID')
                if folder_id:
                    try:
                        body = (get_content(token, account_id, folder_id, mid) or {}).get('content', '') or ''
                    except Exception as e:
                        logger.warning('Zoho content fetch failed for %s: %s', mid, e)

            try:
                # get_or_create, not create: the same message can be seen twice
                # in one run (and message_id is globally unique), so a re-import
                # should be a quiet no-op rather than an error.
                _, was_created = IncomingEmail.objects.get_or_create(
                    message_id=mid[:500],
                    defaults=dict(
                        account=ea,
                        sender=(msg.get('fromAddress') or '')[:254],
                        sender_name=(msg.get('sender') or '')[:300],
                        recipient=(msg.get('toAddress') or primary or '')[:254],
                        subject=(msg.get('subject') or '')[:500],
                        body=body,
                        body_html=body,
                        received_at=_parse_ts(msg.get('receivedTime') or msg.get('sentDateInGMT')),
                        has_attachments=str(msg.get('hasAttachment')) in ('1', 'true', 'True'),
                        source='zoho_api',
                        folder=msg.get('_folder', 'inbox'),
                    ),
                )
                if was_created:
                    saved += 1
            except Exception as e:
                logger.warning('Zoho save failed for %s: %s', mid, e)

        if ea:
            EmailAccount.objects.filter(pk=ea.pk).update(
                last_synced_at=timezone.now(), last_sync_error='')

    return saved


# ============================================================
# ATTACHMENTS ON MAIL THAT CAME IN
# ============================================================
#
# The sync records that a message has attachments; the files themselves stay
# in Zoho. Pulling every attachment of 1,061 messages into our own storage
# would be a lot of megabytes for files most of which nobody will open, so
# they are fetched on demand — the first time somebody actually clicks one.

def get_attachment_info(token, account_id, folder_id, message_id):
    """What is attached to this message: id, name and size for each file."""
    r = requests.get(
        f'{_mail_base()}/accounts/{account_id}/folders/{folder_id}'
        f'/messages/{message_id}/attachmentinfo',
        headers=_auth(token), timeout=30,
    )
    r.raise_for_status()
    data = r.json().get('data', {}) or {}
    rows = data.get('attachments') if isinstance(data, dict) else data
    out = []
    for a in (rows or []):
        out.append({
            'id': str(a.get('attachmentId') or a.get('attachmentID') or ''),
            'name': a.get('attachmentName') or a.get('fileName') or 'attachment',
            'size': a.get('attachmentSize') or a.get('size') or 0,
        })
    return [a for a in out if a['id']]


def download_attachment(token, account_id, folder_id, message_id, attachment_id, name=''):
    """The bytes of one attachment.

    Zoho has moved this path around between API versions, so the known shapes
    are tried in turn rather than trusting one and failing silently. Every
    attempt is named if none of them work — a bare "could not download" taught
    us nothing the last time.
    """
    from urllib.parse import quote

    base = (f'{_mail_base()}/accounts/{account_id}/folders/{folder_id}'
            f'/messages/{message_id}')
    candidates = [
        f'{base}/attachments/{attachment_id}',
        f'{base}/attachments/{attachment_id}?attachmentName={quote(name or "")}',
        f'{_mail_base()}/accounts/{account_id}/messages/{message_id}'
        f'/attachments/{attachment_id}',
    ]

    attempts = []
    for url in candidates:
        try:
            r = requests.get(url, headers=_auth(token), timeout=60)
            r.raise_for_status()
            # An error can still arrive as 200 with a JSON body, so anything
            # that parses as our error envelope is not the file.
            if r.headers.get('Content-Type', '').startswith('application/json'):
                attempts.append(f'{url.split("?")[0][-60:]}: JSON, not a file')
                continue
            return r.content
        except Exception as e:
            attempts.append(f'{url.split("?")[0][-60:]}: {e}')
    raise RuntimeError(' | '.join(attempts))


def resolve_ids(email):
    """The account and folder ids Zoho needs for one stored message.

    We keep the folder by name (inbox, sent, …) because that is what the mail
    page shows; Zoho wants its own numeric ids. They are looked up from the
    mailbox's own token, which is also the check that this message really
    belongs to a mailbox we can read.
    """
    from ..models import EmailAccount

    account = email.account
    if not account:
        raise RuntimeError('This message is not linked to a mailbox.')

    token = get_access_token(
        account.oauth_refresh_token or None,
        account.oauth_client_id or None,
        account.oauth_client_secret or None,
    )

    wanted = (account.email_address or '').lower()
    account_id = None
    for a in get_accounts(token):
        address = (a.get('primaryEmailAddress') or a.get('mailboxAddress') or '').lower()
        if not account_id or address == wanted:
            account_id = a.get('accountId') or a.get('account_id')
        if address == wanted:
            break
    if not account_id:
        raise RuntimeError(f'Zoho does not list {account.email_address} for this token.')

    folder_id = None
    for f in get_folders(token, account_id):
        name = (f.get('folderName') or '').strip().lower()
        if FOLDER_MAP.get(name, name) == (email.folder or 'inbox'):
            folder_id = f.get('folderId') or f.get('folderID')
            break
    if not folder_id:
        raise RuntimeError(f'No Zoho folder matching "{email.folder}".')

    return token, account_id, folder_id


def deep_sync_due(max_age_hours=24, mailboxes_per_run=1):
    """Walk one whole mailbox end to end, for the mail the quick sync can miss.

    The routine sync looks at the newest messages in each folder, which is
    enough for ordinary traffic. It is not enough for a burst: if more arrive
    between two runs than that window covers, the older ones in the burst fall
    behind the window and are never looked at again — permanently missing from
    a search that is supposed to reach back to 2022.

    So every mailbox is walked in full once a day. It is cheap after the first
    time, because a message already stored is skipped before its body is
    fetched: the cost is listing pages, not downloading mail twice. One
    mailbox per run keeps any single cron request short.
    """
    from datetime import timedelta

    from ..models import EmailAccount

    cutoff = timezone.now() - timedelta(hours=max_age_hours)
    due = EmailAccount.objects.filter(is_active=True).exclude(
        oauth_refresh_token='').filter(
        models_Q(last_deep_sync_at__isnull=True) | models_Q(last_deep_sync_at__lt=cutoff)
    ).order_by('last_deep_sync_at')[:mailboxes_per_run]

    done = []
    for account in due:
        try:
            saved = _sync_one(
                account.oauth_refresh_token,
                limit=None,                       # the whole mailbox
                fetch_bodies=True,
                only_address=account.email_address,
                client_id=account.oauth_client_id or None,
                client_secret=account.oauth_client_secret or None,
            )
            EmailAccount.objects.filter(pk=account.pk).update(
                last_deep_sync_at=timezone.now(), last_sync_error='')
            done.append({'mailbox': account.email_address, 'new': saved})
        except Exception as e:
            logger.error('Deep sync failed for %s: %s', account.email_address, e)
            EmailAccount.objects.filter(pk=account.pk).update(
                last_sync_error=f'Deep sync: {str(e)[:400]}')
            done.append({'mailbox': account.email_address, 'error': str(e)[:200]})
    return done
