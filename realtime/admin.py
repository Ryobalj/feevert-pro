# realtime/admin.py

from django.contrib import admin
from notifications.admin import (
    NotificationAdmin,
    NotificationTemplateAdmin,
    UserNotificationSettingAdmin
)
from notifications.models import Notification, NotificationTemplate, UserNotificationSetting

# Re-export the same admins
__all__ = [
    'NotificationAdmin',
    'NotificationTemplateAdmin',
    'UserNotificationSettingAdmin'
]
