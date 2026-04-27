# realtime/views.py - Add these to existing views

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Max, Count, OuterRef, Subquery
from django.utils import timezone
from django.contrib.auth import get_user_model
from accounts.serializers import UserSerializer
from .models import Message
from .serializers import MessageSerializer, ConversationSerializer, SendMessageSerializer
from .services.notification_service import NotificationService
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render, redirect
from django.contrib import messages



User = get_user_model()


@staff_member_required
def send_test_notification(request):
    """Send test notification from admin panel"""
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        title = request.POST.get('title')
        message = request.POST.get('message')
        
        if user_id and title and message:
            try:
                NotificationService.send_realtime_notification(
                    user_id=int(user_id),
                    notification_type='test',
                    title=title,
                    message=message,
                    data={'admin_test': True}
                )
                messages.success(request, 'Test notification sent successfully!')
            except Exception as e:
                messages.error(request, f'Failed to send: {e}')
        else:
            messages.error(request, 'Please fill all fields')
        
        return redirect('admin:realtime_notification_changelist')
    
    from accounts.models import User
    users = User.objects.filter(is_active=True)[:10]
    
    return render(request, 'admin/realtime/send_test.html', {'users': users})


@staff_member_required
def broadcast_notification(request):
    """Send broadcast notification to all users"""
    if request.method == 'POST':
        title = request.POST.get('title')
        message = request.POST.get('message')
        notification_type = request.POST.get('notification_type', 'in_app')
        
        if title and message:
            from accounts.models import User
            users = User.objects.filter(is_active=True)
            success_count = 0
            
            for user in users:
                try:
                    if notification_type == 'sms' and user.phone:
                        from .services.sms_service import SMSService
                        SMSService.send_sms(str(user.phone), message)
                        success_count += 1
                    else:
                        NotificationService.send_realtime_notification(
                            user_id=user.id,
                            notification_type='broadcast',
                            title=title,
                            message=message
                        )
                        success_count += 1
                except Exception as e:
                    pass
            
            messages.success(request, f'Broadcast sent to {success_count} users!')
        else:
            messages.error(request, 'Please fill title and message')
        
        return redirect('admin:realtime_notification_changelist')
    
    return render(request, 'admin/realtime/broadcast.html')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """
    Get list of users the current user has chatted with, plus online status
    """
    current_user = request.user
    
    # Get all unique users from sent and received messages
    sent_to = Message.objects.filter(sender=current_user).values_list('recipient', flat=True)
    received_from = Message.objects.filter(recipient=current_user).values_list('sender', flat=True)
    
    # Combine and get unique user IDs
    user_ids = set(list(sent_to) + list(received_from))
    
    # Get last message and unread count for each conversation
    conversations = []
    for user_id in user_ids:
        try:
            other_user = User.objects.get(id=user_id)
            
            # Get last message between users
            last_message = Message.objects.filter(
                (Q(sender=current_user, recipient=other_user) |
                 Q(sender=other_user, recipient=current_user))
            ).order_by('-created_at').first()
            
            # Get unread count
            unread_count = Message.objects.filter(
                sender=other_user,
                recipient=current_user,
                is_read=False
            ).count()
            
            conversations.append({
                'user_id': other_user.id,
                'username': other_user.username,
                'full_name': other_user.get_full_name() or other_user.username,
                'profile_picture': other_user.profile_picture.url if other_user.profile_picture else None,
                'last_message': last_message.message[:50] if last_message else '',
                'last_message_time': last_message.created_at if last_message else other_user.last_login,
                'unread_count': unread_count,
                'is_online': False  # You can implement online status with WebSocket
            })
        except User.DoesNotExist:
            continue
    
    # Sort by last message time
    conversations.sort(key=lambda x: x['last_message_time'] or timezone.now(), reverse=True)
    
    serializer = ConversationSerializer(conversations, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    """
    Get all users (for starting new conversations)
    """
    users = User.objects.filter(is_active=True).exclude(id=request.user.id)
    
    # Annotate with whether there's an existing conversation
    users = users.annotate(
        has_conversation=Count('sent_messages', filter=Q(sent_messages__recipient=request.user)) + 
                         Count('received_messages', filter=Q(received_messages__sender=request.user))
    )
    
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, user_id):
    """
    Get messages between current user and another user
    """
    try:
        other_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    # Get all messages between the two users
    messages = Message.objects.filter(
        (Q(sender=request.user, recipient=other_user) |
         Q(sender=other_user, recipient=request.user))
    ).order_by('created_at')
    
    # Mark received messages as read
    Message.objects.filter(
        sender=other_user,
        recipient=request.user,
        is_read=False
    ).update(is_read=True, read_at=timezone.now())
    
    serializer = MessageSerializer(messages, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """
    Send a message to another user
    """
    serializer = SendMessageSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    recipient_id = serializer.validated_data['recipient_id']
    message_text = serializer.validated_data['message']
    
    try:
        recipient = User.objects.get(id=recipient_id, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'Recipient not found'}, status=404)
    
    # Don't allow sending messages to yourself
    if recipient == request.user:
        return Response({'error': 'Cannot send message to yourself'}, status=400)
    
    # Create message
    message = Message.objects.create(
        sender=request.user,
        recipient=recipient,
        message=message_text
    )
    
    # Send realtime notification via WebSocket
    try:
        NotificationService.send_realtime_notification(
            recipient.id,
            'new_message',
            f'New message from {request.user.username}',
            message_text[:100] + ('...' if len(message_text) > 100 else ''),
            {
                'sender_id': request.user.id,
                'sender_name': request.user.get_full_name() or request.user.username,
                'message_id': message.id
            }
        )
    except Exception as e:
        print(f"Failed to send realtime notification: {e}")
    
    serializer = MessageSerializer(message, context={'request': request})
    return Response(serializer.data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """
    Get total unread messages count for current user
    """
    count = Message.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    
    return Response({'unread_count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_conversation_read(request, user_id):
    """
    Mark all messages from a specific user as read
    """
    Message.objects.filter(
        sender_id=user_id,
        recipient=request.user,
        is_read=False
    ).update(is_read=True, read_at=timezone.now())
    
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_message_read(request, message_id):
    """
    Mark a single message as read
    """
    try:
        message = Message.objects.get(
            id=message_id,
            recipient=request.user
        )
        message.is_read = True
        message.read_at = timezone.now()
        message.save()
        return Response({'success': True})
    except Message.DoesNotExist:
        return Response({'error': 'Message not found'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    """
    Soft delete a message (only if sender)
    """
    try:
        message = Message.objects.get(
            id=message_id,
            sender=request.user
        )
        message.is_active = False
        message.save()
        return Response({'success': True})
    except Message.DoesNotExist:
        return Response({'error': 'Message not found or not authorized'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_online_users(request):
    """
    Get list of online users (can be implemented with WebSocket later)
    """
    # For now, return recently active users (last 5 minutes)
    from django.utils import timezone
    from datetime import timedelta
    
    five_min_ago = timezone.now() - timedelta(minutes=5)
    online_users = User.objects.filter(
        is_active=True,
        last_seen__gte=five_min_ago
    ).exclude(id=request.user.id)[:20]
    
    from accounts.serializers import UserSerializer
    serializer = UserSerializer(online_users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_messages(request):
    """
    Search through user's messages
    """
    query = request.GET.get('q', '')
    if not query:
        return Response({'results': []})
    
    messages = Message.objects.filter(
        (Q(sender=request.user) | Q(recipient=request.user)),
        message__icontains=query
    ).order_by('-created_at')[:50]
    
    serializer = MessageSerializer(messages, many=True, context={'request': request})
    return Response({'results': serializer.data})
