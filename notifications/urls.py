# notifications/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'notifications'

router = DefaultRouter()
router.register(r'', views.NotificationViewSet, basename='notification')
router.register(r'templates', views.NotificationTemplateViewSet, basename='notification-template')
router.register(r'settings', views.UserNotificationSettingViewSet, basename='notification-setting')
router.register(r'logs', views.NotificationLogViewSet, basename='notification-log')

urlpatterns = [
    # Router endpoints
    path('api/', include(router.urls)),
    
    # Test endpoints
    path('test/email/', views.TestEndpointViewSet.as_view({'post': 'email'}), name='test-email'),
    path('test/sms/', views.TestEndpointViewSet.as_view({'post': 'sms'}), name='test-sms'),
    path('test/bulk/', views.TestEndpointViewSet.as_view({'post': 'bulk'}), name='test-bulk'),
    path('test/communication/', views.TestEndpointViewSet.as_view({'post': 'communication'}), name='test-communication'),
    
    # Standalone utility endpoints
    path('unread-count/', views.get_unread_count, name='unread-count'),
    path('mark-all-read/', views.mark_all_as_read, name='mark-all-read'),
    path('mark-read/<uuid:notification_id>/', views.mark_as_read, name='mark-read'),
    path('stats/', views.get_notification_stats, name='stats'),
]