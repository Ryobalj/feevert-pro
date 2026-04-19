# bookings/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import TimeSlot, Booking, Availability, Holiday, BookingReminder
from .serializers import (
    TimeSlotSerializer, BookingSerializer, BookingCreateSerializer,
    AvailabilitySerializer, HolidaySerializer, BookingReminderSerializer
)


class TimeSlotViewSet(viewsets.ModelViewSet):
    """ViewSet for Time Slots"""
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['consultant', 'date', 'is_booked']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'consultant']:
            return TimeSlot.objects.all()
        return TimeSlot.objects.filter(is_booked=False)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available time slots"""
        date = request.query_params.get('date')
        consultant_id = request.query_params.get('consultant')
        
        queryset = TimeSlot.objects.filter(is_booked=False)
        
        if date:
            queryset = queryset.filter(date=date)
        if consultant_id:
            queryset = queryset.filter(consultant_id=consultant_id)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class BookingViewSet(viewsets.ModelViewSet):
    """ViewSet for Bookings"""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'consultant']
    ordering_fields = ['created_at', 'slot__date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Booking.objects.all()
        elif user.role == 'consultant':
            return Booking.objects.filter(consultant=user)
        return Booking.objects.filter(client=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingSerializer
    
    def perform_create(self, serializer):
        booking = serializer.save(client=self.request.user, status='pending')
        # Mark time slot as booked
        slot = booking.slot
        slot.is_booked = True
        slot.save()
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = self.get_object()
        reason = request.data.get('reason', '')
        
        booking.status = 'cancelled'
        booking.cancellation_reason = reason
        booking.save()
        
        # Free up the time slot
        slot = booking.slot
        slot.is_booked = False
        slot.save()
        
        return Response({'success': True, 'message': 'Booking cancelled'})
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a booking"""
        booking = self.get_object()
        booking.status = 'confirmed'
        booking.save()
        
        return Response({'success': True, 'message': 'Booking confirmed'})


class AvailabilityViewSet(viewsets.ModelViewSet):
    """ViewSet for Consultant Availability"""
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Availability.objects.all()
        return Availability.objects.filter(consultant=user)


class HolidayViewSet(viewsets.ModelViewSet):
    """ViewSet for Holidays"""
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Holiday.objects.all()
        return Holiday.objects.filter(consultant=user)


class BookingReminderViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Booking Reminders"""
    queryset = BookingReminder.objects.all()
    serializer_class = BookingReminderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return BookingReminder.objects.filter(booking__client=self.request.user)