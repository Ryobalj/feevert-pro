# home/admin.py

from django.contrib import admin
from django.utils import timezone
from .models import (
    SiteSetting, HeroSection, AboutSection, AboutImage, ServiceHighlight,
    SeoData, Faq, Partner, Testimonial, ContactMessage, Contact,
    WhatWeDo, WhatWeDoImage, WhatWeDoService  # ✅ Ongeza hii
)


# ========== INLINE IMAGES FOR ABOUT SECTION ==========
class AboutImageInline(admin.TabularInline):
    model = AboutImage
    extra = 1
    fields = ('image', 'caption', 'section', 'order', 'is_active')
    readonly_fields = ('created_at', 'updated_at')


# ========== INLINE RELATED IMAGES FOR WHAT WE DO ==========
class WhatWeDoImageInline(admin.TabularInline):
    model = WhatWeDoImage
    extra = 1
    fields = ('image', 'title', 'caption', 'order', 'is_active')
    readonly_fields = ('created_at', 'updated_at')


# ========== INLINE SERVICES FOR WHAT WE DO ==========
class WhatWeDoServiceInline(admin.TabularInline):
    model = WhatWeDoService
    extra = 1
    fields = ('icon', 'title', 'description', 'order', 'is_active')
    readonly_fields = ('created_at', 'updated_at')


# ========== SITE SETTINGS ==========
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
    list_display = ('title', 'is_active', 'image_count', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'description', 'mission', 'vision')
    inlines = [AboutImageInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'is_active')
        }),
        ('Content', {
            'fields': ('description', 'image', 'video_url')
        }),
        ('Mission & Vision', {
            'fields': ('mission', 'vision'),
        }),
        ('Core Values', {
            'fields': ('core_values',),
            'description': 'JSON format: [{"icon": "", "title": "", "description": "", "image": ""}]'
        }),
        ('Statistics', {
            'fields': ('stats',),
            'description': 'JSON format: [{"number": "", "label": "", "icon": ""}]'
        }),
        ('Why Choose Us', {
            'fields': ('why_choose_us',),
            'description': 'JSON format: [{"icon": "", "title": "", "description": "", "image": ""}]'
        }),
    )

    def image_count(self, obj):
        return obj.gallery.filter(is_active=True).count()
    image_count.short_description = "Images"

    class Media:
        js = ('admin/js/about_section_preview.js',)


# ============================================================
# ✅ WHAT WE DO - ADMIN
# ============================================================
@admin.register(WhatWeDo)
class WhatWeDoAdmin(admin.ModelAdmin):
    list_display = ('title', 'service_count', 'image_count', 'is_active', 'order')
    list_filter = ('is_active',)
    search_fields = ('title', 'description', 'subtitle')
    list_editable = ('order', 'is_active')
    inlines = [WhatWeDoServiceInline, WhatWeDoImageInline]

    fieldsets = (
        ('Header & Description', {
            'fields': ('title', 'subtitle', 'description')
        }),
        ('Main Image', {
            'fields': ('image',),
            'description': 'Background image shown for this section\'s whole turn. Add "related" images and services below.'
        }),
        ('Call to Action', {
            'fields': ('cta_text', 'cta_link')
        }),
        ('Settings', {
            'fields': ('is_active', 'order'),
            'classes': ('collapse',)
        }),
    )

    def service_count(self, obj):
        count = obj.services.filter(is_active=True).count()
        return f"{count} service(s)" if count > 0 else "No services"
    service_count.short_description = "Services"

    def image_count(self, obj):
        count = obj.related_images.filter(is_active=True).count()
        return f"{count} related image(s)" if count > 0 else "No related images"
    image_count.short_description = "Related Images"


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


