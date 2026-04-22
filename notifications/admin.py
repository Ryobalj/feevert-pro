# notifications/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import Notification, NotificationTemplate, UserNotificationSetting, NotificationLog


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'recipient', 'title', 'notification_type', 
        'priority', 'is_read_status', 'created_at'
    ]
    list_filter = ['notification_type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__username', 'recipient__email']
    readonly_fields = ['created_at', 'updated_at', 'sent_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Notification Details', {
            'fields': ('recipient', 'notification_type', 'title', 'message')
        }),
        ('Priority & Scheduling', {
            'fields': ('priority', 'scheduled_for')
        }),
        ('Related Object', {
            'fields': ('related_link', 'related_object_id', 'related_object_type'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_read', 'sent_at', 'retry_count', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread', 'resend_notification']
    
    def is_read_status(self, obj):
        if obj.is_read:
            return '✅ Read'
        return '⏳ Unread'
    is_read_status.short_description = 'Status'
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notification(s) marked as read.')
    mark_as_read.short_description = "Mark selected as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} notification(s) marked as unread.')
    mark_as_unread.short_description = "Mark selected as unread"
    
    def resend_notification(self, request, queryset):
        from realtime.services.notification_service import NotificationService
        
        success = 0
        for notif in queryset:
            try:
                NotificationService.send_realtime_notification(
                    notif.recipient.id,
                    notif.notification_type or 'admin_resend',
                    notif.title,
                    notif.message
                )
                success += 1
            except Exception as e:
                pass
        
        self.message_user(request, f'{success} notification(s) resent.')
    resend_notification.short_description = "Resend selected notifications"


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'subject', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'subject', 'body_text']
    
    fieldsets = (
        ('Template Details', {
            'fields': ('name', 'category', 'subject', 'is_active')
        }),
        ('Content', {
            'fields': ('body_html', 'body_text')
        }),
        ('Variables', {
            'fields': ('variables',),
            'description': 'List of variables that can be used in the template, e.g., ["client_name", "booking_date"]'
        }),
    )


@admin.register(UserNotificationSetting)
class UserNotificationSettingAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_enabled', 'sms_enabled', 'in_app_enabled']
    list_filter = ['email_enabled', 'sms_enabled', 'in_app_enabled']
    search_fields = ['user__username', 'user__email']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('General Settings', {
            'fields': ('email_enabled', 'sms_enabled', 'in_app_enabled')
        }),
        ('Email Notifications', {
            'fields': (
                'email_booking_confirmation', 'email_booking_reminder',
                'email_consultation_update', 'email_payment_receipt',
                'email_promotional'
            ),
            'classes': ('collapse',)
        }),
        ('SMS Notifications', {
            'fields': (
                'sms_booking_confirmation', 'sms_booking_reminder',
                'sms_consultation_update'
            ),
            'classes': ('collapse',)
        }),
        ('In-App Notifications', {
            'fields': ('in_app_all',)
        }),
        ('Quiet Hours', {
            'fields': ('quiet_hours_start', 'quiet_hours_end'),
            'description': 'Do not send notifications during these hours'
        }),
    )


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'notification_link', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    readonly_fields = ['created_at', 'provider_response']
    
    def notification_link(self, obj):
        return format_html(
            '<a href="/admin/notifications/notification/{}/change/">{}</a>',
            obj.notification.id,
            obj.notification.title[:50]
        )
    notification_link.short_description = 'Notification'
    
    def has_add_permission(self, request):
        return False