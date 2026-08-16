"""The request form is the front door: if it refuses a client, we lose the job."""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from .models import ConsultationCategory
from .serializers import ConsultationRequestCreateSerializer


class RequestDateTests(TestCase):
    def setUp(self):
        self.category = ConsultationCategory.objects.create(
            name='Environmental Impact Assessment', slug='eia', is_active=True)

    def _valid(self, when):
        s = ConsultationRequestCreateSerializer(data={
            'category': str(self.category.id), 'preferred_date': when, 'message': 'hello',
        })
        ok = s.is_valid()
        return ok, s.errors

    def test_today_is_accepted(self):
        """The server runs in UTC and a date field arrives as midnight, so
        comparing against `now()` rejected every request made today — the
        client was told their own date was in the past."""
        ok, errors = self._valid(timezone.localdate().isoformat())
        self.assertTrue(ok, errors)

    def test_tomorrow_is_accepted(self):
        ok, errors = self._valid((timezone.localdate() + timedelta(days=1)).isoformat())
        self.assertTrue(ok, errors)

    def test_yesterday_is_refused(self):
        ok, errors = self._valid((timezone.localdate() - timedelta(days=1)).isoformat())
        self.assertFalse(ok)
        self.assertIn('preferred_date', errors)

    def test_a_time_later_today_is_accepted(self):
        later = timezone.localtime(timezone.now()) + timedelta(hours=2)
        ok, errors = self._valid(later.isoformat())
        self.assertTrue(ok, errors)

    def test_a_service_must_be_chosen(self):
        s = ConsultationRequestCreateSerializer(data={
            'preferred_date': timezone.localdate().isoformat(), 'message': 'hello',
        })
        self.assertFalse(s.is_valid())


