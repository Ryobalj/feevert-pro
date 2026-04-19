# careers/serializers.py

from rest_framework import serializers
from .models import JobCategory, JobPost, JobApplication, SavedJob, JobAlert


class JobCategorySerializer(serializers.ModelSerializer):
    """Serializer for Job Category"""
    class Meta:
        model = JobCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'order', 'is_active']
        read_only_fields = ['id', 'slug', 'created_at']


class JobPostSerializer(serializers.ModelSerializer):
    """Serializer for Job Post"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    experience_level_display = serializers.CharField(source='get_experience_level_display', read_only=True)
    remote_option_display = serializers.CharField(source='get_remote_option_display', read_only=True)
    
    class Meta:
        model = JobPost
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'description',
            'requirements', 'responsibilities', 'location', 'employment_type',
            'employment_type_display', 'experience_level', 'experience_level_display',
            'remote_option', 'remote_option_display', 'salary_range_min', 'salary_range_max',
            'salary_currency', 'vacancies_count', 'deadline', 'is_active', 'is_featured',
            'seo_title', 'seo_description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class JobPostListSerializer(serializers.ModelSerializer):
    """Serializer for Job Post list view (lightweight)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    
    class Meta:
        model = JobPost
        fields = ['id', 'title', 'slug', 'category_name', 'location', 'employment_type_display', 'deadline', 'is_featured']


class JobApplicationSerializer(serializers.ModelSerializer):
    """Serializer for Job Application"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'job_title', 'full_name', 'email', 'phone', 'cv_file',
            'cover_letter', 'portfolio_url', 'linkedin_url', 'expected_salary',
            'earliest_start_date', 'heard_from', 'status', 'status_display',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'interview_date',
            'interview_notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'reviewed_at']


class JobApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a job application"""
    class Meta:
        model = JobApplication
        fields = ['job', 'full_name', 'email', 'phone', 'cv_file', 'cover_letter', 'portfolio_url', 'linkedin_url', 'expected_salary', 'earliest_start_date', 'heard_from']


class SavedJobSerializer(serializers.ModelSerializer):
    """Serializer for Saved Job"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    
    class Meta:
        model = SavedJob
        fields = ['id', 'user', 'user_name', 'job', 'job_title', 'created_at']
        read_only_fields = ['id', 'created_at']


class JobAlertSerializer(serializers.ModelSerializer):
    """Serializer for Job Alert"""
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    
    class Meta:
        model = JobAlert
        fields = ['id', 'email', 'category', 'category_name', 'location', 'frequency', 'frequency_display', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']