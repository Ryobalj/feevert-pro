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


class ReplyAsTests(TestCase):
    """Who may answer as which address. A shared mailbox carries several
    people's aliases, so this is a privacy boundary, not a convenience."""

    def setUp(self):
        self.nicole = User.objects.create_user(
            username='nicole', email='nicole.abbas@feevert.co.tz', password='x')
        self.prisila = User.objects.create_user(
            username='prisila', email='accounts@feevert.co.tz', password='x')
        self.shared = EmailAccount.objects.create(
            email_address='info@feevert.co.tz', is_shared=True, is_active=True,
            aliases=['nicole.abbas@feevert.co.tz', 'saidina@feevert.co.tz'])
        self.personal = EmailAccount.objects.create(
            email_address='accounts@feevert.co.tz', owner_user=self.prisila, is_active=True,
            aliases=['prisila.neema@feevert.co.tz', 'finance@feevert.co.tz'])

    def _options(self, user):
        api = APIClient()
        api.force_authenticate(user)
        return api.get('/api/v1/email-inbox/mailboxes/').data['from_options']

    def test_a_team_member_gets_the_shared_address_and_their_own(self):
        options = self._options(self.nicole)
        self.assertIn('info@feevert.co.tz', options)
        self.assertIn('nicole.abbas@feevert.co.tz', options)

    def test_a_colleagues_alias_on_the_shared_mailbox_is_not_offered(self):
        self.assertNotIn('saidina@feevert.co.tz', self._options(self.nicole))

    def test_the_owner_of_a_mailbox_gets_all_of_its_aliases(self):
        options = self._options(self.prisila)
        for addr in ('accounts@feevert.co.tz', 'prisila.neema@feevert.co.tz',
                     'finance@feevert.co.tz'):
            self.assertIn(addr, options)

    def test_a_personal_mailbox_is_not_offered_to_others(self):
        options = self._options(self.nicole)
        self.assertNotIn('accounts@feevert.co.tz', options)
        self.assertNotIn('prisila.neema@feevert.co.tz', options)

    def test_own_work_address_is_offered_even_before_it_is_recorded(self):
        """Nicole could not answer as herself because nobody had written her
        alias down yet — the address is hers either way."""
        self.shared.aliases = []
        self.shared.save(update_fields=['aliases'])
        self.assertIn('nicole.abbas@feevert.co.tz', self._options(self.nicole))

    def test_an_outside_address_is_never_offered(self):
        outsider = User.objects.create_user(
            username='gmail', email='someone@gmail.com', password='x')
        self.assertNotIn('someone@gmail.com', self._options(outsider))


class SharedMailboxPrivacyTests(TestCase):
    """info@ is read by the whole team, but a message addressed to one of them
    by name is theirs. This is the rule the directors asked for."""

    def setUp(self):
        self.saidina = User.objects.create_user(
            username='saidina', email='saidina@feevert.co.tz', password='x')
        self.nicole = User.objects.create_user(
            username='nicole', email='nicole.abbas@feevert.co.tz', password='x')
        self.shared = EmailAccount.objects.create(
            email_address='info@feevert.co.tz', is_shared=True, is_active=True)

    def _mail(self, subject, recipient):
        return IncomingEmail.objects.create(
            account=self.shared, sender='client@example.com', subject=subject,
            recipient=recipient, message_id=f'id-{subject}',
            received_at=timezone.now(), folder='inbox',
        )

    def _subjects_for(self, user):
        api = APIClient()
        api.force_authenticate(user)
        rows = api.get('/api/v1/email-inbox/?page_size=100').data
        return {r['subject'] for r in rows.get('results', rows)}

    def test_mail_addressed_to_saidina_is_his_alone(self):
        self._mail('For Saidina', 'saidina@feevert.co.tz')
        self.assertIn('For Saidina', self._subjects_for(self.saidina))
        self.assertNotIn('For Saidina', self._subjects_for(self.nicole))

    def test_mail_to_the_team_address_is_everyones(self):
        self._mail('For the team', 'info@feevert.co.tz')
        self.assertIn('For the team', self._subjects_for(self.saidina))
        self.assertIn('For the team', self._subjects_for(self.nicole))

    def test_a_message_naming_him_in_a_longer_header_is_still_his(self):
        """Real headers arrive as 'Info <info@…>, Saidina <saidina@…>'."""
        self._mail('Cc test', 'info@feevert.co.tz, saidina@feevert.co.tz')
        self.assertIn('Cc test', self._subjects_for(self.saidina))
        self.assertNotIn('Cc test', self._subjects_for(self.nicole))

    def test_mail_with_no_recipient_header_stays_with_the_team(self):
        """Nothing says who it was for, so nobody can claim it — it belongs to
        whoever reads the shared box."""
        self._mail('Unaddressed', '')
        self.assertIn('Unaddressed', self._subjects_for(self.saidina))
        self.assertIn('Unaddressed', self._subjects_for(self.nicole))
