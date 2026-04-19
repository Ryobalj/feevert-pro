# notifications/admin.py

from django.contrib import admin
from .models import Notification, NotificationLog, NotificationTemplate, UserNotificationSetting

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'title', 'notification_type', 'priority', 'is_read', 'sent_at', 'created_at')
    list_filter = ('notification_type', 'priority', 'is_read', 'sent_at', 'created_at')
    search_fields = ('recipient__username', 'recipient__email', 'title', 'message')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('is_read',)

@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('notification', 'status', 'sent_at', 'created_at')
    list_filter = ('status', 'sent_at', 'created_at')
    search_fields = ('notification__title', 'notification__recipient__username', 'error_message')
    readonly_fields = ('created_at',)

@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'subject', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'subject', 'body_text')
    list_editable = ('is_active',)

@admin.register(UserNotificationSetting)
class UserNotificationSettingAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_enabled', 'sms_enabled', 'in_app_enabled')
    list_filter = ('email_enabled', 'sms_enabled', 'in_app_enabled')
    search_fields = ('user__username', 'user__email')