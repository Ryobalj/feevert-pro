# home/admin.py

from django.contrib import admin
from .models import (
    SiteSetting, HeroSection, AboutSection, ServiceHighlight, SeoData,
    Faq, Partner, Testimonial, ContactMessage
)


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('site_name', 'contact_email', 'contact_phone', 'enable_maintenance_mode')
    fieldsets = (
        ('Basic Information', {
            'fields': ('site_name', 'site_tagline', 'site_logo', 'site_logo_dark', 'favicon')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone', 'contact_phone_alt', 'contact_address')
        }),
        ('Social Media', {
            'fields': ('social_facebook', 'social_twitter', 'social_linkedin', 'social_instagram', 'social_youtube', 'social_whatsapp')
        }),
        ('SEO & Analytics', {
            'fields': ('meta_description', 'meta_keywords', 'google_analytics_id')
        }),
        ('Branding', {
            'fields': ('primary_color', 'secondary_color', 'accent_color')
        }),
        ('Footer', {
            'fields': ('footer_copyright_text', 'footer_about_text')
        }),
        ('Maintenance', {
            'fields': ('enable_maintenance_mode', 'maintenance_message')
        }),
    )


@admin.register(HeroSection)
class HeroSectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'cta_text', 'order', 'is_active')
    list_filter = ('is_active',)
    list_editable = ('order', 'is_active')
    fieldsets = (
        ('Content', {
            'fields': ('title', 'subtitle', 'background_image', 'background_overlay')
        }),
        ('Call to Action', {
            'fields': ('cta_text', 'cta_link', 'cta_second_text', 'cta_second_link')
        }),
        ('Settings', {
            'fields': ('animation_type', 'order', 'is_active')
        }),
    )


@admin.register(AboutSection)
class AboutSectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'description', 'mission', 'vision')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'is_active')
        }),
        ('Content', {
            'fields': ('description', 'image', 'video_url')
        }),
        ('Mission & Vision', {
            'fields': ('mission', 'vision'),
            'description': 'Enter the mission and vision statements for the organization.'
        }),
        ('Core Values', {
            'fields': ('core_values',),
            'description': 'Add core values as JSON list. Example: [{"icon": "💎", "title": "Integrity", "description": "We uphold the highest standards of honesty and transparency."}]'
        }),
        ('Statistics', {
            'fields': ('stats',),
            'description': 'Add stats as JSON list. Example: [{"number": "50", "label": "Projects Completed"}]'
        }),
        ('Why Choose Us', {
            'fields': ('why_choose_us',),
            'description': 'Add reasons as JSON list. Example: [{"icon": "🎓", "title": "Expert Team", "description": "Our consultants are industry experts."}]'
        }),
    )
    
    class Media:
        js = ('admin/js/about_section_preview.js',)  # Optional: Custom JS for preview


@admin.register(ServiceHighlight)
class ServiceHighlightAdmin(admin.ModelAdmin):
    list_display = ('title', 'service', 'badge_text', 'is_featured', 'order', 'is_active')
    list_filter = ('is_featured', 'is_active')
    search_fields = ('title', 'description')
    list_editable = ('is_featured', 'order', 'is_active')
    fieldsets = (
        ('Basic Information', {
            'fields': ('service', 'title', 'description', 'icon')
        }),
        ('Media', {
            'fields': ('image', 'link')
        }),
        ('Display', {
            'fields': ('badge_text', 'is_featured', 'order', 'is_active')
        }),
    )


@admin.register(SeoData)
class SeoDataAdmin(admin.ModelAdmin):
    list_display = ('page_name', 'meta_title', 'meta_description', 'no_index')
    search_fields = ('page_name', 'meta_title')
    fieldsets = (
        ('Page', {
            'fields': ('page_name',)
        }),
        ('Meta Tags', {
            'fields': ('meta_title', 'meta_description', 'keywords')
        }),
        ('Social Sharing', {
            'fields': ('og_image', 'canonical_url')
        }),
        ('Indexing', {
            'fields': ('no_index', 'no_follow')
        }),
    )


@admin.register(Faq)
class FaqAdmin(admin.ModelAdmin):
    list_display = ('question', 'category', 'order', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('question', 'answer')
    list_editable = ('order', 'is_active')
    fieldsets = (
        ('Content', {
            'fields': ('question', 'answer')
        }),
        ('Settings', {
            'fields': ('category', 'order', 'is_active')
        }),
    )


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ('name', 'website_url', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    list_editable = ('order', 'is_active')
    fieldsets = (
        ('Information', {
            'fields': ('name', 'logo', 'website_url', 'description')
        }),
        ('Settings', {
            'fields': ('order', 'is_active')
        }),
    )


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('client_name', 'client_company', 'rating', 'is_approved', 'is_active', 'order')
    list_filter = ('rating', 'is_approved', 'is_active')
    search_fields = ('client_name', 'client_company', 'content')
    list_editable = ('is_approved', 'is_active', 'order')
    fieldsets = (
        ('Client Information', {
            'fields': ('client_name', 'client_role', 'client_company', 'client_image')
        }),
        ('Testimonial', {
            'fields': ('content', 'rating', 'project')
        }),
        ('Settings', {
            'fields': ('order', 'is_active', 'is_approved')
        }),
    )


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'is_read', 'is_replied', 'created_at')
    list_filter = ('is_read', 'is_replied', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)
    list_editable = ('is_read', 'is_replied')
    fieldsets = (
        ('Contact Information', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Message', {
            'fields': ('subject', 'message')
        }),
        ('Status', {
            'fields': ('is_read', 'is_replied', 'replied_at')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_replied']
    
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
        self.message_user(request, f"{queryset.count()} messages marked as read.")
    mark_as_read.short_description = "Mark selected messages as read"
    
    def mark_as_replied(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_replied=True, replied_at=timezone.now())
        self.message_user(request, f"{queryset.count()} messages marked as replied.")
    mark_as_replied.short_description = "Mark selected messages as replied"