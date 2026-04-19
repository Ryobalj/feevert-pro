from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

# Import all viewset routers
from accounts.views import UserViewSet, ProfileViewSet, RoleViewSet, UserActivityLogViewSet
from consultations.views import (
    ConsultationCategoryViewSet, ConsultationServiceViewSet,
    ConsultationRequestViewSet, ConsultationDocumentViewSet,
    ConsultationFollowupViewSet
)
from bookings.views import (
    TimeSlotViewSet, BookingViewSet, AvailabilityViewSet,
    HolidayViewSet, BookingReminderViewSet
)
from reviews.views import ReviewViewSet, ReviewImageViewSet, ReviewHelpfulVoteViewSet
from notifications.views import (
    NotificationViewSet, NotificationTemplateViewSet,
    UserNotificationSettingViewSet
)
from projects.views import (
    ProjectCategoryViewSet, ProjectTagViewSet, ProjectViewSet,
    ProjectImageViewSet, ProjectAwardViewSet
)
from careers.views import (
    JobCategoryViewSet, JobPostViewSet, JobApplicationViewSet,
    SavedJobViewSet, JobAlertViewSet
)
from news.views import (
    NewsCategoryViewSet, NewsPostViewSet, CommentViewSet,
    NewsletterSubscriptionViewSet, NewsletterCampaignViewSet
)
from team.views import (
    DepartmentViewSet, TeamMemberViewSet, TeamMemberSocialViewSet,
    TeamTestimonialViewSet, TeamAchievementViewSet
)
from home.views import (
    SiteSettingViewSet, HeroSectionViewSet, AboutSectionViewSet,
    ServiceHighlightViewSet, SeoDataViewSet, FaqViewSet,
    PartnerViewSet, TestimonialViewSet, ContactMessageViewSet,
    get_homepage_data
)
from payments.views import (
    initiate_payment, verify_payment, refund_payment,
    get_transactions, get_transaction, invoices, get_invoice,
    pawapay_webhook
)

# Create main router
router = DefaultRouter()

# Accounts
router.register(r'users', UserViewSet)
router.register(r'profiles', ProfileViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'activity-logs', UserActivityLogViewSet)

# Consultations
router.register(r'consultation-categories', ConsultationCategoryViewSet)
router.register(r'consultation-services', ConsultationServiceViewSet)
router.register(r'consultation-requests', ConsultationRequestViewSet)
router.register(r'consultation-documents', ConsultationDocumentViewSet)
router.register(r'consultation-followups', ConsultationFollowupViewSet)

# Bookings
router.register(r'time-slots', TimeSlotViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'availabilities', AvailabilityViewSet)
router.register(r'holidays', HolidayViewSet)
router.register(r'booking-reminders', BookingReminderViewSet)

# Reviews
router.register(r'reviews', ReviewViewSet)
router.register(r'review-images', ReviewImageViewSet)
router.register(r'review-votes', ReviewHelpfulVoteViewSet)

# Notifications
router.register(r'notifications', NotificationViewSet)
router.register(r'notification-templates', NotificationTemplateViewSet)
router.register(r'notification-settings', UserNotificationSettingViewSet)

# Projects
router.register(r'project-categories', ProjectCategoryViewSet)
router.register(r'project-tags', ProjectTagViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'project-images', ProjectImageViewSet)
router.register(r'project-awards', ProjectAwardViewSet)

# Careers
router.register(r'job-categories', JobCategoryViewSet)
router.register(r'jobs', JobPostViewSet)
router.register(r'job-applications', JobApplicationViewSet)
router.register(r'saved-jobs', SavedJobViewSet)
router.register(r'job-alerts', JobAlertViewSet)

# News
router.register(r'news-categories', NewsCategoryViewSet)
router.register(r'news', NewsPostViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'newsletter-subscriptions', NewsletterSubscriptionViewSet)
router.register(r'newsletter-campaigns', NewsletterCampaignViewSet)

