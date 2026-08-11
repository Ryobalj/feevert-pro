# core/management/commands/create_staff_user.py
"""Create (or update) a staff login for the system.

    python manage.py create_staff_user --username=nicole \
        --email=nicole.abbas@feevert.co.tz --full-name="Nicole Abbas" \
        --role="Normal Employee" --password='...'

Notes:
  * An alias address (e.g. nicole.abbas@ / saidina@, which both deliver into
    info@) is fine as a login identity — mailbox access comes from the shared
    info@ inbox, not from the login address.
  * Re-running with the same --username updates that user instead of failing.
  * Pass --password to set one; otherwise the account is created unusable and
    the person must use "forgot password" to set their own.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import Role

User = get_user_model()


class Command(BaseCommand):
    help = 'Create or update a staff user account.'

    def add_arguments(self, p):
        p.add_argument('--username', required=True)
        p.add_argument('--email', required=True)
        p.add_argument('--full-name', default='', help='"First Last"')
        p.add_argument('--role', default='Normal Employee',
                       help='Role name exactly as it exists (e.g. "Normal Employee", consultant, admin)')
        p.add_argument('--password', default=None,
                       help='Optional. If omitted the account has no usable password yet.')
        p.add_argument('--staff', action='store_true',
                       help='Also grant Django admin-site access (is_staff)')

    def handle(self, *a, **o):
        role = Role.objects.filter(name__iexact=o['role']).first()
        if not role:
            available = ', '.join(Role.objects.values_list('name', flat=True))
            self.stdout.write(self.style.ERROR(
                f"No role '{o['role']}'. Available: {available}"))
            return

        first, _, last = (o['full_name'] or '').partition(' ')
        user, created = User.objects.get_or_create(
            username=o['username'],
            defaults={'email': o['email']},
        )
        user.email = o['email']
        if first:
            user.first_name = first
        if last:
            user.last_name = last
        user.role = role
        user.is_active = True
        if o['staff']:
            user.is_staff = True
        if o['password']:
            user.set_password(o['password'])
        elif created:
            user.set_unusable_password()
        user.save()

        what = 'Created' if created else 'Updated'
        pw = 'password set' if o['password'] else ('no password yet' if created else 'password unchanged')
        self.stdout.write(self.style.SUCCESS(
            f'{what} {user.username} <{user.email}> · role={role.name} · {pw}'))
