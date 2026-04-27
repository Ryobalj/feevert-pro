# consultations/serializers.py

from rest_framework import serializers
from .models import (
    ConsultationCategory, ConsultationService, ConsultationRequest,
    ConsultationDocument, ConsultationFollowup, ServiceImage
)


# ============ SERVICE IMAGE SERIALIZER ============
class ServiceImageSerializer(serializers.ModelSerializer):
    """Serializer for Service Gallery Images"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceImage
        fields = [
            'id', 'image', 'image_url', 'caption', 'alt_text', 
            'order', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


# ============ CATEGORY SERIALIZER ============
class ConsultationCategorySerializer(serializers.ModelSerializer):
    """Serializer for Consultation Category"""
    children = serializers.SerializerMethodField()
    service_count = serializers.IntegerField(read_only=True)
    level_name = serializers.CharField(read_only=True)
    full_path = serializers.CharField(read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ConsultationCategory
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'image', 'image_url',
            'parent', 'parent_name', 'level', 'level_name', 'full_path',
            'children', 'service_count', 'order', 'is_active',
            'seo_title', 'seo_description'
        ]
        read_only_fields = ['id', 'slug', 'level', 'created_at', 'updated_at']
    
    def get_children(self, obj):
        """Get immediate children of this category"""
        children = obj.children.filter(is_active=True).order_by('order', 'name')
        if children.exists():
            return ConsultationCategoryListSerializer(
                children, many=True, context=self.context
            ).data
        return []
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ConsultationCategoryListSerializer(serializers.ModelSerializer):
    """Simplified category serializer for list/children"""
    service_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ConsultationCategory
        fields = [
            'id', 'name', 'slug', 'icon', 'level', 'level_name',
            'full_path', 'service_count', 'order', 'is_active'
        ]


class ConsultationCategoryTreeSerializer(serializers.ModelSerializer):
    """Full tree structure with nested children"""
    children = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    service_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ConsultationCategory
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'image',
            'level', 'level_name', 'full_path', 'children', 'services',
            'service_count', 'order', 'is_active'
        ]
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('order', 'name')
        if children.exists():
            return ConsultationCategoryTreeSerializer(
                children, many=True, context=self.context
            ).data
        return []
    
    def get_services(self, obj):
        services = obj.services.filter(is_active=True).order_by('order', 'name')
        if services.exists():
            return ConsultationServiceListSerializer(
                services, many=True, context=self.context
            ).data
        return []


# ============ SERVICE SERIALIZER ============
class ConsultationServiceSerializer(serializers.ModelSerializer):
    """Full serializer for Consultation Service"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_path = serializers.CharField(read_only=True)
    display_price = serializers.CharField(read_only=True)
    image_url = serializers.SerializerMethodField()
    gallery = ServiceImageSerializer(many=True, read_only=True)
    all_images = serializers.SerializerMethodField()
    primary_image_url = serializers.CharField(read_only=True)
    request_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ConsultationService
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 'category_slug',
            'category_path', 'description', 'icon', 'image', 'image_url',
            'price', 'currency', 'price_type', 'display_price',
            'price_range_min', 'price_range_max',
            'duration_minutes', 'estimated_delivery_days', 'max_clients',
            'is_featured', 'is_active', 'popularity_score', 'order',
            'benefits', 'faq', 'prerequisites', 'deliverables',
            'gallery', 'all_images', 'primary_image_url', 'request_count',
            'seo_title', 'seo_description'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_all_images(self, obj):
        return ServiceImageSerializer(
            obj.all_images, many=True, context=self.context
        ).data


