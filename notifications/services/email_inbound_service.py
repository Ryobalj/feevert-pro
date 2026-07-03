# notifications/services/email_inbound_service.py

import requests
import logging
from datetime import datetime

from django.conf import settings
from django.utils import timezone

from imap_tools import MailBox, AND

from notifications.models import IncomingEmail, EmailAccount


logger = logging.getLogger(__name__)


class EmailInboundService:
    """
    Service ya kupokea na kutuma emails kutoka nje.

    Inasaidia:
    - Microsoft 365 / Outlook (Graph API)
    - IMAP (Titan, Gmail, cPanel, Custom Mail Servers)
    
    Kila email inayopokewa inahifadhiwa kwenye IncomingEmail model
    na inaweza kuunganishwa na ContactMessage (Unified Inbox).
    """

    # ============================================================
    # MICROSOFT 365 / OUTLOOK
    # ============================================================

    @classmethod
    def fetch_outlook_emails(cls, folder='inbox', limit=50, unread_only=False):
        """
        Fetch emails kutoka Microsoft 365 kupitia Graph API.
        
        Returns:
            dict: {'success': bool, 'saved': int, 'error': str}
        """
        token = cls._get_outlook_token()
        if not token:
            logger.error("Cannot fetch Outlook emails - no token")
            return {'success': False, 'error': 'Microsoft credentials not configured'}

        url = f'https://graph.microsoft.com/v1.0/me/mailFolders/{folder}/messages'
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }
        params = {
            '$top': limit,
            '$orderby': 'receivedDateTime desc',
            '$select': (
                'id,subject,body,from,toRecipients,ccRecipients,bccRecipients,'
                'receivedDateTime,hasAttachments,internetMessageId,conversationId,'
                'importance,isRead,flag,webLink'
            ),
        }

        if unread_only:
            params['$filter'] = 'isRead eq false'

        try:
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            emails = data.get('value', [])
            
            saved = 0
            for email_data in emails:
                try:
                    msg = cls._save_outlook_message(email_data)
                    if msg:
                        saved += 1
                except Exception as e:
                    logger.error(f"Error saving Outlook email: {e}")

            logger.info(f"Fetched {len(emails)} Outlook emails, saved {saved} new ones")
            return {'success': True, 'saved': saved, 'total_fetched': len(emails)}

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch Outlook emails: {e}")
            return {'success': False, 'error': str(e)}

    @classmethod
    def _save_outlook_message(cls, message_data):
        """Save Outlook email to IncomingEmail model"""
        message_id = message_data.get('internetMessageId') or message_data.get('id')
        
        if not message_id:
            return None
        
        # Check if already exists
        if IncomingEmail.objects.filter(message_id=message_id).exists():
            return None
        
        # Extract from
        sender_info = message_data.get('from', {}).get('emailAddress', {})
        sender_email = sender_info.get('address', 'unknown@unknown.com')
        sender_name = sender_info.get('name', '')
        
        # Extract recipients
        to_emails = [
            r.get('emailAddress', {}).get('address', '')
            for r in message_data.get('toRecipients', [])
        ]
        recipient = to_emails[0] if to_emails else ''
        
        # Extract body
        body_data = message_data.get('body', {})
        body_html = body_data.get('content', '') if body_data.get('contentType') == 'html' else ''
        body_text = ''
        
        if body_html:
            try:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(body_html, 'html.parser')
                body_text = soup.get_text(separator='\n', strip=True)
            except Exception:
                body_text = body_html
        else:
            body_text = body_data.get('content', '')
        
        # Extract cc
        cc_emails = [
            r.get('emailAddress', {}).get('address', '')
            for r in message_data.get('ccRecipients', [])
        ]
        
        # Extract received date
        received_str = message_data.get('receivedDateTime')
        received_at = datetime.fromisoformat(received_str.replace('Z', '+00:00')) if received_str else timezone.now()
        
        return IncomingEmail.objects.create(
            sender=sender_email,
            sender_name=sender_name,
            recipient=recipient,
            subject=message_data.get('subject', '') or '',
            body=body_text or '',
            body_html=body_html or '',
            message_id=message_id,
            thread_id=message_data.get('conversationId', ''),
            in_reply_to=message_data.get('inReplyTo', ''),
            received_at=received_at,
            is_read=message_data.get('isRead', False),
            has_attachments=message_data.get('hasAttachments', False),
            headers={
                'importance': message_data.get('importance', 'normal'),
                'cc': cc_emails,
                'web_link': message_data.get('webLink', ''),
            },
            source='outlook',
            folder='inbox',
        )

    @classmethod
    def send_via_outlook(cls, to_email, subject, body, body_html=None, cc=None):
        """
        Tuma email kupitia Microsoft 365.
        
        Returns:
            dict: {'success': bool, 'error': str}
        """
        token = cls._get_outlook_token()
        if not token:
            logger.error("Cannot send Outlook email - no token")
            return {'success': False, 'error': 'Microsoft credentials not configured'}

        url = 'https://graph.microsoft.com/v1.0/me/sendMail'
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }
        
        message = {
            'subject': subject,
            'body': {
                'contentType': 'HTML' if body_html else 'Text',
                'content': body_html or body,
            },
            'toRecipients': [
                {'emailAddress': {'address': to_email}}
            ],
        }
        
        if cc:
            message['ccRecipients'] = [
                {'emailAddress': {'address': email}}
                for email in (cc if isinstance(cc, list) else [cc])
            ]
        
        payload = {
            'message': message,
            'saveToSentItems': True,
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            logger.info(f"Outlook email sent to {to_email}")
            return {'success': True}
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send Outlook email: {e}")
            return {'success': False, 'error': str(e)}

    @classmethod
    def _get_outlook_token(cls):
        """Pata OAuth2 token kwa Microsoft Graph API"""
        client_id = getattr(settings, 'MICROSOFT_CLIENT_ID', '')
        client_secret = getattr(settings, 'MICROSOFT_CLIENT_SECRET', '')
        tenant_id = getattr(settings, 'MICROSOFT_TENANT_ID', '')

        if not all([client_id, client_secret, tenant_id]):
            logger.warning("Microsoft credentials not fully configured")
            return None

        url = f'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token'
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'scope': 'https://graph.microsoft.com/.default',
            'grant_type': 'client_credentials',
        }

        try:
            response = requests.post(url, data=data, timeout=30)
            response.raise_for_status()
            return response.json().get('access_token')
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get Outlook token: {e}")
            return None

    @classmethod
    def test_outlook_connection(cls):
        """Jaribu kama Outlook integration inafanya kazi"""
        token = cls._get_outlook_token()
        if not token:
            return {'success': False, 'error': 'Microsoft credentials not configured'}

        try:
            response = requests.get(
                'https://graph.microsoft.com/v1.0/me',
                headers={'Authorization': f'Bearer {token}'},
                timeout=15,
            )
            if response.status_code == 200:
                user_data = response.json()
                return {
                    'success': True,
                    'email': user_data.get('mail') or user_data.get('userPrincipalName'),
                    'name': user_data.get('displayName'),
                }
            return {'success': False, 'error': f'HTTP {response.status_code}: {response.text[:200]}'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    # ============================================================
    # IMAP EMAIL FETCHING
    # ============================================================

    @classmethod
    def fetch_imap_emails(cls, limit=50, host=None, username=None, password=None,
                           unread_only=False, account=None):
        """
        Fetch emails kutoka IMAP server.
        Inasaidia: Titan, Gmail, cPanel, Custom mail servers.

        Args:
            limit: Max emails kufetch
            host: IMAP host (default: settings.IMAP_HOST, used only if account is None)
            username: Email address (default: settings.IMAP_USER)
            password: Email password (default: settings.IMAP_PASSWORD)
            unread_only: Fetch unread emails tu
            account: an EmailAccount instance - if given, its own IMAP
                credentials are used instead of the host/username/password
                args, and every saved IncomingEmail is tagged with it so
                the right staff member (or shared inbox) can find it later.

        Returns:
            dict: {'success': bool, 'saved': int, 'error': str}
        """
        if account is not None:
            imap_host = account.imap_host
            imap_user = account.email_address
            imap_password = account.get_imap_password()
        else:
            imap_host = host or getattr(settings, 'IMAP_HOST', '')
            imap_user = username or getattr(settings, 'IMAP_USER', '')
            imap_password = password or getattr(settings, 'IMAP_PASSWORD', '')

        if not all([imap_host, imap_user, imap_password]):
            logger.warning("IMAP credentials not fully configured")
            return {'success': False, 'error': 'IMAP credentials not configured'}

        saved = 0
        skipped = 0

        try:
            # imap_tools sends this straight into an IMAP SEARCH command -
            # passing criteria=None literally sends "NONE", which servers
            # reject as an invalid search key. 'ALL' is the correct default
            # for "every message", matching fetch()'s own default.
            search_criteria = AND(seen=False) if unread_only else 'ALL'

            with MailBox(imap_host).login(imap_user, imap_password, 'INBOX') as mailbox:
                for msg in mailbox.fetch(reverse=True, limit=limit, criteria=search_criteria):
                    # Check if already exists
                    message_id = msg.uid
                    if IncomingEmail.objects.filter(message_id=message_id).exists():
                        skipped += 1
                        continue

                    # Extract attachments
                    attachments = []
                    for att in msg.attachments:
                        attachments.append({
                            'filename': att.filename or 'unnamed',
                            'size': len(att.payload) if att.payload else 0,
                            'content_type': att.content_type or 'application/octet-stream',
                        })

                    # Extract headers
                    headers = {}
                    for key, value in msg.headers.items():
                        headers[key] = value

                    received_at = msg.date or timezone.now()
                    if timezone.is_naive(received_at):
                        received_at = timezone.make_aware(received_at)

                    IncomingEmail.objects.create(
                        account=account,
                        sender=msg.from_ or 'unknown@unknown.com',
                        sender_name=msg.from_values.name if msg.from_values else '',
                        recipient=imap_user,
                        subject=msg.subject or '',
                        body=msg.text or '',
                        body_html=msg.html or '',
                        message_id=message_id,
                        thread_id=headers.get('Thread-Index', headers.get('Message-ID', '')),
                        in_reply_to=headers.get('In-Reply-To', ''),
                        received_at=received_at,
                        is_read=msg.flags and '\\Seen' in msg.flags,
                        has_attachments=len(attachments) > 0,
                        attachments=attachments,
                        headers=headers,
                        source='imap',
                        folder='inbox',
                    )
                    saved += 1

            logger.info(f"IMAP fetch complete: {saved} saved, {skipped} skipped")
            return {
                'success': True,
                'saved': saved,
                'skipped': skipped,
            }

        except Exception as e:
            logger.error(f"Failed to fetch IMAP emails: {e}")
            return {'success': False, 'error': str(e)}

    # ============================================================
    # MULTI-ACCOUNT FETCH - one mailbox per staff member (or shared)
    # ============================================================

    @classmethod
    def fetch_for_account(cls, account, limit=50):
        """Fetch one EmailAccount's mailbox and record sync status on it."""
        if account.provider == 'outlook':
            # Outlook accounts still go through the single tenant-wide app
            # registration (MICROSOFT_CLIENT_ID/SECRET/TENANT_ID) - per
            # account Graph delegated auth isn't wired up yet.
            result = cls.fetch_outlook_emails(limit=limit)
        else:
            result = cls.fetch_imap_emails(limit=limit, account=account)

        account.last_synced_at = timezone.now()
        account.last_sync_error = '' if result.get('success') else str(result.get('error', ''))[:2000]
        account.save(update_fields=['last_synced_at', 'last_sync_error'])
        return result

    @classmethod
    def fetch_all_accounts(cls, limit=50, accounts=None):
        """
        Fetch every active EmailAccount. Returns {email_address: result}.
        Pass `accounts` (a queryset) to restrict to a subset (e.g. just the
        accounts one user is allowed to trigger a sync for).
        """
        queryset = accounts if accounts is not None else EmailAccount.objects.filter(is_active=True)
        results = {}
        for account in queryset:
            try:
                results[account.email_address] = cls.fetch_for_account(account, limit=limit)
            except Exception as e:
                logger.error(f"Failed to fetch account {account.email_address}: {e}")
                results[account.email_address] = {'success': False, 'error': str(e)}
        return results

    # ============================================================
    # UNIFIED FETCH - Inajaribu zote
    # ============================================================

    @classmethod
    def fetch_all_sources(cls, limit=50):
        """
        Fetch emails kutoka sources zote zilizosanidiwa.

        If any EmailAccount rows exist, those are the source of truth (one
        mailbox per staff member, or shared). Otherwise falls back to the
        single legacy settings.IMAP_*/Outlook config, for installs that
        haven't been migrated to EmailAccount yet.

        Returns:
            dict: {'outlook': {...}, 'imap': {...}} (legacy) or
                  {email_address: {...}, ...} (multi-account)
        """
        if EmailAccount.objects.filter(is_active=True).exists():
            results = cls.fetch_all_accounts(limit=limit)
            total_saved = sum(r.get('saved', 0) for r in results.values() if r.get('success'))
            logger.info(f"Unified fetch complete: {total_saved} total emails saved across {len(results)} account(s)")
            return results

        results = {}
        outlook_result = cls.fetch_outlook_emails(limit=limit)
        results['outlook'] = outlook_result

        imap_result = cls.fetch_imap_emails(limit=limit)
        results['imap'] = imap_result

        total_saved = (
            (outlook_result.get('saved', 0) if outlook_result.get('success') else 0) +
            (imap_result.get('saved', 0) if imap_result.get('success') else 0)
        )

        logger.info(f"Unified fetch complete: {total_saved} total emails saved")
        return results


# ============================================================
# CONVENIENCE FUNCTIONS
# ============================================================

def fetch_incoming_emails(source='all', limit=50):
    """
    Convenience function kwa ajili ya Celery tasks au management commands.
    
    Args:
        source: 'outlook', 'imap', au 'all'
        limit: Max emails kufetch
    """
    if source == 'outlook':
        return EmailInboundService.fetch_outlook_emails(limit=limit)
    elif source == 'imap':
        return EmailInboundService.fetch_imap_emails(limit=limit)
    else:
        return EmailInboundService.fetch_all_sources(limit=limit)