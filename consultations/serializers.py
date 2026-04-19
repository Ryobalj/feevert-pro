# consultations/serializers.py

from rest_framework import serializers
from .models import ConsultationCategory, ConsultationService, ConsultationRequest, ConsultationDocument, ConsultationFollowup
from accounts.serializers import UserSerializer


class ConsultationCategorySerializer(serializers.ModelSerializer):
    """Serializer for Consultation Category"""
    class Meta:
        model = ConsultationCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'image', 'order', 'is_active']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class ConsultationServiceSerializer(serializers.ModelSerializer):
    """Serializer for Consultation Service"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = ConsultationService
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 'description',
            'price', 'duration_minutes', 'is_featured', 'popularity_score',
            'estimated_delivery_days', 'faq', 'prerequisites', 'order', 'is_active'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class ConsultationRequestSerializer(serializers.ModelSerializer):
    """Serializer for Consultation Request"""
    client_name = serializers.CharField(source='client.username', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ConsultationRequest
        fields = [
            'id', 'client', 'client_name', 'client_email', 'service', 'service_name',
            'preferred_date', 'message', 'budget_range', 'attachments', 'status',
            'assigned_to', 'assigned_to_name', 'admin_notes', 'response_sent_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'response_sent_at']


class ConsultationRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating consultation request"""
    class Meta:
        model = ConsultationRequest
        fields = ['service', 'preferred_date', 'message', 'budget_range']


class ConsultationDocumentSerializer(serializers.ModelSerializer):
    """Serializer for Consultation Document"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = ConsultationDocument
        fields = ['id', 'request', 'file', 'title', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class ConsultationFollowupSerializer(serializers.ModelSerializer):
    """Serializer for Consultation Followup"""
    request_info = serializers.CharField(source='request.__str__', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ConsultationFollowup
        fields = ['id', 'request', 'request_info', 'followup_date', 'notes', 'assigned_to', 'assigned_to_name', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']