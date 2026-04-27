# payments/services/payment_service.py

import uuid
from datetime import datetime
from decimal import Decimal
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from ..models import PaymentTransaction, Invoice
from .flutterwave import FlutterwaveGateway

class PaymentService:
    """
    Main payment orchestration service for FeeVert
    """
    
    def __init__(self):
        self.flutterwave = FlutterwaveGateway()
    
    def process_payment(self, user, amount, currency, payment_data, item_type=None, item_id=None):
        """
        Process a payment through Flutterwave
        """
        # Generate transaction ID
        transaction_id = f"FVT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        
        # Create transaction record
        transaction = PaymentTransaction.objects.create(
            user=user,
            amount=amount,
            currency=currency,
            transaction_id=transaction_id,
            customer_name=payment_data.get('customer_name', user.get_full_name() or user.username),
            customer_email=payment_data.get('customer_email', user.email),
            customer_phone=payment_data.get('customer_phone', ''),
            status='pending'
        )
        
        # Link to consultation or booking if provided
        if item_type == 'consultation' and item_id:
            from consultations.models import ConsultationRequest
            try:
                transaction.consultation = ConsultationRequest.objects.get(id=item_id)
            except ConsultationRequest.DoesNotExist:
                pass
        elif item_type == 'booking' and item_id:
            from bookings.models import Booking
            try:
                transaction.booking = Booking.objects.get(id=item_id)
            except Booking.DoesNotExist:
                pass
        
        transaction.save()
        
        return self._process_flutterwave(transaction)
    
    def _process_flutterwave(self, transaction):
        """Process Flutterwave payment"""
        response = self.flutterwave.initiate_payment(
            amount=transaction.amount,
            currency=transaction.currency,
            email=transaction.customer_email,
            reference=transaction.transaction_id,
            customer_name=transaction.customer_name,
            phone=transaction.customer_phone
        )
        
        transaction.flutterwave_request = response
        transaction.flutterwave_reference = response.get('data', {}).get('id', '')
        transaction.payment_link = response.get('data', {}).get('link', '')
        transaction.status = 'processing'
        transaction.save()
        
        return {
            'success': response.get('status') == 'success',
            'transaction_id': transaction.transaction_id,
            'payment_link': transaction.payment_link,
            'flutterwave_reference': transaction.flutterwave_reference,
            'message': response.get('message', 'Payment initiated successfully')
        }
    
    def verify_payment(self, transaction_id):
        """
        Verify payment status with Flutterwave
        """
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
        except PaymentTransaction.DoesNotExist:
            return {'success': False, 'error': 'Transaction not found'}
        
        response = self.flutterwave.verify_transaction(transaction.flutterwave_reference)
        
        transaction.flutterwave_response = response
        
        if response.get('status') == 'success':
            data = response.get('data', {})
            if data.get('status') == 'successful':
                transaction.status = 'completed'
                transaction.paid_at = timezone.now()
                transaction.save()
                
                # Send confirmation email
                self._send_payment_confirmation(transaction)
                
                return {
                    'success': True,
                    'status': 'completed',
                    'transaction_id': transaction.transaction_id,
                    'amount': transaction.amount,
                    'currency': transaction.currency
                }
            elif data.get('status') == 'failed':
                transaction.status = 'failed'
                transaction.error_message = data.get('processor_response', 'Payment failed')
                transaction.save()
                return {
                    'success': False,
                    'status': 'failed',
                    'transaction_id': transaction.transaction_id,
                    'error': transaction.error_message
                }
        
        return {
            'success': False,
            'status': transaction.status,
            'transaction_id': transaction.transaction_id
        }
    
    def handle_webhook(self, payload):
        """
        Handle Flutterwave webhook
        """
        # Get transaction reference
        transaction_ref = payload.get('data', {}).get('tx_ref', '')
        
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=transaction_ref)
        except PaymentTransaction.DoesNotExist:
            return {'status': 'transaction_not_found'}
        
        # Update transaction
        status = payload.get('data', {}).get('status')
        transaction.webhook_response = payload
        
        if status == 'successful':
            transaction.status = 'completed'
            transaction.paid_at = timezone.now()
        elif status == 'failed':
            transaction.status = 'failed'
            transaction.error_message = payload.get('data', {}).get('processor_response', 'Unknown error')
        
        transaction.save()
        
        # Send confirmation email if completed
        if transaction.status == 'completed':
            self._send_payment_confirmation(transaction)
        
        return {'status': 'processed', 'transaction_id': transaction.transaction_id}
    
    def refund_payment(self, transaction_id, amount=None):
        """
        Refund a payment
        """
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
        except PaymentTransaction.DoesNotExist:
            return {'success': False, 'error': 'Transaction not found'}
        
        if transaction.status != 'completed':
            return {'success': False, 'error': 'Only completed transactions can be refunded'}
        
        refund_amount = amount or transaction.amount
        
        response = self.flutterwave.initiate_refund(transaction.flutterwave_reference, refund_amount)
        
        if response.get('status') == 'success':
            transaction.status = 'refunded'
            transaction.refunded_amount = refund_amount
            transaction.refunded_at = timezone.now()
            transaction.refund_reference = response.get('data', {}).get('id', '')
            transaction.save()
            
            return {
                'success': True,
                'refund_id': transaction.refund_reference,
                'amount': refund_amount
            }
        
        return {
            'success': False,
            'error': response.get('message', 'Refund failed')
        }
    
    def _send_payment_confirmation(self, transaction):
        """Send payment confirmation email"""
        subject = f"Payment Confirmation - {transaction.transaction_id}"
        
        try:
            send_mail(
                subject=subject,
                message=f"Dear {transaction.customer_name},\n\nYour payment of {transaction.amount} {transaction.currency} has been confirmed.\n\nTransaction ID: {transaction.transaction_id}\n\nThank you for choosing FeeVert!",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[transaction.customer_email],
                fail_silently=True
            )
        except Exception:
            pass  # Don't fail if email fails