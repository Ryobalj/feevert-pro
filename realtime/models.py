# realtime/models.py

# Realtime app inatumia models za notifications app
# Hii ni empty file - models zote zinatoka kwenye notifications app

# Import models from notifications for convenience
from notifications.models import (
    Notification,
    NotificationLog,
    NotificationTemplate,
    UserNotificationSetting
)

__all__ = [
    'Notification',
    'NotificationLog',
    'NotificationTemplate',
    'UserNotificationSetting'
]
