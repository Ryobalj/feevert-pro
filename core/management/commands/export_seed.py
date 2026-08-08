# core/management/commands/export_seed.py
"""
Dumps the CURRENT database content back into the seed_data.xlsx format,
so the committed seed stays a faithful, portable baseline of what is live.

The heavy lifting lives in core/seed_export.py (shared with the admin
"Export current content" button).

IMPORTANT: this exports whatever database DATABASE_URL points at.
  - To capture PRODUCTION content, run it against the live DB, e.g. on a
    Render Shell, or locally with DATABASE_URL set to the live connection
    string. Running it locally with the local DB exports the local content.

Usage:
    python manage.py export_seed                 # -> fixtures/seed_data.exported.xlsx
    python manage.py export_seed --overwrite     # -> fixtures/seed_data.xlsx (replaces template)
    python manage.py export_seed --output path.xlsx
"""

import os

from django.core.management.base import BaseCommand

from core import seed_export


class Command(BaseCommand):
    help = 'Export current DB content into the seed_data.xlsx format (portable baseline).'

    def add_arguments(self, parser):
        parser.add_argument('--overwrite', action='store_true',
                            help='Write directly to fixtures/seed_data.xlsx (replaces the template)')
        parser.add_argument('--output', default=None, help='Custom output path')

    def handle(self, *args, **options):
        template = seed_export.template_path()
        if not os.path.exists(template):
            self.stdout.write(self.style.ERROR(f'Template not found: {template}'))
            return

        if options.get('output'):
            out_path = options['output']
        elif options.get('overwrite'):
            out_path = template
        else:
            out_path = os.path.join(os.path.dirname(template), 'seed_data.exported.xlsx')

        try:
            seed_export.write_to_path(out_path, log=self.stdout.write)
        except FileNotFoundError as e:
            self.stdout.write(self.style.ERROR(str(e)))
            return

        self.stdout.write(self.style.SUCCESS(f'\n✅ Exported current DB -> {out_path}'))
        if out_path != template:
            self.stdout.write('   Review it, then rename to fixtures/seed_data.xlsx (and commit) to make it the baseline.')
