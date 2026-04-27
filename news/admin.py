# news/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    NewsCategory, NewsPost, Comment, 
    NewsletterSubscription, NewsletterCampaign, NewsPostView
)

@admin.register(NewsCategory)
class NewsCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('order',)

@admin.register(NewsPost)
class NewsPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author', 'is_published', 'is_featured', 'views', 'created_at')
    list_filter = ('category', 'is_published', 'is_featured', 'created_at')
    search_fields = ('title', 'content', 'excerpt')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ('is_published', 'is_featured')
    readonly_fields = ('views', 'reading_time_minutes')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'category', 'author', 'featured_image')
        }),
        ('Content', {
            'fields': ('excerpt', 'content', 'gallery')
        }),
        ('Metadata', {
            'fields': ('tags', 'is_published', 'is_featured', 'allow_comments')
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description')
        }),
        ('Analytics', {
            'fields': ('views', 'reading_time_minutes')
        }),
    )
    
    def thumbnail(self, obj):
        if obj.featured_image:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 4px;" />', obj.featured_image.url)
        return '-'
    thumbnail.short_description = 'Image'

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('name', 'post', 'email', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('name', 'email', 'message', 'post__title')
    list_editable = ('is_approved',)
    
    actions = ['approve_comments']
    
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, f"{queryset.count()} comments approved.")
    approve_comments.short_description = "Approve selected comments"

@admin.register(NewsletterSubscription)
class NewsletterSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('email', 'name')
    list_editable = ('is_active',)

@admin.register(NewsletterCampaign)
class NewsletterCampaignAdmin(admin.ModelAdmin):
    list_display = ('subject', 'status', 'recipients_count', 'open_count', 'click_count', 'sent_at')
    list_filter = ('status', 'sent_at')
    search_fields = ('subject',)
    readonly_fields = ('recipients_count', 'open_count', 'click_count')

@admin.register(NewsPostView)
class NewsPostViewAdmin(admin.ModelAdmin):
    list_display = ('post', 'ip_address', 'viewed_at')
    list_filter = ('viewed_at',)
    search_fields = ('post__title', 'ip_address')
    readonly_fields = ('viewed_at',)