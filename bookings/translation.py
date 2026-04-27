# bookings/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import Booking, Holiday

@register(Booking)
class BookingTranslationOptions(TranslationOptions):
    fields = ('notes', 'cancellation_reason', 'admin_notes')

@register(Holiday)
class HolidayTranslationOptions(TranslationOptions):
    fields = ('name',)