# Team
router.register(r'departments', DepartmentViewSet)
router.register(r'team-members', TeamMemberViewSet)
router.register(r'team-socials', TeamMemberSocialViewSet)
router.register(r'team-testimonials', TeamTestimonialViewSet)
router.register(r'team-achievements', TeamAchievementViewSet)

# Home
router.register(r'site-settings', SiteSettingViewSet)
router.register(r'hero-sections', HeroSectionViewSet)
router.register(r'about-sections', AboutSectionViewSet)
router.register(r'service-highlights', ServiceHighlightViewSet)
router.register(r'seo-data', SeoDataViewSet)
router.register(r'faqs', FaqViewSet)
router.register(r'partners', PartnerViewSet)
router.register(r'testimonials', TestimonialViewSet)
router.register(r'contact-messages', ContactMessageViewSet)


def api_root(request):
    """API root endpoint - returns available endpoints"""
    return JsonResponse({
        'name': 'FeeVert API',
        'version': '1.0.0',
        'status': 'operational',
        'endpoints': {
            'homepage_data': '/api/homepage/',
            'api_v1': '/api/v1/',
            'admin': '/feevert-admin/',
            'auth': {
                'token': '/api/token/',
                'token_refresh': '/api/token/refresh/',
                'token_verify': '/api/token/verify/',
                'register': '/api/auth/register/',
                'login': '/api/auth/login/',
                'logout': '/api/auth/logout/',
                'change_password': '/api/auth/change-password/',
            },
            'payments': {
                'initiate': '/api/payments/initiate/',
                'verify': '/api/payments/verify/<transaction_id>/',
                'refund': '/api/payments/refund/<transaction_id>/',
                'transactions': '/api/payments/transactions/',
                'invoices': '/api/payments/invoices/',
            },
            'webhooks': {
                'pawapay': '/webhooks/pawapay/',
            },
            'language': {
                'current': '/api/language/',
                'set': '/api/language/set/',
            },
            'documentation': 'https://feevert.co.tz/docs',
        }
    })


urlpatterns = [
    # API Root - Main landing page (returns JSON)
    path('', api_root, name='api-root'),
    path('api/language/', include('home.urls')),
    
    # Admin panel (custom URL for security)
    path('feevert-admin/', admin.site.urls),
    
    # API v1 - includes all registered routers
    path('api/v1/', include(router.urls)),
    
    # JWT Authentication (csrf_exempt for API usage - no CSRF needed)
    path('api/token/', csrf_exempt(TokenObtainPairView.as_view()), name='token_obtain_pair'),
    path('api/token/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='token_refresh'),
    path('api/token/verify/', csrf_exempt(TokenVerifyView.as_view()), name='token_verify'),
    
    path('realtime/', include('realtime.urls')),
    
    # Custom Auth Endpoints
    path('api/auth/', include('accounts.urls')),
    
    # Payments Endpoints
    path('api/payments/initiate/', initiate_payment, name='initiate-payment'),
    path('api/payments/verify/<str:transaction_id>/', verify_payment, name='verify-payment'),
    path('api/payments/refund/<str:transaction_id>/', refund_payment, name='refund-payment'),
    path('api/payments/transactions/', get_transactions, name='get-transactions'),
    path('api/payments/transactions/<str:transaction_id>/', get_transaction, name='get-transaction'),
    path('api/payments/invoices/', invoices, name='invoices'),
    path('api/payments/invoices/<str:invoice_number>/', get_invoice, name='get-invoice'),
    
    # Webhooks (no auth) - PawaPay
    path('webhooks/pawapay/', pawapay_webhook, name='pawapay-webhook'),
    
    # Homepage aggregated data API
    path('api/homepage/', get_homepage_data, name='homepage-data'),
]

# ============================================================
# SERVE MEDIA AND STATIC FILES (DEVELOPMENT & PRODUCTION)
# ============================================================
# Hii inahakikisha media files (picha, logos) zinaservewa hata kwenye Render
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # Kwenye production, Whitenoise inaserve static files, lakini media tunaziserve manually
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)