class ConsultationServiceListSerializer(serializers.ModelSerializer):
    """Simplified serializer for service lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_path = serializers.CharField(read_only=True)
    display_price = serializers.CharField(read_only=True)
    image_url = serializers.SerializerMethodField()
    primary_image_url = serializers.CharField(read_only=True)
    
    class Meta:
        model = ConsultationService
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 'category_path',
            'description', 'icon', 'image_url', 'primary_image_url',
            'price_type', 'display_price', 'duration_minutes',
            'is_featured', 'is_active', 'popularity_score', 'order'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


# ============ REQUEST SERIALIZER ============
class ConsultationRequestSerializer(serializers.ModelSerializer):
    """Full serializer for Consultation Request"""
    client_name = serializers.CharField(source='client.full_name', read_only=True, allow_null=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    client_phone = serializers.CharField(source='client.phone', read_only=True, allow_null=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_category = serializers.CharField(source='service.category.full_path', read_only=True)
    assigned_to_name = serializers.CharField(
        source='assigned_to.full_name', read_only=True, allow_null=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    document_count = serializers.IntegerField(read_only=True)
    followup_count = serializers.IntegerField(read_only=True)
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = ConsultationRequest
        fields = [
            'id', 'client', 'client_name', 'client_email', 'client_phone',
            'service', 'service_name', 'service_category',
            'preferred_date', 'preferred_time', 'alternative_date',
            'message', 'budget_range', 'attachments',
            'status', 'status_display', 'priority', 'priority_display',
            'assigned_to', 'assigned_to_name',
            'admin_notes', 'internal_notes',
            'response_sent_at', 'completed_at', 'is_overdue',
            'client_feedback', 'client_rating',
            'document_count', 'followup_count', 'documents',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'response_sent_at', 'completed_at'
        ]
        extra_kwargs = {
            'internal_notes': {'write_only': True},  # Staff only, not exposed to clients
        }
    
    def get_documents(self, obj):
        documents = obj.documents.all()
        if documents.exists():
            return ConsultationDocumentSerializer(
                documents, many=True, context=self.context
            ).data
        return []
    
    def to_representation(self, instance):
        """Hide internal_notes from non-staff users"""
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and not request.user.is_staff:
            data.pop('internal_notes', None)
        return data


class ConsultationRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a consultation request"""
    class Meta:
        model = ConsultationRequest
        fields = [
            'service', 'preferred_date', 'preferred_time',
            'alternative_date', 'message', 'budget_range'
        ]
    
    def validate_preferred_date(self, value):
        from django.utils import timezone
        if value < timezone.now():
            raise serializers.ValidationError("Preferred date cannot be in the past")
        return value


class ConsultationRequestUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating request (admin/staff)"""
    class Meta:
        model = ConsultationRequest
        fields = [
            'status', 'priority', 'assigned_to', 'admin_notes',
            'internal_notes', 'response_sent_at', 'completed_at'
        ]


# ============ DOCUMENT SERIALIZER ============
class ConsultationDocumentSerializer(serializers.ModelSerializer):
    """Serializer for Consultation Document"""
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.full_name', read_only=True, allow_null=True
    )
    document_type_display = serializers.CharField(
        source='get_document_type_display', read_only=True
    )
    file_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ConsultationDocument
        fields = [
            'id', 'request', 'file', 'file_url', 'title',
            'document_type', 'document_type_display', 'description',
            'uploaded_by', 'uploaded_by_name', 'file_size', 'file_size_display',
            'created_at'
        ]
        read_only_fields = ['id', 'file_size', 'created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_size_display(self, obj):
        if obj.file_size:
            size = obj.file_size
            if size < 1024:
                return f"{size} B"
            elif size < 1024 * 1024:
                return f"{size / 1024:.1f} KB"
            else:
                return f"{size / (1024 * 1024):.1f} MB"
        return None


# ============ FOLLOWUP SERIALIZER ============
class ConsultationFollowupSerializer(serializers.ModelSerializer):
    """Serializer for Consultation Followup"""
    request_info = serializers.CharField(source='request.__str__', read_only=True)
    assigned_to_name = serializers.CharField(
        source='assigned_to.full_name', read_only=True, allow_null=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ConsultationFollowup
        fields = [
            'id', 'request', 'request_info', 'followup_date', 'notes',
            'assigned_to', 'assigned_to_name', 'status', 'status_display',
            'completed_at', 'reminder_sent', 'created_at'
        ]
        read_only_fields = ['id', 'completed_at', 'created_at']