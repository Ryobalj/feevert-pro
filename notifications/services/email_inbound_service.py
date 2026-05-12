# notifications/services/email_inbound_service.py

import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class EmailInboundService:
    """
    Service ya kupokea emails kutoka nje.
    Inasaidia:
    - Microsoft 365 / Outlook (Graph API)
    - IMAP (Titan, Gmail, Custom)
    
    Hii ilihamishwa kutoka home/services/outlook_service.py
    """

    # ============================================================
    # MICROSOFT 365 / OUTLOOK
    # ============================================================

    @classmethod
    def fetch_outlook_emails(cls, folder='inbox', limit=50, unread_only=False):
        """
        Fetch emails kutoka Microsoft 365 kupitia Graph API.
        
        Returns:
            List ya email message objects
        """
        token = cls._get_outlook_token()
        if not token:
            logger.error("Cannot fetch Outlook emails - no token")
            return []

        url = f'https://graph.microsoft.com/v1.0/me/mailFolders/{folder}/messages'
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }
        params = {
            '$top': limit,
            '$orderby': 'receivedDateTime desc',
            '$select': 'id,subject,body,from,toRecipients,receivedDateTime,'
                       'hasAttachments,internetMessageId,conversationId,'
                       'importance,isRead,flag,webLink',
        }

        if unread_only:
            params['$filter'] = 'isRead eq false'

        try:
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            emails = data.get('value', [])
            logger.info(f"Fetched {len(emails)} Outlook emails from '{folder}'")
            return emails
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch Outlook emails: {e}")
            return []

    @classmethod
    def send_via_outlook(cls, to_email, subject, body):
        """
        Tuma email kupitia Microsoft 365.
        
        Returns:
            bool: True kama email imetumwa
        """
        token = cls._get_outlook_token()
        if not token:
            logger.error("Cannot send Outlook email - no token")
            return False

        url = 'https://graph.microsoft.com/v1.0/me/sendMail'
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }
        payload = {
            'message': {
                'subject': subject,
                'body': {
                    'contentType': 'Text',
                    'content': body,
                },
                'toRecipients': [
                    {'emailAddress': {'address': to_email}}
                ],
            },
            'saveToSentItems': True,
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            logger.info(f"Outlook email sent to {to_email}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send Outlook email: {e}")
            return False

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
            return {'success': False, 'error': f"HTTP {response.status_code}"}
        except Exception as e:
            return {'success': False, 'error': str(e)}