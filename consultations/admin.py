# consultations/admin.py

from django.contrib import admin
from .models import (
    ConsultationCategory, ConsultationService, ConsultationRequest,
    ConsultationDocument, ConsultationFollowup
)

@admin.register(ConsultationCategory)
class ConsultationCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('order',)

@admin.register(ConsultationService)
class ConsultationServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'duration_minutes', 'is_featured', 'is_active')
    list_filter = ('category', 'is_featured', 'is_active')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('price', 'duration_minutes', 'is_featured')

@admin.register(ConsultationRequest)
class ConsultationRequestAdmin(admin.ModelAdmin):
    list_display = ('client', 'service', 'preferred_date', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'preferred_date')
    search_fields = ('client__username', 'client__email', 'service__name', 'message')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)

@admin.register(ConsultationDocument)
class ConsultationDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'request', 'uploaded_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'request__client__username')

@admin.register(ConsultationFollowup)
class ConsultationFollowupAdmin(admin.ModelAdmin):
    list_display = ('request', 'followup_date', 'assigned_to', 'status')
    list_filter = ('status', 'followup_date')
    search_fields = ('request__client__username', 'notes')