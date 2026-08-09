# core/management/commands/sync_zoho_inbox.py
"""Sync the in-app inbox from Zoho via the Mail REST API (bypasses the IMAP
geo-block on Render). Safe to run repeatedly / on a schedule — it only stores
messages it hasn't seen before.

    python manage.py sync_zoho_inbox
    python manage.py sync_zoho_inbox --limit 100
"""

from django.core.management.base import BaseCommand

from notifications.services import zoho_mail_api


class Command(BaseCommand):
    help = 'Sync the in-app inbox from Zoho Mail via the REST API.'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=50,
                            help='Max recent messages per account to check (default 50)')

    def handle(self, *args, **opts):
        if not zoho_mail_api.is_configured():
            self.stdout.write(self.style.ERROR(
                'Zoho API not configured. Set ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN.'))
            return
        try:
            n = zoho_mail_api.sync(limit=opts['limit'])
            self.stdout.write(self.style.SUCCESS(f'✅ Zoho sync complete — saved {n} new email(s).'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Zoho sync failed: {e}'))
