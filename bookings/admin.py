# bookings/admin.py

from django.contrib import admin
from .models import TimeSlot, Booking, Availability, Holiday, BookingReminder

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ('consultant', 'date', 'start_time', 'end_time', 'is_booked')
    list_filter = ('is_booked', 'date', 'consultant')
    search_fields = ('consultant__username', 'consultant__email')
    list_editable = ('is_booked',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('client', 'consultant', 'slot', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'consultant')
    search_fields = ('client__username', 'client__email', 'notes')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)

@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('consultant', 'day_of_week', 'start_time', 'end_time', 'is_recurring')
    list_filter = ('is_recurring', 'day_of_week', 'consultant')
    search_fields = ('consultant__username',)

@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'is_recurring_yearly', 'consultant')
    list_filter = ('is_recurring_yearly', 'date', 'consultant')
    search_fields = ('name',)

@admin.register(BookingReminder)
class BookingReminderAdmin(admin.ModelAdmin):
    list_display = ('booking', 'reminder_type', 'status', 'sent_at')
    list_filter = ('reminder_type', 'status', 'sent_at')
    search_fields = ('booking__client__username',)