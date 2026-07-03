# notifications/serializers.py

from rest_framework import serializers
from .models import (
    Notification, NotificationLog, NotificationTemplate, UserNotificationSetting,
    IncomingEmail, EmailAccount
)


# ============================================================
# NOTIFICATION SERIALIZERS
# ============================================================

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer kamili ya Notification"""
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    recipient_email = serializers.CharField(source='recipient.email', read_only=True)
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    is_read_status = serializers.SerializerMethodField()
    has_been_sent = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_name', 'recipient_email',
            'notification_type', 'type_display',
            'title', 'message', 'is_read', 'is_read_status',
            'related_link', 'data', 'has_been_sent',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'data', 'created_at', 'updated_at']

    def get_is_read_status(self, obj):
        return 'read' if obj.is_read else 'unread'

    def get_has_been_sent(self, obj):
        return bool((obj.data or {}).get('sent_at'))


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Serializer fupi kwa list view.
    Haina message kamili - inatumia preview tu.
    """
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    message_preview = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient_name', 'notification_type', 'type_display',
            'title', 'message_preview', 'is_read',
            'related_link', 'created_at',
        ]

    def get_message_preview(self, obj):
        return obj.message[:100] + '...' if len(obj.message) > 100 else obj.message


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer kwa ajili ya kuunda notification mpya"""

    class Meta:
        model = Notification
        fields = [
            'recipient', 'notification_type', 'title', 'message',
            'related_link',
        ]


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer kwa ajili ya kusoma notifications kwa wingi"""
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="List ya notification IDs za kusoma"
    )
    mark_all = serializers.BooleanField(default=False, help_text="Soma zote kwa wakati mmoja")


# ============================================================
# NOTIFICATION TEMPLATE SERIALIZERS
# ============================================================

class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer kamili ya Notification Template"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    variable_count = serializers.SerializerMethodField()

    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'category', 'category_display',
            'subject', 'body_html', 'body_text',
            'variables', 'variable_count', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_variable_count(self, obj):
        return len(obj.variables) if obj.variables else 0


class NotificationTemplatePreviewSerializer(serializers.ModelSerializer):
    """
    Serializer kwa ajili ya ku-preview template.
    Inaruhusu kutuma context ya variables.
    """
    rendered_subject = serializers.SerializerMethodField()
    rendered_body = serializers.SerializerMethodField()

    class Meta:
        model = NotificationTemplate
        fields = ['id', 'name', 'subject', 'body_html', 'body_text', 'rendered_subject', 'rendered_body']

    def _render(self, template_str, context):
        if not template_str:
            return ''
        result = template_str
        for key, value in context.items():
            result = result.replace(f'{{{{{key}}}}}', str(value))
        return result

    def get_rendered_subject(self, obj):
        context = self.context.get('variables', {})
        return self._render(obj.subject, context)

    def get_rendered_body(self, obj):
        context = self.context.get('variables', {})
        return self._render(obj.body_html or obj.body_text, context)


# ============================================================
# USER NOTIFICATION SETTING SERIALIZERS
# ============================================================

class UserNotificationSettingSerializer(serializers.ModelSerializer):
    """Serializer kamili ya User Notification Settings"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserNotificationSetting
        fields = [
            'id', 'user', 'user_name', 'user_email',
            'email_enabled', 'sms_enabled', 'in_app_enabled',
            'email_booking_confirmation', 'email_booking_reminder',
            'email_consultation_update', 'email_payment_receipt',
            'email_promotional',
            'sms_booking_confirmation', 'sms_booking_reminder',
            'sms_consultation_update',
            'in_app_all',
            'quiet_hours_start', 'quiet_hours_end',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserNotificationSettingUpdateSerializer(serializers.ModelSerializer):
    """Serializer kwa ajili ya kusasisha settings tu"""

    class Meta:
        model = UserNotificationSetting
        fields = [
            'email_enabled', 'sms_enabled', 'in_app_enabled',
            'email_booking_confirmation', 'email_booking_reminder',
            'email_consultation_update', 'email_payment_receipt',
            'email_promotional',
            'sms_booking_confirmation', 'sms_booking_reminder',
            'sms_consultation_update',
            'in_app_all',
            'quiet_hours_start', 'quiet_hours_end',
        ]


# ============================================================
# NOTIFICATION LOG SERIALIZERS
# ============================================================

class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer kamili ya Notification Log"""
    notification_title = serializers.CharField(source='notification.title', read_only=True)
    notification_type = serializers.CharField(source='notification.notification_type', read_only=True)
    recipient_name = serializers.CharField(source='notification.recipient.username', read_only=True)
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = NotificationLog
        fields = [
            'id', 'notification', 'notification_title', 'notification_type',
            'recipient_name', 'channel', 'status', 'status_display',
            'error_message', 'metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_status_display(self, obj):
        status_map = {
            'pending': '🟡 Pending',
            'sent': '🟢 Sent',
            'failed': '🔴 Failed',
            'retrying': '🔄 Retrying',
        }
        return status_map.get(obj.status, obj.status.title())


# ============================================================
# TEST / UTILITY SERIALIZERS
# ============================================================

class EmailTestSerializer(serializers.Serializer):
    """Serializer kwa ajili ya kujaribu email"""
    to_email = serializers.EmailField()
    subject = serializers.CharField(max_length=200, default='Test Email from FeeVert')
    message = serializers.CharField(default='This is a test email.')


class SMSTestSerializer(serializers.Serializer):
    """Serializer kwa ajili ya kujaribu SMS"""
    phone_number = serializers.CharField(max_length=20)
    message = serializers.CharField(max_length=160, default='Test SMS from FeeVert')


class BulkNotificationSerializer(serializers.Serializer):
    """Serializer kwa ajili ya kutuma notifications kwa wingi"""
    user_ids = serializers.ListField(child=serializers.IntegerField())
    notification_type = serializers.ChoiceField(choices=Notification.NOTIFICATION_TYPES)
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    priority = serializers.ChoiceField(
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent'),
        ],
        default='medium'
    )
    related_link = serializers.CharField(max_length=500, required=False, allow_blank=True)


