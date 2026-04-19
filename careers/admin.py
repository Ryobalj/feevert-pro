# careers/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import JobCategory, JobPost, JobApplication, SavedJob, JobAlert

@admin.register(JobCategory)
class JobCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('order',)

@admin.register(JobPost)
class JobPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'location', 'employment_type', 'deadline', 'is_active', 'is_featured')
    list_filter = ('category', 'employment_type', 'is_active', 'is_featured', 'deadline')
    search_fields = ('title', 'description', 'location')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ('is_active', 'is_featured')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'category', 'employment_type', 'experience_level')
        }),
        ('Location & Remote', {
            'fields': ('location', 'remote_option')
        }),
        ('Compensation', {
            'fields': ('salary_range_min', 'salary_range_max', 'salary_currency')
        }),
        ('Description', {
            'fields': ('description', 'requirements', 'responsibilities')
        }),
        ('Vacancy Details', {
            'fields': ('vacancies_count', 'deadline')
        }),
        ('SEO & Display', {
            'fields': ('is_active', 'is_featured', 'seo_title', 'seo_description')
        }),
    )

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'job', 'email', 'phone', 'status', 'created_at')
    list_filter = ('status', 'job', 'created_at')
    search_fields = ('full_name', 'email', 'phone', 'job__title')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('full_name', 'email', 'phone')
        }),
        ('Application Details', {
            'fields': ('job', 'cv_file', 'cover_letter', 'portfolio_url', 'linkedin_url')
        }),
        ('Additional Info', {
            'fields': ('expected_salary', 'earliest_start_date', 'heard_from')
        }),
        ('Review Process', {
            'fields': ('status', 'reviewed_by', 'reviewed_at', 'interview_date', 'interview_notes', 'admin_notes')
        }),
    )
    
    def cv_link(self, obj):
        if obj.cv_file:
            return format_html('<a href="{}" target="_blank">View CV</a>', obj.cv_file.url)
        return '-'
    cv_link.short_description = 'CV'

@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'job__title')

@admin.register(JobAlert)
class JobAlertAdmin(admin.ModelAdmin):
    list_display = ('email', 'category', 'location', 'frequency', 'is_active')
    list_filter = ('frequency', 'is_active', 'category')
    search_fields = ('email', 'location')
    list_editable = ('is_active',)