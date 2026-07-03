# notifications/management/commands/migrate_legacy_email_account.py

from django.conf import settings
from django.core.management.base import BaseCommand

from notifications.models import EmailAccount, IncomingEmail


class Command(BaseCommand):
    help = (
        'One-time migration: turn the legacy settings.IMAP_* config (the '
        'single info@feevert.co.tz mailbox) into a real EmailAccount row '
        '(shared inbox, no owner_user), and backfill any IncomingEmail '
        'rows fetched before EmailAccount existed so they point to it.'
    )

    def handle(self, *args, **options):
        imap_host = getattr(settings, 'IMAP_HOST', '')
        imap_user = getattr(settings, 'IMAP_USER', '')
        imap_password = getattr(settings, 'IMAP_PASSWORD', '')
        imap_port = getattr(settings, 'IMAP_PORT', 993)

        if not all([imap_host, imap_user, imap_password]):
            self.stdout.write(self.style.WARNING(
                'settings.IMAP_HOST/IMAP_USER/IMAP_PASSWORD are not fully configured - nothing to migrate.'
            ))
            return

        account, created = EmailAccount.objects.get_or_create(
            email_address=imap_user,
            defaults={
                'owner_user': None,  # shared inbox, matches its original design
                'provider': 'imap',
                'imap_host': imap_host,
                'imap_port': imap_port,
                'imap_use_ssl': True,
                'smtp_host': getattr(settings, 'EMAIL_HOST', imap_host),
                'smtp_port': getattr(settings, 'EMAIL_PORT', 465),
                'smtp_use_ssl': getattr(settings, 'EMAIL_USE_SSL', True),
                'smtp_use_tls': getattr(settings, 'EMAIL_USE_TLS', False),
            }
        )
        if created:
            account.set_imap_password(imap_password)
            account.save(update_fields=['imap_password_encrypted'])
            self.stdout.write(self.style.SUCCESS(f'Created shared EmailAccount for {imap_user}'))
        else:
            self.stdout.write(self.style.WARNING(f'EmailAccount for {imap_user} already exists - reusing it'))

        updated = IncomingEmail.objects.filter(
            account__isnull=True, source='imap', recipient=imap_user
        ).update(account=account)
        self.stdout.write(self.style.SUCCESS(f'Backfilled {updated} existing IncomingEmail row(s) onto this account'))
