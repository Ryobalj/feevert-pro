# home/serializers.py

from rest_framework import serializers
from modeltranslation.translator import translator
from .models import (
    SiteSetting, HeroSection, AboutSection, AboutImage, ServiceHighlight, 
    SeoData, Faq, Partner, Testimonial, ContactMessage
)
from projects.serializers import ProjectListSerializer
from consultations.serializers import ConsultationServiceSerializer


# 🆕 ABOUT IMAGE SERIALIZER
class AboutImageSerializer(serializers.ModelSerializer):
    """Serializer for About Section Gallery Images"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AboutImage
        fields = [
            'id', 'image', 'image_url', 'caption', 'section', 'order', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class SiteSettingSerializer(serializers.ModelSerializer):
    """Serializer for Site Settings with Multi-language support"""
    
    class Meta:
        model = SiteSetting
        fields = [
            'id', 'site_name', 'site_tagline', 'site_logo', 'site_logo_dark', 'favicon',
            'contact_email', 'contact_phone', 'contact_phone_alt', 'contact_address',
            'social_facebook', 'social_twitter', 'social_linkedin', 'social_instagram',
            'social_youtube', 'social_whatsapp', 'meta_description', 'meta_keywords',
            'google_analytics_id', 'primary_color', 'secondary_color', 'accent_color',
            'footer_copyright_text', 'footer_about_text', 'enable_maintenance_mode'
        ]
        read_only_fields = ['id']
    
    def to_representation(self, instance):
        """Translate fields based on current language"""
        data = super().to_representation(instance)
        
        lang = self.context.get('request', None)
        if lang:
            lang = lang.COOKIES.get('django_language', 'en')
        else:
            lang = 'en'
        
        translate_fields = ['site_name', 'site_tagline', 'footer_copyright_text', 'footer_about_text']
        for field in translate_fields:
            translated_value = getattr(instance, f'{field}_{lang}', None)
            if translated_value:
                data[field] = translated_value
        
        return data


class HeroSectionSerializer(serializers.ModelSerializer):
    """Serializer for Hero Section with Multi-language support"""
    background_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = HeroSection
        fields = [
            'id', 'title', 'subtitle', 'background_image', 'background_image_url',
            'background_overlay', 'cta_text', 'cta_link', 'cta_second_text',
            'cta_second_link', 'animation_type', 'order', 'is_active'
        ]
    
    def get_background_image_url(self, obj):
        if obj.background_image:
            return obj.background_image.url
        return None
    
    def to_representation(self, instance):
        """Translate fields based on current language"""
        data = super().to_representation(instance)
        
        lang = self.context.get('request', None)
        if lang:
            lang = lang.COOKIES.get('django_language', 'en')
        else:
            lang = 'en'
        
        translate_fields = ['title', 'subtitle', 'cta_text', 'cta_second_text']
        for field in translate_fields:
            translated_value = getattr(instance, f'{field}_{lang}', None)
            if translated_value:
                data[field] = translated_value
        
        return data


class AboutSectionSerializer(serializers.ModelSerializer):
    """Serializer for About Section with Multi-language support"""
    image_url = serializers.SerializerMethodField()
    gallery = AboutImageSerializer(many=True, read_only=True)  # ✅ ADDED
    
    class Meta:
        model = AboutSection
        fields = [
            'id', 'title', 'description', 'mission', 'vision',
            'core_values',
            'image', 'image_url',
            'video_url', 'stats', 'why_choose_us', 'is_active',
            'gallery',  # ✅ ADDED
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
    
    def to_representation(self, instance):
        """Translate fields based on current language"""
        data = super().to_representation(instance)
        
        lang = self.context.get('request', None)
        if lang:
            lang = lang.COOKIES.get('django_language', 'en')
        else:
            lang = 'en'
        
        translate_fields = ['title', 'description', 'mission', 'vision']
        for field in translate_fields:
            translated_value = getattr(instance, f'{field}_{lang}', None)
            if translated_value:
                data[field] = translated_value
        
        # Translate core_values descriptions
        if data.get('core_values') and isinstance(data['core_values'], list):
            for item in data['core_values']:
                if isinstance(item, dict):
                    for key in ['title', 'description']:
                        if key in item:
                            translated = getattr(instance, f'core_values_{key}_{lang}', None)
                            if translated:
                                item[key] = translated
        
        return data


class ServiceHighlightSerializer(serializers.ModelSerializer):
    """Serializer for Service Highlight with Multi-language support"""
    service_details = ConsultationServiceSerializer(source='service', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceHighlight
        fields = [
            'id', 'service', 'service_details', 'title', 'description', 'icon',
            'image', 'image_url', 'link', 'badge_text', 'is_featured', 'order', 'is_active'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
    
    def to_representation(self, instance):
        """Translate fields based on current language"""
        data = super().to_representation(instance)
        
        lang = self.context.get('request', None)
        if lang:
            lang = lang.COOKIES.get('django_language', 'en')
        else:
            lang = 'en'
        
        translate_fields = ['title', 'description', 'badge_text']
        for field in translate_fields:
            translated_value = getattr(instance, f'{field}_{lang}', None)
            if translated_value:
                data[field] = translated_value
        
        return data


class SeoDataSerializer(serializers.ModelSerializer):
    """Serializer for SEO Data with Multi-language support"""
    page_display = serializers.CharField(source='get_page_name_display', read_only=True)
    og_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SeoData
        fields = [
            'id', 'page_name', 'page_display', 'meta_title', 'meta_description',
            'og_image', 'og_image_url', 'canonical_url', 'keywords',
            'no_index', 'no_follow', 'created_at', 'updated_at'
        ]
    
    def get_og_image_url(self, obj):
        if obj.og_image:
            return obj.og_image.url
        return None
    
    def to_representation(self, instance):
        """Translate fields based on current language"""
        data = super().to_representation(instance)
        
        lang = self.context.get('request', None)
        if lang:
            lang = lang.COOKIES.get('django_language', 'en')
        else:
            lang = 'en'
        
        translate_fields = ['meta_title', 'meta_description', 'keywords']
        for field in translate_fields:
            translated_value = getattr(instance, f'{field}_{lang}', None)
            if translated_value:
                data[field] = translated_value
        
        return data


class FaqSerializer(serializers.ModelSerializer):
    """Serializer for FAQ with Multi-language support"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Faq
        fields = ['id', 'question', 'answer', 'category', 'category_display', 'order', 'is_active']
    
    def to_representation(self, instance):
        """Translate fields based on current language"""
        data = super().to_representation(instance)
        
        lang = self.context.get('request', None)
        if lang:
            lang = lang.COOKIES.get('django_language', 'en')
        else:
            lang = 'en'
        
        translate_fields = ['question', 'answer']
        for field in translate_fields:
            translated_value = getattr(instance, f'{field}_{lang}', None)
            if translated_value:
                data[field] = translated_value
        
        return data


