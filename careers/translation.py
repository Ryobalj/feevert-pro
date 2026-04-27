# careers/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import JobCategory, JobPost

@register(JobCategory)
class JobCategoryTranslationOptions(TranslationOptions):
    fields = ('name', 'description')

@register(JobPost)
class JobPostTranslationOptions(TranslationOptions):
    fields = ('title', 'description', 'requirements', 'responsibilities', 'location', 'seo_title', 'seo_description')
