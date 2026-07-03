# feevert/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.static import serve as static_serve
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
    ConsultationFollowupViewSet, public_services_list, public_categories_tree
)
from bookings.views import (
    TimeSlotViewSet, BookingViewSet, AvailabilityViewSet,
    HolidayViewSet, BookingReminderViewSet
)
from reviews.views import ReviewViewSet, ReviewImageViewSet, ReviewHelpfulVoteViewSet
from notifications.views import (
    NotificationViewSet, NotificationTemplateViewSet,
    UserNotificationSettingViewSet, NotificationLogViewSet,
    TestEndpointViewSet, get_unread_count, mark_all_as_read,
    mark_as_read, get_notification_stats, IncomingEmailViewSet,
    EmailAccountViewSet, cron_sync_emails
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
    WhatWeDoViewSet,  # ✅ Ongeza hii
    get_homepage_data, get_what_we_do_slides  # ✅ Ongeza hii
)
from payments.views import (
    initiate_payment, verify_payment, refund_payment,
    get_transactions, get_transaction, invoices, get_invoice,
    pawapay_webhook
)

# Create main router
router = DefaultRouter()

# Accounts
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'activity-logs', UserActivityLogViewSet, basename='activity-log')

# Consultations
router.register(r'consultation-categories', ConsultationCategoryViewSet, basename='consultation-category')
router.register(r'consultation-services', ConsultationServiceViewSet, basename='consultation-service')
router.register(r'consultation-requests', ConsultationRequestViewSet, basename='consultation-request')
router.register(r'consultation-documents', ConsultationDocumentViewSet, basename='consultation-document')
router.register(r'consultation-followups', ConsultationFollowupViewSet, basename='consultation-followup')

# Bookings
router.register(r'time-slots', TimeSlotViewSet, basename='time-slot')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'availabilities', AvailabilityViewSet, basename='availability')
router.register(r'holidays', HolidayViewSet, basename='holiday')
router.register(r'booking-reminders', BookingReminderViewSet, basename='booking-reminder')

# Reviews
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'review-images', ReviewImageViewSet, basename='review-image')
router.register(r'review-votes', ReviewHelpfulVoteViewSet, basename='review-vote')

# Notifications
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'notification-templates', NotificationTemplateViewSet, basename='notification-template')
router.register(r'notification-settings', UserNotificationSettingViewSet, basename='notification-setting')
router.register(r'notification-logs', NotificationLogViewSet, basename='notification-log')
router.register(r'email-inbox', IncomingEmailViewSet, basename='incoming-email')
router.register(r'email-accounts', EmailAccountViewSet, basename='email-account')

# Projects
router.register(r'project-categories', ProjectCategoryViewSet, basename='project-category')
router.register(r'project-tags', ProjectTagViewSet, basename='project-tag')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'project-images', ProjectImageViewSet, basename='project-image')
router.register(r'project-awards', ProjectAwardViewSet, basename='project-award')

# Careers
router.register(r'job-categories', JobCategoryViewSet, basename='job-category')
router.register(r'jobs', JobPostViewSet, basename='job')
router.register(r'job-applications', JobApplicationViewSet, basename='job-application')
router.register(r'saved-jobs', SavedJobViewSet, basename='saved-job')
router.register(r'job-alerts', JobAlertViewSet, basename='job-alert')

# News
router.register(r'news-categories', NewsCategoryViewSet, basename='news-category')
router.register(r'news', NewsPostViewSet, basename='news')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'newsletter-subscriptions', NewsletterSubscriptionViewSet, basename='newsletter-subscription')
router.register(r'newsletter-campaigns', NewsletterCampaignViewSet, basename='newsletter-campaign')

# Team
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'team-members', TeamMemberViewSet, basename='team-member')
router.register(r'team-socials', TeamMemberSocialViewSet, basename='team-social')
router.register(r'team-testimonials', TeamTestimonialViewSet, basename='team-testimonial')
router.register(r'team-achievements', TeamAchievementViewSet, basename='team-achievement')

# Home
router.register(r'site-settings', SiteSettingViewSet, basename='site-setting')
router.register(r'hero-sections', HeroSectionViewSet, basename='hero-section')
router.register(r'about-sections', AboutSectionViewSet, basename='about-section')
router.register(r'service-highlights', ServiceHighlightViewSet, basename='service-highlight')
router.register(r'seo-data', SeoDataViewSet, basename='seo-data')
router.register(r'faqs', FaqViewSet, basename='faq')
router.register(r'partners', PartnerViewSet, basename='partner')
router.register(r'testimonials', TestimonialViewSet, basename='testimonial')
router.register(r'contact-messages', ContactMessageViewSet, basename='contact-message')
# ✅ What We Do - Ongeza kwenye router
router.register(r'what-we-do', WhatWeDoViewSet, basename='what-we-do')


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
            'public': {
                'services': '/api/public/services/',
                'categories_tree': '/api/public/categories-tree/',
                'category_tree': '/api/v1/consultation-categories/tree/',
            },
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
            'notifications': {
                'unread': '/api/v1/notification-counts/unread/',
                'mark_all_read': '/api/v1/notification-counts/mark-all-read/',
                'mark_read': '/api/v1/notification-counts/mark-read/<id>/',
                'test_email': '/api/v1/email/test/',
                'test_sms': '/api/v1/sms/test/',
                'stats': '/api/v1/notification-stats/',
            },
            'messaging': {
                'unread_count': '/api/realtime/unread-count/',
                'conversations': '/api/realtime/conversations/',
                'send': '/api/realtime/send/',
            },
            'language': {
                'current': '/api/language/',
                'set': '/api/language/set/',
            },
            'what_we_do': {
                'list': '/api/v1/what-we-do/',
                'slides': '/api/what-we-do-slides/',
            },
            'documentation': 'https://feevert.co.tz/docs',
        }
    })


