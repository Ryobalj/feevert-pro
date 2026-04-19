# home/context_processors.py

from django.db.models import Sum
from home.models import ContactMessage
from bookings.models import Booking
from accounts.models import User
from payments.models import PaymentTransaction


def admin_dashboard_stats(request):
    """Add statistics to admin dashboard"""
    if not request.user.is_authenticated or not request.user.is_staff:
        return {}
    
    context = {
        'user_count': User.objects.filter(is_active=True).count(),
        'contact_count': ContactMessage.objects.filter(is_read=False).count(),
        'booking_count': Booking.objects.filter(status='pending').count(),
        'revenue': PaymentTransaction.objects.filter(
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0,
    }
    
    # Get recent logs
    from django.contrib.admin.models import LogEntry
    context['recent_logs'] = LogEntry.objects.all().order_by('-action_time')[:10]
    
    return context
