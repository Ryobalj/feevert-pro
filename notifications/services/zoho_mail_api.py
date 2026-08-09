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


def get_access_token():
    """Exchange the stored refresh token for a short-lived access token."""
    r = requests.post(f'{_accounts_base()}/oauth/v2/token', data={
        'refresh_token': settings.ZOHO_REFRESH_TOKEN,
        'client_id': settings.ZOHO_CLIENT_ID,
        'client_secret': settings.ZOHO_CLIENT_SECRET,
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
    r = requests.get(f'{_mail_base()}/accounts', headers=_auth(token), timeout=20)
    r.raise_for_status()
    return r.json().get('data', []) or []


def list_messages(token, account_id, limit=50):
    """Recent messages for the account (newest first)."""
    r = requests.get(
        f'{_mail_base()}/accounts/{account_id}/messages/view',
        headers=_auth(token), params={'limit': limit}, timeout=30,
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
    """Pull recent messages for every Zoho account and store new ones as
    IncomingEmail rows (so the dashboard inbox shows them). Idempotent —
    messages already stored (by message_id) are skipped. Returns count saved."""
    if not is_configured():
        logger.warning('Zoho API not configured — skipping sync')
        return 0

    from notifications.models import IncomingEmail, EmailAccount

    token = get_access_token()
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
        ea = EmailAccount.objects.filter(email_address__iexact=primary).first() if primary else None

        try:
            messages = list_messages(token, account_id, limit=limit)
        except Exception as e:
            logger.warning('Zoho list_messages failed for %s: %s', primary or account_id, e)
            continue

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
                IncomingEmail.objects.create(
                    account=ea,
                    sender=(msg.get('fromAddress') or '')[:254],
                    sender_name=(msg.get('sender') or '')[:300],
                    recipient=(msg.get('toAddress') or primary or '')[:254],
                    subject=(msg.get('subject') or '')[:500],
                    body=body,
                    body_html=body,
                    message_id=mid[:500],
                    received_at=_parse_ts(msg.get('receivedTime') or msg.get('sentDateInGMT')),
                    has_attachments=str(msg.get('hasAttachment')) in ('1', 'true', 'True'),
                    source='zoho_api',
                    folder='inbox',
                )
                saved += 1
            except Exception as e:
                logger.warning('Zoho save failed for %s: %s', mid, e)

    logger.info('Zoho API sync: saved %d new email(s)', saved)
    return saved
