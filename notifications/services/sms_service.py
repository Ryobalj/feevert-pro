# notifications/services/sms_service.py

import logging
import africastalking
from django.conf import settings

logger = logging.getLogger(__name__)

# Initialize Africa's Talking mara moja
_sms = None
try:
    username = getattr(settings, 'AFRICASTALKING_USERNAME', '')
    api_key = getattr(settings, 'AFRICASTALKING_API_KEY', '')
    
    if username and api_key:
        africastalking.initialize(username=username, api_key=api_key)
        _sms = africastalking.SMS
        logger.info("Africa's Talking SMS initialized successfully")
    else:
        logger.warning("Africa's Talking credentials not configured")
except Exception as e:
    logger.error(f"Failed to initialize Africa's Talking: {e}")


class SMSService:
    """
    Service ya kutuma SMS kupitia Africa's Talking.
    Ilihamishwa kutoka realtime/services/sms_service.py
    """

    @classmethod
    def _format_phone(cls, phone_number):
        """Format namba ya simu kuwa 255..."""
        phone = str(phone_number).strip()
        if phone.startswith('0'):
            phone = '255' + phone[1:]
        elif phone.startswith('+'):
            phone = phone[1:]
        return phone

    @classmethod
    def send_sms(cls, phone_number, message, sender_id=None):
        """
        Tuma SMS kwa mpokeaji mmoja.
        
        Args:
            phone_number: Namba ya simu
            message: Ujumbe wa SMS
            sender_id: Sender ID (optional)
        
        Returns:
            dict: {'status': 'success'/'error', 'response': ..., 'message': '...'}
        """
        if not _sms:
            logger.error("SMS service not initialized")
            return {'status': 'error', 'message': 'SMS service not available'}

        try:
            phone = cls._format_phone(phone_number)
            sender = sender_id or getattr(settings, 'AFRICASTALKING_SENDER_ID', 'FEEVERT')
            response = _sms.send(message, [phone], sender)
            logger.info(f"SMS sent to {phone}: {response}")
            return {'status': 'success', 'response': response}
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {e}")
            return {'status': 'error', 'message': str(e)}

    @classmethod
    def send_bulk_sms(cls, phone_numbers, message, sender_id=None):
        """
        Tuma SMS kwa wapokeaji wengi.
        
        Args:
            phone_numbers: List ya namba za simu
            message: Ujumbe wa SMS
            sender_id: Sender ID (optional)
        
        Returns:
            dict: {'status': 'success'/'error', 'response': ..., 'count': ...}
        """
        if not _sms:
            return {'status': 'error', 'message': 'SMS service not available'}

        try:
            formatted = [cls._format_phone(p) for p in phone_numbers]
            sender = sender_id or getattr(settings, 'AFRICASTALKING_SENDER_ID', 'FEEVERT')
            response = _sms.send(message, formatted, sender)
            logger.info(f"Bulk SMS sent to {len(formatted)} recipients")
            return {'status': 'success', 'response': response, 'count': len(formatted)}
        except Exception as e:
            logger.error(f"Failed to send bulk SMS: {e}")
            return {'status': 'error', 'message': str(e)}

    # ============================================================
    # CONVENIENCE METHODS
    # ============================================================

    @classmethod
    def send_booking_confirmation(cls, phone, date, time):
        """Tuma SMS ya booking confirmation"""
        message = f"FEEVERT: Booking confirmed for {date} at {time}. Thank you!"
        return cls.send_sms(phone, message)

    @classmethod
    def send_booking_reminder(cls, phone, date, time):
        """Tuma SMS ya booking reminder"""
        message = f"FEEVERT Reminder: You have a consultation {date} at {time}. Call us for changes."
        return cls.send_sms(phone, message)

    @classmethod
    def send_payment_confirmation(cls, phone, amount):
        """Tuma SMS ya payment confirmation"""
        message = f"FEEVERT: Payment of {amount} received. Thank you!"
        return cls.send_sms(phone, message)

    @classmethod
    def send_verification_code(cls, phone, code):
        """Tuma SMS ya verification code"""
        message = f"Your FeeVert verification code is: {code}. Valid for 10 minutes."
        return cls.send_sms(phone, message)

    @classmethod
    def send_welcome(cls, phone, name):
        """Tuma SMS ya kumkaribisha"""
        message = f"Welcome to FeeVert, {name}! Explore services at feevert.co.tz"
        return cls.send_sms(phone, message)

    @classmethod
    def is_available(cls):
        """Check kama SMS service ipo available"""
        return _sms is not None