# team/serializers.py

from rest_framework import serializers
from .models import Department, TeamMember, TeamMemberSocial, TeamTestimonial, TeamAchievement
from projects.serializers import ProjectListSerializer


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department"""
    head_name = serializers.CharField(source='head.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'slug', 'description', 'head', 'head_name', 'icon', 'email', 'phone', 'order', 'is_active']
        read_only_fields = ['id', 'slug', 'created_at']


class TeamMemberSocialSerializer(serializers.ModelSerializer):
    """Serializer for Team Member Social Links"""
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    
    class Meta:
        model = TeamMemberSocial
        fields = ['id', 'member', 'platform', 'platform_display', 'url']
        read_only_fields = ['id']


class TeamAchievementSerializer(serializers.ModelSerializer):
    """Serializer for Team Achievement"""
    class Meta:
        model = TeamAchievement
        fields = ['id', 'team_member', 'title', 'description', 'date', 'issuer']
        read_only_fields = ['id']


class TeamTestimonialSerializer(serializers.ModelSerializer):
    """Serializer for Team Testimonial"""
    team_member_name = serializers.CharField(source='team_member.full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True, allow_null=True)
    
    class Meta:
        model = TeamTestimonial
        fields = ['id', 'team_member', 'team_member_name', 'client_name', 'client_company', 'content', 'rating', 'project', 'project_title', 'is_approved', 'created_at']
        read_only_fields = ['id', 'created_at']


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for Team Member"""
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    profile_image_url = serializers.SerializerMethodField()
    social_links = TeamMemberSocialSerializer(many=True, read_only=True)
    achievements = TeamAchievementSerializer(many=True, read_only=True)
    testimonials = TeamTestimonialSerializer(many=True, read_only=True)
    projects = ProjectListSerializer(many=True, read_only=True)
    
    class Meta:
        model = TeamMember
        fields = [
            'id', 'full_name', 'slug', 'role', 'department', 'department_name',
            'bio', 'profile_image', 'profile_image_url', 'email', 'phone',
            'expertise_areas', 'education', 'work_experience', 'certifications', 'languages',
            'linkedin', 'twitter', 'facebook', 'instagram', 'github',
            'is_featured', 'order', 'is_active',
            'social_links', 'achievements', 'testimonials', 'projects',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_profile_image_url(self, obj):
        if obj.profile_image:
            return obj.profile_image.url
        return None


class TeamMemberListSerializer(serializers.ModelSerializer):
    """Serializer for Team Member list view (lightweight)"""
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    profile_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamMember
        fields = ['id', 'full_name', 'slug', 'role', 'department_name', 'profile_image_url', 'is_featured', 'order']
    
    def get_profile_image_url(self, obj):
        if obj.profile_image:
            return obj.profile_image.url
        return None