class PartnerSerializer(serializers.ModelSerializer):
    """Serializer for Partner with Multi-language support"""
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Partner
        fields = ['id', 'name', 'logo', 'logo_url', 'website_url', 'description', 'order', 'is_active']
    
    def get_logo_url(self, obj):
        if obj.logo:
            return obj.logo.url
        return None
    
    def to_representation(self, instance):
        """Translate fields based on current language"""
        data = super().to_representation(instance)
        
        lang = self.context.get('request', None)
        if lang:
            lang = lang.COOKIES.get('django_language', 'en')
        else:
            lang = 'en'
        
        translate_fields = ['name', 'description']
        for field in translate_fields:
            translated_value = getattr(instance, f'{field}_{lang}', None)
            if translated_value:
                data[field] = translated_value
        
        return data


class TestimonialSerializer(serializers.ModelSerializer):
    """Serializer for Testimonial with Multi-language support"""
    client_image_url = serializers.SerializerMethodField()
    project_title = serializers.CharField(source='project.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Testimonial
        fields = [
            'id', 'client_name', 'client_role', 'client_company', 'client_image',
            'client_image_url', 'content', 'rating', 'project', 'project_title',
            'order', 'is_active', 'is_approved', 'created_at'
        ]
    
    def get_client_image_url(self, obj):
        if obj.client_image:
            return obj.client_image.url
        return None
    
    def to_representation(self, instance):
        """Translate fields based on current language"""
        data = super().to_representation(instance)
        
        lang = self.context.get('request', None)
        if lang:
            lang = lang.COOKIES.get('django_language', 'en')
        else:
            lang = 'en'
        
        translate_fields = ['client_name', 'client_role', 'client_company', 'content']
        for field in translate_fields:
            translated_value = getattr(instance, f'{field}_{lang}', None)
            if translated_value:
                data[field] = translated_value
        
        return data


class ContactMessageSerializer(serializers.ModelSerializer):
    """Serializer for Contact Message"""
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'phone', 'subject', 'message', 'is_read', 'is_replied', 'created_at']
        read_only_fields = ['id', 'is_read', 'is_replied', 'created_at']


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a contact message"""
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'phone', 'subject', 'message']