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


def notify_request_submitted(consultation, actor=None):
    """The work is in; somebody has to look at it.

    Told to whoever assigned it, and to the admins — a submission nobody sees
    is a client waiting for a report that is already written.
    """
    from django.contrib.auth import get_user_model
    from django.db.models import Q

    who = list(get_user_model().objects.filter(
        Q(role__name__iexact='admin') | Q(role__name__iexact='consultant')
        | Q(is_superuser=True), is_active=True).distinct())

    name = getattr(actor, 'full_name', '') or getattr(actor, 'username', 'Someone')
    for person in who:
        if actor and person.pk == actor.pk:
            continue
        _create(
            person,
            'Work submitted for review',
            f'{name} finished {consultation.item_name or "a job"} for '
            f'{getattr(consultation.client, "full_name", "") or "a client"}. '
            f'It needs checking before it goes out.',
            link=f'/work/job/{consultation.id}',
        )


def notify_request_reviewed(consultation, approved, actor=None):
    """The verdict goes back to whoever did the work."""
    if not consultation.assigned_to:
        return
    if approved:
        title = 'Work approved'
        message = (f'{consultation.item_name or "The job"} was approved. '
                   f'It can now be sent to the client.')
    else:
        title = 'Work sent back'
        message = f'{consultation.item_name or "The job"} needs changes.'
        if consultation.review_notes:
            message += f' — {consultation.review_notes}'
    _create(consultation.assigned_to, title, message,
            link=f'/work/job/{consultation.id}')
