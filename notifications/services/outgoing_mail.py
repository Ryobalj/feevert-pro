# notifications/services/outgoing_mail.py
"""Sending with a memory: every outgoing message is recorded, retried if the
mail server refuses it, and marked read if the recipient opens it.

Before this, a send was a single try — a refused message was reported to
whoever clicked Send and then forgotten, and there was no way to answer "did
they get it?". Three things changed:

  * `send_now()` writes an OutgoingEmail row first, so nothing is lost even
    if the send fails outright.
  * `retry_pending()` (called from the mail cron) walks the failures on a
    backoff, so a mail server that was briefly down doesn't cost a message.
  * a tracking pixel in the HTML alternative marks the row opened when the
    recipient's client loads it.

What the statuses honestly mean is documented on the model — `sent` is the
mail server accepting the message, not a delivery receipt.
"""

import html as _html
import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from ..models import OutgoingEmail

logger = logging.getLogger(__name__)


class AttachmentError(Exception):
    """An attachment could not be stored, so the message must not go out
    pretending to carry it."""



def _tracking_url(out):
    base = (getattr(settings, 'BACKEND_URL', '') or '').rstrip('/')
    return f'{base}/api/mail/open/{out.tracking_id}.gif'


def _with_pixel(out):
    """The HTML alternative to send, with the read-tracking pixel appended.

    A plain-text message gets an HTML twin rather than being replaced by one:
    the text part stays exactly as written, and clients that refuse HTML (or
    images) still get the real message.
    """
    if out.body_html:
        body_html = out.body_html
    else:
        escaped = _html.escape(out.body or '').replace('\n', '<br>')
        body_html = f'<div style="font-family:Arial,sans-serif;font-size:14px">{escaped}</div>'
    pixel = (f'<img src="{_tracking_url(out)}" width="1" height="1" '
             f'alt="" style="display:none">')
    return body_html + pixel


def read_uploads(files):
    """The bytes, taken while the upload is still in our hands.

    Storing a file and reading it back is not the same round trip on every
    backend: Cloudinary's raw storage accepts the save and then cannot open
    what it wrote, which is how a PDF that uploaded perfectly turned into
    "the file could not be read back, so the message was not sent". The first
    send never needs storage at all — the bytes are right here.
    """
    out = []
    for f in files or []:
        try:
            f.seek(0)
            data = f.read()
            f.seek(0)                     # leave it re-readable for the save
            out.append((f.name, data, getattr(f, 'content_type', '')
                        or 'application/octet-stream'))
        except Exception as e:
            logger.error('Could not read upload %s: %s', getattr(f, 'name', '?'), e)
            raise AttachmentError(
                f'The file "{getattr(f, "name", "attachment")}" could not be read, '
                f'so the message was not sent: {e}') from e
    return out


def _store_attachments(files):
    """Keep a copy where a retry can still find it.

    A retry can come two hours after the click, long after the upload objects
    have gone. This copy is for that case only — the first attempt uses the
    bytes read straight from the upload.
    """
    from django.core.files.storage import default_storage

    from core.storage import any_file_storage

    storage = any_file_storage() or default_storage
    saved = []
    for f in files or []:
        try:
            path = storage.save(f'outgoing_attachments/{f.name}', f)
            saved.append({
                'name': f.name,
                'path': path,
                'content_type': getattr(f, 'content_type', '') or 'application/octet-stream',
            })
        except Exception as e:
            # Loudly. This used to be swallowed, and the message went out
            # without the file while the sender was told it had been sent —
            # the worst of both, because nobody knew to try again.
            logger.error('Could not store attachment %s: %s', getattr(f, 'name', '?'), e)
            raise AttachmentError(
                f'The file "{getattr(f, "name", "attachment")}" could not be saved, '
                f'so the message was not sent: {e}'
            ) from e
    return saved


