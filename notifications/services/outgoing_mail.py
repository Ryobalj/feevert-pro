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


def queue(to_email, subject, body, html_body=None, account=None, user=None,
          reply_to_email=None):
    """Record a message we intend to send. Nothing goes out yet."""
    recipients = to_email if isinstance(to_email, str) else ', '.join(to_email)
    return OutgoingEmail.objects.create(
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


def attempt(out):
    """Try to send one recorded message once, and write down what happened."""
    from .email_outbound_service import EmailOutboundService

    recipients = [r.strip() for r in out.to_email.split(',') if r.strip()]
    out.attempts += 1

    try:
        if out.account:
            result = EmailOutboundService.send_via_account(
                account=out.account, to_email=recipients,
                subject=out.subject, body=out.body, html_body=_with_pixel(out),
            )
        else:
            ok = EmailOutboundService.send(
                to_email=recipients, subject=out.subject, body=out.body,
                html_body=_with_pixel(out),
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
             reply_to_email=None):
    """Record and try to send immediately. Returns the OutgoingEmail either
    way — a failure here is scheduled for retry, not lost."""
    out = queue(to_email, subject, body, html_body, account, user, reply_to_email)
    attempt(out)
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
