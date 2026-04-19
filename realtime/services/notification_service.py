# realtime/services/notification_service.py

import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from .sms_service import SMSService
from notifications.models import Notification
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending realtime and SMS notifications"""
    
    @staticmethod
    def send_realtime_notification(user_id, notification_type, title, message, data=None):
        """
        Send realtime WebSocket notification to a specific user
        """
        try:
            channel_layer = get_channel_layer()
            group_name = f'user_{user_id}'
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'send_notification',
                    'notification_type': notification_type,
                    'title': title,
                    'message': message,
                    'data': data or {},
                    'timestamp': timezone.now().isoformat()
                }
            )
            logger.info(f"Realtime notification sent to user {user_id}: {title}")
            return True
        except Exception as e:
            logger.error(f"Failed to send realtime notification: {e}")
            return False
    
    @staticmethod
    def send_sms_notification(phone_number, message, sms_type='general'):
        """
        Send SMS notification
        """
        result = SMSService.send_sms(phone_number, message)
        logger.info(f"SMS notification sent to {phone_number}: {result}")
        return result
    
    @staticmethod
    def notify_new_contact_message(message_obj):
        """
        Notify admin about new contact message
        """
        from accounts.models import User
        
        # Get admin users
        admins = User.objects.filter(role='admin', is_active=True)
        
        # Message content
        title = "New Contact Message"
        content = f"New message from {message_obj.name}: {message_obj.subject}"
        
        for admin in admins:
            # Realtime notification
            NotificationService.send_realtime_notification(
                admin.id,
                'new_contact_message',
                title,
                content,
                {'message_id': message_obj.id, 'name': message_obj.name}
            )
            
            # SMS notification (optional)
            if admin.phone:
                sms_message = f"FEEVERT: New message from {message_obj.name}. Subject: {message_obj.subject}. Login to respond."
                NotificationService.send_sms_notification(str(admin.phone), sms_message)
            
            # Save to database
            Notification.objects.create(
                recipient=admin,
                notification_type='email',
                title=title,
                message=content,
                related_link=f'/admin/home/contactmessage/{message_obj.id}/change/'
            )
    
    @staticmethod
    def notify_new_booking(booking_obj):
        """
        Notify admin about new booking
        """
        from accounts.models import User
        
        admins = User.objects.filter(role='admin', is_active=True)
        
        title = "New Booking Request"
        content = f"New booking from {booking_obj.client.username} on {booking_obj.slot.date}"
        
        for admin in admins:
            NotificationService.send_realtime_notification(
                admin.id,
                'new_booking',
                title,
                content,
                {'booking_id': booking_obj.id}
            )
            
            if admin.phone:
                sms_message = f"FEEVERT: New booking from {booking_obj.client.username}. Date: {booking_obj.slot.date}. Login to confirm."
                NotificationService.send_sms_notification(str(admin.phone), sms_message)
            
            Notification.objects.create(
                recipient=admin,
                notification_type='email',
                title=title,
                message=content,
                related_link=f'/admin/bookings/booking/{booking_obj.id}/change/'
            )
    
    @staticmethod
    def notify_booking_reminder(booking_obj):
        """
        Send booking reminder to client
        """
        client = booking_obj.client
        
        if client.phone:
            message = f"FEEVERT Reminder: Your consultation is scheduled for {booking_obj.slot.date} at {booking_obj.slot.start_time}. Call {booking_obj.consultant.phone if booking_obj.consultant else '0712345678'} for changes."
            NotificationService.send_sms_notification(str(client.phone), message)
        
        Notification.objects.create(
            recipient=client,
            notification_type='email',
            title='Booking Reminder',
            message=f"Reminder: Your consultation is on {booking_obj.slot.date} at {booking_obj.slot.start_time}",
            related_link='/bookings/'
        )
    
    @staticmethod
    def notify_consultation_update(consultation_obj):
        """
        Notify client about consultation status update
        """
        client = consultation_obj.client
        
        title = f"Consultation {consultation_obj.status}"
        content = f"Your consultation request #{consultation_obj.id} is now {consultation_obj.status}"
        
        NotificationService.send_realtime_notification(
            client.id,
            'consultation_update',
            title,
            content,
            {'consultation_id': consultation_obj.id, 'status': consultation_obj.status}
        )
        
        if client.phone:
            sms_message = f"FEEVERT: Consultation #{consultation_obj.id} status changed to {consultation_obj.status}. Login for details."
            NotificationService.send_sms_notification(str(client.phone), sms_message)
        
        Notification.objects.create(
            recipient=client,
            notification_type='email',
            title=title,
            message=content,
            related_link=f'/consultations/{consultation_obj.id}/'
        )
