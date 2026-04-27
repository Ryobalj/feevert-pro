# payments/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Payment endpoints
    path('initiate/', views.initiate_payment, name='initiate-payment'),
    path('verify/<str:transaction_id>/', views.verify_payment, name='verify-payment'),
    path('refund/<str:transaction_id>/', views.refund_payment, name='refund-payment'),
    path('transactions/', views.get_transactions, name='get-transactions'),
    path('transactions/<str:transaction_id>/', views.get_transaction, name='get-transaction'),
    
    # Invoice endpoints
    path('invoices/', views.invoices, name='invoices'),
    path('invoices/<str:invoice_number>/', views.get_invoice, name='get-invoice'),
    
    # PawaPay Webhook
    path('webhooks/pawapay/', views.pawapay_webhook, name='pawapay-webhook'),
]
