# team/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import Department, TeamMember, TeamMemberSocial, TeamTestimonial, TeamAchievement

class TeamMemberSocialInline(admin.TabularInline):
    model = TeamMemberSocial
    extra = 1

class TeamTestimonialInline(admin.TabularInline):
    model = TeamTestimonial
    extra = 1
    fields = ('client_name', 'client_company', 'content', 'rating', 'is_approved')

class TeamAchievementInline(admin.TabularInline):
    model = TeamAchievement
    extra = 1

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'head', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('order',)

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'role', 'department', 'email', 'is_featured', 'is_active', 'order')
    list_filter = ('department', 'is_featured', 'is_active')
    search_fields = ('full_name', 'role', 'email', 'bio')
    prepopulated_fields = {'slug': ('full_name',)}
    list_editable = ('is_featured', 'is_active', 'order')
    filter_horizontal = ('projects',)
    inlines = [TeamMemberSocialInline, TeamTestimonialInline, TeamAchievementInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('full_name', 'slug', 'role', 'department', 'profile_image')
        }),
        ('Contact', {
            'fields': ('email', 'phone')
        }),
        ('Professional Details', {
            'fields': ('bio', 'expertise_areas', 'education', 'work_experience', 'certifications', 'languages')
        }),
        ('Social Media', {
            'fields': ('linkedin', 'twitter', 'facebook', 'instagram', 'github')
        }),
        ('Projects & Display', {
            'fields': ('projects', 'is_featured', 'order')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )
    
    def thumbnail(self, obj):
        if obj.profile_image:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.profile_image.url)
        return '-'
    thumbnail.short_description = 'Photo'

@admin.register(TeamMemberSocial)
class TeamMemberSocialAdmin(admin.ModelAdmin):
    list_display = ('member', 'platform', 'url')
    list_filter = ('platform',)
    search_fields = ('member__full_name', 'url')

@admin.register(TeamTestimonial)
class TeamTestimonialAdmin(admin.ModelAdmin):
    list_display = ('team_member', 'client_name', 'rating', 'is_approved', 'created_at')
    list_filter = ('rating', 'is_approved', 'created_at')
    search_fields = ('team_member__full_name', 'client_name', 'content')
    list_editable = ('is_approved',)

@admin.register(TeamAchievement)
class TeamAchievementAdmin(admin.ModelAdmin):
    list_display = ('team_member', 'title', 'date', 'issuer')
    list_filter = ('date',)
    search_fields = ('team_member__full_name', 'title', 'issuer')