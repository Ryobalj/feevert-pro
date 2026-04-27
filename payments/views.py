# payments/views.py

import json
import uuid
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PaymentTransaction, Invoice
from .serializers import (
    PaymentTransactionSerializer, InitiatePaymentSerializer,
    VerifyPaymentSerializer, RefundPaymentSerializer,
    InvoiceSerializer, PaymentStatusSerializer
)
from .services.pawapay_service import PawaPayService

import logging
logger = logging.getLogger(__name__)


# Initialize PawaPay service
pawapay_service = PawaPayService()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    """
    Initiate a payment through PawaPay
    """
    serializer = InitiatePaymentSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=400)
    
    data = serializer.validated_data
    
    # Generate unique transaction ID
    import uuid
    transaction_id = str(uuid.uuid4())[:8].upper()
    
    # Create transaction record
    transaction = PaymentTransaction.objects.create(
        user=request.user,
        amount=data['amount'],
        currency=data['currency'],
        transaction_id=transaction_id,
        gateway='pawapay',
        customer_name=data.get('customer_name', request.user.get_full_name() or request.user.username),
        customer_email=data.get('customer_email', request.user.email),
        customer_phone=data.get('customer_phone', ''),
        status='pending'
    )
    
    # Check if phone number is provided
    if not transaction.customer_phone:
        transaction.status = 'failed'
        transaction.error_message = 'Phone number is required for PawaPay payment'
        transaction.save()
        return Response({
            'success': False,
            'transaction_id': transaction_id,
            'error': 'Phone number is required for PawaPay payment'
        }, status=400)
    
    # Initiate payment with PawaPay
    result = pawapay_service.initiate_deposit(
        transaction_id=transaction_id,
        amount=str(data['amount']),
        currency=data['currency'],
        phone_number=transaction.customer_phone,
        customer_name=transaction.customer_name,
        customer_email=transaction.customer_email
    )
    
    if result.get('success'):
        transaction.gateway_reference = result.get('deposit_id')
        transaction.payment_link = result.get('redirect_url', '')
        transaction.gateway_response = result
        transaction.status = 'processing'
        transaction.save()
        
        return Response({
            'success': True,
            'transaction_id': transaction_id,
            'payment_link': transaction.payment_link,
            'gateway_reference': transaction.gateway_reference,
            'message': 'Payment initiated successfully'
        })
    else:
        transaction.status = 'failed'
        transaction.error_message = result.get('error', 'Payment initiation failed')
        transaction.gateway_response = result
        transaction.save()
        
        return Response({
            'success': False,
            'transaction_id': transaction_id,
            'error': transaction.error_message
        }, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_payment(request, transaction_id):
    """
    Verify payment status
    """
    try:
        transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
    except PaymentTransaction.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Transaction not found'
        }, status=404)
    
    # Check status with PawaPay if we have gateway reference
    if transaction.gateway_reference:
        result = pawapay_service.get_deposit_status(transaction.gateway_reference)
        
        if result.get('success'):
            status = result.get('status')
            if status == 'SUCCEEDED':
                transaction.status = 'completed'
                transaction.paid_at = timezone.now()
                transaction.save()
            elif status == 'FAILED':
                transaction.status = 'failed'
                transaction.error_message = result.get('error', 'Payment failed')
                transaction.save()
    
    return Response({
        'success': transaction.status == 'completed',
        'transaction_id': transaction.transaction_id,
        'status': transaction.status,
        'amount': transaction.amount,
        'currency': transaction.currency
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_payment(request, transaction_id):
    """
    Refund a payment
    """
    try:
        transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
    except PaymentTransaction.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Transaction not found'
        }, status=404)
    
    if transaction.status != 'completed':
        return Response({
            'success': False,
            'error': 'Only completed transactions can be refunded'
        }, status=400)
    
    # For now, manual refund processing
    transaction.status = 'refunded'
    transaction.refunded_amount = transaction.amount
    transaction.refunded_at = timezone.now()
    transaction.save()
    
    return Response({
        'success': True,
        'transaction_id': transaction.transaction_id,
        'refunded_amount': transaction.refunded_amount
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    """
    Get user's payment transactions
    """
    transactions = PaymentTransaction.objects.filter(user=request.user).order_by('-created_at')
    serializer = PaymentTransactionSerializer(transactions, many=True)
    return Response({
        'success': True,
        'count': transactions.count(),
        'transactions': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transaction(request, transaction_id):
    """
    Get single payment transaction
    """
    try:
        transaction = PaymentTransaction.objects.get(transaction_id=transaction_id, user=request.user)
        serializer = PaymentTransactionSerializer(transaction)
        return Response({
            'success': True,
            'transaction': serializer.data
        })
    except PaymentTransaction.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Transaction not found'
        }, status=404)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def invoices(request):
    """
    Get user's invoices or create new invoice
    """
    if request.method == 'GET':
        invoices_list = Invoice.objects.filter(user=request.user).order_by('-issue_date')
        serializer = InvoiceSerializer(invoices_list, many=True)
        return Response({
            'success': True,
            'count': invoices_list.count(),
            'invoices': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = InvoiceSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=400)
        
        # Generate invoice number
        from django.utils import timezone
        import random
        invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        
        # Remove 'user' from validated_data if present
        validated_data = serializer.validated_data
        validated_data.pop('user', None)  # Remove user if exists
        
        invoice = Invoice.objects.create(
            invoice_number=invoice_number,
            user=request.user,  # Set user explicitly
            **validated_data
        )
        
        result_serializer = InvoiceSerializer(invoice)
        return Response({
            'success': True,
            'invoice': result_serializer.data
        }, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_invoice(request, invoice_number):
    """
    Get single invoice
    """
    try:
        invoice = Invoice.objects.get(invoice_number=invoice_number, user=request.user)
        serializer = InvoiceSerializer(invoice)
        return Response({
            'success': True,
            'invoice': serializer.data
        })
    except Invoice.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Invoice not found'
        }, status=404)


@csrf_exempt
@require_http_methods(['POST'])
def pawapay_webhook(request):
    """
    PawaPay webhook endpoint (no authentication required)
    """
    try:
        payload = json.loads(request.body)
        logger.info(f"PawaPay webhook received: {payload}")
    except json.JSONDecodeError:
        return JsonResponse({'status': 'invalid_json'}, status=400)
    
    # Extract deposit information
    deposit_id = payload.get('depositId')
    status = payload.get('status')
    
    if deposit_id:
        try:
            transaction = PaymentTransaction.objects.get(gateway_reference=deposit_id)
            
            if status == 'SUCCEEDED':
                transaction.status = 'completed'
                transaction.paid_at = timezone.now()
            elif status == 'FAILED':
                transaction.status = 'failed'
                transaction.error_message = payload.get('reason', 'Payment failed')
            elif status == 'PENDING':
                transaction.status = 'processing'
            
            transaction.webhook_response = payload
            transaction.save()
            
            logger.info(f"Updated transaction {transaction.transaction_id} status to {transaction.status}")
            
        except PaymentTransaction.DoesNotExist:
            logger.warning(f"Transaction not found for deposit_id: {deposit_id}")
    
    return JsonResponse({'status': 'ok'})
