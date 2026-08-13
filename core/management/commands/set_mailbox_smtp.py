# core/management/commands/set_mailbox_smtp.py
"""Let a mailbox send as itself.

Replies go out over the platform's own SMTP account by default, so a client
sees support@ in the From line even when the reply came from Masero's inbox.
Give a mailbox its own app password here and its replies are genuinely from
that address (the reply path prefers a mailbox's own credentials).

    python manage.py set_mailbox_smtp --email=endrewcus.masero@feevert.co.tz --password='APP PASSWORD'
    python manage.py set_mailbox_smtp --email=info@feevert.co.tz --password='...' --test=someone@example.com
    python manage.py set_mailbox_smtp --list

The password is a Zoho app-specific password (accounts.zoho.com -> Security ->
App Passwords), not the login password, and is stored encrypted.
"""

from django.core.management.base import BaseCommand

from notifications.models import EmailAccount


class Command(BaseCommand):
    help = "Store a mailbox's own SMTP app password so it can send as itself."

    def add_arguments(self, p):
        p.add_argument('--list', action='store_true', help='Show which mailboxes can send as themselves')
        p.add_argument('--email', help='Mailbox address')
        p.add_argument('--password', help='App-specific password for that mailbox')
        p.add_argument('--host', default='smtp.zoho.com')
        p.add_argument('--port', type=int, default=465)
        p.add_argument('--test', default=None, help='Send a test message to this address afterwards')
        p.add_argument('--clear', action='store_true', help='Remove the stored password')

    def handle(self, *a, **o):
        if o['list'] or not o['email']:
            self.stdout.write(self.style.SUCCESS('Mailboxes:'))
            for acc in EmailAccount.objects.all():
                own = 'sends as itself' if acc.get_smtp_password() else 'sends via the platform account'
                self.stdout.write(f'  {acc.email_address:34} {own}')
            if not o['email']:
                return

        account = EmailAccount.objects.filter(email_address__iexact=o['email']).first()
        if not account:
            self.stdout.write(self.style.ERROR(f"No mailbox {o['email']} — run sync_zoho_inbox first."))
            return

        if o['clear']:
            account.smtp_password_encrypted = ''
            account.save(update_fields=['smtp_password_encrypted'])
            self.stdout.write(self.style.SUCCESS(f'Cleared — {account.email_address} will send via the platform account.'))
            return

        if not o['password']:
            self.stdout.write(self.style.ERROR('Pass --password (a Zoho app-specific password).'))
            return

        account.smtp_host = o['host']
        account.smtp_port = o['port']
        account.smtp_use_ssl = o['port'] == 465
        account.smtp_use_tls = o['port'] == 587
        account.set_smtp_password(o['password'])
        account.save()
        self.stdout.write(self.style.SUCCESS(
            f'✅ {account.email_address} will now send as itself via {o["host"]}:{o["port"]}.'))

        if o['test']:
            from notifications.services.email_outbound_service import EmailOutboundService
            result = EmailOutboundService.send_via_account(
                account=account, to_email=o['test'],
                subject=f'Test from {account.email_address}',
                body='If this arrived from the right address, the mailbox can send as itself.',
            )
            if result.get('success'):
                self.stdout.write(self.style.SUCCESS(f'✅ Test message sent to {o["test"]}.'))
            else:
                self.stdout.write(self.style.ERROR(f'❌ Send failed: {result.get("error")}'))
