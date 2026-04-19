# projects/serializers.py

from rest_framework import serializers
from .models import ProjectCategory, ProjectTag, Project, ProjectImage, ProjectAward


class ProjectCategorySerializer(serializers.ModelSerializer):
    """Serializer for Project Category"""
    parent_name = serializers.CharField(source='parent_category.name', read_only=True, allow_null=True)
    
    class Meta:
        model = ProjectCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'image', 'parent_category', 'parent_name', 'order', 'is_active']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class ProjectTagSerializer(serializers.ModelSerializer):
    """Serializer for Project Tag"""
    class Meta:
        model = ProjectTag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id', 'slug']


class ProjectImageSerializer(serializers.ModelSerializer):
    """Serializer for Project Image"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectImage
        fields = ['id', 'project', 'image', 'image_url', 'caption', 'is_cover', 'order']
        read_only_fields = ['id']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class ProjectAwardSerializer(serializers.ModelSerializer):
    """Serializer for Project Award"""
    class Meta:
        model = ProjectAward
        fields = ['id', 'project', 'award_name', 'awarding_body', 'year', 'description']
        read_only_fields = ['id']


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags = ProjectTagSerializer(many=True, read_only=True)
    images = ProjectImageSerializer(many=True, read_only=True)
    awards = ProjectAwardSerializer(many=True, read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'tags',
            'description', 'cover_image', 'cover_image_url', 'gallery',
            'client_name', 'completion_date', 'technologies_used', 'video_url',
            'testimonial', 'testimonial_author', 'challenges', 'solutions', 'results',
            'is_featured', 'status', 'status_display', 'images', 'awards',
            'meta_title', 'meta_description', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_cover_image_url(self, obj):
        if obj.cover_image:
            return obj.cover_image.url
        return None


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for Project list view (lightweight)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'title', 'slug', 'category_name', 'cover_image_url', 'client_name', 'completion_date', 'is_featured']
    
    def get_cover_image_url(self, obj):
        if obj.cover_image:
            return obj.cover_image.url
        return None