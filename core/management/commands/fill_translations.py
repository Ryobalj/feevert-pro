# core/management/commands/fill_translations.py
"""
Fill in MISSING translations for every modeltranslation-registered field,
using the English (default-language) value as the source.

It is strictly ADDITIVE and SAFE:
  * It only writes a `<field>_<lang>` column when that column is empty AND
    the English `<field>_en` value is present. Existing translations are
    never overwritten.
  * Values that look like structured data (JSON starting with '[' or '{'),
    URLs, or pure numbers are skipped, so structured fields are not corrupted.

Run it against whichever DB DATABASE_URL points at (use the live connection
string to translate production content). Always preview with --dry-run first.

Usage:
    python manage.py fill_translations --dry-run          # report only, no writes
    python manage.py fill_translations                    # apply
    python manage.py fill_translations --apps home,projects
    python manage.py fill_translations --languages sw,fr
"""

import time

from django.conf import settings
from django.core.management.base import BaseCommand
from modeltranslation.translator import translator

# modeltranslation default language (base we translate FROM)
BASE_LANG = getattr(settings, 'MODELTRANSLATION_DEFAULT_LANGUAGE', None) or 'en'

# Django language code -> Google Translate code
GOOGLE_CODE = {'zh': 'zh-CN'}

MAX_CHARS = 4500  # Google free endpoint per-request limit is ~5000


class Command(BaseCommand):
    help = 'Auto-fill missing translations from the English value (blanks only).'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true',
                            help='Report what would be filled without writing.')
        parser.add_argument('--apps', default=None,
                            help='Comma list of app labels to limit to (e.g. home,projects).')
        parser.add_argument('--languages', default=None,
                            help='Comma list of target langs (default: all except English).')
        parser.add_argument('--sleep', type=float, default=0.2,
                            help='Seconds to pause between translate calls (politeness).')

    # -- helpers --------------------------------------------------------
    def _target_langs(self, opt):
        langs = [c for c, _ in settings.LANGUAGES if c != BASE_LANG]
        if opt:
            wanted = {x.strip() for x in opt.split(',') if x.strip()}
            langs = [l for l in langs if l in wanted]
        return langs

    def _translatable(self, text):
        """Skip empty / structured / non-prose values."""
        if text is None:
            return False
        s = str(text).strip()
        if not s:
            return False
        if s[0] in '[{':          # JSON list/dict -> leave structured data alone
            return False
        if s.startswith(('http://', 'https://', 'www.', '/')):
            return False
        if s.replace('.', '').replace(',', '').isdigit():
            return False
        return True

    def _translate(self, translator_fn, text):
        s = str(text)
        if len(s) <= MAX_CHARS:
            return translator_fn(s)
        # Long text: translate paragraph-by-paragraph to stay under the limit.
        out, buf = [], ''
        for para in s.split('\n'):
            if len(buf) + len(para) + 1 > MAX_CHARS and buf:
                out.append(translator_fn(buf)); buf = ''
            buf += (('\n' if buf else '') + para)
        if buf:
            out.append(translator_fn(buf))
        return '\n'.join(out)

    # -- main -----------------------------------------------------------
    def handle(self, *args, **opts):
        try:
            from deep_translator import GoogleTranslator
        except ImportError:
            self.stderr.write(self.style.ERROR(
                'deep-translator not installed. Run: pip install deep-translator'))
            return

        dry = opts['dry_run']
        sleep = opts['sleep']
        langs = self._target_langs(opts['languages'])
        app_filter = ({x.strip() for x in opts['apps'].split(',')}
                      if opts['apps'] else None)

        self.stdout.write(self.style.WARNING(
            f"Base={BASE_LANG}  Targets={langs}  {'(DRY-RUN)' if dry else '(APPLYING)'}"))

        cache = {}   # (lang, source_text) -> translated  (dedupe repeated strings)
        engines = {l: GoogleTranslator(source=BASE_LANG, target=GOOGLE_CODE.get(l, l))
                   for l in langs}
        grand_total = 0

        for model in translator.get_registered_models():
            if app_filter and model._meta.app_label not in app_filter:
                continue
            fields = list(translator.get_options_for_model(model).fields)
            filled_here = 0
            objs = model.objects.all()
            for obj in objs:
                changed = False
                for field in fields:
                    base_val = getattr(obj, f'{field}_{BASE_LANG}', None)
                    if not self._translatable(base_val):
                        continue
                    for lang in langs:
                        col = f'{field}_{lang}'
                        cur = getattr(obj, col, None)
                        if cur is not None and str(cur).strip():
                            continue  # already translated -> never overwrite
                        # need a translation
                        if dry:
                            filled_here += 1; grand_total += 1
                            continue
                        key = (lang, str(base_val))
                        if key not in cache:
                            try:
                                cache[key] = self._translate(
                                    engines[lang].translate, base_val)
                                time.sleep(sleep)
                            except Exception as e:
                                self.stderr.write(self.style.WARNING(
                                    f'   !! {model.__name__}#{obj.pk} {col}: {e}'))
                                continue
                        setattr(obj, col, cache[key])
                        changed = True
                        filled_here += 1; grand_total += 1
                if changed and not dry:
                    obj.save()
            if filled_here:
                tag = 'would fill' if dry else 'filled'
                self.stdout.write(self.style.SUCCESS(
                    f'  {model._meta.app_label}.{model.__name__:24} {tag} {filled_here} field-value(s)'))

        verb = 'Would fill' if dry else 'Filled'
        self.stdout.write(self.style.SUCCESS(
            f'\n{verb} {grand_total} translation value(s) total.'))
        if dry and grand_total:
            self.stdout.write('Re-run without --dry-run to apply.')
