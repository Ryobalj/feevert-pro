# payments/services/flutterwave.py

import requests
import hashlib
import hmac
import uuid
from django.conf import settings
from django.core.cache import cache

class FlutterwaveGateway:
    """
    Flutterwave Gateway Integration for FeeVert
    Supports: Credit/Debit Cards, Bank Transfers, Mobile Money
    """
    
    def __init__(self):
        self.sandbox_url = "https://api.flutterwave.com/v3"
        self.live_url = "https://api.flutterwave.com/v3"
        self.api_key = settings.FLUTTERWAVE_API_KEY
        self.secret_hash = settings.FLUTTERWAVE_SECRET_HASH
        self.use_sandbox = settings.FLUTTERWAVE_USE_SANDBOX
        
    @property
    def base_url(self):
        return self.sandbox_url if self.use_sandbox else self.live_url
    
    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    def initiate_payment(self, amount, currency, email, reference, customer_name, phone=None, redirect_url=None):
        """
        Initiate payment via Flutterwave
        """
        url = f"{self.base_url}/payments"
        
        payload = {
            "tx_ref": reference,
            "amount": str(amount),
            "currency": currency,
            "redirect_url": redirect_url or f"{settings.SITE_URL}/payment/callback/",
            "meta": {
                "consumer_id": reference,
                "consumer_mac": "feevert"
            },
            "customer": {
                "email": email,
                "phonenumber": phone or "",
                "name": customer_name
            },
            "customizations": {
                "title": "FeeVert Consultancy Services",
                "description": "Payment for consultation services",
                "logo": f"{settings.SITE_URL}/static/images/logo.png"
            }
        }
        
        response = requests.post(url, json=payload, headers=self._headers())
        return response.json()
    
    def verify_transaction(self, transaction_id):
        """
        Verify transaction status
        """
        url = f"{self.base_url}/transactions/{transaction_id}/verify"
        response = requests.get(url, headers=self._headers())
        return response.json()
    
    def initiate_refund(self, transaction_id, amount):
        """
        Initiate refund
        """
        url = f"{self.base_url}/transactions/{transaction_id}/refund"
        payload = {"amount": str(amount)}
        response = requests.post(url, json=payload, headers=self._headers())
        return response.json()
    
    def get_banks(self, country="TZ"):
        """
        Get list of banks for bank transfer
        """
        url = f"{self.base_url}/banks/{country}"
        response = requests.get(url, headers=self._headers())
        return response.json()
    
    def initiate_bank_transfer(self, amount, currency, email, reference, customer_name, bank_code, account_number):
        """
        Initiate bank transfer payment
        """
        url = f"{self.base_url}/charges?type=bank_transfer"
        
        payload = {
            "tx_ref": reference,
            "amount": str(amount),
            "currency": currency,
            "email": email,
            "redirect_url": f"{settings.SITE_URL}/payment/callback/",
            "customer": {
                "name": customer_name,
                "email": email
            },
            "meta": {
                "bank_code": bank_code,
                "account_number": account_number
            }
        }
        
        response = requests.post(url, json=payload, headers=self._headers())
        return response.json()
    
    def verify_webhook_signature(self, payload, signature):
        """
        Verify webhook signature
        """
        expected = hmac.new(
            self.secret_hash.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected, signature)