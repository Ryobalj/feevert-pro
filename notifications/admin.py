# notifications/admin.py

from django import forms
from django.contrib import admin
from django.utils import timezone
from .models import (
    Notification, NotificationLog, NotificationTemplate,
    UserNotificationSetting, IncomingEmail, EmailAccount
)


# ============================================
# NOTIFICATION ADMIN
# ============================================
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'title_preview', 'recipient', 'notification_type', 'is_read', 'created_at'
    ]
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__username', 'recipient__email']
    readonly_fields = ['created_at', 'updated_at', 'read_at']
    date_hierarchy = 'created_at'
    list_per_page = 50
    
    fieldsets = (
        ('Recipient', {
            'fields': ('recipient',)
        }),
        ('Content', {
            'fields': ('notification_type', 'title', 'message')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'related_link')
        }),
        ('Additional Data', {
            'fields': ('data',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def title_preview(self, obj):
        return obj.title[:60]
    title_preview.short_description = "Title"
    title_preview.admin_order_field = 'title'
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.filter(is_read=False).update(is_read=True, read_at=timezone.now())
        self.message_user(request, f"{updated} notifications marked as read.")
    mark_as_read.short_description = "Mark selected as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False, read_at=None)
        self.message_user(request, f"{updated} notifications marked as unread.")
    mark_as_unread.short_description = "Mark selected as unread"


# ============================================
# NOTIFICATION LOG ADMIN
# ============================================
@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['notification_preview', 'channel', 'status', 'created_at']
    list_filter = ['channel', 'status', 'created_at']
    search_fields = ['notification__title', 'error_message']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Details', {
            'fields': ('notification', 'channel', 'status')
        }),
        ('Error Info', {
            'fields': ('error_message', 'metadata')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def notification_preview(self, obj):
        if obj.notification:
            return obj.notification.title[:60]
        return '-'
    notification_preview.short_description = "Notification"


# ============================================
# NOTIFICATION TEMPLATE ADMIN
# ============================================
@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'notification_type', 'subject_preview', 'is_active']
    list_filter = ['notification_type', 'is_active']
    search_fields = ['name', 'subject_template', 'body_template']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Template Info', {
            'fields': ('name', 'notification_type', 'is_active')
        }),
        ('Content', {
            'fields': ('subject_template', 'body_template')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def subject_preview(self, obj):
        return obj.subject_template[:60]
    subject_preview.short_description = "Subject"
    subject_preview.admin_order_field = 'subject_template'
    
    actions = ['activate', 'deactivate']
    
    def activate(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} templates activated.")
    activate.short_description = "Activate selected"
    
    def deactivate(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} templates deactivated.")
    deactivate.short_description = "Deactivate selected"


# ============================================
# USER NOTIFICATION SETTINGS ADMIN
# ============================================
@admin.register(UserNotificationSetting)
class UserNotificationSettingAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_enabled', 'sms_enabled', 'in_app_enabled']
    list_filter = ['email_enabled', 'sms_enabled', 'in_app_enabled']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Channels', {
            'fields': ('email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ============================================
# EMAIL ACCOUNT ADMIN (per-staff mailbox)
# ============================================
class EmailAccountForm(forms.ModelForm):
    """
    Passwords are write-only here: the fields below are plain (unencrypted)
    inputs that get encrypted into imap_password_encrypted /
    smtp_password_encrypted on save, and are never pre-filled from the
    stored value (so re-opening the form doesn't leak/round-trip the
    decrypted secret through the browser).
    """
    imap_password = forms.CharField(
        required=False, widget=forms.PasswordInput(render_value=False),
        help_text='Leave blank to keep the current password unchanged.'
    )
    smtp_password = forms.CharField(
        required=False, widget=forms.PasswordInput(render_value=False),
        help_text='Leave blank to reuse the IMAP password for sending too.'
    )

    class Meta:
        model = EmailAccount
        exclude = ['imap_password_encrypted', 'smtp_password_encrypted']

    def save(self, commit=True):
        instance = super().save(commit=False)
        if self.cleaned_data.get('imap_password'):
            instance.set_imap_password(self.cleaned_data['imap_password'])
        if self.cleaned_data.get('smtp_password'):
            instance.set_smtp_password(self.cleaned_data['smtp_password'])
        if commit:
            instance.save()
        return instance


@admin.register(EmailAccount)
class EmailAccountAdmin(admin.ModelAdmin):
    form = EmailAccountForm
    list_display = ['email_address', 'owner_user', 'provider', 'is_active', 'last_synced_at']
    list_filter = ['provider', 'is_active']
    search_fields = ['email_address', 'owner_user__username', 'owner_user__email']
    readonly_fields = ['last_synced_at', 'last_sync_error', 'created_at', 'updated_at']

    fieldsets = (
        ('Ownership', {
            'fields': ('owner_user', 'email_address', 'provider', 'is_active'),
            'description': 'Leave "owner user" blank for a shared inbox visible to all staff.'
        }),
        ('IMAP (fetching)', {
            'fields': ('imap_host', 'imap_port', 'imap_use_ssl', 'imap_password')
        }),
        ('SMTP (sending replies)', {
            'fields': ('smtp_host', 'smtp_port', 'smtp_use_ssl', 'smtp_use_tls', 'smtp_password')
        }),
        ('Sync Status', {
            'fields': ('last_synced_at', 'last_sync_error'),
            'classes': ('collapse',)
        }),
    )


# ============================================
# INCOMING EMAIL ADMIN
# ============================================
@admin.register(IncomingEmail)
class IncomingEmailAdmin(admin.ModelAdmin):
    list_display = ['sender', 'subject_preview', 'account', 'source', 'is_read', 'is_processed', 'received_at']
    list_filter = ['account', 'source', 'is_read', 'is_processed', 'folder', 'received_at']
    search_fields = ['sender', 'sender_name', 'subject', 'body', 'message_id']
    readonly_fields = ['created_at', 'updated_at', 'message_id', 'thread_id']
    date_hierarchy = 'received_at'
    list_per_page = 50
    
    fieldsets = (
        ('Email Info', {
            'fields': ('account', 'sender', 'sender_name', 'recipient', 'subject')
        }),
        ('Content', {
            'fields': ('body', 'body_html')
        }),
        ('Status', {
            'fields': ('source', 'folder', 'is_read', 'is_processed')
        }),
        ('Message IDs', {
            'fields': ('message_id', 'thread_id', 'in_reply_to')
        }),
        ('Attachments', {
            'fields': ('has_attachments', 'attachments')
        }),
        ('Linking', {
            'fields': ('linked_message',)
        }),
        ('Headers & Metadata', {
            'fields': ('headers',),
            'classes': ('collapse',)
        }),
        ('System', {
            'fields': ('received_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def subject_preview(self, obj):
        return obj.subject[:60] if obj.subject else '(No Subject)'
    subject_preview.short_description = "Subject"
    subject_preview.admin_order_field = 'subject'
    
    actions = ['mark_as_read', 'mark_as_processed', 'process_and_link']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.filter(is_read=False).update(is_read=True)
        self.message_user(request, f"{updated} emails marked as read.")
    mark_as_read.short_description = "Mark as read"
    
    def mark_as_processed(self, request, queryset):
        updated = queryset.filter(is_processed=False).update(is_processed=True)
        self.message_user(request, f"{updated} emails marked as processed.")
    mark_as_processed.short_description = "Mark as processed"
    
    def process_and_link(self, request, queryset):
        """Process email and create ContactMessage if linked"""
        from home.models import ContactMessage
        count = 0
        for email in queryset.filter(is_processed=False, linked_message__isnull=True):
            try:
                msg = ContactMessage.objects.create(
                    name=email.sender_name or email.sender.split('@')[0],
                    email=email.sender,
                    subject=email.subject or '(No Subject)',
                    message=email.body or '',
                    channel='email',
                    status='unread',
                    priority='medium',
                    message_id=email.message_id,
                    thread_id=email.thread_id,
                    is_incoming=True,
                )
                email.linked_message = msg
                email.is_processed = True
                email.save(update_fields=['linked_message', 'is_processed'])
                count += 1
            except Exception as e:
                self.message_user(request, f"Error processing {email.sender}: {e}", level='ERROR')
        
        self.message_user(request, f"{count} emails processed and linked to ContactMessage.")
    process_and_link.short_description = "Process & link to ContactMessage"