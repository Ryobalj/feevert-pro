# notifications/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification, NotificationTemplate, UserNotificationSetting
from .serializers import (
    NotificationSerializer, NotificationTemplateSerializer,
    UserNotificationSettingSerializer, NotificationMarkReadSerializer
)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Notifications"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Mark notifications as read"""
        serializer = NotificationMarkReadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if serializer.validated_data.get('mark_all'):
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        else:
            notification_ids = serializer.validated_data.get('notification_ids', [])
            Notification.objects.filter(
                id__in=notification_ids,
                recipient=request.user
            ).update(is_read=True)
        
        return Response({'success': True, 'message': 'Notifications marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_read_single(self, request, pk=None):
        """Mark a single notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'success': True})


class NotificationTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Notification Templates (admin only)"""
    queryset = NotificationTemplate.objects.filter(is_active=True)
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()


class UserNotificationSettingViewSet(viewsets.ModelViewSet):
    """ViewSet for User Notification Settings"""
    queryset = UserNotificationSetting.objects.all()
    serializer_class = UserNotificationSettingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserNotificationSetting.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create settings for the user"""
        obj, created = UserNotificationSetting.objects.get_or_create(user=self.request.user)
        return obj