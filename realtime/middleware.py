# realtime/middleware.py

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def _get_user_from_token(token):
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import AccessToken
    from rest_framework_simplejwt.exceptions import TokenError

    User = get_user_model()
    try:
        access_token = AccessToken(token)
        return User.objects.get(id=access_token['user_id'])
    except (TokenError, KeyError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Authenticates Channels WebSocket connections using the same JWT access
    token the REST API uses (rest_framework_simplejwt), passed as a
    `?token=` query param. This app has no Django session cookies to
    authenticate with (channels.auth.AuthMiddlewareStack expects those),
    so without this, scope['user'] is always AnonymousUser and every
    WebSocket connection gets rejected in NotificationConsumer.connect().
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        token = parse_qs(query_string).get('token', [None])[0]

        scope['user'] = await _get_user_from_token(token) if token else AnonymousUser()

        return await self.app(scope, receive, send)
