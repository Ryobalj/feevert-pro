# core/seed_export.py
"""
Shared logic that snapshots the CURRENT database content into the
seed_data.xlsx layout. Used by:
  * the `export_seed` management command (writes a file), and
  * the admin "Export current content" button (streams an in-memory download).

It reuses the column layout of the committed fixtures/seed_data.xlsx as the
template so the output re-imports cleanly with the `seed_data` command.
"""

import io
import json
import os
from datetime import date, time, datetime

import pandas as pd
from django.apps import apps
from django.conf import settings
from django.db.models.fields.files import FieldFile

# sheet name -> (app_label, ModelName). Order mirrors seed_data.py.
SHEET_MODEL = {
    'categories':        ('consultations', 'ConsultationCategory'),   # level 0
    'sub_categories':    ('consultations', 'ConsultationCategory'),   # level >= 1
    'services':          ('consultations', 'ConsultationService'),
    'project_categories':('projects', 'ProjectCategory'),
    'projects':          ('projects', 'Project'),
    'departments':       ('team', 'Department'),
    'team':              ('team', 'TeamMember'),
    'site_settings':     ('home', 'SiteSetting'),
    'hero_slides':       ('home', 'HeroSection'),
    'what_we_do':        ('home', 'WhatWeDo'),
    'about':             ('home', 'AboutSection'),
    'testimonials':      ('home', 'Testimonial'),
    'partners':          ('home', 'Partner'),
    'faqs':              ('home', 'Faq'),
    'news_categories':   ('news', 'NewsCategory'),
    'news':              ('news', 'NewsPost'),
    'job_categories':    ('careers', 'JobCategory'),
    'jobs':              ('careers', 'JobPost'),
    'time_slots':        ('bookings', 'TimeSlot'),
    'product_categories':('shop', 'ProductCategory'),
    'products':          ('shop', 'Product'),
}


def template_path():
    return os.path.join(settings.BASE_DIR, 'fixtures', 'seed_data.xlsx')


def _cell(obj, col):
    # Relationship columns the seed reader expects as slug/name.
    if col == 'parent_slug':
        p = getattr(obj, 'parent', None)
        return getattr(p, 'slug', '') if p else ''
    if col == 'category_slug':
        c = getattr(obj, 'category', None)
        return getattr(c, 'slug', '') if c else ''
    if col == 'department':
        d = getattr(obj, 'department', None)
        return getattr(d, 'name', '') if d else ''

    try:
        val = getattr(obj, col)
    except AttributeError:
        return ''

    if val is None:
        return ''
    if isinstance(val, FieldFile):
        return val.name or ''
    if isinstance(val, (dict, list)):
        return json.dumps(val, ensure_ascii=False)
    if isinstance(val, (datetime, date, time)):
        return val.isoformat()
    if hasattr(val, '_meta'):  # a related model instance (FK)
        return getattr(val, 'slug', None) or getattr(val, 'name', None) or str(val)
    return val


def _queryset(model, sheet):
    qs = model.objects.all()
    if sheet == 'categories':
        qs = model.objects.filter(level=0)
    elif sheet == 'sub_categories':
        qs = model.objects.filter(level__gte=1)
    field_names = {f.name for f in model._meta.fields}
    if 'level' in field_names and 'order' in field_names:
        return qs.order_by('level', 'order', 'id')
    if 'order' in field_names:
        return qs.order_by('order', 'id')
    return qs.order_by('id')


def _columns(template_cols):
    # Drop pandas duplicate/blank artifacts seen in the products sheet.
    return [c for c in template_cols
            if not str(c).startswith('Unnamed') and not str(c).endswith('.1')]


def build_frames(log=None):
    """Build {sheet_name: DataFrame} from the current DB, plus the sheet order.

    `log` is an optional callable(str) for progress messages.
    Returns (frames, sheet_order). Raises FileNotFoundError if no template.
    """
    tpath = template_path()
    if not os.path.exists(tpath):
        raise FileNotFoundError(f'Template not found: {tpath}')

    xl = pd.ExcelFile(tpath)
    frames = {}

    for sheet, (app_label, model_name) in SHEET_MODEL.items():
        if sheet not in xl.sheet_names:
            continue
        try:
            template_cols = _columns(
                list(pd.read_excel(tpath, sheet_name=sheet, nrows=0).columns))
            model = apps.get_model(app_label, model_name)
            rows = [{col: _cell(obj, col) for col in template_cols}
                    for obj in _queryset(model, sheet)]
            frames[sheet] = pd.DataFrame(rows, columns=template_cols)
            if log:
                log(f'   OK {sheet}: {len(rows)} row(s)')
        except Exception as e:
            # Never let one sheet abort the whole export; keep template rows.
            frames[sheet] = pd.read_excel(tpath, sheet_name=sheet)
            if log:
                log(f'   !! {sheet}: {e} (kept template rows)')

    # Preserve any template sheets we don't manage, so nothing is lost.
    for sheet in xl.sheet_names:
        if sheet not in frames:
            frames[sheet] = pd.read_excel(tpath, sheet_name=sheet)

    return frames, list(xl.sheet_names)


def _write(frames, sheet_order, writer):
    for sheet in sheet_order:
        frames[sheet].to_excel(writer, sheet_name=sheet, index=False)


def write_to_path(out_path, log=None):
    frames, order = build_frames(log=log)
    with pd.ExcelWriter(out_path, engine='openpyxl') as writer:
        _write(frames, order, writer)
    return out_path


def build_bytes(log=None):
    """Return the seed workbook as in-memory .xlsx bytes (for downloads)."""
    frames, order = build_frames(log=log)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine='openpyxl') as writer:
        _write(frames, order, writer)
    return buf.getvalue()
