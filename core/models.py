# core/models.py

from datetime import timedelta

from django.db import models
from django.conf import settings

from .storage import any_file_storage

class BaseModel(models.Model):
    """
    Base model with common fields for all apps.
    All models should inherit from this class.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated'
    )
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        abstract = True
    
    def soft_delete(self):
        """Soft delete this record"""
        self.is_deleted = True
        self.deleted_at = models.DateTimeField(auto_now=True)
        self.save()
    
    def restore(self):
        """Restore a soft-deleted record"""
        self.is_deleted = False
        self.deleted_at = None
        self.save()


# ============================================================
# WORKSPACE — the tools staff use to actually do the work
# ============================================================

class Task(BaseModel):
    """Work assigned to a staff member.

    Consultation requests already carry client work; this is the lighter,
    internal to-do that admins and consultants hand out ("prepare the tender
    summary", "call the client back") and everyone can track.
    """
    # Work comes back for review before it counts as done, so whoever handed
    # it out sees the result instead of just a ticked box.
    STATUS_CHOICES = (
        ('todo', 'To do'),
        ('in_progress', 'In progress'),
        ('submitted', 'Submitted for review'),
        ('returned', 'Returned for changes'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    )
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )

    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='workspace_tasks',
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='workspace_tasks_created',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    # Optional link back to the client job this task belongs to
    related_request = models.ForeignKey(
        'consultations.ConsultationRequest', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='tasks',
    )
    attachment = models.FileField(
        upload_to='task_files/', blank=True, null=True,
        storage=any_file_storage(),          # PDFs and Word files, not just images
    )
    # The email that carried the work, so the assignee has the original to hand
    related_email = models.ForeignKey(
        'notifications.IncomingEmail', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='tasks',
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['status', '-priority', 'due_date', '-created_at']
        indexes = [
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f'{self.title} -> {self.assigned_to}'

    @property
    def is_overdue(self):
        from django.utils import timezone as _tz
        return bool(self.due_date and self.status not in ('done', 'cancelled')
                    and self.due_date < _tz.now())


class StickyNote(BaseModel):
    """A private scratch note pinned to someone's dashboard."""
    COLOR_CHOICES = (
        ('yellow', 'Yellow'), ('green', 'Green'), ('blue', 'Blue'),
        ('pink', 'Pink'), ('purple', 'Purple'),
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sticky_notes',
    )
    content = models.TextField(blank=True)
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='yellow')
    is_pinned = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_pinned', '-updated_at']

    def __str__(self):
        return (self.content[:40] or 'Empty note')


class WorkDocument(BaseModel):
    """A quick draft staff can start here and finish in Office.

    Deliberately simple: a rich-text note or a small grid, enough to capture
    work on the spot. Anything heavier gets downloaded and finished in Word or
    Excel — this is a scratchpad, not a competitor to Office.
    """
    KIND_CHOICES = (
        ('doc', 'Document'),
        ('sheet', 'Sheet'),
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='work_documents',
    )
    title = models.CharField(max_length=300, default='Untitled')
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default='doc')
    content = models.TextField(blank=True)             # doc: HTML
    data = models.JSONField(default=list, blank=True)  # sheet: [[cell, ...], ...]
    # Somewhere the real file lives (Google Docs / Office 365 / SharePoint)
    external_url = models.URLField(blank=True)
    # A draft is private. Sharing means naming the colleagues who should see
    # it — and only they do. It used to be a single "share with the team"
    # switch, which meant the whole company read a half-written quote.
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name='shared_documents',
        help_text='Colleagues who can read this draft',
    )
    related_request = models.ForeignKey(
        'consultations.ConsultationRequest', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='drafts',
    )

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.title} ({self.kind})'


class CalendarEvent(BaseModel):
    """An appointment or event someone puts on the workspace calendar.

    Client bookings and task deadlines already appear there, but there was no
    way to write down "meet the tender committee on Thursday" — the calendar
    could only be read, never added to. This is that missing piece, and it is
    what the reminders are sent for.
    """

    KIND_CHOICES = (
        ('appointment', 'Appointment'),
        ('meeting', 'Meeting'),
        ('deadline', 'Deadline'),
        ('reminder', 'Reminder'),
        ('other', 'Other'),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='calendar_events',
    )
    # Anyone else who should see it on their own calendar and be reminded.
    attendees = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name='invited_events',
    )
    # Most clients have no account here. Their names are written down so the
    # appointment says who it is with — they get no notification, because we
    # have no way to reach them from this record.
    guests = models.CharField(
        max_length=500, blank=True,
        help_text='People without an account, e.g. "Mr Kileo, TANESCO"')

    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=300, blank=True)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default='appointment')

    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)

    # Reminders: how long before it starts, and whether that has been sent.
    # `reminded_at` is what stops the cron sending the same reminder every
    # time it runs.
    remind_minutes = models.PositiveIntegerField(
        default=30, help_text='Minutes before the start to send a reminder; 0 = no reminder')
    reminded_at = models.DateTimeField(null=True, blank=True)

    related_request = models.ForeignKey(
        'consultations.ConsultationRequest', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='calendar_events',
    )

    class Meta:
        ordering = ['starts_at']
        indexes = [
            models.Index(fields=['starts_at']),
            models.Index(fields=['reminded_at', 'starts_at']),
        ]
        verbose_name = 'Calendar Event'
        verbose_name_plural = 'Calendar Events'

    def __str__(self):
        return f'{self.title} — {self.starts_at:%Y-%m-%d %H:%M}'

    @property
    def remind_at(self):
        if not self.remind_minutes:
            return None
        return self.starts_at - timedelta(minutes=self.remind_minutes)
