# notifications/services/communication_service.py

"""
FACADE kwa apps zote.
Badala ya kuunda Notification kwa manually kila mahali,
apps zitatumia hizi njia rahisi.

Matumizi:
    CommunicationService.notify_new_booking(booking)
    CommunicationService.send_welcome(user)
"""

from .notification_dispatcher import NotificationDispatcher


class CommunicationService:

    # ============================================================
    # BOOKING NOTIFICATIONS
    # ============================================================

    @staticmethod
    def notify_new_booking(booking):
        """Admin anaarifiwa kuhusu booking mpya"""
        NotificationDispatcher.send_to_admins(
            notification_type='email',
            title='New Booking Request',
            message=f"New booking from {booking.client.username} on {booking.slot.date if hasattr(booking, 'slot') else 'pending date'}",
            related_link=f'/admin/bookings/booking/{booking.id}/change/',
            object_id=booking.id,
            object_type='booking',
        )

    @staticmethod
    def send_booking_confirmation(booking):
        """Mteja anapokea confirmation ya booking"""
        NotificationDispatcher.send(
            recipient=booking.client,
            notification_type='email',
            title='Booking Confirmed ✅',
            message=(
                f"Dear {booking.client.username},\n\n"
                f"Your booking has been confirmed.\n"
                f"Date: {booking.slot.date if hasattr(booking, 'slot') else 'TBC'}\n"
                f"Time: {booking.slot.start_time if hasattr(booking, 'slot') else 'TBC'}\n\n"
                f"Thank you for choosing FeeVert!"
            ),
            related_link='/bookings/',
            object_id=booking.id,
            object_type='booking',
        )

    @staticmethod
    def send_booking_reminder(booking):
        """Mteja anapokea reminder ya booking"""
        NotificationDispatcher.send(
            recipient=booking.client,
            notification_type='sms',
            title='Booking Reminder',
            message=(
                f"FEEVERT Reminder: Your consultation is scheduled for "
                f"{booking.slot.date if hasattr(booking, 'slot') else 'upcoming'} "
                f"at {booking.slot.start_time if hasattr(booking, 'slot') else 'TBC'}. "
                f"Call us for changes."
            ),
            related_link='/bookings/',
            object_id=booking.id,
            object_type='booking',
        )

    @staticmethod
    def send_booking_cancellation(booking):
        """Mteja anapokea cancellation notice"""
        NotificationDispatcher.send(
            recipient=booking.client,
            notification_type='email',
            title='Booking Cancelled',
            message=f"Your booking #{booking.id} has been cancelled. Contact us if you need help.",
            related_link='/bookings/',
            object_id=booking.id,
            object_type='booking',
        )

    # ============================================================
    # CONSULTATION NOTIFICATIONS
    # ============================================================

    @staticmethod
    def notify_consultation_update(consultation):
        """Mteja anaarifiwa kuhusu mabadiliko ya consultation"""
        NotificationDispatcher.send(
            recipient=consultation.client if hasattr(consultation, 'client') else consultation.user,
            notification_type='email',
            title=f"Consultation {consultation.status.title()}",
            message=(
                f"Your consultation #{consultation.id} is now "
                f"{consultation.status}.\n\n"
                f"Login to view details."
            ),
            related_link=f'/consultations/{consultation.id}/',
            object_id=consultation.id,
            object_type='consultation',
        )

    @staticmethod
    def notify_new_consultation(consultation):
        """Admin anaarifiwa kuhusu consultation mpya"""
        NotificationDispatcher.send_to_admins(
            notification_type='email',
            title='New Consultation Request',
            message=f"New consultation request from {consultation.client.username if hasattr(consultation, 'client') else 'a client'}.",
            related_link=f'/admin/consultations/consultation/{consultation.id}/change/',
            object_id=consultation.id,
            object_type='consultation',
        )

    # ============================================================
    # PAYMENT NOTIFICATIONS
    # ============================================================

    @staticmethod
    def send_payment_receipt(transaction):
        """Mteja anapokea receipt ya malipo"""
        NotificationDispatcher.send(
            recipient=transaction.user if hasattr(transaction, 'user') else transaction.recipient,
            notification_type='email',
            title='Payment Receipt 💰',
            message=(
                f"Dear Customer,\n\n"
                f"Payment received successfully!\n"
                f"Amount: {transaction.amount} {getattr(transaction, 'currency', 'TZS')}\n"
                f"Reference: {getattr(transaction, 'reference', transaction.id)}\n"
                f"Date: {getattr(transaction, 'created_at', 'Now')}\n\n"
                f"Thank you for your payment!"
            ),
            related_link='/payments/',
            object_id=transaction.id,
            object_type='payment',
        )

    @staticmethod
    def send_payment_failed(transaction, reason=''):
        """Mteja anaarifiwa kuhusu malipo yaliyoshindikana"""
        NotificationDispatcher.send(
            recipient=transaction.user if hasattr(transaction, 'user') else transaction.recipient,
            notification_type='email',
            title='Payment Failed ❌',
            message=f"Your payment of {transaction.amount} has failed. {reason} Please try again.",
            related_link='/payments/',
            object_id=transaction.id,
            object_type='payment',
        )

    # ============================================================
    # CONTACT MESSAGE NOTIFICATIONS
    # ============================================================

    @staticmethod
    def notify_new_contact_message(message_obj):
        """Admin anaarifiwa kuhusu ujumbe mpya kutoka kwa mteja"""
        NotificationDispatcher.send_to_admins(
            notification_type='email',
            title='📩 New Contact Message',
            message=(
                f"From: {message_obj.name} ({message_obj.email})\n"
                f"Phone: {getattr(message_obj, 'phone', 'N/A')}\n"
                f"Subject: {message_obj.subject}\n\n"
                f"Message:\n{message_obj.message[:200]}..."
            ),
            related_link=f'/admin/home/contactmessage/{message_obj.id}/change/',
            object_id=message_obj.id,
            object_type='contact_message',
        )

    # ============================================================
    # ACCOUNT NOTIFICATIONS
    # ============================================================

    @staticmethod
    def send_welcome(user):
        """Tuma ujumbe wa kukaribisha mtumiaji mpya"""
        NotificationDispatcher.send(
            recipient=user,
            notification_type='email',
            title='Welcome to FeeVert! 🎉',
            message=(
                f"Dear {user.username},\n\n"
                f"Welcome to FeeVert Solution Limited!\n"
                f"We're excited to have you on board.\n\n"
                f"Explore our services: consultations, bookings, and more.\n\n"
                f"Thank you,\nFeeVert Team"
            ),
            related_link='/',
        )

    @staticmethod
    def send_verification_email(user, token):
        """Tuma email ya verification"""
        from django.conf import settings
        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        NotificationDispatcher.send(
            recipient=user,
            notification_type='email',
            title='Verify Your Email ✉️',
            message=(
                f"Hello {user.username},\n\n"
                f"Please verify your email by clicking the link below:\n\n"
                f"{verification_link}\n\n"
                f"This link will expire in 24 hours.\n\n"
                f"Thank you,\nFeeVert Team"
            ),
            related_link=verification_link,
        )

    @staticmethod
    def send_password_reset(user, reset_link):
        """Tuma link ya kubadilisha password"""
        NotificationDispatcher.send(
            recipient=user,
            notification_type='email',
            title='Password Reset 🔐',
            message=(
                f"Hello {user.username},\n\n"
                f"You requested a password reset. Click the link below:\n\n"
                f"{reset_link}\n\n"
                f"If you didn't request this, please ignore this email.\n\n"
                f"FeeVert Team"
            ),
            related_link=reset_link,
        )

    @staticmethod
    def send_account_activation(user):
        """Tuma notification ya account activation"""
        NotificationDispatcher.send(
            recipient=user,
            notification_type='email',
            title='Account Activated ✅',
            message=(
                f"Dear {user.username},\n\n"
                f"Your FeeVert account has been activated!\n"
                f"You can now access all our services.\n\n"
                f"Login: {getattr(settings, 'FRONTEND_URL', '')}/login\n\n"
                f"FeeVert Team"
            ),
            related_link='/login/',
        )

    # ============================================================
    # PROMOTIONAL NOTIFICATIONS
    # ============================================================

    @staticmethod
    def send_promotion(user, title, message, link=''):
        """Tuma promotional email kwa mtumiaji"""
        NotificationDispatcher.send(
            recipient=user,
            notification_type='email',
            title=title,
            message=message,
            related_link=link,
            priority='low',
        )

    @staticmethod
    def send_newsletter(user, subject, content):
        """Tuma newsletter kwa mtumiaji"""
        NotificationDispatcher.send(
            recipient=user,
            notification_type='email',
            title=subject,
            message=content,
            priority='low',
        )

    # ============================================================
    # INTERNAL / STAFF NOTIFICATIONS
    # ============================================================

    @staticmethod
    def notify_staff(recipient, title, message, link=''):
        """Tuma notification kwa staff member"""
        NotificationDispatcher.send(
            recipient=recipient,
            notification_type='in_app',
            title=title,
            message=message,
            related_link=link,
            priority='medium',
        )

    @staticmethod
    def notify_all_staff(title, message, link=''):
        """Tuma notification kwa staff wote"""
        from accounts.models import User
        staff = User.objects.filter(is_staff=True, is_active=True)
        return NotificationDispatcher.send_to_users(
            users=staff,
            notification_type='in_app',
            title=title,
            message=message,
            related_link=link,
        )