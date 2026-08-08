# consultations/notify.py
"""In-app notifications for the consultation (job) workflow.

Kept side-effect-safe: a failure to create a notification must never break the
underlying workflow action, so everything is wrapped defensively.
"""

import logging

logger = logging.getLogger(__name__)


def _create(recipient, title, message, link='/dashboard', data=None):
    if recipient is None:
        return
    try:
        from notifications.models import Notification
        Notification.objects.create(
            recipient=recipient,
            notification_type='consultation',
            title=title,
            message=message,
            related_link=link,
            data=data or {},
        )
    except Exception as e:  # never let notifications break the workflow
        logger.warning("notify failed: %s", e)


def notify_request_assigned(consultation, assignee, actor=None):
    """Tell the staff member a job was assigned to them."""
    if not assignee:
        return
    item = consultation.item_name or 'a service'
    _create(
        assignee,
        title="New job assigned to you",
        message=f"You have been assigned: {item}.",
        link='/dashboard',
        data={'request_id': str(consultation.id), 'kind': 'assigned'},
    )


# Client-facing message per status.
_CLIENT_STATUS_MSG = {
    'confirmed':   ("Your request was accepted", "We've accepted your request and assigned a specialist."),
    'in_progress': ("Work has started", "Our team has started working on your request."),
    'completed':   ("Your request is completed", "The work on your request is complete."),
    'delivered':   ("Your work has been delivered", "Your completed work is ready — open your dashboard to view and download it."),
}


def notify_request_status(consultation, actor=None, delivered=False):
    """Tell the client their job moved to a new step."""
    client = getattr(consultation, 'client', None)
    status = 'delivered' if delivered else consultation.status
    entry = _CLIENT_STATUS_MSG.get(status)
    if not entry:
        return
    title, message = entry
    _create(
        client,
        title=title,
        message=message,
        link='/dashboard',
        data={'request_id': str(consultation.id), 'status': status},
    )
