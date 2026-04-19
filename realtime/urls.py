from django.urls import path
from . import views

urlpatterns = [
    path('admin/send-test/', views.send_test_notification, name='admin-realtime-send-test'),
    path('admin/broadcast/', views.broadcast_notification, name='admin-realtime-broadcast'),
]