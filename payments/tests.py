# payments/tests.py

import json
import uuid
from decimal import Decimal
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from rest_framework import status

from payments.models import PaymentTransaction, Invoice
from payments.services.pawapay_service import PawaPayService

User = get_user_model()


# ============================================================
# PAWAPAY SERVICE TESTS
# ============================================================

class PawaPayServiceTest(TestCase):
    """Test cases for PawaPay Service"""

    def setUp(self):
        """Set up test data"""
        self.service = PawaPayService()
        self.test_phone = "255712345678"
        self.test_amount = "1000"
        self.test_currency = "TZS"
        self.test_transaction_id = str(uuid.uuid4())[:8].upper()
        self.test_customer_name = "Test Customer"
        self.test_customer_email = "test@example.com"

    def test_detect_provider_tigo(self):
        """Test provider detection for Tigo numbers (71, 72, 73, 74)"""
        tigo_numbers = ["255712345678", "255722345678", "255732345678", "255742345678"]
        for number in tigo_numbers:
            provider = self.service._detect_provider(number)
            self.assertEqual(provider, "TIGO_PESA_TZA")

    def test_detect_provider_vodacom(self):
        """Test provider detection for Vodacom numbers (75, 76)"""
        vodacom_numbers = ["255752345678", "255762345678"]
        for number in vodacom_numbers:
            provider = self.service._detect_provider(number)
            self.assertEqual(provider, "VODACOM_M_PESA_TZA")

    def test_detect_provider_airtel(self):
        """Test provider detection for Airtel numbers (65, 66, 67, 68)"""
        airtel_numbers = ["255652345678", "255662345678", "255672345678", "255682345678"]
        for number in airtel_numbers:
            provider = self.service._detect_provider(number)
            self.assertEqual(provider, "AIRTEL_MONEY_TZA")

    def test_detect_provider_halotel(self):
        """Test provider detection for Halotel numbers (78, 79)"""
        halotel_numbers = ["255782345678", "255792345678"]
        for number in halotel_numbers:
            provider = self.service._detect_provider(number)
            self.assertEqual(provider, "HALOPESA_TZA")

    def test_detect_provider_unknown(self):
        """Test provider detection for unknown numbers"""
        unknown_numbers = ["255112345678", "255992345678", "123456789", "255999999999"]
        for number in unknown_numbers:
            provider = self.service._detect_provider(number)
            self.assertEqual(provider, "UNKNOWN")

    def test_headers(self):
        """Test headers generation"""
        headers = self.service._headers()
        self.assertIn('Authorization', headers)
        self.assertIn('Content-Type', headers)
        self.assertEqual(headers['Content-Type'], 'application/json')

    @patch('requests.post')
    def test_initiate_deposit_success(self, mock_post):
        """Test successful deposit initiation"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "depositId": self.test_transaction_id,
            "status": "PENDING",
            "redirectUrl": "https://pay.pawapay.io/pay/123"
        }
        mock_post.return_value = mock_response

        result = self.service.initiate_deposit(
            transaction_id=self.test_transaction_id,
            amount=self.test_amount,
            currency=self.test_currency,
            phone_number=self.test_phone,
            customer_name=self.test_customer_name,
            customer_email=self.test_customer_email
        )

        self.assertTrue(result['success'])
        self.assertEqual(result['deposit_id'], self.test_transaction_id)
        self.assertEqual(result['status'], "PENDING")
        self.assertIsNotNone(result['redirect_url'])

    @patch('requests.post')
    def test_initiate_deposit_failure(self, mock_post):
        """Test failed deposit initiation"""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.raise_for_status.side_effect = Exception("API Error")
        mock_post.return_value = mock_response

        result = self.service.initiate_deposit(
            transaction_id=self.test_transaction_id,
            amount=self.test_amount,
            currency=self.test_currency,
            phone_number=self.test_phone,
            customer_name=self.test_customer_name,
            customer_email=self.test_customer_email
        )

        self.assertFalse(result['success'])
        self.assertIn('error', result)

    @patch('requests.get')
    def test_get_deposit_status(self, mock_get):
        """Test getting deposit status"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "depositId": self.test_transaction_id,
            "status": "SUCCEEDED",
            "amount": "1000",
            "currency": "TZS"
        }
        mock_get.return_value = mock_response

        result = self.service.get_deposit_status(self.test_transaction_id)

        self.assertTrue(result['success'])
        self.assertEqual(result['deposit_id'], self.test_transaction_id)
        self.assertEqual(result['status'], "SUCCEEDED")

    @patch('requests.post')
    def test_predict_provider(self, mock_post):
        """Test provider prediction"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "phoneNumber": self.test_phone,
            "provider": "VODACOM_M_PESA_TZA",
            "country": "TZA"
        }
        mock_post.return_value = mock_response

        result = self.service.predict_provider(self.test_phone)

        self.assertIsNotNone(result)
        self.assertEqual(result.get('provider'), "VODACOM_M_PESA_TZA")


# ============================================================
# PAYMENT API TESTS
# ============================================================

class PaymentAPITest(TestCase):
    """Test cases for Payment API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            phone='255712345678'
        )
        self.client.force_authenticate(user=self.user)

    def test_initiate_payment_no_phone(self):
        """Test initiate payment without phone number"""
        url = reverse('initiate-payment')
        data = {
            'amount': '1000',
            'currency': 'TZS',
            'customer_name': 'Test User',
            'customer_email': 'test@example.com'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    @patch('payments.services.pawapay_service.PawaPayService.initiate_deposit')
    def test_initiate_payment_success(self, mock_initiate):
        """Test successful payment initiation"""
        mock_initiate.return_value = {
            'success': True,
            'deposit_id': 'test-deposit-123',
            'status': 'PENDING',
            'redirect_url': 'https://pay.pawapay.io/pay/123'
        }

        url = reverse('initiate-payment')
        data = {
            'amount': '1000',
            'currency': 'TZS',
            'customer_name': 'Test User',
            'customer_email': 'test@example.com',
            'customer_phone': '255712345678'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIsNotNone(response.data['transaction_id'])

    def test_get_transactions_empty(self):
        """Test get transactions when none exist"""
        url = reverse('get-transactions')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['transactions'], [])

    def test_get_transactions_with_data(self):
        """Test get transactions with existing data"""
        PaymentTransaction.objects.create(
            user=self.user,
            amount=Decimal('1000'),
            currency='TZS',
            transaction_id='TXN-001',
            gateway='pawapay',
            status='pending',
            customer_phone='255712345678'
        )

        url = reverse('get-transactions')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_get_transaction_not_found(self):
        """Test get non-existent transaction"""
        url = reverse('get-transaction', kwargs={'transaction_id': 'NONEXISTENT'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_verify_payment_not_found(self):
        """Test verify non-existent payment"""
        url = reverse('verify-payment', kwargs={'transaction_id': 'NONEXISTENT'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invoice_creation(self):
        """Test invoice creation"""
        url = reverse('invoices')
        data = {
            'title': 'Consultation Fee',
            'description': 'Agriculture consultation',
            'amount': '50000',
            'tax': '9000',
            'currency': 'TZS',
            'issue_date': timezone.now().date().isoformat(),
            'due_date': (timezone.now().date() + timezone.timedelta(days=30)).isoformat(),
            'user': self.user.id,  # Add user field
            'status': 'draft'      # Add status field
        }
        response = self.client.post(url, data, format='json')
        
        # Print response for debugging
        if response.status_code != 201:
            print(f"Response data: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIsNotNone(response.data['invoice']['invoice_number'])

    def test_get_invoices(self):
        """Test get invoices list"""
        Invoice.objects.create(
            invoice_number='INV-001',
            user=self.user,
            title='Consultation Fee',
            amount=Decimal('50000'),
            tax=Decimal('9000'),
            currency='TZS',
            issue_date=timezone.now().date(),
            due_date=timezone.now().date() + timezone.timedelta(days=30)
        )

        url = reverse('invoices')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_get_invoice_not_found(self):
        """Test get non-existent invoice"""
        url = reverse('get-invoice', kwargs={'invoice_number': 'INV-NONE'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ============================================================
# WEBHOOK TESTS
# ============================================================

class WebhookTest(TestCase):
    """Test cases for PawaPay Webhook"""

    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.transaction = PaymentTransaction.objects.create(
            user=self.user,
            amount=Decimal('1000'),
            currency='TZS',
            transaction_id='TXN-WEBHOOK-001',
            gateway_reference='deposit-123',
            gateway='pawapay',
            status='pending'
        )

    def test_webhook_success(self):
        """Test successful webhook callback"""
        url = reverse('pawapay-webhook')
        payload = {
            "depositId": "deposit-123",
            "status": "SUCCEEDED",
            "amount": "1000",
            "currency": "TZS"
        }
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.status, 'completed')
        self.assertIsNotNone(self.transaction.paid_at)

    def test_webhook_failure(self):
        """Test failed webhook callback"""
        url = reverse('pawapay-webhook')
        payload = {
            "depositId": "deposit-123",
            "status": "FAILED",
            "reason": "Insufficient funds"
        }
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.status, 'failed')
        self.assertIsNotNone(self.transaction.error_message)

    def test_webhook_processing(self):
        """Test processing webhook callback"""
        url = reverse('pawapay-webhook')
        payload = {
            "depositId": "deposit-123",
            "status": "PENDING",
            "amount": "1000",
            "currency": "TZS"
        }
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.status, 'processing')

    def test_webhook_invalid_json(self):
        """Test webhook with invalid JSON"""
        url = reverse('pawapay-webhook')
        response = self.client.post(url, data='invalid json', content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_webhook_transaction_not_found(self):
        """Test webhook with non-existent transaction"""
        url = reverse('pawapay-webhook')
        payload = {
            "depositId": "nonexistent-deposit",
            "status": "SUCCEEDED"
        }
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ============================================================
# INVOICE TESTS
# ============================================================

class InvoiceTest(TestCase):
    """Test cases for Invoice model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_invoice_creation(self):
        """Test invoice creation"""
        invoice = Invoice.objects.create(
            invoice_number='INV-001',
            user=self.user,
            title='Consultation Fee',
            description='Agriculture consultation',
            amount=Decimal('50000'),
            tax=Decimal('9000'),
            currency='TZS',
            issue_date=timezone.now().date(),
            due_date=timezone.now().date() + timezone.timedelta(days=30)
        )
        
        self.assertEqual(invoice.total_amount, Decimal('59000'))
        self.assertEqual(invoice.status, 'draft')

    def test_invoice_mark_as_paid(self):
        """Test marking invoice as paid"""
        invoice = Invoice.objects.create(
            invoice_number='INV-002',
            user=self.user,
            title='Consultation Fee',
            amount=Decimal('50000'),
            tax=Decimal('9000'),
            currency='TZS',
            issue_date=timezone.now().date(),
            due_date=timezone.now().date() + timezone.timedelta(days=30)
        )
        
        invoice.mark_as_paid()
        
        self.assertEqual(invoice.status, 'paid')
        self.assertIsNotNone(invoice.paid_date)

    def test_invoice_str_method(self):
        """Test invoice string representation"""
        invoice = Invoice.objects.create(
            invoice_number='INV-003',
            user=self.user,
            title='Consultation Fee',
            amount=Decimal('50000'),
            tax=Decimal('9000'),
            currency='TZS',
            issue_date=timezone.now().date(),
            due_date=timezone.now().date() + timezone.timedelta(days=30)
        )
        
        self.assertIn('INV-003', str(invoice))
        self.assertIn(self.user.username, str(invoice))

    def test_invoice_total_amount_calculation(self):
        """Test invoice total amount calculation"""
        invoice = Invoice.objects.create(
            invoice_number='INV-004',
            user=self.user,
            title='Test Service',
            amount=Decimal('100000'),
            tax=Decimal('18000'),
            currency='TZS',
            issue_date=timezone.now().date(),
            due_date=timezone.now().date() + timezone.timedelta(days=30)
        )
        
        self.assertEqual(invoice.total_amount, Decimal('118000'))


# ============================================================
# PAYMENT TRANSACTION TESTS
# ============================================================

class PaymentTransactionTest(TestCase):
    """Test cases for PaymentTransaction model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_transaction_creation(self):
        """Test transaction creation"""
        transaction = PaymentTransaction.objects.create(
            user=self.user,
            amount=Decimal('1000'),
            currency='TZS',
            transaction_id='TXN-001',
            gateway='pawapay',
            status='pending'
        )
        
        self.assertEqual(transaction.status, 'pending')
        self.assertEqual(transaction.gateway, 'pawapay')
        self.assertIsNotNone(transaction.created_at)

    def test_mark_completed(self):
        """Test marking transaction as completed"""
        transaction = PaymentTransaction.objects.create(
            user=self.user,
            amount=Decimal('1000'),
            currency='TZS',
            transaction_id='TXN-002',
            gateway='pawapay',
            status='pending'
        )
        
        transaction.mark_completed(gateway_ref='ref-123')
        
        self.assertEqual(transaction.status, 'completed')
        self.assertEqual(transaction.gateway_reference, 'ref-123')
        self.assertIsNotNone(transaction.paid_at)

    def test_mark_failed(self):
        """Test marking transaction as failed"""
        transaction = PaymentTransaction.objects.create(
            user=self.user,
            amount=Decimal('1000'),
            currency='TZS',
            transaction_id='TXN-003',
            gateway='pawapay',
            status='pending'
        )
        
        transaction.mark_failed(error_msg='Payment timeout')
        
        self.assertEqual(transaction.status, 'failed')
        self.assertEqual(transaction.error_message, 'Payment timeout')

    def test_mark_refunded(self):
        """Test marking transaction as refunded"""
        transaction = PaymentTransaction.objects.create(
            user=self.user,
            amount=Decimal('1000'),
            currency='TZS',
            transaction_id='TXN-004',
            gateway='pawapay',
            status='completed'
        )
        
        transaction.mark_refunded(refund_ref='refund-123')
        
        self.assertEqual(transaction.status, 'refunded')
        self.assertEqual(transaction.refund_reference, 'refund-123')
        self.assertIsNotNone(transaction.refunded_at)

    def test_mark_processing(self):
        """Test marking transaction as processing"""
        transaction = PaymentTransaction.objects.create(
            user=self.user,
            amount=Decimal('1000'),
            currency='TZS',
            transaction_id='TXN-005',
            gateway='pawapay',
            status='pending'
        )
        
        transaction.mark_processing()
        
        self.assertEqual(transaction.status, 'processing')

    def test_transaction_str_method(self):
        """Test transaction string representation"""
        transaction = PaymentTransaction.objects.create(
            user=self.user,
            amount=Decimal('1000'),
            currency='TZS',
            transaction_id='TXN-006',
            gateway='pawapay',
            status='pending'
        )
        
        self.assertIn('TXN-006', str(transaction))
        self.assertIn('1000', str(transaction))

    def test_transaction_with_all_fields(self):
        """Test transaction with all fields populated"""
        transaction = PaymentTransaction.objects.create(
            user=self.user,
            amount=Decimal('25000'),
            currency='TZS',
            transaction_id='TXN-007',
            gateway='pawapay',
            status='completed',
            gateway_reference='pawapay-ref-123',
            invoice_number='INV-001',
            customer_name='Test Customer',
            customer_email='customer@example.com',
            customer_phone='255712345678',
            payment_link='https://pay.example.com/123',
            paid_at=timezone.now()
        )
        
        self.assertEqual(transaction.gateway_reference, 'pawapay-ref-123')
        self.assertEqual(transaction.customer_name, 'Test Customer')
        self.assertEqual(transaction.amount, Decimal('25000'))


# ============================================================
# RUN TESTS
# ============================================================

if __name__ == '__main__':
    import unittest
    unittest.main()
