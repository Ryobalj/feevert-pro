# core/models.py

from django.db import models
from django.conf import settings

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
    STATUS_CHOICES = (
        ('todo', 'To do'),
        ('in_progress', 'In progress'),
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
    attachment = models.FileField(upload_to='task_files/', blank=True, null=True)

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
    is_shared = models.BooleanField(
        default=False, help_text='Visible to all staff, not just the owner')
    related_request = models.ForeignKey(
        'consultations.ConsultationRequest', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='drafts',
    )

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.title} ({self.kind})'
