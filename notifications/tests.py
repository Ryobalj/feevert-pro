"""Tests for the parts of the mail page that can silently do nothing:
selecting several messages at once, and knowing what became of a message
we sent.
"""

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import EmailAccount, IncomingEmail, OutgoingEmail
from .services import outgoing_mail

User = get_user_model()


def make_email(account, subject='Hello', read=False, folder='inbox'):
    return IncomingEmail.objects.create(
        account=account, sender='client@example.com', subject=subject,
        message_id=f'msg-{subject}-{timezone.now().timestamp()}',
        received_at=timezone.now(), is_read=read, folder=folder,
    )


class BulkMarkTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='staff', email='staff@feevert.co.tz', password='x')
        self.shared = EmailAccount.objects.create(
            email_address='info@feevert.co.tz', is_shared=True, is_active=True)
        self.api = APIClient()
        self.api.force_authenticate(self.user)

    def test_marks_only_the_ticked_messages(self):
        a, b, c = (make_email(self.shared, s) for s in ('a', 'b', 'c'))
        res = self.api.post('/api/v1/email-inbox/bulk/',
                            {'action': 'read', 'ids': [str(a.id), str(b.id)]},
                            format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['updated'], 2)
        self.assertTrue(IncomingEmail.objects.get(pk=a.pk).is_read)
        self.assertTrue(IncomingEmail.objects.get(pk=b.pk).is_read)
        self.assertFalse(IncomingEmail.objects.get(pk=c.pk).is_read)

    def test_select_all_respects_the_current_folder(self):
        """"All" means the list you're looking at — ticking select-all in Spam
        must not mark the Inbox read."""
        inbox = make_email(self.shared, 'in-inbox', folder='inbox')
        spam = make_email(self.shared, 'in-spam', folder='spam')
        res = self.api.post('/api/v1/email-inbox/bulk/?folder=spam',
                            {'action': 'read', 'all': True}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['updated'], 1)
        self.assertTrue(IncomingEmail.objects.get(pk=spam.pk).is_read)
        self.assertFalse(IncomingEmail.objects.get(pk=inbox.pk).is_read)

    def test_unread_and_archive(self):
        e = make_email(self.shared, 'z', read=True)
        self.api.post('/api/v1/email-inbox/bulk/',
                      {'action': 'unread', 'ids': [str(e.id)]}, format='json')
        self.assertFalse(IncomingEmail.objects.get(pk=e.pk).is_read)
        self.api.post('/api/v1/email-inbox/bulk/',
                      {'action': 'archive', 'ids': [str(e.id)]}, format='json')
        self.assertTrue(IncomingEmail.objects.get(pk=e.pk).is_archived)

    def test_rejects_an_unknown_action(self):
        e = make_email(self.shared)
        res = self.api.post('/api/v1/email-inbox/bulk/',
                            {'action': 'delete', 'ids': [str(e.id)]}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_cannot_touch_another_persons_mailbox(self):
        other = User.objects.create_user(username='other', email='o@feevert.co.tz', password='x')
        private = EmailAccount.objects.create(
            email_address='accounts@feevert.co.tz', owner_user=other, is_active=True)
        theirs = make_email(private, 'private')
        res = self.api.post('/api/v1/email-inbox/bulk/',
                            {'action': 'read', 'ids': [str(theirs.id)]}, format='json')
        self.assertEqual(res.data['updated'], 0)
        self.assertFalse(IncomingEmail.objects.get(pk=theirs.pk).is_read)


class OutgoingMailTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='sender', email='sender@feevert.co.tz', password='x')
        self.account = EmailAccount.objects.create(
            email_address='info@feevert.co.tz', is_shared=True, is_active=True)

    def test_a_successful_send_is_recorded(self):
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': True}):
            out = outgoing_mail.send_now(
                to_email='client@example.com', subject='Tender',
                body='Please find attached', account=self.account, user=self.user)
        self.assertEqual(out.status, 'sent')
        self.assertEqual(out.attempts, 1)
        self.assertIsNotNone(out.sent_at)

    def test_a_refused_send_is_kept_and_scheduled(self):
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account',
                   return_value={'success': False, 'error': '553 not allowed to relay'}):
            out = outgoing_mail.send_now(
                to_email='client@example.com', subject='Tender', body='body',
                account=self.account, user=self.user)
        self.assertEqual(out.status, 'failed')
        self.assertIn('553', out.last_error)
        self.assertIsNotNone(out.next_retry_at)
        self.assertTrue(out.can_retry)

    def test_retry_sends_it_and_stops_after_the_limit(self):
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': False, 'error': 'down'}):
            out = outgoing_mail.send_now(
                to_email='c@example.com', subject='S', body='b',
                account=self.account, user=self.user)
            for _ in range(OutgoingEmail.MAX_ATTEMPTS):
                out.next_retry_at = timezone.now()
                out.save(update_fields=['next_retry_at'])
                outgoing_mail.retry_pending()
                out.refresh_from_db()
        self.assertEqual(out.status, 'gave_up')
        self.assertEqual(out.attempts, OutgoingEmail.MAX_ATTEMPTS)
        # Once it has given up the cron leaves it alone — no infinite loop.
        self.assertEqual(outgoing_mail.retry_pending()['tried'], 0)

    def test_retry_pending_sends_what_it_can(self):
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': False, 'error': 'down'}):
            out = outgoing_mail.send_now(
                to_email='c@example.com', subject='S', body='b',
                account=self.account, user=self.user)
        out.next_retry_at = timezone.now()
        out.save(update_fields=['next_retry_at'])
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': True}):
            result = outgoing_mail.retry_pending()
        out.refresh_from_db()
        self.assertEqual(result['sent'], 1)
        self.assertEqual(out.status, 'sent')

    def test_the_tracking_pixel_marks_it_opened(self):
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': True}):
            out = outgoing_mail.send_now(
                to_email='c@example.com', subject='S', body='b',
                account=self.account, user=self.user)
        # Backdate the send: an open in the first seconds is our own copy.
        OutgoingEmail.objects.filter(pk=out.pk).update(
            sent_at=timezone.now() - timezone.timedelta(minutes=1))
        url = reverse('track-email-open', args=[out.tracking_id])
        res = self.client.get(url)
        out.refresh_from_db()
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'image/gif')
        self.assertEqual(out.status, 'opened')
        self.assertEqual(out.open_count, 1)
        self.assertIsNotNone(out.opened_at)

    def test_an_unknown_tracking_id_still_returns_a_pixel(self):
        """A probe must not be able to tell a real id from a made-up one."""
        import uuid
        res = self.client.get(reverse('track-email-open', args=[uuid.uuid4()]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'image/gif')

    def test_the_pixel_rides_in_the_html_only(self):
        out = outgoing_mail.queue(
            to_email='c@example.com', subject='S', body='plain text body',
            account=self.account, user=self.user)
        html = outgoing_mail._with_pixel(out)
        self.assertIn(str(out.tracking_id), html)
        self.assertIn('plain text body', html)
        self.assertEqual(out.body, 'plain text body')   # the text part is untouched

    def test_the_sender_sees_their_own_sends(self):
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': True}):
            outgoing_mail.send_now(to_email='c@example.com', subject='S', body='b',
                                   account=self.account, user=self.user)
        api = APIClient()
        api.force_authenticate(self.user)
        res = api.get('/api/v1/sent-mail/')
        self.assertEqual(res.status_code, 200)
        rows = res.data.get('results', res.data)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['status'], 'sent')

    def test_stats_counts_by_status(self):
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': True}):
            outgoing_mail.send_now(to_email='c@example.com', subject='ok', body='b',
                                   account=self.account, user=self.user)
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': False, 'error': 'no'}):
            outgoing_mail.send_now(to_email='c@example.com', subject='bad', body='b',
                                   account=self.account, user=self.user)
        api = APIClient()
        api.force_authenticate(self.user)
        res = api.get('/api/v1/sent-mail/stats/')
        self.assertEqual(res.data['sent'], 1)
        self.assertEqual(res.data['failed'], 1)
