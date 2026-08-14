"""Tests for the workspace calendar: appointments people add themselves, and
the reminders that make them worth adding."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from notifications.models import Notification

from .models import CalendarEvent
from .workspace_api import send_due_reminders

User = get_user_model()


class CalendarEventTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='o@feevert.co.tz', password='x')
        self.mate = User.objects.create_user(username='mate', email='m@feevert.co.tz', password='x')
        self.other = User.objects.create_user(username='other', email='x@feevert.co.tz', password='x')
        self.api = APIClient()
        self.api.force_authenticate(self.owner)

    def _make(self, **kw):
        kw.setdefault('title', 'Site visit')
        kw.setdefault('starts_at', timezone.now() + timedelta(days=1))
        kw.setdefault('owner', self.owner)
        return CalendarEvent.objects.create(**kw)

    def test_creating_an_appointment_from_a_clicked_day(self):
        when = (timezone.now() + timedelta(days=2)).replace(microsecond=0)
        res = self.api.post('/api/v1/calendar-events/', {
            'title': 'Tender committee',
            'starts_at': when.isoformat(),
            'location': 'Head office',
            'remind_minutes': 30,
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        event = CalendarEvent.objects.get()
        self.assertEqual(event.owner, self.owner)
        self.assertEqual(event.location, 'Head office')

    def test_invitees_are_told_and_see_it_on_their_own_calendar(self):
        res = self.api.post('/api/v1/calendar-events/', {
            'title': 'Kickoff',
            'starts_at': (timezone.now() + timedelta(days=1)).isoformat(),
            'attendees': [self.mate.id],
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(Notification.objects.filter(
            recipient=self.mate, title__startswith='Invitation').exists())

        mate_api = APIClient()
        mate_api.force_authenticate(self.mate)
        rows = mate_api.get('/api/v1/calendar-events/').data
        self.assertEqual(len(rows.get('results', rows)), 1)

    def test_someone_elses_appointment_is_not_visible(self):
        self._make(owner=self.other, title='Private')
        rows = self.api.get('/api/v1/calendar-events/').data
        self.assertEqual(len(rows.get('results', rows)), 0)

    def test_only_the_owner_can_delete(self):
        event = self._make(owner=self.other)
        event.attendees.add(self.owner)          # invited, not the owner
        res = self.api.delete(f'/api/v1/calendar-events/{event.id}/')
        self.assertEqual(res.status_code, 403)
        self.assertTrue(CalendarEvent.objects.filter(pk=event.pk).exists())

    def test_the_month_filter_leaves_other_months_alone(self):
        self._make(starts_at=timezone.now() + timedelta(days=60), title='Far off')
        soon = self._make(starts_at=timezone.now() + timedelta(days=1), title='Soon')
        start = (timezone.now() - timedelta(days=1)).isoformat()
        end = (timezone.now() + timedelta(days=7)).isoformat()
        rows = self.api.get(f'/api/v1/calendar-events/?from={start}&to={end}').data
        rows = rows.get('results', rows)
        self.assertEqual([r['title'] for r in rows], [soon.title])


class ReminderTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='o@feevert.co.tz', password='x')
        self.mate = User.objects.create_user(username='mate', email='m@feevert.co.tz', password='x')

    def test_a_reminder_goes_out_once_the_window_opens(self):
        event = CalendarEvent.objects.create(
            owner=self.owner, title='Client call',
            starts_at=timezone.now() + timedelta(minutes=20), remind_minutes=30)
        event.attendees.add(self.mate)

        self.assertEqual(send_due_reminders(), 1)
        reminders = Notification.objects.filter(title__startswith='Coming up')
        self.assertEqual(reminders.filter(recipient=self.owner).count(), 1)
        self.assertEqual(reminders.filter(recipient=self.mate).count(), 1)

        # The cron runs every couple of minutes; it must not keep re-sending.
        self.assertEqual(send_due_reminders(), 0)
        self.assertEqual(reminders.count(), 2)

    def test_nothing_is_sent_before_the_window(self):
        CalendarEvent.objects.create(
            owner=self.owner, title='Next week',
            starts_at=timezone.now() + timedelta(days=7), remind_minutes=30)
        self.assertEqual(send_due_reminders(), 0)
        self.assertFalse(Notification.objects.filter(title__startswith='Coming up').exists())

    def test_no_reminder_when_it_was_turned_off(self):
        CalendarEvent.objects.create(
            owner=self.owner, title='Quiet one',
            starts_at=timezone.now() + timedelta(minutes=5), remind_minutes=0)
        self.assertEqual(send_due_reminders(), 0)

    def test_moving_an_appointment_lets_it_remind_again(self):
        api = APIClient()
        api.force_authenticate(self.owner)
        event = CalendarEvent.objects.create(
            owner=self.owner, title='Moved',
            starts_at=timezone.now() + timedelta(minutes=20), remind_minutes=30)
        send_due_reminders()
        event.refresh_from_db()
        self.assertIsNotNone(event.reminded_at)

        api.patch(f'/api/v1/calendar-events/{event.id}/',
                  {'starts_at': (timezone.now() + timedelta(days=3)).isoformat()}, format='json')
        event.refresh_from_db()
        self.assertIsNone(event.reminded_at)


class DraftSharingTests(TestCase):
    """A draft is private. Sharing means naming people — and only they see it."""

    def setUp(self):
        # An account with no role isn't staff (see accounts.roles), and the
        # colleague list is staff-only — so give them the role they'd have.
        from accounts.models import Role
        staff = Role.objects.create(name='Normal Employee')
        self.owner = User.objects.create_user(
            username='writer', email='w@feevert.co.tz', password='x', role=staff)
        self.mate = User.objects.create_user(
            username='mate', email='m@feevert.co.tz', password='x', role=staff)
        self.stranger = User.objects.create_user(
            username='stranger', email='s@feevert.co.tz', password='x', role=staff)
        self.api = APIClient()
        self.api.force_authenticate(self.owner)

    def _titles_for(self, user):
        api = APIClient()
        api.force_authenticate(user)
        rows = api.get('/api/v1/work-documents/').data
        return {r['title'] for r in rows.get('results', rows)}

    def _new(self, title='Quote', shared=()):
        res = self.api.post('/api/v1/work-documents/',
                            {'title': title, 'kind': 'doc',
                             'shared_with': [u.id for u in shared]}, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        return res.data

    def test_a_new_draft_is_private(self):
        self._new('Half-written quote')
        self.assertIn('Half-written quote', self._titles_for(self.owner))
        self.assertNotIn('Half-written quote', self._titles_for(self.mate))
        self.assertNotIn('Half-written quote', self._titles_for(self.stranger))

    def test_only_the_named_colleague_sees_it(self):
        self._new('Tender draft', shared=[self.mate])
        self.assertIn('Tender draft', self._titles_for(self.mate))
        self.assertNotIn('Tender draft', self._titles_for(self.stranger))

    def test_the_person_named_is_told(self):
        self._new('Report', shared=[self.mate])
        self.assertTrue(Notification.objects.filter(
            recipient=self.mate, title__icontains='Report').exists())

    def test_sharing_later_works_the_same_way(self):
        doc = self._new('Later')
        self.assertNotIn('Later', self._titles_for(self.mate))
        self.api.patch(f"/api/v1/work-documents/{doc['id']}/",
                       {'shared_with': [self.mate.id]}, format='json')
        self.assertIn('Later', self._titles_for(self.mate))

    def test_unsharing_takes_it_back(self):
        doc = self._new('Recalled', shared=[self.mate])
        self.api.patch(f"/api/v1/work-documents/{doc['id']}/",
                       {'shared_with': []}, format='json')
        self.assertNotIn('Recalled', self._titles_for(self.mate))

    def test_a_named_colleague_reads_but_cannot_edit(self):
        doc = self._new('Read only', shared=[self.mate])
        mate_api = APIClient()
        mate_api.force_authenticate(self.mate)
        res = mate_api.patch(f"/api/v1/work-documents/{doc['id']}/",
                             {'title': 'Rewritten'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(self._titles_for(self.owner), {'Read only'})

    def test_a_named_colleague_cannot_delete_it(self):
        doc = self._new('Keep', shared=[self.mate])
        mate_api = APIClient()
        mate_api.force_authenticate(self.mate)
        mate_api.delete(f"/api/v1/work-documents/{doc['id']}/")
        self.assertIn('Keep', self._titles_for(self.owner))

    def test_the_colleague_list_excludes_yourself(self):
        rows = self.api.get('/api/v1/workspace/colleagues/').data
        ids = {r['id'] for r in rows}
        self.assertNotIn(self.owner.id, ids)
        self.assertIn(self.mate.id, ids)
