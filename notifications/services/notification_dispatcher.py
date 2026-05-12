# notifications/services/notification_dispatcher.py

import logging
from django.utils import timezone
from notifications.models import Notification, NotificationLog

logger = logging.getLogger(__name__)


class NotificationDispatcher:
    """
    SINGLE SOURCE OF TRUTH kwa kutuma notifications zote.
    Apps ZOTE zitatumia hii class badala ya kuunda Notification kwa manually.
    
    Matumizi:
        NotificationDispatcher.send(
            recipient=user,
            notification_type='email',
            title='Welcome',
            message='Hello!',
            related_link='/dashboard/'
        )
    """

    @classmethod
    def send(cls, recipient, notification_type, title, message, **kwargs):
        """
        Tuma notification kupitia channel yoyote.
        Hii ndiyo njia KUU inayotumiwa na apps zote.
        
        Returns:
            Notification instance
        """
        # 1. Unda Notification record
        notification = cls._create_notification(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            **kwargs
        )

        # 2. Tuma kupitia channel husika
        success = cls._dispatch(notification)

        # 3. Update status
        cls._update_status(notification, success)

        # 4. Log delivery
        cls._log_delivery(notification, success)

        return notification

    @classmethod
    def send_to_admins(cls, notification_type, title, message, **kwargs):
        """Tuma notification kwa admins WOTE kwa wakati mmoja"""
        from accounts.models import User
        admins = User.objects.filter(role='admin', is_active=True)

        notifications = []
        for admin in admins:
            notification = cls.send(
                recipient=admin,
                notification_type=notification_type,
                title=title,
                message=message,
                **kwargs
            )
            notifications.append(notification)

        return notifications

    @classmethod
    def send_to_users(cls, users, notification_type, title, message, **kwargs):
        """Tuma notification kwa watumiaji wengi kwa wakati mmoja"""
        notifications = []
        for user in users:
            notification = cls.send(
                recipient=user,
                notification_type=notification_type,
                title=title,
                message=message,
                **kwargs
            )
            notifications.append(notification)
        return notifications

    @classmethod
    def send_scheduled(cls):
        """Tuma notifications zote zilizopangwa kutumwa sasa"""
        now = timezone.now()
        pending = Notification.objects.filter(
            scheduled_for__lte=now,
            sent_at__isnull=True
        )

        for notification in pending:
            cls.send(
                recipient=notification.recipient,
                notification_type=notification.notification_type,
                title=notification.title,
                message=notification.message,
                priority=notification.priority,
                related_link=notification.related_link,
            )

        return pending.count()

    # ============================================================
    # PRIVATE METHODS
    # ============================================================

    @classmethod
    def _create_notification(cls, recipient, notification_type, title, message, **kwargs):
        """Factory method - unda Notification record moja"""
        return Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=kwargs.get('priority', 'medium'),
            related_link=kwargs.get('related_link', ''),
            related_object_id=kwargs.get('object_id'),
            related_object_type=kwargs.get('object_type', ''),
            scheduled_for=kwargs.get('scheduled_for'),
        )

    @classmethod
    def _dispatch(cls, notification):
        """Tuma notification kupitia channel husika"""
        try:
            if notification.notification_type == 'email':
                return cls._send_email(notification)
            elif notification.notification_type == 'sms':
                return cls._send_sms(notification)
            elif notification.notification_type == 'in_app':
                return cls._send_in_app(notification)
            return False
        except Exception as e:
            logger.error(f"Failed to dispatch notification #{notification.id}: {e}")
            notification.error_message = str(e)[:500]
            notification.save(update_fields=['error_message'])
            return False

    @classmethod
    def _send_email(cls, notification):
        """Tuma email kupitia EmailOutboundService"""
        try:
            from .email_outbound_service import EmailOutboundService
            return EmailOutboundService.send_notification(notification)
        except ImportError:
            # Fallback kwa Django send_mail
            from django.core.mail import send_mail
            from django.conf import settings

            send_mail(
                subject=notification.title,
                message=notification.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.recipient.email],
                fail_silently=True,
            )
            return True

    @classmethod
    def _send_sms(cls, notification):
        """Tuma SMS kupitia SMSService"""
        try:
            from .sms_service import SMSService
            phone = getattr(notification.recipient, 'phone', None)
            if phone:
                result = SMSService.send_sms(str(phone), notification.message)
                return result.get('status') == 'success'
            return False
        except ImportError:
            logger.warning("SMSService not available")
            return False

    @classmethod
    def _send_in_app(cls, notification):
        """Tuma in-app notification kupitia WebSocket (Django Channels)"""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'user_{notification.recipient.id}',
                {
                    'type': 'send_notification',
                    'notification_id': str(notification.id),
                    'notification_type': notification.notification_type,
                    'title': notification.title,
                    'message': notification.message,
                    'priority': notification.priority,
                    'timestamp': timezone.now().isoformat(),
                }
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send in-app notification: {e}")
            return False

    @classmethod
    def _update_status(cls, notification, success):
        """Update notification status baada ya kutuma"""
        if success:
            notification.sent_at = timezone.now()
            notification.save(update_fields=['sent_at'])

    @classmethod
    def _log_delivery(cls, notification, success):
        """Log delivery attempt"""
        NotificationLog.objects.create(
            notification=notification,
            status='sent' if success else 'failed',
            sent_at=timezone.now() if success else None,
        )