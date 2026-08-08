# realtime/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from core.models import BaseModel


def _chat_attachment_storage():
    """Chat attachments can be any file type (PDF, Word, images). On production
    the default Cloudinary storage only accepts images and 500s on other files,
    so use raw storage there. Locally (filesystem) this stays the default."""
    default = (getattr(settings, 'DEFAULT_FILE_STORAGE', '') or '').lower()
    if 'cloudinary' in default:
        try:
            from cloudinary_storage.storage import RawMediaCloudinaryStorage
            return RawMediaCloudinaryStorage()
        except Exception:
            return None
    return None


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
    attachment = models.FileField(upload_to='chat_attachments/', storage=_chat_attachment_storage(), blank=True, null=True)
    related_consultation = models.ForeignKey(
        'consultations.ConsultationRequest',
        on_delete=models.SET_NULL,
        blank=True, null=True,
        related_name='messages',
        help_text='Optional link giving a client-staff conversation its context'
    )

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