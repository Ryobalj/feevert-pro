# realtime/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        
        if self.user and not self.user.is_anonymous:
            self.group_name = f'user_{self.user.id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    async def receive(self, text_data):
        """Receive message from WebSocket (optional)"""
        pass
    
    async def send_notification(self, event):
        """Send notification to client"""
        await self.send(text_data=json.dumps({
            'type': event['notification_type'],
            'title': event['title'],
            'message': event['message'],
            'data': event.get('data', {}),
            'timestamp': event['timestamp']
        }))