# ============================================
# CONTACT - Central Contact Database
# ============================================
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'primary_email', 'phone', 'contact_type', 'total_messages', 'last_contacted_at')
    list_filter = ('contact_type', 'source_channel', 'country', 'is_active')
    search_fields = ('first_name', 'last_name', 'primary_email', 'phone', 'company_name')
    readonly_fields = ('total_messages', 'last_contacted_at', 'first_contacted_at', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('first_name', 'last_name', 'company_name', 'job_title', 'contact_type')
        }),
        ('Contact Details', {
            'fields': ('primary_email', 'secondary_emails', 'phone', 'alternate_phone')
        }),
        ('Address', {
            'fields': ('address', 'city', 'region', 'country')
        }),
        ('Source', {
            'fields': ('source', 'source_channel')
        }),
        ('Account Linking', {
            'fields': ('linked_user',),
            'description': 'Link this contact to an existing user account if they have one.'
        }),
        ('Notes & Tags', {
            'fields': ('notes', 'tags')
        }),
        ('Statistics', {
            'fields': ('total_messages', 'last_contacted_at', 'first_contacted_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['link_to_user', 'mark_as_client', 'export_as_csv']

    def link_to_user(self, request, queryset):
        from accounts.models import User
        linked = 0
        for contact in queryset.filter(linked_user__isnull=True):
            if contact.primary_email:
                user = User.objects.filter(email=contact.primary_email).first()
                if user:
                    contact.linked_user = user
                    contact.save(update_fields=['linked_user'])
                    linked += 1
        self.message_user(request, f"{linked} contact(s) linked to user accounts.")
    link_to_user.short_description = "Link to user accounts by email"

    def mark_as_client(self, request, queryset):
        updated = queryset.update(contact_type='client')
        self.message_user(request, f"{updated} contact(s) marked as clients.")
    mark_as_client.short_description = "Mark selected as clients"

    def export_as_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="contacts.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name', 'Email', 'Phone', 'Company', 'Type', 'Total Messages', 'Last Contacted'])
        for contact in queryset:
            writer.writerow([
                contact.display_name,
                contact.primary_email,
                contact.phone,
                contact.company_name,
                contact.contact_type,
                contact.total_messages,
                contact.last_contacted_at,
            ])
        return response
    export_as_csv.short_description = "Export selected to CSV"


# ============================================
# UNIFIED INBOX - ContactMessage (Extended)
# ============================================
@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('subject_preview', 'name', 'channel', 'priority_badge', 'status_badge', 'assigned_to', 'created_at')
    list_filter = ('channel', 'status', 'priority', 'is_read', 'is_incoming', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message', 'message_id')
    readonly_fields = ('created_at', 'updated_at', 'message_id', 'thread_id')
    date_hierarchy = 'created_at'
    list_select_related = ('assigned_to', 'contact')
    list_per_page = 50

    fieldsets = (
        ('Message Information', {
            'fields': ('channel', 'status', 'priority', 'is_incoming')
        }),
        ('Sender', {
            'fields': ('name', 'email', 'phone', 'contact')
        }),
        ('Content', {
            'fields': ('subject', 'message')
        }),
        ('Assignment & Tracking', {
            'fields': ('assigned_to', 'is_read', 'is_replied', 'replied_at', 'responded_at', 'resolved_at')
        }),
        ('SLA Tracking', {
            'fields': ('sla_deadline', 'sla_breached'),
            'classes': ('collapse',)
        }),
        ('Email Headers (for email integration)', {
            'fields': ('message_id', 'thread_id', 'in_reply_to', 'cc_emails', 'attachments', 'headers'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = [
        'mark_as_read', 'mark_as_unread',
        'mark_as_responded', 'mark_as_resolved',
        'mark_as_spam', 'mark_as_archived',
        'assign_to_me', 'set_high_priority', 'set_urgent_priority',
    ]

    def subject_preview(self, obj):
        return obj.subject[:60]
    subject_preview.short_description = "Subject"
    subject_preview.admin_order_field = 'subject'

    def priority_badge(self, obj):
        colors = {'low': 'green', 'medium': 'orange', 'high': 'red', 'urgent': 'darkred'}
        color = colors.get(obj.priority, 'gray')
        return f'<span style="color:{color};font-weight:bold;">{obj.priority.upper()}</span>'
    priority_badge.short_description = "Priority"
    priority_badge.admin_order_field = 'priority'
    priority_badge.allow_tags = True

    def status_badge(self, obj):
        colors = {
            'unread': 'blue', 'read': 'gray', 'in_progress': 'orange',
            'responded': 'green', 'resolved': 'darkgreen', 'spam': 'red', 'archived': 'lightgray'
        }
        color = colors.get(obj.status, 'black')
        return f'<span style="color:{color};font-weight:bold;">{obj.status.replace("_", " ").upper()}</span>'
    status_badge.short_description = "Status"
    status_badge.admin_order_field = 'status'
    status_badge.allow_tags = True

    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True, status='read')
        self.message_user(request, f"{updated} message(s) marked as read.")
    mark_as_read.short_description = "Mark as Read"

    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False, status='unread')
        self.message_user(request, f"{updated} message(s) marked as unread.")
    mark_as_unread.short_description = "Mark as Unread"

    def mark_as_responded(self, request, queryset):
        updated = queryset.update(
            is_replied=True, status='responded',
            replied_at=timezone.now(), responded_at=timezone.now()
        )
        self.message_user(request, f"{updated} message(s) marked as responded.")
    mark_as_responded.short_description = "Mark as Responded"

    def mark_as_resolved(self, request, queryset):
        updated = queryset.update(status='resolved', resolved_at=timezone.now())
        self.message_user(request, f"{updated} message(s) marked as resolved.")
    mark_as_resolved.short_description = "Mark as Resolved"

    def mark_as_spam(self, request, queryset):
        updated = queryset.update(status='spam')
        self.message_user(request, f"{updated} message(s) marked as spam.")
    mark_as_spam.short_description = "Mark as Spam"

    def mark_as_archived(self, request, queryset):
        updated = queryset.update(status='archived')
        self.message_user(request, f"{updated} message(s) archived.")
    mark_as_archived.short_description = "Archive Messages"

    def assign_to_me(self, request, queryset):
        updated = queryset.filter(assigned_to__isnull=True).update(assigned_to=request.user)
        self.message_user(request, f"{updated} unassigned message(s) assigned to you.")
    assign_to_me.short_description = "Assign unassigned to me"

    def set_high_priority(self, request, queryset):
        updated = queryset.update(priority='high')
        self.message_user(request, f"{updated} message(s) set to HIGH priority.")
    set_high_priority.short_description = "Set as HIGH priority"

    def set_urgent_priority(self, request, queryset):
        from datetime import timedelta
        sla = timezone.now() + timedelta(hours=1)
        updated = queryset.update(priority='urgent', sla_deadline=sla)
        self.message_user(request, f"{updated} message(s) set to URGENT priority (1hr SLA).")
    set_urgent_priority.short_description = "Set as URGENT priority"

    class Media:
        css = {
            'all': ('admin/css/unified-inbox.css',)
        }