# ============================================================
# URL PATTERNS - Standalone endpoints BEFORE router
# ============================================================
urlpatterns = [
    # API Root
    path('', api_root, name='api-root'),
    path('api/language/', include('home.urls')),
    
    # Admin
    path('feevert-admin/', admin.site.urls),
    
    # JWT Authentication
    path('api/token/', csrf_exempt(TokenObtainPairView.as_view()), name='token_obtain_pair'),
    path('api/token/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='token_refresh'),
    path('api/token/verify/', csrf_exempt(TokenVerifyView.as_view()), name='token_verify'),
    
    # Realtime (Messaging + WebSocket)
    path('api/v1/realtime/', include('realtime.urls')),
    
    # Auth
    path('api/auth/', include('accounts.urls')),
    
    # Public
    path('api/public/services/', public_services_list, name='public-services-list'),
    path('api/public/categories-tree/', public_categories_tree, name='public-categories-tree'),
    
    # Payments
    path('api/payments/initiate/', initiate_payment, name='initiate-payment'),
    path('api/payments/verify/<str:transaction_id>/', verify_payment, name='verify-payment'),
    path('api/payments/refund/<str:transaction_id>/', refund_payment, name='refund-payment'),
    path('api/payments/transactions/', get_transactions, name='get-transactions'),
    path('api/payments/transactions/<str:transaction_id>/', get_transaction, name='get-transaction'),
    path('api/payments/invoices/', invoices, name='invoices'),
    path('api/payments/invoices/<str:invoice_number>/', get_invoice, name='get-invoice'),
    
    # Webhooks
    path('webhooks/pawapay/', pawapay_webhook, name='pawapay-webhook'),

    # Cron (external scheduler, e.g. cron-job.org - see notifications/views.py:cron_sync_emails)
    path('api/cron/sync-emails/', cron_sync_emails, name='cron-sync-emails'),
    
    # Homepage
    path('api/homepage/', get_homepage_data, name='homepage-data'),
    
    # ✅ What We Do Slides - Ongeza hii
    path('api/what-we-do-slides/', get_what_we_do_slides, name='what-we-do-slides'),
    
    # ============================================
    # NOTIFICATION COUNTS (Different URL to avoid ViewSet conflict)
    # ============================================
    path('api/v1/notification-counts/unread/', get_unread_count, name='notification-counts-unread'),
    path('api/v1/notification-counts/mark-all-read/', mark_all_as_read, name='notification-counts-mark-all-read'),
    path('api/v1/notification-counts/mark-read/<int:notification_id>/', mark_as_read, name='notification-counts-mark-read'),
    
    # ============================================
    # NOTIFICATION TEST & MANAGEMENT ENDPOINTS
    # ============================================
    path('api/v1/email/test/', 
         TestEndpointViewSet.as_view({'post': 'email'}), 
         name='email-test'),
    path('api/v1/sms/test/', 
         TestEndpointViewSet.as_view({'post': 'sms'}), 
         name='sms-test'),
    path('api/v1/notifications/test/bulk/', 
         TestEndpointViewSet.as_view({'post': 'bulk'}), 
         name='notification-test-bulk'),
    path('api/v1/notifications/test/communication/', 
         TestEndpointViewSet.as_view({'post': 'communication'}), 
         name='notification-test-communication'),
    path('api/v1/notifications/templates/<int:pk>/preview/', 
         NotificationTemplateViewSet.as_view({'post': 'preview'}), 
         name='notification-template-preview'),
    path('api/v1/notifications/templates/<int:pk>/send/', 
         NotificationTemplateViewSet.as_view({'post': 'send'}), 
         name='notification-template-send'),
    path('api/v1/notification-stats/', 
         get_notification_stats, 
         name='notification-stats'),
    
    # Shop
    path('api/v1/shop/', include('shop.urls')),
    
    # ============================================
    # API v1 ROUTER (LAST - so standalone paths match first)
    # ============================================
    path('api/v1/', include(router.urls)),
]

# ============================================================
# SERVE MEDIA AND STATIC FILES
# ============================================================
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', static_serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]