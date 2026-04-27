# consultations/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import ConsultationCategory, ConsultationService, ConsultationRequest

@register(ConsultationCategory)
class ConsultationCategoryTranslationOptions(TranslationOptions):
    fields = ('name', 'description', 'seo_title', 'seo_description')

@register(ConsultationService)
class ConsultationServiceTranslationOptions(TranslationOptions):
    fields = ('name', 'description', 'faq', 'prerequisites')
