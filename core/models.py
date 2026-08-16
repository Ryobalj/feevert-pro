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


# ============================================================
# ONE UNIT OF WORK — the notes on it, and the field data behind it
# ============================================================

class WorkNote(BaseModel):
    """A line in the conversation about one piece of work.

    Both a client job and an internal task need the same thing: somewhere to
    say "site visit done, waiting on the lab" so the next person — or the
    same person next week — knows where it stands. Kept internal by default;
    a note is only shown to the client when someone decides it should be.
    """

    job = models.ForeignKey(
        'consultations.ConsultationRequest', on_delete=models.CASCADE,
        null=True, blank=True, related_name='work_notes',
    )
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, null=True, blank=True, related_name='work_notes',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='work_notes',
    )
    body = models.TextField()
    is_internal = models.BooleanField(
        default=True, help_text='Internal notes are never shown to the client')

    class Meta:
        ordering = ['created_at']
        indexes = [models.Index(fields=['job', 'created_at']),
                   models.Index(fields=['task', 'created_at'])]

    def __str__(self):
        return f'{self.author}: {self.body[:40]}'


class FieldSheet(BaseModel):
    """Field data collected for a job: a checklist, a set of readings, or a
    risk assessment.

    These three cover what this company actually does. An environmental audit
    or an OHS inspection is a checklist walked through on site; a noise, dust
    or water study is a column of readings that has to be summarised and
    compared against a limit; a risk assessment is likelihood times severity.
    Doing any of them in a notebook and retyping them into Word is where the
    hours and the mistakes go.

    `rows` holds the data as filled; the analysis (averages, exceedances, risk
    ratings) is computed on read so that correcting a number corrects the
    conclusion — a stored total would quietly go stale.
    """

    KIND_CHOICES = (
        ('checklist', 'Checklist / inspection'),
        ('measurements', 'Measurements'),
        ('risk', 'Risk assessment'),
    )

    job = models.ForeignKey(
        'consultations.ConsultationRequest', on_delete=models.CASCADE,
        null=True, blank=True, related_name='field_sheets',
    )
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, null=True, blank=True, related_name='field_sheets',
    )
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default='checklist')
    title = models.CharField(max_length=200)
    template_key = models.CharField(max_length=60, blank=True)

    # measurements: what is being measured, and what it may not exceed
    parameter = models.CharField(max_length=100, blank=True)
    unit = models.CharField(max_length=30, blank=True)
    limit_value = models.FloatField(null=True, blank=True)
    limit_source = models.CharField(
        max_length=200, blank=True, help_text='e.g. TBS / NEMC / WHO guideline')

    location = models.CharField(max_length=200, blank=True)
    collected_on = models.DateField(null=True, blank=True)
    rows = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='field_sheets',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.kind})'

    # ---- analysis ---------------------------------------------------------
    def _numbers(self):
        out = []
        for row in self.rows or []:
            try:
                out.append(float(row.get('value')))
            except (TypeError, ValueError):
                continue
        return out

    def summary(self):
        """What the sheet says, worked out from what is in it."""
        if self.kind == 'measurements':
            values = self._numbers()
            if not values:
                return {'count': 0}
            n = len(values)
            mean = sum(values) / n
            # Population standard deviation: these are the readings taken, not
            # a sample of a larger set.
            variance = sum((v - mean) ** 2 for v in values) / n
            out = {
                'count': n,
                'mean': round(mean, 3),
                'min': round(min(values), 3),
                'max': round(max(values), 3),
                'std_dev': round(variance ** 0.5, 3),
            }
            if self.limit_value is not None:
                over = [v for v in values if v > self.limit_value]
                out.update({
                    'limit': self.limit_value,
                    'exceedances': len(over),
                    'worst_exceedance': round(max(over), 3) if over else None,
                    'compliant': not over,
                })
            return out

        if self.kind == 'risk':
            bands = {'low': 0, 'medium': 0, 'high': 0, 'extreme': 0}
            worst = 0
            for row in self.rows or []:
                try:
                    score = int(row.get('likelihood', 0)) * int(row.get('severity', 0))
                except (TypeError, ValueError):
                    continue
                worst = max(worst, score)
                bands[self.risk_band(score)] += 1
            return {'count': len(self.rows or []), 'highest_score': worst,
                    'highest_band': self.risk_band(worst), **bands}

        done = sum(1 for r in (self.rows or []) if r.get('status') == 'yes')
        failed = sum(1 for r in (self.rows or []) if r.get('status') == 'no')
        total = len(self.rows or [])
        return {
            'count': total, 'compliant': done, 'findings': failed,
            'percent': round(done * 100 / total) if total else 0,
        }

    @staticmethod
    def risk_band(score):
        """The 5x5 matrix every OHS report in the country uses."""
        if score >= 15:
            return 'extreme'
        if score >= 8:
            return 'high'
        if score >= 4:
            return 'medium'
        return 'low'
