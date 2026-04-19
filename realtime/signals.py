# realtime/signals.py

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from home.models import ContactMessage
from bookings.models import Booking
from consultations.models import ConsultationRequest
from .services.notification_service import NotificationService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ContactMessage)
def contact_message_created(sender, instance, created, **kwargs):
    """Send notification when new contact message is created"""
    if created:
        try:
            NotificationService.notify_new_contact_message(instance)
            logger.info(f"Notification sent for contact message {instance.id}")
        except Exception as e:
            logger.error(f"Failed to send notification for contact message {instance.id}: {e}")


@receiver(post_save, sender=Booking)
def booking_created(sender, instance, created, **kwargs):
    """Send notification when new booking is created"""
    if created:
        try:
            NotificationService.notify_new_booking(instance)
            logger.info(f"Notification sent for booking {instance.id}")
        except Exception as e:
            logger.error(f"Failed to send notification for booking {instance.id}: {e}")


@receiver(post_save, sender=ConsultationRequest)
def consultation_updated(sender, instance, created, **kwargs):
    """Send notification when consultation status changes"""
    if not created:
        try:
            # Get the old instance (before save)
            # Note: This requires the instance to have been saved before
            # For proper status change detection, consider using a pre_save signal
            if hasattr(instance, '_old_status'):
                if instance._old_status != instance.status:
                    NotificationService.notify_consultation_update(instance)
                    logger.info(f"Notification sent for consultation {instance.id} status change")
        except Exception as e:
            logger.error(f"Failed to send notification for consultation {instance.id}: {e}")


# Alternative: Use pre_save to capture old status
from django.db.models.signals import pre_save


@receiver(pre_save, sender=ConsultationRequest)
def capture_old_status(sender, instance, **kwargs):
    """Capture old status before saving"""
    if instance.pk:
        try:
            old = ConsultationRequest.objects.get(pk=instance.pk)
            instance._old_status = old.status
        except ConsultationRequest.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None
