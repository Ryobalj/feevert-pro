# bookings/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel
from consultations.models import ConsultationService

class TimeSlot(BaseModel):
    """
    Available time slots for appointments
    """
    consultant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='time_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False)
    buffer_before_minutes = models.IntegerField(default=0, help_text="Buffer time before appointment")
    buffer_after_minutes = models.IntegerField(default=0, help_text="Buffer time after appointment")
    price_override = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    class Meta:
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['consultant', 'date']),
            models.Index(fields=['date', 'is_booked']),
        ]
    
    def __str__(self):
        return f"{self.consultant.username} - {self.date} {self.start_time}-{self.end_time}"


class Booking(BaseModel):
    """
    Appointment booking made by client
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
        ('no_show', 'No Show'),
    )
    
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    consultant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_bookings')
    service = models.ForeignKey(ConsultationService, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='bookings')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    meeting_link = models.URLField(blank=True, help_text="Google Meet / Zoom link")
    cancellation_reason = models.TextField(blank=True)
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(blank=True, null=True)
    rescheduled_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='rescheduled_to')
    admin_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['client', '-created_at']),
            models.Index(fields=['consultant', 'status']),
        ]
    
    def __str__(self):
        return f"{self.client.username} - {self.slot.date} ({self.status})"


class Availability(BaseModel):
    """
    Regular working hours for consultants
    """
    DAYS_OF_WEEK = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )
    
    LOCATION_CHOICES = (
        ('online', 'Online'),
        ('onsite', 'Onsite'),
        ('hybrid', 'Hybrid'),
    )
    
    consultant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_recurring = models.BooleanField(default=True)
    specific_date = models.DateField(blank=True, null=True)
    max_bookings_per_day = models.IntegerField(default=5)
    break_start = models.TimeField(blank=True, null=True)
    break_end = models.TimeField(blank=True, null=True)
    location_type = models.CharField(max_length=20, choices=LOCATION_CHOICES, default='online')
    
    class Meta:
        ordering = ['day_of_week', 'start_time']
        verbose_name_plural = "Availabilities"
    
    def __str__(self):
        if self.is_recurring:
            return f"{self.consultant.username} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"
        return f"{self.consultant.username} - {self.specific_date} {self.start_time}-{self.end_time}"


class Holiday(BaseModel):
    """
    Holidays or days when consultant is unavailable
    """
    name = models.CharField(max_length=100)
    date = models.DateField()
    is_recurring_yearly = models.BooleanField(default=False)
    consultant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='holidays')
    
    class Meta:
        ordering = ['date']
    
    def __str__(self):
        return f"{self.name} - {self.date}"


class BookingReminder(BaseModel):
    """
    Reminders sent to clients before their appointment
    """
    REMINDER_TYPES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    )
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=10, choices=REMINDER_TYPES, default='email')
    sent_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Reminder for {self.booking.client.username} - {self.reminder_type}"