def _job_documents(document_ids, user):
    """Attach files already held against a client job.

    The file is on the job because someone uploaded it there; sending it
    should not mean finding it on a laptop again. Nothing is copied — the
    message points at the file where it already lives.

    Only documents this person is allowed to see can be attached: the same
    queryset the documents API uses, not a raw id lookup.
    """
    import mimetypes

    if not document_ids:
        return []

    from accounts.roles import is_staff_role
    from consultations.models import ConsultationDocument

    qs = ConsultationDocument.objects.all()
    if not is_staff_role(user):
        qs = qs.filter(request__client=user)

    rows = []
    for doc in qs.filter(id__in=document_ids):
        if not doc.file:
            continue
        name = doc.title or doc.file.name.rsplit('/', 1)[-1]
        rows.append({
            'name': name,
            'path': doc.file.name,
            'content_type': mimetypes.guess_type(name)[0] or 'application/octet-stream',
            'from_job': True,
        })
    return rows


def _fetch(storage, path):
    """The bytes at `path`, however we can get them.

    `storage.open()` is the direct route and fails on Cloudinary raw files;
    the URL is public and works. Trying both means a retry is not at the mercy
    of which backend the file happened to land on.
    """
    try:
        with storage.open(path, 'rb') as fh:
            return fh.read()
    except Exception as direct:
        try:
            import requests
            url = storage.url(path)
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as over_http:
            raise AttachmentError(
                f'{direct} / {over_http}'
            ) from over_http


def _load_attachments(rows):
    """Read them back as (name, bytes, content_type) for the mail message."""
    from django.core.files.storage import default_storage

    from core.storage import any_file_storage

    storage = any_file_storage() or default_storage
    out = []
    for row in rows or []:
        try:
            out.append((row.get('name') or 'attachment', _fetch(storage, row['path']),
                        row.get('content_type') or 'application/octet-stream'))
        except Exception as e:
            logger.error('Could not read attachment %s: %s', row.get('path'), e)
            raise AttachmentError(
                f'The file "{row.get("name") or row.get("path")}" could not be read back '
                f'from {row.get("path")}, so the message was not sent. {e}'
            ) from e
    return out


def queue(to_email, subject, body, html_body=None, account=None, user=None,
          reply_to_email=None, attachments=None, document_ids=None):
    """Record a message we intend to send. Nothing goes out yet."""
    recipients = to_email if isinstance(to_email, str) else ', '.join(to_email)
    return OutgoingEmail.objects.create(
        attachments=_store_attachments(attachments) + _job_documents(document_ids, user),
        account=account,
        sent_by=user if getattr(user, 'is_authenticated', False) else None,
        reply_to_email=reply_to_email,
        from_address=(account.email_address if account else
                      getattr(settings, 'DEFAULT_FROM_EMAIL', '')),
        to_email=recipients,
        subject=subject or '',
        body=body or '',
        body_html=html_body or '',
        status='queued',
    )


def attempt(out, files=None):
    """Try to send one recorded message once, and write down what happened.

    `files` is the bytes already in hand from the upload. Only a retry, hours
    later, has to go back to storage for them.
    """
    from .email_outbound_service import EmailOutboundService

    recipients = [r.strip() for r in out.to_email.split(',') if r.strip()]
    out.attempts += 1

    try:
        if files is None:
            files = _load_attachments(out.attachments)
        else:
            # Files held on a client job are pointed at, not uploaded, so those
            # do have to be fetched — but only if there are any. An upload in
            # hand should never wait on storage.
            from_job = [r for r in (out.attachments or []) if r.get('from_job')]
            files = list(files) + (_load_attachments(from_job) if from_job else [])
        if out.account:
            result = EmailOutboundService.send_via_account(
                account=out.account, to_email=recipients,
                subject=out.subject, body=out.body, html_body=_with_pixel(out),
                attachments=files,
            )
        else:
            ok = EmailOutboundService.send(
                to_email=recipients, subject=out.subject, body=out.body,
                html_body=_with_pixel(out), attachments=files,
            )
            result = {'success': bool(ok), 'error': EmailOutboundService.last_error}
    except Exception as e:            # a broken connection shouldn't lose the record
        result = {'success': False, 'error': str(e)}

    if result.get('success'):
        out.status = 'sent'
        out.sent_at = timezone.now()
        out.last_error = ''
        out.next_retry_at = None
        out.save(update_fields=['status', 'sent_at', 'last_error', 'next_retry_at',
                                'attempts', 'updated_at'])
        return True

    out.last_error = str(result.get('error') or 'Unknown error')[:2000]
    if out.attempts >= OutgoingEmail.MAX_ATTEMPTS:
        out.status = 'gave_up'
        out.next_retry_at = None
        logger.error('Giving up on mail to %s after %s attempts: %s',
                     out.to_email, out.attempts, out.last_error[:200])
        _alert(out)
    else:
        idx = min(out.attempts - 1, len(OutgoingEmail.RETRY_BACKOFF) - 1)
        out.status = 'failed'
        out.next_retry_at = timezone.now() + timedelta(minutes=OutgoingEmail.RETRY_BACKOFF[idx])
    out.save(update_fields=['status', 'last_error', 'next_retry_at', 'attempts', 'updated_at'])
    return False


