# realtime/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel


# Realtime app inatumia models za notifications app
# Hii ni empty file - models zote zinatoka kwenye notifications app

# Import models from notifications for convenience
from notifications.models import (
    Notification,
    NotificationLog,
    NotificationTemplate,
    UserNotificationSetting
)

__all__ = [
    'Notification',
    'NotificationLog',
    'NotificationTemplate',
    'UserNotificationSetting'
]


class Message(BaseModel):
    """
    User-to-user messages (chat)
    """
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sent_messages'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='received_messages'
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender', '-created_at']),
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
    
    def __str__(self):
        return f"{self.sender.username} → {self.recipient.username}: {self.message[:30]}"
    
    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])