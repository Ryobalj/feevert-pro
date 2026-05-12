# notifications/services/email_outbound_service.py

import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)


class EmailOutboundService:
    """
    Service ya kutuma emails kupitia njia mbalimbali:
    - Django send_mail (SMTP) - kwa Gmail, Titan, Custom SMTP
    - Microsoft Graph API - kwa Outlook/365 (inapatikana kupitia EmailInboundService)
    """

    @classmethod
    def send(cls, to_email, subject, body, html_body=None, from_email=None, 
             cc=None, bcc=None, attachments=None):
        """
        Tuma email kupitia Django's send_mail.
        
        Args:
            to_email: Email ya mpokeaji (string au list)
            subject: Kichwa cha email
            body: Ujumbe (plain text)
            html_body: Ujumbe (HTML) - optional
            from_email: Email ya mtumaji - optional
            cc: CC recipients - optional
            bcc: BCC recipients - optional
            attachments: List ya attachments - optional
        
        Returns:
            bool: True kama email imetumwa successfully
        """
        try:
            recipient_list = to_email if isinstance(to_email, list) else [to_email]
            sender = from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@feevert.co.tz')

            if html_body:
                email = EmailMultiAlternatives(
                    subject=subject,
                    body=body,
                    from_email=sender,
                    to=recipient_list,
                    cc=cc or [],
                    bcc=bcc or [],
                )
                email.attach_alternative(html_body, "text/html")

                if attachments:
                    for attachment in attachments:
                        if isinstance(attachment, tuple) and len(attachment) >= 3:
                            email.attach(*attachment[:3])
                        else:
                            email.attach(attachment)

                result = email.send()
            else:
                result = send_mail(
                    subject=subject,
                    message=body,
                    from_email=sender,
                    recipient_list=recipient_list,
                    fail_silently=False,
                )

            logger.info(f"Email sent to {recipient_list}: {subject}")
            return result > 0

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    @classmethod
    def send_notification(cls, notification):
        """
        Tuma email kutoka kwenye Notification object.
        Hii inaitwa na NotificationDispatcher.
        """
        return cls.send(
            to_email=notification.recipient.email,
            subject=notification.title,
            body=notification.message,
        )

    @classmethod
    def send_template(cls, to_email, template, context=None):
        """
        Tuma email kwa kutumia template (NotificationTemplate).
        
        Args:
            to_email: Email ya mpokeaji
            template: NotificationTemplate instance
            context: Dict ya variables kwa template
        """
        ctx = context or {}
        subject = template.subject
        body = template.body_text
        html_body = template.body_html

        # Replace variables
        for key, value in ctx.items():
            placeholder = f'{{{{{key}}}}}'
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))
            html_body = html_body.replace(placeholder, str(value)) if html_body else ''

        return cls.send(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
        )

    @classmethod
    def send_bulk(cls, recipients, subject, body, html_body=None):
        """
        Tuma email kwa watu wengi (bulk sending).
        
        Args:
            recipients: List ya email addresses
            subject: Kichwa cha email
            body: Ujumbe (plain text)
            html_body: Ujumbe (HTML) - optional
        """
        success_count = 0
        for recipient in recipients:
            if cls.send(recipient, subject, body, html_body):
                success_count += 1
        return success_count

    @classmethod
    def test_connection(cls):
        """
        Jaribu kama email configuration inafanya kazi.
        """
        try:
            result = cls.send(
                to_email=getattr(settings, 'CONTACT_FORM_EMAIL', 'admin@feevert.co.tz'),
                subject='FeeVert - Email Test',
                body='This is a test email from FeeVert. If you receive this, email is configured correctly!',
            )
            return {'success': result, 'message': 'Email test completed'}
        except Exception as e:
            return {'success': False, 'message': str(e)}