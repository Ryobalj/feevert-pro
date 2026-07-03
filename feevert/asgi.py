# feevert/asgi.py

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'feevert.settings')

# Initialize Django ASGI application first
django_asgi_app = get_asgi_application()

# Import consumers after Django is configured
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from realtime import consumers
from realtime.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': JWTAuthMiddleware(
        URLRouter([
            path('ws/notifications/', consumers.NotificationConsumer.as_asgi()),
        ])
    ),
})
