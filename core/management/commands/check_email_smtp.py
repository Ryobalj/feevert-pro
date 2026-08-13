# core/management/commands/check_email_smtp.py
"""Check that the platform can actually send mail, and say why if it can't.

Replies were failing with a generic "check the mail account settings", which
names no setting. This connects with the configured credentials and reports the
server's own answer.

    python manage.py check_email_smtp
    python manage.py check_email_smtp --to=someone@example.com   # also send one
"""

import smtplib

from django.conf import settings
from django.core.mail import get_connection, EmailMessage
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Verify the outgoing mail (SMTP) settings and report the real error.'

    def add_arguments(self, parser):
        parser.add_argument('--to', default=None, help='Send a test message to this address')

    def handle(self, *args, **o):
        host = getattr(settings, 'EMAIL_HOST', '')
        port = getattr(settings, 'EMAIL_PORT', 0)
        user = getattr(settings, 'EMAIL_HOST_USER', '')
        pwd = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
        ssl = getattr(settings, 'EMAIL_USE_SSL', False)
        tls = getattr(settings, 'EMAIL_USE_TLS', False)

        self.stdout.write('Outgoing mail settings')
        self.stdout.write(f'  host      : {host or "(empty)"}')
        self.stdout.write(f'  port      : {port}')
        self.stdout.write(f'  user      : {user or "(empty)"}')
        self.stdout.write(f'  password  : {"set (" + str(len(pwd)) + " chars)" if pwd else "(EMPTY — this is usually the problem)"}')
        self.stdout.write(f'  ssl / tls : {ssl} / {tls}')
        self.stdout.write(f'  from      : {getattr(settings, "DEFAULT_FROM_EMAIL", "")}')
        self.stdout.write('')

        if not (host and user and pwd):
            self.stdout.write(self.style.ERROR(
                'Missing host/user/password — set EMAIL_HOST, EMAIL_HOST_USER and '
                'EMAIL_HOST_PASSWORD (a Zoho app-specific password, not the login one).'))
            return

        try:
            server = smtplib.SMTP_SSL(host, port, timeout=20) if ssl else smtplib.SMTP(host, port, timeout=20)
            if tls and not ssl:
                server.starttls()
            server.login(user, pwd)
            server.quit()
            self.stdout.write(self.style.SUCCESS('✅ Login OK — the server accepted these credentials.'))
        except smtplib.SMTPAuthenticationError as e:
            self.stdout.write(self.style.ERROR(f'❌ Authentication rejected: {e}'))
            self.stdout.write('Zoho refuses normal passwords here — generate an app-specific '
                              'password (accounts.zoho.com -> Security -> App Passwords) and set '
                              'it as EMAIL_HOST_PASSWORD.')
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Could not connect: {type(e).__name__}: {e}'))
            return

        if o['to']:
            try:
                conn = get_connection()
                msg = EmailMessage(
                    subject='FeeVert system test',
                    body='If you are reading this, outgoing mail works.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[o['to']], connection=conn,
                )
                msg.send()
                self.stdout.write(self.style.SUCCESS(f'✅ Test message sent to {o["to"]}.'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Send failed: {type(e).__name__}: {e}'))
