# accounts/services/email_service.py

from django.core.mail import send_mail
from django.conf import settings


class EmailService:

    @staticmethod
    def send_verification_email(user, token):
        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        subject = "Verify your FeeVert account"
        message = f"""
Hello {user.username},

Please verify your email by clicking the link below:

{verification_link}

This link will expire soon.

Thank you,
FeeVert Team
"""

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False
        )