# ============================================================
# INCOMING EMAIL (Unified Inbox) SERIALIZERS
# ============================================================

class IncomingEmailListSerializer(serializers.ModelSerializer):
    """Preview-only serializer for the inbox list view"""
    body_preview = serializers.SerializerMethodField()
    account_email = serializers.CharField(source='account.email_address', read_only=True, default=None)

    class Meta:
        model = IncomingEmail
        fields = [
            'id', 'account', 'account_email', 'sender', 'sender_name', 'subject', 'body_preview',
            'received_at', 'is_read', 'has_attachments', 'source', 'folder',
        ]

    def get_body_preview(self, obj):
        text = obj.body or ''
        return text[:150] + '...' if len(text) > 150 else text


class IncomingEmailSerializer(serializers.ModelSerializer):
    """Full serializer for the email detail/reply view"""
    account_email = serializers.CharField(source='account.email_address', read_only=True, default=None)

    class Meta:
        model = IncomingEmail
        fields = [
            'id', 'account', 'account_email', 'sender', 'sender_name', 'recipient', 'subject',
            'body', 'body_html', 'message_id', 'thread_id', 'in_reply_to',
            'received_at', 'is_read', 'is_processed',
            'has_attachments', 'attachments', 'source', 'folder',
            'linked_message', 'created_at',
        ]
        read_only_fields = [
            'id', 'account', 'sender', 'sender_name', 'recipient', 'subject',
            'body', 'body_html', 'message_id', 'thread_id', 'in_reply_to',
            'received_at', 'has_attachments', 'attachments', 'source',
            'folder', 'linked_message', 'created_at',
        ]


class EmailReplySerializer(serializers.Serializer):
    """Serializer for replying to an incoming email"""
    body = serializers.CharField()
    body_html = serializers.CharField(required=False, allow_blank=True)


class EmailAccountSerializer(serializers.ModelSerializer):
    """
    Admin-only serializer for managing per-staff mailboxes. Passwords are
    write-only plain input (encrypted on save) and never sent back to the
    client - the detail/list responses never include the encrypted secret
    either, so a decrypted or encrypted password never round-trips through
    the API.
    """
    owner_username = serializers.CharField(source='owner_user.username', read_only=True, default=None)
    imap_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    smtp_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = EmailAccount
        fields = [
            'id', 'owner_user', 'owner_username', 'email_address', 'provider', 'is_active',
            'imap_host', 'imap_port', 'imap_use_ssl', 'imap_password',
            'smtp_host', 'smtp_port', 'smtp_use_ssl', 'smtp_use_tls', 'smtp_password',
            'last_synced_at', 'last_sync_error', 'created_at',
        ]
        read_only_fields = ['id', 'last_synced_at', 'last_sync_error', 'created_at']

    def create(self, validated_data):
        imap_password = validated_data.pop('imap_password', '')
        smtp_password = validated_data.pop('smtp_password', '')
        instance = EmailAccount(**validated_data)
        if imap_password:
            instance.set_imap_password(imap_password)
        if smtp_password:
            instance.set_smtp_password(smtp_password)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        imap_password = validated_data.pop('imap_password', '')
        smtp_password = validated_data.pop('smtp_password', '')
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if imap_password:
            instance.set_imap_password(imap_password)
        if smtp_password:
            instance.set_smtp_password(smtp_password)
        instance.save()
        return instance


class CommunicationSerializer(serializers.Serializer):
    """Serializer kwa ajili ya kutuma notification kupitia CommunicationService"""
    
    # Booking
    booking_id = serializers.IntegerField(required=False)
    action = serializers.ChoiceField(choices=[
        ('booking_confirmation', 'Booking Confirmation'),
        ('booking_reminder', 'Booking Reminder'),
        ('booking_cancellation', 'Booking Cancellation'),
        ('payment_receipt', 'Payment Receipt'),
        ('welcome', 'Welcome'),
        ('test', 'Test'),
    ])
    
    # Aina ya utumaji
    send_via = serializers.ChoiceField(
        choices=[('email', 'Email'), ('sms', 'SMS'), ('in_app', 'In App')],
        default='email'
    )