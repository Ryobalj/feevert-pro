# notifications/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import NotificationTemplate

@register(NotificationTemplate)
class NotificationTemplateTranslationOptions(TranslationOptions):
    fields = ('subject', 'body_html', 'body_text')
