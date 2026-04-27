# bookings/serializers.py

from rest_framework import serializers
from .models import TimeSlot, Booking, Availability, Holiday, BookingReminder
from accounts.serializers import UserSerializer


class TimeSlotSerializer(serializers.ModelSerializer):
    """Serializer for Time Slot"""
    consultant_name = serializers.CharField(source='consultant.username', read_only=True)
    
    class Meta:
        model = TimeSlot
        fields = [
            'id', 'consultant', 'consultant_name', 'date', 'start_time',
            'end_time', 'is_booked', 'buffer_before_minutes', 'buffer_after_minutes',
            'price_override', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for Booking"""
    client_name = serializers.CharField(source='client.username', read_only=True)
    consultant_name = serializers.CharField(source='consultant.username', read_only=True)
    slot_info = serializers.CharField(source='slot.__str__', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'client', 'client_name', 'consultant', 'consultant_name',
            'service', 'service_name', 'slot', 'slot_info', 'status', 'notes',
            'meeting_link', 'cancellation_reason', 'reminder_sent', 'admin_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'reminder_sent']


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a booking"""
    class Meta:
        model = Booking
        fields = ['consultant', 'service', 'slot', 'notes']


class AvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for Availability"""
    consultant_name = serializers.CharField(source='consultant.username', read_only=True)
    day_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = Availability
        fields = [
            'id', 'consultant', 'consultant_name', 'day_of_week', 'day_display',
            'start_time', 'end_time', 'is_recurring', 'specific_date',
            'max_bookings_per_day', 'break_start', 'break_end', 'location_type',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class HolidaySerializer(serializers.ModelSerializer):
    """Serializer for Holiday"""
    consultant_name = serializers.CharField(source='consultant.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'is_recurring_yearly', 'consultant', 'consultant_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class BookingReminderSerializer(serializers.ModelSerializer):
    """Serializer for Booking Reminder"""
    booking_info = serializers.CharField(source='booking.__str__', read_only=True)
    
    class Meta:
        model = BookingReminder
        fields = ['id', 'booking', 'booking_info', 'reminder_type', 'status', 'sent_at', 'error_message', 'created_at']
        read_only_fields = ['id', 'sent_at', 'created_at']