# payments/admin.py

from django.contrib import admin
from .models import PaymentTransaction, Invoice

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'user', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('status', 'currency', 'created_at')
    search_fields = ('transaction_id', 'flutterwave_reference', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'user', 'total_amount', 'status', 'issue_date', 'due_date')
    list_filter = ('status', 'issue_date', 'due_date')
    search_fields = ('invoice_number', 'user__username', 'user__email', 'title')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)