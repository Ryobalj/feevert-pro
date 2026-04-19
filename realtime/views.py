from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render, redirect
from django.contrib import messages
from .services.notification_service import NotificationService


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