# notifications/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import NotificationTemplate

@register(NotificationTemplate)
class NotificationTemplateTranslationOptions(TranslationOptions):
    fields = ('subject_template', 'body_template')