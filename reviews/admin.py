# reviews/admin.py

from django.contrib import admin
from .models import Review, ReviewImage, ReviewHelpfulVote

class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 1

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('client', 'rating', 'title', 'verified_purchase', 'is_approved', 'helpful_count', 'created_at')
    list_filter = ('rating', 'is_approved', 'verified_purchase', 'created_at')
    search_fields = ('client__username', 'client__email', 'title', 'comment')
    readonly_fields = ('helpful_count', 'not_helpful_count', 'created_at', 'updated_at')
    list_editable = ('is_approved',)
    inlines = [ReviewImageInline]
    
    actions = ['approve_reviews', 'mark_as_verified']
    
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, f"{queryset.count()} reviews approved.")
    approve_reviews.short_description = "Approve selected reviews"
    
    def mark_as_verified(self, request, queryset):
        queryset.update(verified_purchase=True)
        self.message_user(request, f"{queryset.count()} reviews marked as verified.")
    mark_as_verified.short_description = "Mark as verified purchase"

@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    list_display = ('review', 'image', 'is_featured', 'order')
    list_filter = ('is_featured',)
    search_fields = ('review__client__username', 'caption')
    list_editable = ('is_featured', 'order')

@admin.register(ReviewHelpfulVote)
class ReviewHelpfulVoteAdmin(admin.ModelAdmin):
    list_display = ('review', 'user', 'is_helpful', 'created_at')
    list_filter = ('is_helpful', 'created_at')
    search_fields = ('review__client__username', 'user__username')