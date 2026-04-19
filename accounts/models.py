# accoints/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField
from core.models import BaseModel
from django.utils import timezone
import uuid


class User(AbstractUser, BaseModel):
    ROLE_CHOICES = (
        ('client', 'Client'),
        ('consultant', 'Consultant'),
        ('admin', 'Admin'),
        ('hr', 'HR'),
        ('marketing', 'Marketing'),
    )

    phone = PhoneNumberField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    last_seen = models.DateTimeField(blank=True, null=True)
    preferred_language = models.CharField(
        max_length=10,
        default='en',
        choices=(('en', 'English'), ('sw', 'Kiswahili'))
    )
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    two_factor_enabled = models.BooleanField(default=False)

    # override BaseModel fields
    created_at = None
    updated_at = None

    class Meta:
        db_table = 'auth_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return self.username or self.email or str(self.phone)


class Profile(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=10,
        blank=True,
        choices=(('M', 'Male'), ('F', 'Female'), ('O', 'Other'))
    )
    newsletter_subscribed = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile of {self.user.username}"


class Role(BaseModel):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict, blank=True)
    is_system_role = models.BooleanField(default=False)
    priority_level = models.IntegerField(default=0)

    class Meta:
        ordering = ['priority_level', 'name']

    def __str__(self):
        return self.name


class UserActivityLog(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.created_at}"

    # ✅ FIXED METHOD (your bug fix)
    @classmethod
    def log_action(cls, user, action, description="", ip_address=None, user_agent=None):
        return cls.objects.create(
            user=user,
            action=action,
            details={"description": description},
            ip_address=ip_address,
            user_agent=user_agent
        )


class PasswordResetToken(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)

    def is_valid(self):
        from django.utils import timezone
        return not self.used_at and self.expires_at > timezone.now()

    def __str__(self):
        return f"Reset token for {self.user.username}"


class EmailVerificationToken(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_tokens')
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(blank=True, null=True)

    def is_valid(self):
        from django.utils import timezone
        return not self.verified_at and self.expires_at > timezone.now()

    def __str__(self):
        return f"Email verification for {self.user.username}"


class EmailVerificationToken(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_tokens')
    token = models.CharField(max_length=255, unique=True, blank=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = str(uuid.uuid4())
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.verified_at and self.expires_at > timezone.now()

    def __str__(self):
        return f"Email verification for {self.user.username}"
