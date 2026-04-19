# notifications/serializers.py

from rest_framework import serializers
from .models import Notification, NotificationLog, NotificationTemplate, UserNotificationSetting


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification"""
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_name', 'notification_type', 'type_display',
            'title', 'message', 'is_read', 'priority', 'priority_display',
            'related_link', 'scheduled_for', 'sent_at', 'created_at'
        ]
        read_only_fields = ['id', 'sent_at', 'created_at']


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    notification_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    mark_all = serializers.BooleanField(default=False)


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for Notification Template"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = ['id', 'name', 'category', 'category_display', 'subject', 'body_html', 'body_text', 'variables', 'is_active']
        read_only_fields = ['id']


class UserNotificationSettingSerializer(serializers.ModelSerializer):
    """Serializer for User Notification Settings"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserNotificationSetting
        fields = [
            'id', 'user', 'user_name', 'email_enabled', 'sms_enabled', 'in_app_enabled',
            'email_booking_confirmation', 'email_booking_reminder', 'email_consultation_update',
            'email_payment_receipt', 'email_promotional', 'sms_booking_confirmation',
            'sms_booking_reminder', 'sms_consultation_update', 'in_app_all',
            'quiet_hours_start', 'quiet_hours_end'
        ]
        read_only_fields = ['id']


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for Notification Log"""
    notification_title = serializers.CharField(source='notification.title', read_only=True)
    
    class Meta:
        model = NotificationLog
        fields = ['id', 'notification', 'notification_title', 'status', 'error_message', 'sent_at', 'provider_response', 'created_at']
        read_only_fields = ['id', 'created_at']