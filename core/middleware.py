# core/middleware.py
"""Record when each person was last actually using the system.

The User model has carried a `last_seen` field all along and nothing ever
wrote to it, so the only answer available about a colleague was `last_login`
— which says when they signed in, not whether they have touched the system
since. Sessions here last hours, so those are very different questions.

Writing on every request would be a database update per click, so the stamp
is refreshed at most once every few minutes. That is precise enough for
"is this person working today?" and costs almost nothing.
"""

import logging
from datetime import timedelta

from django.utils import timezone

logger = logging.getLogger(__name__)

REFRESH_AFTER = timedelta(minutes=5)


class LastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            user = getattr(request, 'user', None)
            if user is not None and user.is_authenticated:
                now = timezone.now()
                last = getattr(user, 'last_seen', None)
                if last is None or (now - last) > REFRESH_AFTER:
                    # update() rather than save(): no signals, no race with
                    # whatever else the request touched on this row.
                    type(user).objects.filter(pk=user.pk).update(last_seen=now)
        except Exception as e:                     # never break a request over a timestamp
            logger.debug('last_seen not updated: %s', e)
        return response
