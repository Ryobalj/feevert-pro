# core/file_views.py
"""Serve uploaded files through our own door.

A link straight to Cloudinary depends on that account allowing public
delivery of PDFs — it does not, by default, and answers 401 for a file we
uploaded ourselves. Every document link in the app was broken by that
setting, and the setting lives in a console behind an account nobody can
currently sign into.

So the app serves its own files: the link points here, this fetches the
bytes with our own credentials (see core.storage.read_file), and the browser
gets the file. It also means permission is checked on the way out, which a
public Cloudinary URL never did — anyone with the link had the file.
"""

import logging
import mimetypes

from django.http import FileResponse, Http404, HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.roles import is_staff_role
from .storage import read_file

logger = logging.getLogger(__name__)


def _send(name, data):
    content_type = mimetypes.guess_type(name)[0] or 'application/octet-stream'
    response = HttpResponse(data, content_type=content_type)
    # `inline` so a PDF opens in the browser instead of forcing a download —
    # people are usually checking a file, not filing it.
    response['Content-Disposition'] = f'inline; filename="{name}"'
    response['Cache-Control'] = 'private, max-age=300'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consultation_document(request, pk):
    """A file held against a client job.

    Staff see any of them. A client sees the ones released to them, and the
    ones they uploaded themselves — the same rule the documents API uses, now
    enforced on the file itself rather than only on the listing.
    """
    from consultations.models import ConsultationDocument
    from django.db.models import Q

    qs = ConsultationDocument.objects.all()
    if not is_staff_role(request.user):
        qs = qs.filter(request__client=request.user).filter(
            Q(is_deliverable=True) | Q(uploaded_by=request.user))

    doc = qs.filter(pk=pk).first()
    if not doc or not doc.file:
        raise Http404

    try:
        data = read_file(doc.file.name)
    except Exception as e:
        logger.error('Could not serve document %s: %s', pk, e)
        return Response({'error': f'The file could not be read: {e}'}, status=502)

    return _send(doc.title or doc.file.name.rsplit('/', 1)[-1], data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_attachment(request, pk):
    """The file attached to a task — visible to the person doing it and to
    whoever handed it out."""
    from .models import Task

    task = Task.objects.filter(pk=pk).first()
    if not task or not task.attachment:
        raise Http404

    role = (getattr(request.user, 'role_name', '') or '').strip().lower()
    allowed = (task.assigned_to_id == request.user.id
               or task.assigned_by_id == request.user.id
               or role in ('admin', 'consultant') or request.user.is_superuser)
    if not allowed:
        return Response({'error': 'This task is not yours.'}, status=403)

    try:
        data = read_file(task.attachment.name)
    except Exception as e:
        logger.error('Could not serve task attachment %s: %s', pk, e)
        return Response({'error': f'The file could not be read: {e}'}, status=502)

    return _send(task.attachment.name.rsplit('/', 1)[-1], data)
