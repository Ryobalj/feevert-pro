# core/management/commands/map_mailbox.py
"""Decide who sees which mailbox in the in-app inbox (TeamInbox-style).

    # list what exists and who can see it
    python manage.py map_mailbox --list

    # info@ becomes a team inbox every staff member can read
    python manage.py map_mailbox --email=info@feevert.co.tz --shared

    # a personal mailbox: only this user (plus admins) can read it
    python manage.py map_mailbox --email=accounts@feevert.co.tz --owner=prisila

`--owner` accepts a username or an email address of a system user.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from notifications.models import EmailAccount

User = get_user_model()


class Command(BaseCommand):
    help = 'Map a mailbox to an owner (personal) or mark it shared (team inbox).'

    def add_arguments(self, parser):
        parser.add_argument('--list', action='store_true', help='Show mailboxes and their visibility')
        parser.add_argument('--email', help='Mailbox address, e.g. info@feevert.co.tz')
        parser.add_argument('--owner', help='System user (username or email) who owns this mailbox')
        parser.add_argument('--shared', action='store_true', help='Mark as a team inbox (all staff)')
        parser.add_argument('--unassign', action='store_true', help='Clear owner and shared (admins only)')

    def _describe(self, a):
        if a.owner_user_id:
            who = f'personal -> {a.owner_user.username}'
        elif a.is_shared:
            who = 'shared (all staff)'
        else:
            who = 'unassigned (admins only)'
        return f'  {a.email_address:35} {who}'

    def handle(self, *args, **o):
        if o['list'] or not o['email']:
            accounts = EmailAccount.objects.select_related('owner_user').all()
            if not accounts:
                self.stdout.write('No mailboxes yet — run: python manage.py sync_zoho_inbox')
                return
            self.stdout.write(self.style.SUCCESS('Mailboxes:'))
            for a in accounts:
                self.stdout.write(self._describe(a))
            if not o['email']:
                return

        account = EmailAccount.objects.filter(email_address__iexact=o['email']).first()
        if not account:
            self.stdout.write(self.style.ERROR(
                f"No mailbox {o['email']}. Run sync_zoho_inbox first, or check the address."))
            return

        if o['unassign']:
            account.owner_user = None
            account.is_shared = False
        elif o['shared']:
            account.owner_user = None
            account.is_shared = True
        elif o['owner']:
            user = (User.objects.filter(username__iexact=o['owner']).first()
                    or User.objects.filter(email__iexact=o['owner']).first())
            if not user:
                self.stdout.write(self.style.ERROR(f"No system user matching '{o['owner']}'."))
                return
            account.owner_user = user
            account.is_shared = False
        else:
            self.stdout.write('Nothing to change — pass --shared, --owner=<user> or --unassign.')
            return

        account.save()
        self.stdout.write(self.style.SUCCESS('Updated:'))
        self.stdout.write(self._describe(account))
