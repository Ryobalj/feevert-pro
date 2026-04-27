# notifications/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel

class Notification(BaseModel):
    """
    Notifications sent to users (email, SMS, in-app)
    """
    NOTIFICATION_TYPES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('in_app', 'In App'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES, default='in_app')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    related_link = models.CharField(max_length=500, blank=True)
    related_object_id = models.IntegerField(blank=True, null=True, help_text="ID of related object (booking, consultation, etc.)")
    related_object_type = models.CharField(max_length=50, blank=True, help_text="Model name like 'booking', 'consultation'")
    scheduled_for = models.DateTimeField(blank=True, null=True, help_text="Schedule notification for later")
    sent_at = models.DateTimeField(blank=True, null=True)
    retry_count = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type', 'sent_at']),
            models.Index(fields=['scheduled_for']),
        ]
    
    def __str__(self):
        return f"{self.recipient.username} - {self.title[:50]} - {self.notification_type}"


class NotificationLog(BaseModel):
    """
    Log of notification delivery attempts
    """
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='logs')
    status = models.CharField(max_length=20, choices=(
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('retrying', 'Retrying'),
    ), default='pending')
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    provider_response = models.JSONField(default=dict, blank=True, help_text="Response from email/SMS provider")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['notification', 'status']),
        ]
    
    def __str__(self):
        return f"Log for {self.notification.title[:30]} - {self.status}"


class NotificationTemplate(BaseModel):
    """
    Reusable templates for notifications
    """
    TEMPLATE_CATEGORIES = (
        ('booking', 'Booking Related'),
        ('consultation', 'Consultation Related'),
        ('payment', 'Payment Related'),
        ('account', 'Account Related'),
        ('promotional', 'Promotional'),
        ('reminder', 'Reminder'),
    )
    
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=TEMPLATE_CATEGORIES)
    subject = models.CharField(max_length=200, help_text="Email subject or notification title")
    body_html = models.TextField(blank=True, help_text="HTML version for email")
    body_text = models.TextField(help_text="Plain text version for SMS/In-app")
    variables = models.JSONField(default=list, blank=True, help_text="List of variables like ['client_name', 'booking_date']")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.get_category_display()} - {self.name}"


class UserNotificationSetting(BaseModel):
    """
    User preferences for receiving notifications
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_settings')
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    in_app_enabled = models.BooleanField(default=True)
    
    # Specific notification types
    email_booking_confirmation = models.BooleanField(default=True)
    email_booking_reminder = models.BooleanField(default=True)
    email_consultation_update = models.BooleanField(default=True)
    email_payment_receipt = models.BooleanField(default=True)
    email_promotional = models.BooleanField(default=False)
    
    sms_booking_confirmation = models.BooleanField(default=False)
    sms_booking_reminder = models.BooleanField(default=True)
    sms_consultation_update = models.BooleanField(default=False)
    
    in_app_all = models.BooleanField(default=True)
    
    # Quiet hours
    quiet_hours_start = models.TimeField(blank=True, null=True)
    quiet_hours_end = models.TimeField(blank=True, null=True)
    
    class Meta:
        verbose_name_plural = "User Notification Settings"
    
    def __str__(self):
        return f"Notification settings for {self.user.username}"