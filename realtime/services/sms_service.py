import africastalking
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Africa's Talking
try:
    africastalking.initialize(
        username=settings.AFRICASTALKING_USERNAME,
        api_key=settings.AFRICASTALKING_API_KEY
    )
    sms = africastalking.SMS
except Exception as e:
    logger.error(f"Failed to initialize Africa's Talking: {e}")
    sms = None


class SMSService:
    """Service for sending SMS notifications"""
    
    @staticmethod
    def send_sms(phone_number, message, sender_id=None):
        """
        Send SMS to a single recipient
        """
        if not sms:
            logger.error("SMS service not initialized")
            return {'status': 'error', 'message': 'SMS service not available'}
        
        try:
            # Format phone number (ensure it starts with 255)
            if phone_number.startswith('0'):
                phone_number = '255' + phone_number[1:]
            elif phone_number.startswith('+'):
                phone_number = phone_number[1:]
            
            sender = sender_id or settings.AFRICASTALKING_SENDER_ID
            
            response = sms.send(message, [phone_number], sender)
            
            logger.info(f"SMS sent to {phone_number}: {response}")
            return {'status': 'success', 'response': response}
            
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return {'status': 'error', 'message': str(e)}
    
    @staticmethod
    def send_bulk_sms(phone_numbers, message, sender_id=None):
        """
        Send SMS to multiple recipients
        """
        if not sms:
            logger.error("SMS service not initialized")
            return {'status': 'error', 'message': 'SMS service not available'}
        
        try:
            # Format all phone numbers
            formatted_numbers = []
            for num in phone_numbers:
                if num.startswith('0'):
                    num = '255' + num[1:]
                elif num.startswith('+'):
                    num = num[1:]
                formatted_numbers.append(num)
            
            sender = sender_id or settings.AFRICASTALKING_SENDER_ID
            
            response = sms.send(message, formatted_numbers, sender)
            
            logger.info(f"Bulk SMS sent to {len(formatted_numbers)} recipients")
            return {'status': 'success', 'response': response}
            
        except Exception as e:
            logger.error(f"Failed to send bulk SMS: {e}")
            return {'status': 'error', 'message': str(e)}
    
    @staticmethod
    def send_booking_confirmation(phone_number, booking_details):
        """
        Send booking confirmation SMS
        """
        message = f"FEEVERT: Booking confirmed for {booking_details['date']} at {booking_details['time']}. Thank you!"
        return SMSService.send_sms(phone_number, message)
    
    @staticmethod
    def send_booking_reminder(phone_number, booking_details):
        """
        Send booking reminder SMS
        """
        message = f"FEEVERT Reminder: You have a consultation tomorrow {booking_details['date']} at {booking_details['time']}. Call {booking_details.get('phone', '0712345678')} for changes."
        return SMSService.send_sms(phone_number, message)
    
    @staticmethod
    def send_consultation_update(phone_number, consultation_details):
        """
        Send consultation status update SMS
        """
        message = f"FEEVERT: Your consultation request #{consultation_details['id']} is now {consultation_details['status']}. Login to view details."
        return SMSService.send_sms(phone_number, message)
