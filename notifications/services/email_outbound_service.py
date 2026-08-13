# notifications/services/email_outbound_service.py

import logging
from django.core.mail import send_mail, EmailMultiAlternatives, get_connection
from django.conf import settings

logger = logging.getLogger(__name__)


class EmailOutboundService:
    last_error = ''
    """
    Service ya kutuma emails kupitia njia mbalimbali:
    - Django send_mail (SMTP) - kwa Gmail, Titan, Custom SMTP
    - Microsoft Graph API - kwa Outlook/365 (inapatikana kupitia EmailInboundService)
    """

    @classmethod
    def send_via_account(cls, account, to_email, subject, body, html_body=None):
        """
        Send using one specific EmailAccount's own SMTP credentials, so the
        reply actually comes from that staff member's address (e.g.
        john@feevert.co.tz) instead of the site-wide DEFAULT_FROM_EMAIL.

        Mailboxes discovered by the Zoho sync have no SMTP password of their
        own — replying through them tried to authenticate with nothing and the
        server answered "530 Authentication Required". When that's the case,
        send over the site's own SMTP account instead and put the mailbox in
        Reply-To, so the message still goes out and the answer comes back to
        the right inbox.
        """
        if not account.get_smtp_password() or not (account.smtp_host or account.imap_host):
            logger.info(
                'No SMTP credentials for %s — sending via the site account with Reply-To set',
                account.email_address,
            )
            # send() answers with a bool; callers of send_via_account expect a
            # dict, so normalise it here rather than at every call site.
            ok = cls.send(
                to_email=to_email, subject=subject, body=body, html_body=html_body,
                reply_to=account.email_address,
            )
            if ok:
                return {'success': True}
            return {
                'success': False,
                'error': cls.last_error or 'Could not send the message. Check the mail account settings.',
            }

        try:
            connection = get_connection(
                backend='django.core.mail.backends.smtp.EmailBackend',
                host=account.smtp_host or account.imap_host,
                port=account.smtp_port,
                username=account.email_address,
                password=account.get_smtp_password(),
                use_ssl=account.smtp_use_ssl,
                use_tls=account.smtp_use_tls,
            )
            recipient_list = to_email if isinstance(to_email, list) else [to_email]

            if html_body:
                email = EmailMultiAlternatives(
                    subject=subject, body=body, from_email=account.email_address,
                    to=recipient_list, connection=connection,
                )
                email.attach_alternative(html_body, "text/html")
                sent = email.send()
            else:
                sent = send_mail(
                    subject=subject, message=body, from_email=account.email_address,
                    recipient_list=recipient_list, connection=connection, fail_silently=False,
                )

            logger.info(f"Email sent via {account.email_address} to {recipient_list}: {subject}")
            return {'success': sent > 0}
        except Exception as e:
            logger.error(f"Failed to send via account {account.email_address} to {to_email}: {e}")
            return {'success': False, 'error': str(e)}

    @classmethod
    def send(cls, to_email, subject, body, html_body=None, from_email=None,
             cc=None, bcc=None, attachments=None, reply_to=None):
        """
        Tuma email kupitia Django's send_mail.
        
        Args:
            to_email: Email ya mpokeaji (string au list)
            subject: Kichwa cha email
            body: Ujumbe (plain text)
            html_body: Ujumbe (HTML) - optional
            from_email: Email ya mtumaji - optional
            reply_to: Anwani ya kujibia - optional (kwa mailbox zisizo na SMTP zao)
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
                    reply_to=[reply_to] if reply_to else None,
                )
                email.attach_alternative(html_body, "text/html")

                if attachments:
                    for attachment in attachments:
                        if isinstance(attachment, tuple) and len(attachment) >= 3:
                            email.attach(*attachment[:3])
                        else:
                            email.attach(attachment)

                result = email.send()
            elif reply_to:
                email = EmailMultiAlternatives(
                    subject=subject, body=body, from_email=sender,
                    to=recipient_list, cc=cc or [], bcc=bcc or [],
                    reply_to=[reply_to],
                )
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
            # Keep the real SMTP error (e.g. "530 Authentication Required")
            # rather than swallowing it — "check the mail account settings"
            # tells nobody which setting is wrong.
            logger.error(f"Failed to send email to {to_email}: {e}")
            cls.last_error = str(e)
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