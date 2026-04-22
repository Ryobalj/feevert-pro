# realtime/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Admin notification routes
    path('admin/send-test/', views.send_test_notification, name='admin-realtime-send-test'),
    path('admin/broadcast/', views.broadcast_notification, name='admin-realtime-broadcast'),
    
    # ============================================
    # MESSAGING ROUTES
    # ============================================
    
    # Conversations
    path('conversations/', views.get_conversations, name='get-conversations'),
    
    # Users list (for starting new conversations)
    path('users/', views.get_all_users, name='get-all-users'),
    
    # Messages with a specific user
    path('messages/<int:user_id>/', views.get_messages, name='get-messages'),
    
    # Send a message
    path('send/', views.send_message, name='send-message'),
    
    # Unread messages count
    path('unread-count/', views.get_unread_count, name='unread-count'),
    
    # Mark conversation as read
    path('conversations/<int:user_id>/read/', views.mark_conversation_read, name='mark-conversation-read'),
    
    # ============================================
    # ADDITIONAL MESSAGING ROUTES
    # ============================================
    
    # Mark single message as read
    path('messages/<int:message_id>/read/', views.mark_message_read, name='mark-message-read'),
    
    # Delete a message (soft delete)
    path('messages/<int:message_id>/delete/', views.delete_message, name='delete-message'),
    
    # Get online users
    path('online-users/', views.get_online_users, name='online-users'),
    
    # Search messages
    path('search/', views.search_messages, name='search-messages'),
]

# API versioned routes (optional - can be included in main urls.py)
api_urlpatterns = [
    path('v1/conversations/', views.get_conversations, name='api-v1-conversations'),
    path('v1/users/', views.get_all_users, name='api-v1-users'),
    path('v1/messages/<int:user_id>/', views.get_messages, name='api-v1-messages'),
    path('v1/send/', views.send_message, name='api-v1-send'),
    path('v1/unread-count/', views.get_unread_count, name='api-v1-unread-count'),
]