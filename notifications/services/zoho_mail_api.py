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
        logger.info('Zoho folders unavailable for %s: %s', account_id, e)
        return []


def list_messages(token, account_id, limit=50, folder_id=None):
    """Recent messages for the account (newest first), optionally in one
    folder."""
    params = {'limit': limit}
    if folder_id:
        params['folderId'] = folder_id
    r = requests.get(
        f'{_mail_base()}/accounts/{account_id}/messages/view',
        headers=_auth(token), params=params, timeout=30,
    )
    r.raise_for_status()
    return r.json().get('data', []) or []


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


def sync(limit=50, fetch_bodies=True):
    """Pull recent messages into IncomingEmail rows (what the dashboard inbox
    renders). Idempotent — messages already stored (by message_id) are skipped.

    Zoho only lets a token read its own owner's mail, so this runs once per
    token: the org token in settings (covers its own mailbox and discovers the
    others), plus each mailbox that has connected its own refresh token.
    Returns total saved."""
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
            EmailAccount.objects.filter(pk=ea.pk).update(last_sync_error=str(e)[:500])
    logger.info('Zoho API sync: saved %d new email(s)', total)
    return total


def _sync_one(refresh_token, limit, fetch_bodies, only_address=None,
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

        # Mirror the standard folders, not just the inbox, so the mail page can
        # offer Sent/Drafts/Spam/Trash the way a mail client does.
        targets = []
        for f in get_folders(token, account_id):
            name = (f.get('folderName') or '').strip().lower()
            mapped = FOLDER_MAP.get(name)
            fid = f.get('folderId') or f.get('folderID')
            if mapped and fid:
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
