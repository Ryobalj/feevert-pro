# realtime/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'sender_info', 'recipient_info', 'message_preview', 
        'is_read_status', 'created_at', 'attachment_link'
    ]
    list_filter = ['is_read', 'created_at', 'sender', 'recipient']
    search_fields = ['message', 'sender__username', 'sender__email', 'recipient__username', 'recipient__email']
    readonly_fields = ['created_at', 'updated_at', 'read_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Message Details', {
            'fields': ('sender', 'recipient', 'message', 'attachment')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def sender_info(self, obj):
        return format_html(
            '<strong>{}</strong><br><small>{}</small>',
            obj.sender.username,
            obj.sender.email
        )
    sender_info.short_description = 'Sender'
    sender_info.admin_order_field = 'sender__username'
    
    def recipient_info(self, obj):
        return format_html(
            '<strong>{}</strong><br><small>{}</small>',
            obj.recipient.username,
            obj.recipient.email
        )
    recipient_info.short_description = 'Recipient'
    recipient_info.admin_order_field = 'recipient__username'
    
    def message_preview(self, obj):
        if len(obj.message) > 50:
            return obj.message[:50] + '...'
        return obj.message
    message_preview.short_description = 'Message'
    
    def is_read_status(self, obj):
        if obj.is_read:
            return format_html(
                '<span style="color: green;">✅ Read</span><br><small>{}</small>',
                obj.read_at.strftime('%Y-%m-%d %H:%M') if obj.read_at else ''
            )
        return format_html('<span style="color: orange;">⏳ Unread</span>')
    is_read_status.short_description = 'Status'
    is_read_status.admin_order_field = 'is_read'
    
    def attachment_link(self, obj):
        if obj.attachment:
            return format_html(
                '<a href="{}" target="_blank">📎 View</a>',
                obj.attachment.url
            )
        return '-'
    attachment_link.short_description = 'Attachment'
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{updated} message(s) marked as read.')
    mark_as_read.short_description = "Mark selected messages as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False, read_at=None)
        self.message_user(request, f'{updated} message(s) marked as unread.')
    mark_as_unread.short_description = "Mark selected messages as unread"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('sender', 'recipient')