# accounts/apps.py
from django.apps import AppConfig
import os

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Hii inaitwa baada ya Django apps zote kupakia
        admin_password = os.environ.get('ADMIN_PASSWORD')
        if admin_password:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                if not User.objects.filter(username='admin').exists():
                    User.objects.create_superuser(
                        username='admin',
                        email='admin@feevert.co.tz',
                        password=admin_password
                    )
                    print("✅ Superuser 'admin' created successfully!")
            except Exception as e:
                print(f"⚠️ Could not create superuser: {e}")