# notifications/apps.py

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Notifications & Communications Hub'

    def ready(self):
        """
        Register signals na services wakati app inapoanza.
        Hii inahakikisha services zote ziko tayari.
        """
        # Import signals
        import notifications.signals  # noqa

        # Hakikisha SMS service ime-initialize
        try:
            from notifications.services.sms_service import SMSService
            if SMSService.is_available():
                print("✅ SMS Service (Africa's Talking) initialized")
            else:
                print("⚠️ SMS Service not available - credentials missing")
        except Exception as e:
            print(f"⚠️ SMS Service initialization skipped: {e}")