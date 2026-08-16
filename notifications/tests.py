"""Tests for the parts of the mail page that can silently do nothing:
selecting several messages at once, and knowing what became of a message
we sent.
"""

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
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


class OutgoingAttachmentTests(TestCase):
    """A file reaches a client when it is emailed to them — so the reply has
    to be able to carry one, and a retry has to still have it."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='staff', email='staff@feevert.co.tz', password='x')
        self.account = EmailAccount.objects.create(
            email_address='info@feevert.co.tz', is_shared=True, is_active=True)
        self.email = make_email(self.account, 'Please send the report')
        self.api = APIClient()
        self.api.force_authenticate(self.user)
        # Creating a user sends a welcome email; start counting from here.
        from django.core import mail
        mail.outbox.clear()

    def _file(self, name='report.pdf', body=b'%PDF-1.4 report'):
        from django.core.files.uploadedfile import SimpleUploadedFile
        return SimpleUploadedFile(name, body, content_type='application/pdf')

    def test_a_reply_can_carry_a_document(self):
        sent = {}

        def fake_send(**kwargs):
            sent.update(kwargs)
            return {'success': True}

        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', side_effect=fake_send):
            res = self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/',
                                {'body': 'Here it is', 'attachments': self._file()},
                                format='multipart')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(len(sent['attachments']), 1)
        name, content, content_type = sent['attachments'][0]
        self.assertEqual(name, 'report.pdf')
        self.assertEqual(content, b'%PDF-1.4 report')
        self.assertEqual(content_type, 'application/pdf')

    def test_the_file_survives_for_the_retry(self):
        """The upload object is long gone by the time the cron retries."""
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': False, 'error': 'down'}):
            self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/',
                          {'body': 'Here it is', 'attachments': self._file()},
                          format='multipart')

        out = OutgoingEmail.objects.get()
        self.assertEqual(out.status, 'failed')
        self.assertEqual(len(out.attachments), 1)

        sent = {}

        def fake_send(**kwargs):
            sent.update(kwargs)
            return {'success': True}

        out.next_retry_at = timezone.now()
        out.save(update_fields=['next_retry_at'])
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', side_effect=fake_send):
            outgoing_mail.retry_pending()

        out.refresh_from_db()
        self.assertEqual(out.status, 'sent')
        self.assertEqual(sent['attachments'][0][1], b'%PDF-1.4 report')

    def test_several_files_at_once(self):
        sent = {}
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account',
                   side_effect=lambda **kw: (sent.update(kw), {'success': True})[1]):
            self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/', {
                'body': 'Both attached',
                'attachments': [self._file('a.pdf'), self._file('b.pdf', b'second')],
            }, format='multipart')
        self.assertEqual([a[0] for a in sent['attachments']], ['a.pdf', 'b.pdf'])

    def test_a_plain_reply_still_works(self):
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': True}):
            res = self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/',
                                {'body': 'No attachment here'}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(OutgoingEmail.objects.get().attachments, [])


class JobFileAttachmentTests(TestCase):
    """Sending a file that is already on the job — without going to find it
    on a laptop again."""

    def setUp(self):
        from accounts.models import Role
        from consultations.models import ConsultationRequest, ConsultationDocument
        from django.core.files.uploadedfile import SimpleUploadedFile

        staff_role = Role.objects.create(name='Normal Employee')
        client_role = Role.objects.create(name='Client')
        self.staff = User.objects.create_user(
            username='staff', email='staff@feevert.co.tz', password='x', role=staff_role)
        self.client_user = User.objects.create_user(
            username='client', email='c@example.com', password='x', role=client_role)

        self.account = EmailAccount.objects.create(
            email_address='info@feevert.co.tz', is_shared=True, is_active=True)
        self.email = make_email(self.account, 'Send me the report')

        self.job = ConsultationRequest.objects.create(
            client=self.client_user, preferred_date=timezone.now(),
            message='Water study',
        )
        self.doc = ConsultationDocument.objects.create(
            request=self.job, title='Water study final.pdf',
            file=SimpleUploadedFile('final.pdf', b'%PDF the study', content_type='application/pdf'),
            uploaded_by=self.staff, is_deliverable=False,
        )
        self.api = APIClient()
        self.api.force_authenticate(self.staff)

    def test_a_job_file_can_be_sent_without_re_uploading_it(self):
        sent = {}
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account',
                   side_effect=lambda **kw: (sent.update(kw), {'success': True})[1]):
            res = self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/',
                                {'body': 'Attached', 'document_ids': [str(self.doc.id)]},
                                format='multipart')
        self.assertEqual(res.status_code, 200, res.data)
        name, content, content_type = sent['attachments'][0]
        self.assertEqual(name, 'Water study final.pdf')
        self.assertEqual(content, b'%PDF the study')
        self.assertEqual(content_type, 'application/pdf')

    def test_the_file_is_not_copied_just_pointed_at(self):
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account', return_value={'success': True}):
            self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/',
                          {'body': 'Attached', 'document_ids': [str(self.doc.id)]},
                          format='multipart')
        stored = OutgoingEmail.objects.get().attachments[0]
        self.assertEqual(stored['path'], self.doc.file.name)

    def test_a_client_cannot_attach_someone_elses_job_file(self):
        from consultations.models import ConsultationRequest, ConsultationDocument
        from django.core.files.uploadedfile import SimpleUploadedFile

        other_client = User.objects.create_user(
            username='other', email='o@example.com', password='x',
            role=self.client_user.role)
        other_job = ConsultationRequest.objects.create(
            client=other_client, preferred_date=timezone.now(), message='Private',
        )
        theirs = ConsultationDocument.objects.create(
            request=other_job, title='Private.pdf',
            file=SimpleUploadedFile('p.pdf', b'secret', content_type='application/pdf'),
        )

        from notifications.services.outgoing_mail import _job_documents
        self.assertEqual(_job_documents([str(theirs.id)], self.client_user), [])
        # ...while staff, who work the jobs, may attach it.
        self.assertEqual(len(_job_documents([str(theirs.id)], self.staff)), 1)

    def test_uploaded_and_job_files_can_go_together(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        sent = {}
        with patch('notifications.services.email_outbound_service.EmailOutboundService'
                   '.send_via_account',
                   side_effect=lambda **kw: (sent.update(kw), {'success': True})[1]):
            self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/', {
                'body': 'Both',
                'attachments': SimpleUploadedFile('note.txt', b'note', content_type='text/plain'),
                'document_ids': [str(self.doc.id)],
            }, format='multipart')
        self.assertEqual([a[0] for a in sent['attachments']],
                         ['note.txt', 'Water study final.pdf'])


@override_settings(DEFAULT_FILE_STORAGE='django.core.files.storage.FileSystemStorage',
                   EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class AttachmentEndToEndTests(TestCase):
    """The whole path a file takes: multipart upload -> storage -> the message
    that actually leaves. Mocking the sender proved the plumbing but not that
    the bytes arrive, and 'attachments don't go' is exactly that gap."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='staff', email='staff@feevert.co.tz', password='x')
        self.account = EmailAccount.objects.create(
            email_address='info@feevert.co.tz', is_shared=True, is_active=True)
        self.email = make_email(self.account, 'Please send the report')
        self.api = APIClient()
        self.api.force_authenticate(self.user)
        # Creating a user sends a welcome email — start counting from here, or
        # every assertion about "the message that went out" is off by one.
        from django.core import mail
        mail.outbox.clear()

    def test_the_file_reaches_the_outgoing_message(self):
        from django.core import mail
        from django.core.files.uploadedfile import SimpleUploadedFile

        res = self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/', {
            'body': 'Here is the report',
            'attachments': SimpleUploadedFile('report.pdf', b'%PDF-1.4 real bytes',
                                              content_type='application/pdf'),
        }, format='multipart')

        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(len(sent.attachments), 1, 'the file never made it onto the message')
        name, content, content_type = sent.attachments[0]
        self.assertEqual(name, 'report.pdf')
        self.assertEqual(content, b'%PDF-1.4 real bytes')
        self.assertEqual(content_type, 'application/pdf')

    def test_a_storage_failure_stops_the_send_and_says_so(self):
        """The old behaviour was the dangerous one: the file was dropped, the
        mail went anyway, and the sender was told it had been sent."""
        from django.core import mail

        from django.core.files.uploadedfile import SimpleUploadedFile

        with patch('django.core.files.storage.FileSystemStorage.save',
                   side_effect=OSError('disk is full')):
            res = self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/', {
                'body': 'Here it is',
                'attachments': SimpleUploadedFile('report.pdf', b'x', content_type='application/pdf'),
            }, format='multipart')

        self.assertEqual(res.status_code, 400)
        self.assertIn('report.pdf', res.data['error'])
        self.assertEqual(len(mail.outbox), 0, 'a message went out without its attachment')
        self.assertFalse(OutgoingEmail.objects.exists())

    def test_a_message_with_no_attachment_still_sends(self):
        from django.core import mail

        res = self.api.post(f'/api/v1/email-inbox/{self.email.id}/reply/',
                            {'body': 'No file needed'}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(len(mail.outbox[0].attachments), 0)
