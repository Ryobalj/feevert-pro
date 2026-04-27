# payments/services/pawapay_service.py

import requests
import uuid
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class PawaPayService:
    """
    PawaPay Gateway Integration for FeeVert
    """

    def __init__(self):
        self.sandbox_url = "https://api.sandbox.pawapay.io/v2"
        self.live_url = "https://api.pawapay.io/v2"

        # Use sandbox or live API key based on setting
        if settings.PAWAPAY_USE_SANDBOX:
            self.api_key = getattr(settings, 'PAWAPAY_SANDBOX_API_KEY', '')
        else:
            self.api_key = getattr(settings, 'PAWAPAY_LIVE_API_KEY', '')

        self.use_sandbox = settings.PAWAPAY_USE_SANDBOX

    @property
    def base_url(self):
        return self.sandbox_url if self.use_sandbox else self.live_url

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def _detect_provider(self, phone_number):
        """
        Detect mobile money provider from phone number (Tanzania)
        """
        # Remove any non-digit characters
        import re
        cleaned = re.sub(r'\D', '', str(phone_number))
        
        # Remove country code if present
        if cleaned.startswith('255'):
            cleaned = cleaned[3:]
        elif cleaned.startswith('0'):
            cleaned = cleaned[1:]
        
        # Check first digits for provider
        if len(cleaned) >= 2:
            prefix = cleaned[:2]
            
            # Tigo: 71, 72, 73, 74
            if prefix in ['71', '72', '73', '74']:
                return "TIGO_PESA_TZA"
            # Vodacom: 75, 76
            elif prefix in ['75', '76']:
                return "VODACOM_M_PESA_TZA"
            # Airtel: 65, 66, 67, 68
            elif prefix in ['65', '66', '67', '68']:
                return "AIRTEL_MONEY_TZA"
            # Halotel: 78, 79
            elif prefix in ['78', '79']:
                return "HALOPESA_TZA"
        
        return "UNKNOWN"

    def initiate_deposit(self, transaction_id, amount, currency, phone_number, customer_name, customer_email):
        url = f"{self.base_url}/deposits"
        provider = self._detect_provider(phone_number)
    
        payload = {
            "depositId": transaction_id,
            "amount": str(amount),
            "currency": currency,
            "payer": {
                "type": "MMO",
                "accountDetails": {
                    "phoneNumber": phone_number,
                    "provider": provider
                }
            },
            "customer": {
                "name": customer_name,
                "email": customer_email,
                "phoneNumber": phone_number
            },
            "returnUrl": settings.PAWAPAY_CALLBACK_URL
        }
    
        logger.info(f"Initiating PawaPay deposit: {payload}")
    
        try:
            response = requests.post(url, json=payload, headers=self._headers())
            response.raise_for_status()
            data = response.json()
            logger.info(f"PawaPay response: {data}")
    
            return {
                'success': True,
                'deposit_id': data.get('depositId'),
                'status': data.get('status'),
                'redirect_url': data.get('redirectUrl', ''),
                'message': data.get('message', 'Deposit initiated successfully')
            }
        except requests.exceptions.HTTPError as e:
            logger.error(f"PawaPay HTTP error: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response body: {e.response.text}")
            return {'success': False, 'error': str(e)}
        except requests.exceptions.RequestException as e:
            logger.error(f"PawaPay request failed: {e}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {'success': False, 'error': str(e)}

    def get_deposit_status(self, deposit_id):
        """
        Check deposit status
        """
        url = f"{self.base_url}/deposits/{deposit_id}"

        try:
            response = requests.get(url, headers=self._headers())
            response.raise_for_status()

            data = response.json()

            return {
                'success': True,
                'deposit_id': data.get('depositId'),
                'status': data.get('status'),
                'amount': data.get('amount'),
                'currency': data.get('currency'),
                'error': data.get('failureReason', '')
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"PawaPay status check failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def predict_provider(self, phone_number):
        """
        Predict provider from phone number using PawaPay API
        """
        url = f"{self.base_url}/predict-provider"
        payload = {"phoneNumber": phone_number}

        try:
            response = requests.post(url, json=payload, headers=self._headers())
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Provider prediction failed: {e}")
            return None