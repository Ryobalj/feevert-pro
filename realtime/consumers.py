# realtime/consumers.py

import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

PRESENCE_TOUCH_INTERVAL = 120  # seconds


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')

        if self.user and not self.user.is_anonymous:
            self.group_name = f'user_{self.user.id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            await self._touch_last_seen()
            # Keep last_seen fresh for as long as the socket stays open, so
            # online status reflects an actual live connection instead of
            # going stale after 5 minutes on a long-idle-but-connected tab.
            self._presence_task = asyncio.ensure_future(self._presence_loop())
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, '_presence_task'):
            self._presence_task.cancel()
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def _presence_loop(self):
        try:
            while True:
                await asyncio.sleep(PRESENCE_TOUCH_INTERVAL)
                await self._touch_last_seen()
        except asyncio.CancelledError:
            pass

    @database_sync_to_async
    def _touch_last_seen(self):
        self.user.last_seen = timezone.now()
        self.user.save(update_fields=['last_seen'])
    
    async def receive(self, text_data):
        """Receive a typing indicator from the client and relay it to the
        other participant. Actual message sending still goes through the
        REST /send/ endpoint (so it's persisted before anyone sees it) -
        this channel only carries the ephemeral "user is typing" signal.
        """
        try:
            data = json.loads(text_data)
        except (ValueError, TypeError):
            return

        if data.get('type') == 'typing' and self.user and not self.user.is_anonymous:
            recipient_id = data.get('recipient_id')
            if recipient_id:
                await self.channel_layer.group_send(
                    f'user_{recipient_id}',
                    {
                        'type': 'chat_typing',
                        'sender_id': self.user.id,
                        'is_typing': bool(data.get('is_typing')),
                    }
                )

    async def send_notification(self, event):
        """Send a generic system notification to the client"""
        await self.send(text_data=json.dumps({
            'type': event['notification_type'],
            'title': event['title'],
            'message': event['message'],
            'data': event.get('data', {}),
            'timestamp': event['timestamp']
        }))

    async def chat_message(self, event):
        """Push a newly sent chat message to its recipient in real time"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
        }))

    async def chat_typing(self, event):
        """Relay a typing indicator to the other participant"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'sender_id': event['sender_id'],
            'is_typing': event['is_typing'],
        }))
