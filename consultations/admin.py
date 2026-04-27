# consultations/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ConsultationCategory, ConsultationService, ConsultationRequest,
    ConsultationDocument, ConsultationFollowup, ServiceImage
)


# ============ INLINE FOR SERVICE IMAGES ============
class ServiceImageInline(admin.TabularInline):
    model = ServiceImage
    extra = 3
    fields = ['image', 'image_preview', 'caption', 'alt_text', 'order', 'is_active']
    readonly_fields = ['image_preview']
    ordering = ['order']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Preview"


# ============ INLINE FOR SERVICES IN CATEGORY ============
class ServiceInline(admin.TabularInline):
    model = ConsultationService
    extra = 0
    fields = ['name', 'price_type', 'is_featured', 'is_active']
    show_change_link = True
    verbose_name = "Service"
    verbose_name_plural = "Services in this Category"


# ============ CATEGORY ADMIN ============
@admin.register(ConsultationCategory)
class ConsultationCategoryAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'level_badge', 'parent_link', 'service_count_badge', 
        'order', 'is_active'
    ]
    list_filter = ['is_active', 'level', 'parent']
    search_fields = ['name', 'description', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['order', 'is_active']
    readonly_fields = ['level', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'icon', 'image', 'parent')
        }),
        ('Display', {
            'fields': ('order', 'is_active')
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('level', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ServiceInline]
    
    def level_badge(self, obj):
        badges = {
            0: ('#10b981', 'Main'),
            1: ('#3b82f6', 'Sub'),
            2: ('#8b5cf6', 'Sub-Sub'),
        }
        color, label = badges.get(obj.level, ('#6b7280', 'Unknown'))
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">{}</span>',
            color, label
        )
    level_badge.short_description = "Level"
    
    def parent_link(self, obj):
        if obj.parent:
            return format_html(
                '<a href="{}">{}</a>',
                f"/feevert-admin/consultations/consultationcategory/{obj.parent.id}/change/",
                obj.parent.name
            )
        return "—"
    parent_link.short_description = "Parent"
    
    def service_count_badge(self, obj):
        count = obj.direct_service_count
        if count > 0:
            return format_html(
                '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">{}</span>',
                count
            )
        return "0"
    service_count_badge.short_description = "Services"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('parent')


# ============ SERVICE ADMIN ============
@admin.register(ConsultationService)
class ConsultationServiceAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category_link', 'price_badge', 'duration', 
        'is_featured', 'is_active'
    ]
    list_filter = ['category', 'price_type', 'is_featured', 'is_active']
    search_fields = ['name', 'description', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_featured', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'name', 'slug', 'description', 'icon', 'image')
        }),
        ('Pricing', {
            'fields': ('price_type', 'price', 'currency', 'price_range_min', 'price_range_max'),
            'description': 'Set the pricing structure for this service'
        }),
        ('Details', {
            'fields': ('duration_minutes', 'estimated_delivery_days', 'max_clients')
        }),
        ('Content', {
            'fields': ('benefits', 'faq', 'prerequisites', 'deliverables'),
            'classes': ('collapse',)
        }),
        ('Display', {
            'fields': ('is_featured', 'is_active', 'popularity_score', 'order')
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ServiceImageInline]
    
    def category_link(self, obj):
        if obj.category:
            url = f"/feevert-admin/consultations/consultationcategory/{obj.category.id}/change/"
            return format_html('<a href="{}">{}</a>', url, obj.category.full_path)
        return "—"
    category_link.short_description = "Category"
    
    def price_badge(self, obj):
        if obj.display_price:
            return format_html(
                '<span style="background: #10b981; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">{}</span>',
                obj.display_price
            )
        return "—"
    price_badge.short_description = "Price"
    
    def duration(self, obj):
        hours = obj.duration_minutes // 60
        mins = obj.duration_minutes % 60
        if hours > 0 and mins > 0:
            return f"{hours}h {mins}m"
        elif hours > 0:
            return f"{hours}h"
        return f"{mins}m"
    duration.short_description = "Duration"


# ============ REQUEST ADMIN (FIXED) ============
@admin.register(ConsultationRequest)
class ConsultationRequestAdmin(admin.ModelAdmin):
    list_display = [
        'client', 'service', 'preferred_date', 'status_badge', 'status',
        'priority_badge', 'priority', 'created_at'
    ]
    list_filter = ['status', 'priority', 'created_at', 'preferred_date']
    search_fields = [
        'client__username', 'client__email', 'client__full_name',
        'service__name', 'message'
    ]
    readonly_fields = ['created_at', 'updated_at', 'response_sent_at', 'completed_at']
    list_editable = ['status', 'priority']  # ✅ Now works - both in list_display
    autocomplete_fields = ['client', 'service', 'assigned_to']
    
    fieldsets = (
        ('Client & Service', {
            'fields': ('client', 'service', 'assigned_to')
        }),
        ('Schedule', {
            'fields': ('preferred_date', 'preferred_time', 'alternative_date'),
            'classes': ('collapse',)
        }),
        ('Request Details', {
            'fields': ('message', 'budget_range', 'attachments')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority')
        }),
        ('Admin Notes', {
            'fields': ('admin_notes', 'internal_notes'),
            'classes': ('collapse',)
        }),
        ('Feedback', {
            'fields': ('client_feedback', 'client_rating')
        }),
        ('Timestamps', {
            'fields': ('response_sent_at', 'completed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        colors = {
            'pending': '#f59e0b',
            'confirmed': '#3b82f6',
            'in_progress': '#8b5cf6',
            'completed': '#10b981',
            'cancelled': '#ef4444',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status Badge"
    
    def priority_badge(self, obj):
        colors = {
            'low': '#10b981',
            'medium': '#f59e0b',
            'high': '#f97316',
            'urgent': '#ef4444',
        }
        color = colors.get(obj.priority, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = "Priority Badge"


# ============ DOCUMENT ADMIN ============
@admin.register(ConsultationDocument)
class ConsultationDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'document_type_badge', 'request_link', 'uploaded_by', 'created_at']
    list_filter = ['document_type', 'created_at']
    search_fields = ['title', 'request__client__username', 'request__service__name']
    readonly_fields = ['file_size', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Document', {
            'fields': ('request', 'title', 'document_type', 'file', 'description')
        }),
        ('Upload Info', {
            'fields': ('uploaded_by', 'file_size', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def document_type_badge(self, obj):
        colors = {
            'proposal': '#3b82f6',
            'contract': '#8b5cf6',
            'report': '#10b981',
            'invoice': '#f59e0b',
            'other': '#6b7280',
        }
        color = colors.get(obj.document_type, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; border-radius: 8px; font-size: 11px;">{}</span>',
            color, obj.get_document_type_display()
        )
    document_type_badge.short_description = "Type"
    
    def request_link(self, obj):
        if obj.request:
            url = f"/feevert-admin/consultations/consultationrequest/{obj.request.id}/change/"
            return format_html('<a href="{}">{} - {}</a>', url, obj.request.client.username, obj.request.service.name)
        return "—"
    request_link.short_description = "Request"


# ============ FOLLOWUP ADMIN (FIXED) ============
@admin.register(ConsultationFollowup)
class ConsultationFollowupAdmin(admin.ModelAdmin):
    list_display = [
        'request_link', 'followup_date', 'assigned_to', 
        'status_badge', 'status', 'reminder_sent'
    ]
    list_filter = ['status', 'followup_date', 'reminder_sent']
    search_fields = ['request__client__username', 'notes', 'assigned_to__username']
    list_editable = ['status']  # ✅ Now works - 'status' is in list_display
    readonly_fields = ['completed_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Followup Details', {
            'fields': ('request', 'followup_date', 'notes', 'assigned_to')
        }),
        ('Status', {
            'fields': ('status', 'completed_at', 'reminder_sent')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def request_link(self, obj):
        if obj.request:
            url = f"/feevert-admin/consultations/consultationrequest/{obj.request.id}/change/"
            return format_html(
                '<a href="{}">{} - {}</a>', 
                url, obj.request.client.username, obj.request.service.name
            )
        return "—"
    request_link.short_description = "Request"
    
    def status_badge(self, obj):
        colors = {
            'pending': '#f59e0b',
            'completed': '#10b981',
            'cancelled': '#ef4444',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; border-radius: 8px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status Badge"


# ============ SERVICE IMAGE ADMIN (Standalone) ============
@admin.register(ServiceImage)
class ServiceImageAdmin(admin.ModelAdmin):
    list_display = ['service', 'image_preview', 'caption', 'order', 'is_active']
    list_filter = ['is_active', 'service__category']
    search_fields = ['caption', 'alt_text', 'service__name']
    list_editable = ['order', 'is_active']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 6px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Preview"