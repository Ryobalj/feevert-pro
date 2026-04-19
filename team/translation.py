# team/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import Department, TeamMember, TeamTestimonial, TeamAchievement

@register(Department)
class DepartmentTranslationOptions(TranslationOptions):
    fields = ('name', 'description')

@register(TeamMember)
class TeamMemberTranslationOptions(TranslationOptions):
    fields = ('full_name', 'role', 'bio', 'expertise_areas', 'education', 'work_experience', 'certifications')

@register(TeamTestimonial)
class TeamTestimonialTranslationOptions(TranslationOptions):
    fields = ('client_name', 'client_company', 'content')

@register(TeamAchievement)
class TeamAchievementTranslationOptions(TranslationOptions):
    fields = ('title', 'description', 'issuer')
