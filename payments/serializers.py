# payments/serializers.py

from rest_framework import serializers
from .models import PaymentTransaction, Invoice

class PaymentTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for PaymentTransaction model
    """
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'transaction_id',
            'user',
            'user_name',
            'user_email',
            'consultation',
            'booking',
            'amount',
            'currency',
            'status',
            'gateway_reference',  # Changed from flutterwave_reference
            'invoice_number',
            'customer_name',
            'customer_email',
            'customer_phone',
            'payment_link',
            'paid_at',
            'refunded_amount',
            'refunded_at',
            'error_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'transaction_id', 'gateway_reference', 'payment_link',
            'paid_at', 'refunded_at', 'created_at', 'updated_at'
        ]


class InitiatePaymentSerializer(serializers.Serializer):
    """
    Serializer for initiating a payment
    """
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=3, default='TZS')
    customer_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    item_type = serializers.ChoiceField(choices=['consultation', 'booking'], required=False, allow_blank=True)
    item_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    
    def validate_currency(self, value):
        allowed = ['TZS', 'KES', 'UGX', 'USD', 'EUR', 'GBP']
        if value not in allowed:
            raise serializers.ValidationError(f"Currency must be one of: {', '.join(allowed)}")
        return value.upper()


class VerifyPaymentSerializer(serializers.Serializer):
    """
    Serializer for verifying payment status
    """
    transaction_id = serializers.CharField(max_length=100)


class RefundPaymentSerializer(serializers.Serializer):
    """
    Serializer for refunding a payment
    """
    transaction_id = serializers.CharField(max_length=100)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    
    def validate_amount(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Refund amount must be greater than zero")
        return value


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice model
    """
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id',
            'invoice_number',
            'user',
            'user_name',
            'user_email',
            'consultation',
            'booking',
            'title',
            'description',
            'amount',
            'tax',
            'total_amount',
            'currency',
            'issue_date',
            'due_date',
            'paid_date',
            'status',
            'payment_link',
            'pdf_file',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'invoice_number', 'total_amount', 'created_at', 'updated_at'
        ]


class PaymentStatusSerializer(serializers.Serializer):
    """
    Serializer for payment status response
    """
    success = serializers.BooleanField()
    transaction_id = serializers.CharField(allow_blank=True, required=False)
    status = serializers.CharField(allow_blank=True, required=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    currency = serializers.CharField(required=False)
    payment_link = serializers.URLField(required=False)
    gateway_reference = serializers.CharField(required=False)  # Changed
    error = serializers.CharField(required=False)
    message = serializers.CharField(required=False)
