# projects/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import ProjectCategory, Project, ProjectAward

@register(ProjectCategory)
class ProjectCategoryTranslationOptions(TranslationOptions):
    fields = ('name', 'description', 'seo_title', 'seo_description')

@register(Project)
class ProjectTranslationOptions(TranslationOptions):
    fields = ('title', 'description', 'client_name', 'testimonial', 'testimonial_author', 'challenges', 'solutions', 'results', 'meta_title', 'meta_description')

@register(ProjectAward)
class ProjectAwardTranslationOptions(TranslationOptions):
    fields = ('award_name', 'awarding_body', 'description')
