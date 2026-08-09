# core/management/commands/zoho_oauth_exchange.py
"""One-time helper: exchange a Zoho OAuth grant code for a refresh token.

Run this once (e.g. from the Render Shell) after generating a grant code in the
Zoho API Console (Self Client), then store the printed refresh token as
ZOHO_REFRESH_TOKEN. Grant codes expire in minutes, so run it promptly.

    python manage.py zoho_oauth_exchange --code <GRANT_CODE>
"""

import requests
from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Exchange a Zoho OAuth grant code for a refresh token.'

    def add_arguments(self, parser):
        parser.add_argument('--code', required=True, help='Grant code from the Zoho API Console')
        parser.add_argument('--client-id', default=None, help='Overrides ZOHO_CLIENT_ID')
        parser.add_argument('--client-secret', default=None, help='Overrides ZOHO_CLIENT_SECRET')
        parser.add_argument('--redirect-uri', default=None, help='Only if your client requires one')

    def handle(self, *args, **opts):
        base = getattr(settings, 'ZOHO_ACCOUNTS_BASE', 'https://accounts.zoho.com')
        cid = opts['client_id'] or getattr(settings, 'ZOHO_CLIENT_ID', '')
        secret = opts['client_secret'] or getattr(settings, 'ZOHO_CLIENT_SECRET', '')
        if not cid or not secret:
            self.stdout.write(self.style.ERROR(
                'Missing client id/secret. Set ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET or pass --client-id/--client-secret.'))
            return

        data = {
            'grant_type': 'authorization_code',
            'client_id': cid,
            'client_secret': secret,
            'code': opts['code'],
        }
        if opts['redirect_uri']:
            data['redirect_uri'] = opts['redirect_uri']

        try:
            r = requests.post(f'{base}/oauth/v2/token', data=data, timeout=20)
            j = r.json()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Request failed: {e}'))
            return

        rt = j.get('refresh_token')
        if rt:
            self.stdout.write(self.style.SUCCESS('\n✅ REFRESH TOKEN (set as ZOHO_REFRESH_TOKEN in Render):\n'))
            self.stdout.write(rt)
            self.stdout.write('')
        else:
            self.stdout.write(self.style.ERROR(f'No refresh token returned. Response: {j}'))
            self.stdout.write('Common causes: the grant code expired (regenerate), wrong scope, or wrong client.')
