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
