# core/management/commands/zoho_connect_mailbox.py
"""Connect one mailbox to the in-app inbox.

Zoho only lets an OAuth token read its *own* owner's mail — an org-admin token
can list every mailbox but not read other people's. So each mailbox that should
appear in the dashboard connects once, here, with a grant code generated while
signed in as that mailbox.

    # signed in to Zoho as info@feevert.co.tz, generate a grant code with scope
    #   ZohoMail.messages.READ,ZohoMail.accounts.READ
    python manage.py zoho_connect_mailbox --email=info@feevert.co.tz --code=<GRANT_CODE>

Then `python manage.py sync_zoho_inbox` pulls that mailbox too.
"""

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from notifications.models import EmailAccount


class Command(BaseCommand):
    help = "Store a mailbox's own Zoho refresh token so the inbox can read it."

    def add_arguments(self, p):
        p.add_argument('--email', required=True, help='Mailbox address to connect')
        p.add_argument('--code', required=True, help='Grant code generated while signed in as that mailbox')
        p.add_argument('--client-id', default=None)
        p.add_argument('--client-secret', default=None)
        p.add_argument('--create', action='store_true', help='Create the mailbox row if missing')

    def handle(self, *a, **o):
        account = EmailAccount.objects.filter(email_address__iexact=o['email']).first()
        if not account:
            if not o['create']:
                self.stdout.write(self.style.ERROR(
                    f"No mailbox {o['email']}. Run sync_zoho_inbox, or add --create."))
                return
            account = EmailAccount.objects.create(
                email_address=o['email'], provider='zoho_api', is_active=True, is_shared=False)

        cid = o['client_id'] or getattr(settings, 'ZOHO_CLIENT_ID', '')
        secret = o['client_secret'] or getattr(settings, 'ZOHO_CLIENT_SECRET', '')
        base = getattr(settings, 'ZOHO_ACCOUNTS_BASE', 'https://accounts.zoho.com')
        if not cid or not secret:
            self.stdout.write(self.style.ERROR('Missing ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET.'))
            return

        try:
            r = requests.post(f'{base}/oauth/v2/token', data={
                'grant_type': 'authorization_code',
                'client_id': cid,
                'client_secret': secret,
                'code': o['code'],
            }, timeout=20)
            j = r.json()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Request failed: {e}'))
            return

        rt = j.get('refresh_token')
        if not rt:
            self.stdout.write(self.style.ERROR(f'No refresh token returned: {j}'))
            self.stdout.write('The grant code may have expired — generate a new one and retry.')
            return

        account.oauth_refresh_token = rt
        account.provider = 'zoho_api'
        account.is_active = True
        account.last_sync_error = ''
        account.save()
        self.stdout.write(self.style.SUCCESS(
            f'✅ Connected {account.email_address}. Run: python manage.py sync_zoho_inbox'))
