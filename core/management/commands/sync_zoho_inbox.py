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
        parser.add_argument('--limit', type=int, default=None,
                            help='Only check the N most recent messages per mailbox. '
                                 'Omit it to mirror the whole mailbox (the default).')
        parser.add_argument('--diagnose', action='store_true',
                            help='Show what Zoho returns per mailbox (no saving)')

    def handle(self, *args, **opts):
        if not zoho_mail_api.is_configured():
            self.stdout.write(self.style.ERROR(
                'Zoho API not configured. Set ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN.'))
            return

        if opts['diagnose']:
            try:
                token = zoho_mail_api.get_access_token()
                accounts = zoho_mail_api.get_accounts(token)
                self.stdout.write(self.style.SUCCESS(f'Zoho returned {len(accounts)} mailbox(es):'))
                for a in accounts:
                    addr = (a.get('primaryEmailAddress') or a.get('mailboxAddress')
                            or a.get('incomingUserName') or '?')
                    aid = a.get('accountId') or a.get('account_id')
                    try:
                        msgs = zoho_mail_api.list_messages(token, aid, limit=opts['limit'])
                        self.stdout.write(f'  {addr:35} accountId={aid} messages={len(msgs)}')
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(
                            f'  {addr:35} accountId={aid} ERROR: {str(e)[:120]}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Diagnose failed: {e}'))

            # The org token can list every mailbox but only read its own
            # owner's mail, so the run above says nothing about the rest.
            # Test each mailbox's own token — that's what actually brings
            # their mail in, and a dead one is otherwise silent.
            from notifications.models import EmailAccount
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('Per-mailbox connections:'))
            for acc in EmailAccount.objects.all().order_by('email_address'):
                if not acc.oauth_refresh_token:
                    from django.conf import settings as _s
                    platform = (getattr(_s, 'EMAIL_HOST_USER', '') or '').lower()
                    if acc.email_address.lower() == platform:
                        self.stdout.write(self.style.SUCCESS(
                            f'  {acc.email_address:34} OK — read through the org token in settings'))
                    else:
                        self.stdout.write(f'  {acc.email_address:34} not connected')
                    continue
                try:
                    tok = zoho_mail_api.get_access_token(
                        acc.oauth_refresh_token,
                        acc.oauth_client_id or None,
                        acc.oauth_client_secret or None,
                    )
                    own = zoho_mail_api.get_accounts(tok)
                    reach = ', '.join(
                        (a.get('primaryEmailAddress') or a.get('mailboxAddress') or '?')
                        for a in own) or 'nothing'
                    self.stdout.write(self.style.SUCCESS(f'  {acc.email_address:34} OK — can read: {reach}'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f'  {acc.email_address:34} BROKEN — {str(e)[:80]}'))
                    self.stdout.write('      reconnect: python manage.py zoho_connect_mailbox '
                                      f'--email={acc.email_address} --code=… --client-id=… --client-secret=…')
            return
        try:
            if opts['limit'] is None:
                self.stdout.write('Mirroring every message in each mailbox — this can take a while.')
            n = zoho_mail_api.sync(limit=opts['limit'])
            self.stdout.write(self.style.SUCCESS(f'✅ Zoho sync complete — saved {n} new email(s).'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Zoho sync failed: {e}'))
