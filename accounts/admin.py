# accounts/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, Role, UserActivityLog, PasswordResetToken, EmailVerificationToken

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'phone', 'role', 'is_verified', 'is_active')
    list_filter = ('role', 'is_verified', 'is_active', 'email_verified')
    search_fields = ('username', 'email', 'phone')
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone', 'role', 'profile_picture', 'bio', 'is_verified', 'preferred_language', 'two_factor_enabled')}),
        ('Security', {'fields': ('last_login_ip', 'last_seen', 'email_verified', 'phone_verified')}),
    )

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'country', 'newsletter_subscribed')
    search_fields = ('user__username', 'user__email', 'city', 'country')

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_system_role', 'priority_level')
    search_fields = ('name',)

@admin.register(UserActivityLog)
class UserActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'ip_address', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__username', 'user__email', 'action')

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'expires_at', 'used_at')
    list_filter = ('expires_at', 'used_at')

@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'expires_at', 'verified_at')
    list_filter = ('expires_at', 'verified_at')