def send_now(to_email, subject, body, html_body=None, account=None, user=None,
             reply_to_email=None, attachments=None, document_ids=None):
    """Record and try to send immediately. Returns the OutgoingEmail either
    way — a failure here is scheduled for retry, not lost."""
    # Read the uploads before anything else: this is the one moment the bytes
    # are guaranteed to be readable, whatever the storage backend does next.
    in_hand = read_uploads(attachments)
    out = queue(to_email, subject, body, html_body, account, user, reply_to_email,
                attachments, document_ids)
    attempt(out, files=in_hand)
    return out


def retry_pending(limit=25):
    """Re-send everything that failed and is due. Called by the mail cron."""
    from django.db.models import Q

    due = OutgoingEmail.objects.filter(
        Q(next_retry_at__lte=timezone.now()) | Q(next_retry_at__isnull=True),
        status__in=['queued', 'failed'],
        attempts__lt=OutgoingEmail.MAX_ATTEMPTS,
    )
    rows = list(due.order_by('created_at')[:limit])
    sent = 0
    for out in rows:
        if attempt(out):
            sent += 1
    return {'tried': len(rows), 'sent': sent}


def mark_opened(tracking_id, ip=''):
    """The recipient's mail client loaded the pixel."""
    out = OutgoingEmail.objects.filter(tracking_id=tracking_id).first()
    if not out:
        return None
    now = timezone.now()
    # Some clients pre-fetch images the moment mail arrives, and our own SMTP
    # copy can trip it too — so the first open is only believed a few seconds
    # after we sent, and the timestamp kept is the first one.
    if out.sent_at and (now - out.sent_at).total_seconds() < 5:
        return out
    out.open_count += 1
    out.last_opened_ip = (ip or '')[:64]
    if not out.opened_at:
        out.opened_at = now
    if out.status in ('sent', 'queued'):
        out.status = 'opened'
    out.save(update_fields=['open_count', 'opened_at', 'status', 'last_opened_ip',
                            'updated_at'])
    return out


def _alert(out):
    """Tell the admins when a message has stopped trying — silence here means
    a client is waiting for an answer that will never arrive."""
    try:
        from django.contrib.auth import get_user_model
        from django.db.models import Q

        from ..models import Notification

        recipients = list(get_user_model().objects.filter(is_active=True).filter(
            Q(is_superuser=True) | Q(role__name__iexact='admin')).distinct())
        if out.sent_by and out.sent_by not in recipients:
            recipients.append(out.sent_by)     # the person who wrote it, first of all
        for person in recipients:
            Notification.objects.create(
                recipient=person, notification_type='system',
                title='An email could not be sent',
                message=(f'To: {out.to_email}\nSubject: {out.subject[:120]}\n\n'
                         f'{out.last_error[:200]}'),
                related_link='/email-inbox',
            )
    except Exception as e:
        logger.warning('Could not alert admins about the failed mail: %s', e)