class AssignmentTests(TestCase):
    """Who hears about a new request, and who can pick it up."""

    def setUp(self):
        from django.contrib.auth import get_user_model
        from accounts.models import Role
        from notifications.models import Notification

        User = get_user_model()
        self.admin = User.objects.create_user(
            username='masero', email='m@feevert.co.tz', password='x',
            role=Role.objects.create(name='admin'))
        self.consultant = User.objects.create_user(
            username='essau', email='e@feevert.co.tz', password='x',
            role=Role.objects.create(name='consultant'))
        # An employee: does the work when handed it, does not hand it out —
        # and, importantly, `is_staff` is set, which is what used to decide.
        self.employee = User.objects.create_user(
            username='nicole', email='n@feevert.co.tz', password='x', is_staff=True,
            role=Role.objects.create(name='Normal Employee'))
        self.client_user = User.objects.create_user(
            username='mteja', email='c@example.com', password='x',
            role=Role.objects.create(name='Client'))
        self.category = ConsultationCategory.objects.create(
            name='Environmental Impact Assessment', slug='eia2', is_active=True)
        Notification.objects.all().delete()

    def _make_request(self):
        from .models import ConsultationRequest
        return ConsultationRequest.objects.create(
            client=self.client_user, category=self.category,
            preferred_date=timezone.now() + timedelta(days=1), message='please help',
        )

    def test_admins_and_consultants_are_told_employees_are_not(self):
        from notifications.models import Notification

        self._make_request()
        told = set(Notification.objects.filter(
            title='New Consultation Request').values_list('recipient__username', flat=True))
        self.assertEqual(told, {'masero', 'essau'})

    def test_the_notice_names_the_service_that_was_asked_for(self):
        from notifications.models import Notification

        self._make_request()
        note = Notification.objects.filter(title='New Consultation Request').first()
        self.assertIn('Environmental Impact Assessment', note.message)

    def test_assigning_confirms_the_request_and_tells_both_sides(self):
        from rest_framework.test import APIClient
        from notifications.models import Notification

        job = self._make_request()
        api = APIClient()
        api.force_authenticate(self.admin)
        Notification.objects.all().delete()

        res = api.post(f'/api/v1/consultation-requests/{job.id}/assign/',
                       {'consultant_id': self.employee.id}, format='json')
        self.assertEqual(res.status_code, 200, res.data)

        job.refresh_from_db()
        self.assertEqual(job.assigned_to, self.employee)
        self.assertEqual(job.status, 'confirmed')
        self.assertTrue(Notification.objects.filter(recipient=self.employee).exists())
        self.assertTrue(Notification.objects.filter(recipient=self.client_user).exists())

    def test_a_client_cannot_assign_work_to_anyone(self):
        from rest_framework.test import APIClient

        job = self._make_request()
        api = APIClient()
        api.force_authenticate(self.client_user)
        res = api.post(f'/api/v1/consultation-requests/{job.id}/assign/',
                       {'consultant_id': self.employee.id}, format='json')
        self.assertIn(res.status_code, (403, 404))
        job.refresh_from_db()
        self.assertIsNone(job.assigned_to)

    def test_a_client_cannot_move_their_own_job_to_delivered(self):
        """The tempting one: mark it delivered and the deliverables open up."""
        from rest_framework.test import APIClient

        job = self._make_request()
        api = APIClient()
        api.force_authenticate(self.client_user)
        res = api.post(f'/api/v1/consultation-requests/{job.id}/update_status/',
                       {'status': 'delivered'}, format='json')
        self.assertEqual(res.status_code, 403)
        job.refresh_from_db()
        self.assertEqual(job.status, 'pending')

    def test_a_client_may_call_off_their_own_request(self):
        from rest_framework.test import APIClient

        job = self._make_request()
        api = APIClient()
        api.force_authenticate(self.client_user)
        res = api.post(f'/api/v1/consultation-requests/{job.id}/update_status/',
                       {'status': 'cancelled'}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        job.refresh_from_db()
        self.assertEqual(job.status, 'cancelled')

    def test_an_employee_cannot_assign_but_staff_can_progress_a_job(self):
        from rest_framework.test import APIClient

        job = self._make_request()
        api = APIClient()
        api.force_authenticate(self.employee)

        refused = api.post(f'/api/v1/consultation-requests/{job.id}/assign/',
                           {'consultant_id': self.employee.id}, format='json')
        self.assertEqual(refused.status_code, 403)

        allowed = api.post(f'/api/v1/consultation-requests/{job.id}/update_status/',
                           {'status': 'in_progress'}, format='json')
        self.assertEqual(allowed.status_code, 200, allowed.data)


class WorkflowTests(TestCase):
    """The round trip: assigned, worked, submitted, checked, delivered."""

    def setUp(self):
        from django.contrib.auth import get_user_model
        from accounts.models import Role
        from notifications.models import Notification

        User = get_user_model()
        self.admin = User.objects.create_user(
            username='boss', email='b@feevert.co.tz', password='x',
            role=Role.objects.create(name='admin'))
        self.worker = User.objects.create_user(
            username='worker', email='w@feevert.co.tz', password='x',
            role=Role.objects.create(name='Normal Employee'))
        self.client_user = User.objects.create_user(
            username='client2', email='c2@example.com', password='x',
            role=Role.objects.create(name='Client'))
        self.category = ConsultationCategory.objects.create(
            name='Risk Assessment', slug='risk-assessment-2', is_active=True)

        from .models import ConsultationRequest
        self.job = ConsultationRequest.objects.create(
            client=self.client_user, category=self.category,
            preferred_date=timezone.now() + timedelta(days=3),
            message='Assess our workshop', assigned_to=self.worker, status='confirmed',
        )
        Notification.objects.all().delete()

    def _api(self, who):
        from rest_framework.test import APIClient
        api = APIClient()
        api.force_authenticate(who)
        return api

    def test_progress_moves_the_job_into_in_progress(self):
        res = self._api(self.worker).post(
            f'/api/v1/consultation-requests/{self.job.id}/progress/',
            {'progress': 40}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.job.refresh_from_db()
        self.assertEqual(self.job.progress, 40)
        self.assertEqual(self.job.status, 'in_progress')

    def test_the_worker_submits_and_the_reviewers_hear_about_it(self):
        from notifications.models import Notification

        res = self._api(self.worker).post(
            f'/api/v1/consultation-requests/{self.job.id}/submit/')
        self.assertEqual(res.status_code, 200, res.data)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, 'submitted')
        self.assertIsNotNone(self.job.submitted_at)
        self.assertTrue(Notification.objects.filter(
            recipient=self.admin, title='Work submitted for review').exists())

    def test_sending_it_back_says_why_and_the_worker_is_told(self):
        from notifications.models import Notification

        self._api(self.worker).post(f'/api/v1/consultation-requests/{self.job.id}/submit/')
        Notification.objects.all().delete()

        res = self._api(self.admin).post(
            f'/api/v1/consultation-requests/{self.job.id}/review/',
            {'approve': False, 'notes': 'Add the noise readings'}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, 'returned')
        self.assertEqual(self.job.review_notes, 'Add the noise readings')
        note = Notification.objects.get(recipient=self.worker)
        self.assertIn('Add the noise readings', note.message)

    def test_approval_completes_it_at_100_percent(self):
        self._api(self.worker).post(f'/api/v1/consultation-requests/{self.job.id}/submit/')
        self._api(self.admin).post(f'/api/v1/consultation-requests/{self.job.id}/review/',
                                   {'approve': True}, format='json')
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, 'completed')
        self.assertEqual(self.job.progress, 100)
        self.assertIsNotNone(self.job.completed_at)

    def test_an_employee_cannot_approve_their_own_work(self):
        self._api(self.worker).post(f'/api/v1/consultation-requests/{self.job.id}/submit/')
        res = self._api(self.worker).post(
            f'/api/v1/consultation-requests/{self.job.id}/review/',
            {'approve': True}, format='json')
        self.assertEqual(res.status_code, 403)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, 'submitted')

    def test_the_client_never_sees_the_working_notes(self):
        from core.models import WorkNote

        WorkNote.objects.create(job=self.job, author=self.worker,
                                body='Client was difficult about access')
        rows = self._api(self.client_user).get('/api/v1/work-notes/').data
        self.assertEqual(len(rows.get('results', rows)), 0)
