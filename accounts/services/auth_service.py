# accounts/services/auth_service.py

from datetime import timedelta
from django.utils import timezone
from ..models import EmailVerificationToken


class AuthService:

    @staticmethod
    def create_email_verification(user):
        token_obj = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        return token_obj
