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
    Faq, Partner, Testimonial, ContactMessage,
    WhatWeDo  # ✅ Ongeza hii
)
from .serializers import (
    SiteSettingSerializer, HeroSectionSerializer, AboutSectionSerializer,
    ServiceHighlightSerializer, SeoDataSerializer, FaqSerializer,
    PartnerSerializer, TestimonialSerializer, ContactMessageSerializer,
    ContactMessageCreateSerializer, WhatWeDoSerializer  # ✅ Ongeza hii
)


class SiteSettingViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Site Settings (public)"""
    queryset = SiteSetting.objects.all()
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
    """ViewSet for About Sections (public)"""
    queryset = AboutSection.objects.filter(is_active=True).order_by('id')
    serializer_class = AboutSectionSerializer
    permission_classes = [AllowAny]


class ServiceHighlightViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Service Highlights (public)"""
    queryset = ServiceHighlight.objects.filter(is_active=True)
    serializer_class = ServiceHighlightSerializer
    permission_classes = [AllowAny]
    ordering = ['order']


# ============================================================
# ✅ WHAT WE DO - VIEWSET (MPYA)
# ============================================================
class WhatWeDoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for What We Do section (public)"""
    queryset = WhatWeDo.objects.filter(is_active=True).order_by('order')
    serializer_class = WhatWeDoSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        return self.queryset.first()


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
    """ViewSet for Contact Messages - Anyone can submit, only authenticated can view"""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    
    def get_permissions(self):
        """
        - Anyone can CREATE (submit contact form)
        - Only authenticated users can READ/LIST
        """
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ContactMessage.objects.none()
        if user.role == 'admin' or user.is_staff:
            return ContactMessage.objects.all()
        return ContactMessage.objects.filter(email=user.email)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ContactMessageCreateSerializer
        return ContactMessageSerializer
    
    def perform_create(self, serializer):
        message = serializer.save()
        
        try:
            from notifications.services.communication_service import CommunicationService
            CommunicationService.notify_new_contact_message(message)
        except Exception:
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                send_mail(
                    subject=f"New Contact Message: {message.subject}",
                    message=f"From: {message.name} ({message.email})\nPhone: {message.phone}\n\nMessage:\n{message.message}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.CONTACT_FORM_EMAIL],
                    fail_silently=True,
                )
            except Exception:
                pass


@api_view(['GET'])
@permission_classes([AllowAny])
def get_homepage_data(request):
    """Get all homepage data in one request with language support"""
    
    language = request.COOKIES.get('django_language', 'en')
    
    site_settings = SiteSetting.objects.first()
    site_settings_data = SiteSettingSerializer(site_settings, context={'request': request}).data if site_settings else None
    
    heroes = HeroSection.objects.filter(is_active=True).order_by('order')
    heroes_data = HeroSectionSerializer(heroes, many=True, context={'request': request}).data
    
    about = AboutSection.objects.filter(is_active=True).first()
    about_data = AboutSectionSerializer(about, context={'request': request}).data if about else None
    
    # ✅ WHAT WE DO - Ongeza hii
    what_we_do = WhatWeDo.objects.filter(is_active=True).order_by('order').first()
    what_we_do_data = WhatWeDoSerializer(what_we_do, context={'request': request}).data if what_we_do else None
    
    services = ServiceHighlight.objects.filter(is_active=True).order_by('order')
    services_data = ServiceHighlightSerializer(services, many=True, context={'request': request}).data
    
    testimonials = Testimonial.objects.filter(is_active=True, is_approved=True).order_by('order')
    testimonials_data = TestimonialSerializer(testimonials, many=True, context={'request': request}).data
    
    partners = Partner.objects.filter(is_active=True).order_by('order')
    partners_data = PartnerSerializer(partners, many=True, context={'request': request}).data
    
    from projects.models import Project
    from projects.serializers import ProjectListSerializer
    featured_projects = Project.objects.filter(status='published', is_featured=True)[:6]
    projects_data = ProjectListSerializer(featured_projects, many=True, context={'request': request}).data
    
    from news.models import NewsPost
    from news.serializers import NewsPostListSerializer
    featured_news = NewsPost.objects.filter(is_published=True, is_featured=True)[:3]
    news_data = NewsPostListSerializer(featured_news, many=True, context={'request': request}).data
    
    return Response({
        'current_language': language,
        'site_settings': site_settings_data,
        'heroes': heroes_data,
        'about': about_data,
        'what_we_do': what_we_do_data,  # ✅ Ongeza hii
        'services': services_data,
        'testimonials': testimonials_data,
        'partners': partners_data,
        'featured_projects': projects_data,
        'featured_news': news_data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_hero_slides(request):
    """Get active hero sections for landing page slideshow"""
    heroes = HeroSection.objects.filter(is_active=True, background_image__isnull=False).order_by('order')
    
    if not heroes.exists():
        return Response({
            'heroes': [],
            'site_settings': SiteSettingSerializer(SiteSetting.objects.first(), context={'request': request}).data if SiteSetting.objects.exists() else None
        })
    
    heroes_data = HeroSectionSerializer(heroes, many=True, context={'request': request}).data
    settings_data = SiteSettingSerializer(SiteSetting.objects.first(), context={'request': request}).data if SiteSetting.objects.exists() else None
    
    return Response({
        'heroes': heroes_data,
        'site_settings': settings_data,
        'slide_duration': 5000,
        'transition_duration': 1200,
    })


# ============================================================
# ✅ WHAT WE DO - HERO SLIDES ENDPOINT (MPYA)
# ============================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_what_we_do_slides(request):
    """
    Get What We Do section data with hero-style slides
    Returns section data with images for hero-style slideshow
    """
    what_we_do_qs = WhatWeDo.objects.filter(is_active=True).order_by('order')
    what_we_do = what_we_do_qs.first()

    if not what_we_do:
        return Response({
            'has_data': False,
            'message': 'No What We Do section found'
        })

    def serialize_services(record):
        return [
            {'icon': s.icon, 'title': s.title, 'description': s.description}
            for s in record.get_services()
        ]

    # Section header (title/subtitle/description/services) comes from the
    # first active record - each additional active record becomes its own
    # slide below, rather than being ignored.
    services = serialize_services(what_we_do)

    def build_slide(record, slide_id):
        base = {
            'id': slide_id,
            'title': record.title,
            'subtitle': record.subtitle,
            'description': record.description,
            'cta_text': record.cta_text,
            'cta_link': record.cta_link,
            'services': serialize_services(record),
        }
        # Main image = background image for this record's whole turn.
        # Related images (gallery, each with its own caption) cycle inside
        # the smaller slide box.
        related_images = [
            {'image': img.image_url, 'title': img.title, 'caption': img.caption}
            for img in record.get_related_images()
        ]
        return {**base, 'image': record.image_url, 'related_images': related_images}

    slides = [build_slide(record, f'slide_{idx}') for idx, record in enumerate(what_we_do_qs)]

    return Response({
        'has_data': True,
        'id': what_we_do.id,
        'title': what_we_do.title,
        'subtitle': what_we_do.subtitle,
        'description': what_we_do.description,
        'services': services,
        'slides': slides,
        'cta_text': what_we_do.cta_text,
        'cta_link': what_we_do.cta_link,
        'slide_interval': 15000,
        'transition_duration': 800,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def set_language(request):
    """Set user's preferred language"""
    language = request.data.get('language', 'en')

    valid_codes = [code for code, _ in settings.LANGUAGES]
    if language not in valid_codes:
        return Response({'error': 'Invalid language'}, status=400)
    
    response = Response({'success': True, 'language': language})
    # In production the frontend (feevert.co.tz) and backend
    # (feevert-api.onrender.com) are genuinely different domains, so this
    # is a cross-site request from the browser's point of view. Without
    # SameSite=None the cookie defaults to Lax and never gets sent back on
    # the subsequent cross-site API calls that need it. SameSite=None
    # requires Secure, which needs HTTPS - fine in production, but local
    # dev over plain HTTP would silently drop the cookie if forced on, so
    # keep the (working) Lax/non-secure behavior there.
    if settings.DEBUG:
        response.set_cookie('django_language', language, max_age=31536000)
    else:
        response.set_cookie(
            'django_language', language, max_age=31536000,
            samesite='None', secure=True
        )
    request.session['django_language'] = language

    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def get_language(request):
    """Get current language"""
    language = request.COOKIES.get('django_language', 'en')
    return Response({'language': language})