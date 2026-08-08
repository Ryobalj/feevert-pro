# core/admin_views.py
"""
Staff-only admin views that don't belong to a single model.

export_seed_download: the admin "Export current content" button. It snapshots
the LIVE database into the seed_data.xlsx layout and streams it straight to the
browser as a download. Nothing is written to the server's (ephemeral) disk, so
it works fine on Render — the admin gets an always-current seed file on demand.
"""

from datetime import date

from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse

from core import seed_export

XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


@staff_member_required
def export_seed_download(request):
    data = seed_export.build_bytes()
    resp = HttpResponse(data, content_type=XLSX_MIME)
    fname = f'seed_data_{date.today().isoformat()}.xlsx'
    resp['Content-Disposition'] = f'attachment; filename="{fname}"'
    return resp
