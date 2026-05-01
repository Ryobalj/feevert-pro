# payments/views.py

import json
import uuid
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PaymentTransaction, Invoice
from .serializers import (
    PaymentTransactionSerializer, InitiatePaymentSerializer,
    InvoiceSerializer
)
from .services.pawapay_service import PawaPayService

logger = logging.getLogger(__name__)

pawapay_service = PawaPayService()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    serializer = InitiatePaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'errors': serializer.errors}, status=400)
    
    data = serializer.validated_data
    transaction_id = str(uuid.uuid4())[:8].upper()
    
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
    
    if not transaction.customer_phone:
        transaction.status = 'failed'
        transaction.error_message = 'Phone number is required'
        transaction.save()
        return Response({'success': False, 'error': 'Phone number is required'}, status=400)
    
    result = pawapay_service.initiate_deposit(
        transaction_id=transaction_id, amount=str(data['amount']),
        currency=data['currency'], phone_number=transaction.customer_phone,
        customer_name=transaction.customer_name, customer_email=transaction.customer_email
    )
    
    if result.get('success'):
        transaction.gateway_reference = result.get('deposit_id')
        transaction.payment_link = result.get('redirect_url', '')
        transaction.gateway_response = result
        transaction.status = 'processing'
        transaction.save()
        return Response({
            'success': True, 'transaction_id': transaction_id,
            'payment_link': transaction.payment_link,
            'gateway_reference': transaction.gateway_reference,
            'message': 'Payment initiated'
        })
    else:
        transaction.status = 'failed'
        transaction.error_message = result.get('error', 'Payment failed')
        transaction.gateway_response = result
        transaction.save()
        return Response({'success': False, 'transaction_id': transaction_id, 'error': transaction.error_message}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_payment(request, transaction_id):
    try:
        transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
    except PaymentTransaction.DoesNotExist:
        return Response({'success': False, 'error': 'Transaction not found'}, status=404)
    
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
    try:
        transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
    except PaymentTransaction.DoesNotExist:
        return Response({'success': False, 'error': 'Transaction not found'}, status=404)
    
    if transaction.status != 'completed':
        return Response({'success': False, 'error': 'Only completed transactions can be refunded'}, status=400)
    
    transaction.status = 'refunded'
    transaction.refunded_amount = transaction.amount
    transaction.refunded_at = timezone.now()
    transaction.save()
    
    return Response({'success': True, 'transaction_id': transaction.transaction_id, 'refunded_amount': transaction.refunded_amount})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    transactions = PaymentTransaction.objects.filter(user=request.user).order_by('-created_at')
    serializer = PaymentTransactionSerializer(transactions, many=True)
    return Response({'success': True, 'count': transactions.count(), 'transactions': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transaction(request, transaction_id):
    try:
        transaction = PaymentTransaction.objects.get(transaction_id=transaction_id, user=request.user)
        serializer = PaymentTransactionSerializer(transaction)
        return Response({'success': True, 'transaction': serializer.data})
    except PaymentTransaction.DoesNotExist:
        return Response({'success': False, 'error': 'Transaction not found'}, status=404)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def invoices(request):
    if request.method == 'GET':
        invoices_list = Invoice.objects.filter(user=request.user).order_by('-issue_date')
        serializer = InvoiceSerializer(invoices_list, many=True)
        return Response({'success': True, 'count': invoices_list.count(), 'invoices': serializer.data})
    elif request.method == 'POST':
        serializer = InvoiceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=400)
        import random
        invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        validated_data = serializer.validated_data
        validated_data.pop('user', None)
        invoice = Invoice.objects.create(invoice_number=invoice_number, user=request.user, **validated_data)
        return Response({'success': True, 'invoice': InvoiceSerializer(invoice).data}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_invoice(request, invoice_number):
    try:
        invoice = Invoice.objects.get(invoice_number=invoice_number, user=request.user)
        serializer = InvoiceSerializer(invoice)
        return Response({'success': True, 'invoice': serializer.data})
    except Invoice.DoesNotExist:
        return Response({'success': False, 'error': 'Invoice not found'}, status=404)


@csrf_exempt
@require_http_methods(['POST'])
def pawapay_webhook(request):
    try:
        payload = json.loads(request.body)
        logger.info(f"PawaPay webhook: {payload}")
    except json.JSONDecodeError:
        return JsonResponse({'status': 'invalid_json'}, status=400)
    
    deposit_id = payload.get('depositId')
    status = payload.get('status')
    
    if deposit_id:
        try:
            transaction = PaymentTransaction.objects.get(gateway_reference=deposit_id)
            
            if status == 'SUCCEEDED':
                transaction.status = 'completed'
                transaction.paid_at = timezone.now()
                
                # Update shop order
                if transaction.order:
                    transaction.order.payment_status = 'completed'
                    transaction.order.status = 'processing'
                    transaction.order.save()
                    for item in transaction.order.items.all():
                        if item.product:
                            item.product.stock -= item.quantity
                            item.product.save()
                
                # Update consultation
                if transaction.consultation:
                    transaction.consultation.status = 'confirmed'
                    transaction.consultation.save()
                    
            elif status == 'FAILED':
                transaction.status = 'failed'
                if transaction.order:
                    transaction.order.payment_status = 'failed'
                    transaction.order.save()
            
            transaction.webhook_response = payload
            transaction.save()
            logger.info(f"Updated transaction {transaction.transaction_id} → {transaction.status}")
            
        except PaymentTransaction.DoesNotExist:
            logger.warning(f"Transaction not found: {deposit_id}")
    
    return JsonResponse({'status': 'ok'})