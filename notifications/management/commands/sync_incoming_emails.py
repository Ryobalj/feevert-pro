# notifications/management/commands/sync_incoming_emails.py
"""
Fetches new emails from Outlook/Microsoft 365 and IMAP into the unified
IncomingEmail inbox (notifications.models.IncomingEmail).

There's no Celery app configured in this project, so this is meant to be
run either:
  - on a schedule via a Render Cron Job service:
        python manage.py sync_incoming_emails
  - manually / from the "Sync Now" button in the frontend inbox, which
    calls the same EmailInboundService directly via the API instead.
"""

from django.conf import settings
from django.core.management.base import BaseCommand

from notifications.services.email_inbound_service import EmailInboundService


class Command(BaseCommand):
    help = 'Fetch new emails from Outlook/365 and IMAP into the unified inbox'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force', action='store_true',
            help='Run even if EMAIL_INGESTION_ENABLED is False'
        )

    def handle(self, *args, **options):
        if not settings.EMAIL_INGESTION_ENABLED and not options['force']:
            self.stdout.write(self.style.WARNING(
                'EMAIL_INGESTION_ENABLED is False - skipping (use --force to run anyway)'
            ))
            return

        results = EmailInboundService.fetch_all_sources()

        for source, result in results.items():
            if result.get('success'):
                self.stdout.write(self.style.SUCCESS(
                    f"{source}: saved {result.get('saved', 0)} new email(s)"
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f"{source}: {result.get('error', 'unknown error')}"
                ))
