# payments/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import Invoice

@register(Invoice)
class InvoiceTranslationOptions(TranslationOptions):
    fields = ('title', 'description')
