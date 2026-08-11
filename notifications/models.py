# notifications/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel


class Notification(BaseModel):
    """
    In-app notifications for users
    """
    NOTIFICATION_TYPES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('booking', 'Booking'),
        ('consultation', 'Consultation'),
        ('payment', 'Payment'),
        ('system', 'System'),
        ('chat', 'Chat'),
        ('contact', 'Contact'),
    )
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        default='system'
    )
    title = models.CharField(max_length=300)
    message = models.TextField()
    related_link = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.notification_type}: {self.title}"


class NotificationLog(BaseModel):
    """
    Log of all notification attempts (for debugging)
    """
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='logs',
        null=True,
        blank=True
    )
    channel = models.CharField(max_length=50)  # email, sms, push, websocket
    status = models.CharField(max_length=50)  # success, failed, pending
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.channel} - {self.status}"


class NotificationTemplate(BaseModel):
    """
    Pre-defined notification templates
    """
    name = models.CharField(max_length=200, unique=True)
    notification_type = models.CharField(
        max_length=50,
        choices=Notification.NOTIFICATION_TYPES,
        default='system'
    )
    subject_template = models.CharField(max_length=300)
    body_template = models.TextField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['notification_type', 'name']
    
    def __str__(self):
        return self.name


class UserNotificationSetting(BaseModel):
    """
    User preferences for notifications
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_settings'
    )
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "User Notification Setting"
        verbose_name_plural = "User Notification Settings"
    
    def __str__(self):
        return f"Settings for {self.user.username}"


class EmailAccount(BaseModel):
    """
    A mailbox the system polls for incoming mail and sends replies from.

    owner_user: the staff member this mailbox belongs to. Leave blank for a
    shared/team inbox (e.g. info@feevert.co.tz) that every staff member can
    see; set it for a personal mailbox (e.g. john@feevert.co.tz) that only
    that user (plus admins, for oversight) can see.
    """
    PROVIDER_CHOICES = (
        ('imap', 'IMAP'),
        ('outlook', 'Outlook / Microsoft 365'),
        ('zoho_api', 'Zoho Mail (API)'),
    )

    owner_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='email_accounts',
        help_text='Leave blank for a shared inbox visible to all staff'
    )
    email_address = models.EmailField(unique=True)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='imap')
    is_active = models.BooleanField(default=True)
    # A team inbox every staff member can read (e.g. info@). Personal mailboxes
    # leave this off: with no owner AND not shared, only admins can see it, so a
    # newly discovered mailbox never leaks to everyone by accident.
    is_shared = models.BooleanField(
        default=False,
        help_text='Visible to all staff (team inbox). Leave off for personal mailboxes.'
    )

    # IMAP (fetching)
    imap_host = models.CharField(max_length=255, blank=True)
    imap_port = models.IntegerField(default=993)
    imap_use_ssl = models.BooleanField(default=True)
    imap_password_encrypted = models.TextField(blank=True)

    # SMTP (sending replies "from" this address)
    smtp_host = models.CharField(max_length=255, blank=True)
    smtp_port = models.IntegerField(default=465)
    smtp_use_ssl = models.BooleanField(default=True)
    smtp_use_tls = models.BooleanField(default=False)
    smtp_password_encrypted = models.TextField(blank=True)

    # Zoho OAuth, per mailbox. Zoho lets an org-admin token *list* every
    # mailbox but only *read* its own owner's mail, so each mailbox we want in
    # the in-app inbox connects once and stores its own refresh token here.
    oauth_refresh_token = models.TextField(blank=True)

    last_synced_at = models.DateTimeField(null=True, blank=True)
    last_sync_error = models.TextField(blank=True)

    class Meta:
        ordering = ['email_address']

    def __str__(self):
        owner = self.owner_user.username if self.owner_user else 'shared'
        return f"{self.email_address} ({owner})"

    def set_imap_password(self, raw_password):
        from .utils import encrypt_secret
        self.imap_password_encrypted = encrypt_secret(raw_password)

    def get_imap_password(self):
        from .utils import decrypt_secret
        return decrypt_secret(self.imap_password_encrypted)

    def set_smtp_password(self, raw_password):
        from .utils import encrypt_secret
        self.smtp_password_encrypted = encrypt_secret(raw_password)

    def get_smtp_password(self):
        from .utils import decrypt_secret
        # Most mailboxes use the same password for IMAP and SMTP - fall
        # back to the IMAP one if a distinct SMTP password wasn't set.
        return decrypt_secret(self.smtp_password_encrypted) or self.get_imap_password()


class IncomingEmail(BaseModel):
    """
    Incoming emails from external sources (Outlook/365, IMAP, etc.)
    Stored as part of the unified communication hub.
    """
    account = models.ForeignKey(
        EmailAccount,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='incoming_emails',
        help_text='Which mailbox this email arrived at'
    )
    sender = models.EmailField()
    sender_name = models.CharField(max_length=300, blank=True)
    recipient = models.EmailField(blank=True)
    subject = models.CharField(max_length=500, blank=True)
    body = models.TextField(blank=True)
    body_html = models.TextField(blank=True)
    
    message_id = models.CharField(max_length=500, unique=True)
    thread_id = models.CharField(max_length=500, blank=True)
    in_reply_to = models.CharField(max_length=500, blank=True)
    
    received_at = models.DateTimeField()
    is_read = models.BooleanField(default=False)
    is_processed = models.BooleanField(default=False)
    
    # Attachments
    has_attachments = models.BooleanField(default=False)
    attachments = models.JSONField(default=list, blank=True)
    
    # Metadata
    headers = models.JSONField(default=dict, blank=True)
    source = models.CharField(max_length=50, default='outlook')  # outlook, imap, etc.
    folder = models.CharField(max_length=100, default='inbox')
    
    # Linking
    linked_message = models.ForeignKey(
        'home.ContactMessage',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_source'
    )
    
    class Meta:
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['message_id']),
            models.Index(fields=['thread_id']),
            models.Index(fields=['is_read', '-received_at']),
            models.Index(fields=['is_processed']),
        ]
        verbose_name = "Incoming Email"
        verbose_name_plural = "Incoming Emails"
    
    def __str__(self):
        return f"{self.sender} - {self.subject[:50] if self.subject else '(No Subject)'}"