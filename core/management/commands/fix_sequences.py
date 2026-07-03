# core/management/commands/fix_sequences.py

from io import StringIO

from django.apps import apps
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = (
        'Resets every local app\'s Postgres auto-increment sequences to match '
        'the actual max id in each table. seed_data.py inserts rows with '
        'explicit ids (so re-running it is idempotent), which leaves the '
        'sequence itself unadvanced - the next *normal* INSERT (e.g. creating '
        'a Role from the admin UI) then collides with an id that already '
        'exists and fails with a duplicate-key IntegrityError. Safe to run '
        'anytime; it only reads current max ids and does not touch data.'
    )

    def handle(self, *args, **options):
        local_apps = [
            a.label for a in apps.get_app_configs()
            if not a.name.startswith('django.') and a.name not in (
                'rest_framework', 'rest_framework_simplejwt', 'corsheaders',
                'django_filters', 'django_countries', 'phonenumber_field',
                'django_recaptcha', 'widget_tweaks', 'modeltranslation',
                'channels', 'daphne', 'cloudinary', 'cloudinary_storage',
            )
        ]

        buf = StringIO()
        call_command('sqlsequencereset', *local_apps, stdout=buf)
        sql = buf.getvalue()

        if not sql.strip():
            self.stdout.write(self.style.WARNING('No sequences to reset.'))
            return

        with connection.cursor() as cursor:
            for statement in sql.split(';'):
                statement = statement.strip()
                if statement and not statement.upper() in ('BEGIN', 'COMMIT'):
                    cursor.execute(statement)

        self.stdout.write(self.style.SUCCESS(f'Reset sequences for: {", ".join(local_apps)}'))
