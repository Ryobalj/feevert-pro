# notifications/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel


class Notification(BaseModel):
    """
    In-app notifications for users
    """
    NOTIFICATION_TYPES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('booking', 'Booking'),
        ('consultation', 'Consultation'),
        ('payment', 'Payment'),
        ('system', 'System'),
        ('chat', 'Chat'),
        ('contact', 'Contact'),
    )
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        default='system'
    )
    title = models.CharField(max_length=300)
    message = models.TextField()
    related_link = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.notification_type}: {self.title}"


class NotificationLog(BaseModel):
    """
    Log of all notification attempts (for debugging)
    """
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='logs',
        null=True,
        blank=True
    )
    channel = models.CharField(max_length=50)  # email, sms, push, websocket
    status = models.CharField(max_length=50)  # success, failed, pending
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.channel} - {self.status}"


class NotificationTemplate(BaseModel):
    """
    Pre-defined notification templates
    """
    name = models.CharField(max_length=200, unique=True)
    notification_type = models.CharField(
        max_length=50,
        choices=Notification.NOTIFICATION_TYPES,
        default='system'
    )
    subject_template = models.CharField(max_length=300)
    body_template = models.TextField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['notification_type', 'name']
    
    def __str__(self):
        return self.name


class UserNotificationSetting(BaseModel):
    """
    User preferences for notifications
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_settings'
    )
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "User Notification Setting"
        verbose_name_plural = "User Notification Settings"
    
    def __str__(self):
        return f"Settings for {self.user.username}"


class IncomingEmail(BaseModel):
    """
    Incoming emails from external sources (Outlook/365, IMAP, etc.)
    Stored as part of the unified communication hub.
    """
    sender = models.EmailField()
    sender_name = models.CharField(max_length=300, blank=True)
    recipient = models.EmailField(blank=True)
    subject = models.CharField(max_length=500, blank=True)
    body = models.TextField(blank=True)
    body_html = models.TextField(blank=True)
    
    message_id = models.CharField(max_length=500, unique=True)
    thread_id = models.CharField(max_length=500, blank=True)
    in_reply_to = models.CharField(max_length=500, blank=True)
    
    received_at = models.DateTimeField()
    is_read = models.BooleanField(default=False)
    is_processed = models.BooleanField(default=False)
    
    # Attachments
    has_attachments = models.BooleanField(default=False)
    attachments = models.JSONField(default=list, blank=True)
    
    # Metadata
    headers = models.JSONField(default=dict, blank=True)
    source = models.CharField(max_length=50, default='outlook')  # outlook, imap, etc.
    folder = models.CharField(max_length=100, default='inbox')
    
    # Linking
    linked_message = models.ForeignKey(
        'home.ContactMessage',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_source'
    )
    
    class Meta:
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['message_id']),
            models.Index(fields=['thread_id']),
            models.Index(fields=['is_read', '-received_at']),
            models.Index(fields=['is_processed']),
        ]
        verbose_name = "Incoming Email"
        verbose_name_plural = "Incoming Emails"
    
    def __str__(self):
        return f"{self.sender} - {self.subject[:50] if self.subject else '(No Subject)'}"