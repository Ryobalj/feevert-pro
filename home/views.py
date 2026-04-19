# home/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mail
from django.conf import settings
from .models import (
    SiteSetting, HeroSection, AboutSection, ServiceHighlight, SeoData,
    Faq, Partner, Testimonial, ContactMessage
)
from .serializers import (
    SiteSettingSerializer, HeroSectionSerializer, AboutSectionSerializer,
    ServiceHighlightSerializer, SeoDataSerializer, FaqSerializer,
    PartnerSerializer, TestimonialSerializer, ContactMessageSerializer,
    ContactMessageCreateSerializer
)


class SiteSettingViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Site Settings (public)"""
    queryset = SiteSetting.objects.filter(is_active=True)
    serializer_class = SiteSettingSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        return SiteSetting.objects.first()


class HeroSectionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Hero Sections (public)"""
    queryset = HeroSection.objects.filter(is_active=True)
    serializer_class = HeroSectionSerializer
    permission_classes = [AllowAny]
    ordering = ['order']


class AboutSectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AboutSection.objects.filter(is_active=True).order_by('id')  # Ongeza .order_by('id')
    serializer_class = AboutSectionSerializer
    permission_classes = [AllowAny]

class ServiceHighlightViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Service Highlights (public)"""
    queryset = ServiceHighlight.objects.filter(is_active=True)
    serializer_class = ServiceHighlightSerializer
    permission_classes = [AllowAny]
    ordering = ['order']


class SeoDataViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for SEO Data (public)"""
    queryset = SeoData.objects.all()
    serializer_class = SeoDataSerializer
    permission_classes = [AllowAny]
    lookup_field = 'page_name'


class FaqViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for FAQs (public)"""
    queryset = Faq.objects.filter(is_active=True)
    serializer_class = FaqSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']
    ordering = ['category', 'order']


class PartnerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Partners (public)"""
    queryset = Partner.objects.filter(is_active=True)
    serializer_class = PartnerSerializer
    permission_classes = [AllowAny]
    ordering = ['order']


class TestimonialViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Testimonials (public)"""
    queryset = Testimonial.objects.filter(is_active=True, is_approved=True)
    serializer_class = TestimonialSerializer
    permission_classes = [AllowAny]
    ordering = ['order']


class ContactMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for Contact Messages"""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ContactMessage.objects.all()
        return ContactMessage.objects.filter(email=user.email)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ContactMessageCreateSerializer
        return ContactMessageSerializer
    
    def perform_create(self, serializer):
        message = serializer.save()
        
        # Send email notification to admin
        try:
            send_mail(
                subject=f"New Contact Message: {message.subject}",
                message=f"From: {message.name} ({message.email})\nPhone: {message.phone}\n\nMessage:\n{message.message}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.CONTACT_FORM_EMAIL],
                fail_silently=True
            )
        except Exception:
            pass

@api_view(['GET'])
@permission_classes([AllowAny])
def get_homepage_data(request):
    """Get all homepage data in one request with language support"""
    
    # Get language from cookie or header
    language = request.COOKIES.get('django_language', 'en')
    
    # Site settings
    site_settings = SiteSetting.objects.first()
    site_settings_data = SiteSettingSerializer(site_settings, context={'request': request}).data if site_settings else None
    
    # Hero sections
    heroes = HeroSection.objects.filter(is_active=True).order_by('order')
    heroes_data = HeroSectionSerializer(heroes, many=True, context={'request': request}).data
    
    # About section
    about = AboutSection.objects.filter(is_active=True).first()
    about_data = AboutSectionSerializer(about, context={'request': request}).data if about else None
    
    # Service highlights
    services = ServiceHighlight.objects.filter(is_active=True).order_by('order')
    services_data = ServiceHighlightSerializer(services, many=True, context={'request': request}).data
    
    # Testimonials
    testimonials = Testimonial.objects.filter(is_active=True, is_approved=True).order_by('order')
    testimonials_data = TestimonialSerializer(testimonials, many=True, context={'request': request}).data
    
    # Partners
    partners = Partner.objects.filter(is_active=True).order_by('order')
    partners_data = PartnerSerializer(partners, many=True, context={'request': request}).data
    
    # Featured projects
    from projects.models import Project
    from projects.serializers import ProjectListSerializer
    featured_projects = Project.objects.filter(status='published', is_featured=True)[:6]
    projects_data = ProjectListSerializer(featured_projects, many=True, context={'request': request}).data
    
    # Featured news
    from news.models import NewsPost
    from news.serializers import NewsPostListSerializer
    featured_news = NewsPost.objects.filter(is_published=True, is_featured=True)[:3]
    news_data = NewsPostListSerializer(featured_news, many=True, context={'request': request}).data
    
    return Response({
        'current_language': language,
        'site_settings': site_settings_data,
        'heroes': heroes_data,
        'about': about_data,
        'services': services_data,
        'testimonials': testimonials_data,
        'partners': partners_data,
        'featured_projects': projects_data,
        'featured_news': news_data
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def set_language(request):
    """Set user's preferred language"""
    language_code = request.data.get('language', 'en')
    
    if language_code not in ['en', 'sw']:
        return Response({'error': 'Invalid language'}, status=400)
    
    response = Response({'success': True, 'language': language_code})
    response.set_cookie('django_language', language_code, max_age=31536000)  # 1 year
    
    # Also set session language
    request.session['django_language'] = language_code
    
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def set_language(request):
    """Set user's preferred language"""
    language = request.data.get('language', 'en')
    
    if language not in ['en', 'sw']:
        return Response({'error': 'Invalid language'}, status=400)
    
    response = Response({'success': True, 'language': language})
    response.set_cookie('django_language', language, max_age=31536000)
    request.session['django_language'] = language
    
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def get_language(request):
    """Get current language"""
    language = request.COOKIES.get('django_language', 'en')
    return Response({'language': language})
