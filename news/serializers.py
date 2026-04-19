# news/serializers.py

from rest_framework import serializers
from .models import NewsCategory, NewsPost, Comment, NewsletterSubscription, NewsletterCampaign, NewsPostView


class NewsCategorySerializer(serializers.ModelSerializer):
    """Serializer for News Category"""
    class Meta:
        model = NewsCategory
        fields = ['id', 'name', 'slug', 'description', 'seo_title', 'seo_description', 'order', 'is_active']
        read_only_fields = ['id', 'slug', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for Comment"""
    post_title = serializers.CharField(source='post.title', read_only=True)
    parent_name = serializers.CharField(source='parent_comment.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'post', 'post_title', 'name', 'email', 'message', 'parent_comment', 'parent_name', 'is_approved', 'created_at']
        read_only_fields = ['id', 'is_approved', 'created_at']


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a comment"""
    class Meta:
        model = Comment
        fields = ['post', 'name', 'email', 'message', 'parent_comment']


class NewsPostSerializer(serializers.ModelSerializer):
    """Serializer for News Post"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = NewsPost
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'content', 'excerpt',
            'featured_image', 'featured_image_url', 'gallery', 'author', 'author_name',
            'tags', 'is_published', 'is_featured', 'allow_comments', 'views',
            'status_display', 'comments', 'seo_title', 'seo_description',
            'reading_time_minutes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'views', 'reading_time_minutes', 'created_at', 'updated_at']
    
    def get_featured_image_url(self, obj):
        if obj.featured_image:
            return obj.featured_image.url
        return None


class NewsPostListSerializer(serializers.ModelSerializer):
    """Serializer for News Post list view (lightweight)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = NewsPost
        fields = ['id', 'title', 'slug', 'category_name', 'excerpt', 'featured_image_url', 'views', 'created_at']
    
    def get_featured_image_url(self, obj):
        if obj.featured_image:
            return obj.featured_image.url
        return None


class NewsletterSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Newsletter Subscription"""
    class Meta:
        model = NewsletterSubscription
        fields = ['id', 'email', 'name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class NewsletterCampaignSerializer(serializers.ModelSerializer):
    """Serializer for Newsletter Campaign"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = NewsletterCampaign
        fields = ['id', 'subject', 'content', 'scheduled_for', 'sent_at', 'status', 'status_display', 'recipients_count', 'open_count', 'click_count', 'created_at']
        read_only_fields = ['id', 'sent_at', 'recipients_count', 'open_count', 'click_count', 'created_at']