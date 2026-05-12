# notifications/signals.py

"""
Signals zinazosikiliza matukio mbalimbali na kutuma notifications kiatomati.
Hii inaepuka kuwa na code duplicate katika apps tofauti.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

logger = logging.getLogger(__name__)

# Import CommunicationService kwa kutuma notifications
from notifications.services.communication_service import CommunicationService


# ============================================================
# BOOKING SIGNALS
# ============================================================

@receiver(post_save, sender='bookings.Booking')
def handle_booking_notifications(sender, instance, created, **kwargs):
    """Sikiliza booking events na tuma notifications"""
    try:
        if created:
            # Booking mpya - arifu admin
            CommunicationService.notify_new_booking(instance)
            # Arifu mteja
            CommunicationService.send_booking_confirmation(instance)
            logger.info(f"Booking notifications sent for #{instance.id}")
        elif hasattr(instance, 'status') and instance.status == 'confirmed':
            # Booking imethibitishwa
            CommunicationService.send_booking_confirmation(instance)
        elif hasattr(instance, 'status') and instance.status == 'cancelled':
            # Booking imefutwa
            CommunicationService.send_booking_cancellation(instance)
    except Exception as e:
        logger.error(f"Failed to handle booking notification for #{instance.id}: {e}")


# ============================================================
# CONSULTATION SIGNALS
# ============================================================

@receiver(post_save, sender='consultations.ConsultationRequest')
def handle_consultation_notifications(sender, instance, created, **kwargs):
    """Sikiliza consultation events na tuma notifications"""
    try:
        if created:
            # Consultation mpya - arifu admin
            CommunicationService.notify_new_consultation(instance)
            logger.info(f"Consultation notification sent for #{instance.id}")
        else:
            # Status imebadilika - arifu mteja
            CommunicationService.notify_consultation_update(instance)
            logger.info(f"Consultation update notification sent for #{instance.id}")
    except Exception as e:
        logger.error(f"Failed to handle consultation notification for #{instance.id}: {e}")


# ============================================================
# PAYMENT SIGNALS
# ============================================================

@receiver(post_save, sender='payments.PaymentTransaction')
def handle_payment_notifications(sender, instance, created, **kwargs):
    """Sikiliza payment events na tuma notifications"""
    try:
        if hasattr(instance, 'status') and instance.status == 'completed':
            CommunicationService.send_payment_receipt(instance)
            logger.info(f"Payment receipt sent for transaction #{instance.id}")
        elif hasattr(instance, 'status') and instance.status == 'failed':
            CommunicationService.send_payment_failed(instance)
            logger.info(f"Payment failure notification sent for transaction #{instance.id}")
    except Exception as e:
        logger.error(f"Failed to handle payment notification for #{instance.id}: {e}")


# ============================================================
# CONTACT MESSAGE SIGNALS
# ============================================================

@receiver(post_save, sender='home.ContactMessage')
def handle_contact_message_notifications(sender, instance, created, **kwargs):
    """Sikiliza contact messages na arifu admin"""
    try:
        if created:
            CommunicationService.notify_new_contact_message(instance)
            logger.info(f"Contact message notification sent for #{instance.id}")
    except Exception as e:
        logger.error(f"Failed to handle contact message notification for #{instance.id}: {e}")


# ============================================================
# USER ACCOUNT SIGNALS
# ============================================================

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def handle_user_notifications(sender, instance, created, **kwargs):
    """Sikiliza user events na tuma notifications"""
    try:
        if created:
            # Mtumiaji mpya - tuma welcome email
            CommunicationService.send_welcome(instance)
            logger.info(f"Welcome email sent to {instance.email}")
    except Exception as e:
        logger.error(f"Failed to handle user notification for {instance.id}: {e}")