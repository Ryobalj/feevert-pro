# payments/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from core.models import BaseModel

class PaymentTransaction(BaseModel):
    """
    Payment transaction for FeeVert supporting multiple gateways
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    )
    
    GATEWAY_CHOICES = (
        ('pawapay', 'PawaPay'),
        ('flutterwave', 'Flutterwave'),
        ('mpesa', 'M-Pesa Direct'),
        ('card', 'Credit/Debit Card'),
        ('bank', 'Bank Transfer'),
    )
    
    # Relationships
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    consultation = models.ForeignKey('consultations.ConsultationRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='TZS')
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES, default='pawapay')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Transaction references (generic)
    transaction_id = models.CharField(max_length=100, unique=True)
    gateway_reference = models.CharField(max_length=100, blank=True, help_text="Reference from payment gateway")
    invoice_number = models.CharField(max_length=50, blank=True)
    
    # Customer details
    customer_name = models.CharField(max_length=200, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    
    # Gateway data (generic JSON fields)
    gateway_request = models.JSONField(default=dict, blank=True, help_text="Request sent to gateway")
    gateway_response = models.JSONField(default=dict, blank=True, help_text="Response from gateway")
    webhook_response = models.JSONField(default=dict, blank=True, help_text="Webhook callback data")
    
    # Payment link
    payment_link = models.URLField(blank=True, help_text="Hosted payment link from gateway")
    
    # Timestamps
    paid_at = models.DateTimeField(blank=True, null=True)
    
    # Refund
    refunded_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refunded_at = models.DateTimeField(blank=True, null=True)
    refund_reference = models.CharField(max_length=100, blank=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_id']),
            models.Index(fields=['gateway_reference']),
            models.Index(fields=['gateway']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['invoice_number']),
        ]
    
    def __str__(self):
        return f"{self.transaction_id} - {self.amount} {self.currency} ({self.status})"
    
    def mark_completed(self, gateway_ref=None):
        """Mark transaction as completed"""
        self.status = 'completed'
        if gateway_ref:
            self.gateway_reference = gateway_ref
        self.paid_at = timezone.now()
        self.save()
    
    def mark_failed(self, error_msg=None):
        """Mark transaction as failed"""
        self.status = 'failed'
        if error_msg:
            self.error_message = error_msg
        self.save()
    
    def mark_refunded(self, refund_ref=None):
        """Mark transaction as refunded"""
        self.status = 'refunded'
        if refund_ref:
            self.refund_reference = refund_ref
        self.refunded_at = timezone.now()
        self.save()
    
    def mark_processing(self):
        """Mark transaction as processing"""
        self.status = 'processing'
        self.save()


class Invoice(BaseModel):
    """
    Simple invoice for services
    """
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    )
    
    invoice_number = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invoices')
    consultation = models.ForeignKey('consultations.ConsultationRequest', on_delete=models.SET_NULL, null=True, blank=True)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Invoice details
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="VAT 18%")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    currency = models.CharField(max_length=3, default='TZS')
    
    # Dates
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Payment link
    payment_link = models.URLField(blank=True)
    payment_link_expiry = models.DateTimeField(blank=True, null=True)
    
    # PDF
    pdf_file = models.FileField(upload_to='invoices/', blank=True, null=True)
    
    class Meta:
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['user', '-issue_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.username} - {self.status}"
    
    def save(self, *args, **kwargs):
        self.total_amount = self.amount + self.tax
        super().save(*args, **kwargs)
    
    def mark_as_paid(self, payment_transaction=None):
        """Mark invoice as paid"""
        self.status = 'paid'
        self.paid_date = timezone.now().date()
        self.save()
