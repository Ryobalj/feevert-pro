# core/management/commands/seed_data.py

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
from django.utils import timezone
from datetime import date, timedelta
import random

# Home app models
from home.models import (
    SiteSetting, HeroSection, AboutSection, ServiceHighlight, 
    SeoData, Faq, Partner, Testimonial, ContactMessage
)

# Consultations app models
from consultations.models import (
    ConsultationCategory, ConsultationService, ConsultationRequest,
    ConsultationDocument, ConsultationFollowup
)

# Bookings app models
from bookings.models import (
    TimeSlot, Booking, Availability, Holiday, BookingReminder
)

# Reviews app models
from reviews.models import Review, ReviewImage, ReviewHelpfulVote

# Notifications app models
from notifications.models import (
    Notification, NotificationTemplate, UserNotificationSetting
)

# Projects app models
from projects.models import ProjectCategory, ProjectTag, Project, ProjectImage, ProjectAward

# Careers app models
from careers.models import JobCategory, JobPost, JobApplication, SavedJob, JobAlert

# News app models
from news.models import NewsCategory, NewsPost, Comment, NewsletterSubscription

# Team app models
from team.models import Department, TeamMember, TeamMemberSocial, TeamTestimonial, TeamAchievement

# Accounts app models
from accounts.models import User, Profile, Role, UserActivityLog

# Payments app models
from payments.models import PaymentTransaction, Invoice


class Command(BaseCommand):
    help = 'Seed dummy data for FeeVert website (development only)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force seeding even if data already exists (deletes existing data first)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🌱 Starting dummy data seeding...'))
        
        force = options.get('force', False)
        
        # Check if data already exists
        if SiteSetting.objects.exists() and not force:
            self.stdout.write(self.style.WARNING('⚠️ Data already exists. Skipping seeding.'))
            self.stdout.write(self.style.WARNING('   To force seeding, run: python manage.py seed_data --force'))
            return
        
        if force and SiteSetting.objects.exists():
            self.stdout.write(self.style.WARNING('⚠️ Force mode: Deleting existing data...'))
            self._delete_all_data()
        
        self._seed_site_settings()
        self._seed_seo_data()
        self._seed_hero_section()
        self._seed_about_section()
        self._seed_service_highlights()
        self._seed_faqs()
        self._seed_partners()
        self._seed_testimonials()
        
        self._seed_consultation_categories()
        self._seed_consultation_services()
        self._seed_consultation_requests()
        
        self._seed_team_departments()
        self._seed_team_members()
        
        self._seed_project_categories()
        self._seed_project_tags()
        self._seed_projects()
        
        self._seed_job_categories()
        self._seed_job_posts()
        
        self._seed_news_categories()
        self._seed_news_posts()
        
        self._seed_reviews()
        
        self._seed_notification_templates()
        
        self.stdout.write(self.style.SUCCESS('✅ Dummy data seeding completed successfully!'))
    
    def _delete_all_data(self):
        """Delete all existing data before force seeding"""
        models_to_delete = [
            SiteSetting, HeroSection, AboutSection, ServiceHighlight, SeoData, Faq, Partner, Testimonial, ContactMessage,
            ConsultationCategory, ConsultationService, ConsultationRequest, ConsultationDocument, ConsultationFollowup,
            TimeSlot, Booking, Availability, Holiday, BookingReminder,
            Review, ReviewImage, ReviewHelpfulVote,
            Notification, NotificationTemplate, UserNotificationSetting,
            ProjectCategory, ProjectTag, Project, ProjectImage, ProjectAward,
            JobCategory, JobPost, JobApplication, SavedJob, JobAlert,
            NewsCategory, NewsPost, Comment, NewsletterSubscription,
            Department, TeamMember, TeamMemberSocial, TeamTestimonial, TeamAchievement,
            PaymentTransaction, Invoice
        ]
        
        for model in models_to_delete:
            try:
                count = model.objects.all().delete()
                if count[0] > 0:
                    self.stdout.write(f'     Deleted {count[0]} records from {model.__name__}')
            except Exception as e:
                pass
        self.stdout.write('  ✅ Existing data deleted')
    
    def _seed_site_settings(self):
        SiteSetting.objects.create(
            site_name='Fee-Vert Solution Limited',
            site_tagline='Your Trusted Consultancy Partner',
            contact_email='info@feevert.co.tz',
            contact_phone='+255 123 456 789',
            contact_address='Dar es Salaam, Tanzania',
            meta_description='Expert consultancy in Agriculture, Environment and OHS',
            primary_color='#2d6a4f',
            secondary_color='#1a1a1a',
            accent_color='#d8f3dc',
            footer_copyright_text='© 2025 Fee-Vert Solution Limited. All rights reserved.',
            is_active=True
        )
        self.stdout.write('  ✅ Site settings created')
    
    def _seed_seo_data(self):
        pages = ['home', 'about', 'services', 'projects', 'careers', 'news', 'contact']
        for page in pages:
            SeoData.objects.create(
                page_name=page,
                meta_title=f'Fee-Vert - {page.capitalize()}',
                meta_description=f'Professional consultancy services for {page} page',
                keywords='consultancy, agriculture, environment, OHS',
                is_active=True
            )
        self.stdout.write('  ✅ SEO data created')
    
    def _seed_hero_section(self):
        HeroSection.objects.create(
            title='Expert Consultancy Services',
            subtitle='We provide high-quality services at reasonable prices for individuals and enterprises.',
            cta_text='Get Free Consultation',
            cta_link='#contact',
            order=1,
            is_active=True
        )
        self.stdout.write('  ✅ Hero section created')
    
    def _seed_about_section(self):
        AboutSection.objects.create(
            title='About Fee-Vert',
            description='Fee-Vert is registered to provide consultancy and mentorship services on Agriculture & Livestock, Environment and Occupational Health & Safety (OHS). These services are offered to individuals, small, micro, medium, and large enterprises, public sector and large corporates locally and international.',
            mission='To provide high-quality services at reasonable prices',
            vision='To be the leading consultancy firm in East Africa',
            stats=[
                {'number': '50+', 'label': 'Projects Completed'},
                {'number': '30+', 'label': 'Happy Clients'},
                {'number': '10+', 'label': 'Expert Consultants'},
                {'number': '5+', 'label': 'Years Experience'}
            ],
            why_choose_us=[
                {'title': 'Expert Team', 'description': 'Highly qualified professionals', 'icon': '👥'},
                {'title': 'Quality Service', 'description': 'Commitment to excellence', 'icon': '⭐'},
                {'title': 'Affordable', 'description': 'Competitive pricing', 'icon': '💰'},
                {'title': 'Timely Delivery', 'description': 'On-time project completion', 'icon': '⏰'}
            ],
            is_active=True
        )
        self.stdout.write('  ✅ About section created')
    
    def _seed_service_highlights(self):
        services = ConsultationService.objects.all()[:3]
        for i, service in enumerate(services):
            ServiceHighlight.objects.create(
                service=service,
                title=service.name,
                description=service.description[:100],
                icon='🌾' if i == 0 else '🌿' if i == 1 else '📊',
                is_featured=True,
                order=i+1,
                is_active=True
            )
        self.stdout.write('  ✅ Service highlights created')
    
    def _seed_faqs(self):
        faqs = [
            {'question': 'What services do you offer?', 'answer': 'We offer consultancy in Agriculture, Environment, OHS, and Business Advisory.', 'category': 'general'},
            {'question': 'How can I book a consultation?', 'answer': 'You can book through our website by filling the booking form.', 'category': 'booking'},
            {'question': 'What payment methods do you accept?', 'answer': 'We accept M-Pesa, Bank Transfer, and Credit Cards.', 'category': 'payment'},
            {'question': 'Do you offer online consultations?', 'answer': 'Yes, we offer both online and onsite consultations.', 'category': 'consultation'},
        ]
        for faq in faqs:
            Faq.objects.create(
                question=faq['question'],
                answer=faq['answer'],
                category=faq['category'],
                order=1,
                is_active=True
            )
        self.stdout.write('  ✅ FAQs created')
    
    def _seed_partners(self):
        partners = [
            {'name': 'Partner One', 'website_url': 'https://example1.com'},
            {'name': 'Partner Two', 'website_url': 'https://example2.com'},
            {'name': 'Partner Three', 'website_url': 'https://example3.com'},
        ]
        for partner in partners:
            Partner.objects.create(
                name=partner['name'],
                website_url=partner['website_url'],
                order=1,
                is_active=True
            )
        self.stdout.write('  ✅ Partners created')
    
    def _seed_testimonials(self):
        testimonials = [
            {'name': 'John Mwakibete', 'role': 'Farm Manager', 'company': 'Green Farms Ltd', 'content': 'Fee-Vert transformed our agricultural operations. Highly recommended!', 'rating': 5},
            {'name': 'Sarah Mushi', 'role': 'Safety Officer', 'company': 'Mining Corp', 'content': 'Their OHS consultancy helped us achieve full compliance.', 'rating': 5},
            {'name': 'Peter Kapinga', 'role': 'CEO', 'company': 'Business Solutions', 'content': 'Strategic planning session was invaluable for our growth.', 'rating': 4},
        ]
        for t in testimonials:
            Testimonial.objects.create(
                client_name=t['name'],
                client_role=t['role'],
                client_company=t['company'],
                content=t['content'],
                rating=t['rating'],
                is_active=True,
                is_approved=True
            )
        self.stdout.write('  ✅ Testimonials created')
    
    def _seed_consultation_categories(self):
        categories = [
            {'name': 'Agriculture Consultancy', 'slug': 'agriculture', 'order': 1},
            {'name': 'Environment & OHS', 'slug': 'environment', 'order': 2},
            {'name': 'Business Advisory', 'slug': 'business', 'order': 3},
            {'name': 'Livestock Management', 'slug': 'livestock', 'order': 4},
        ]
        for cat in categories:
            ConsultationCategory.objects.create(
                name=cat['name'],
                slug=cat['slug'],
                description=f'Professional {cat["name"]} services',
                order=cat['order'],
                is_active=True
            )
        self.stdout.write('  ✅ Consultation categories created')
    
    def _seed_consultation_services(self):
        agri = ConsultationCategory.objects.get(slug='agriculture')
        env = ConsultationCategory.objects.get(slug='environment')
        bus = ConsultationCategory.objects.get(slug='business')
        
        services = [
            {'category': agri, 'name': 'Crop Management', 'description': 'Expert advice on crop planning, planting, and harvesting', 'price': 50000, 'duration_minutes': 60, 'is_featured': True},
            {'category': agri, 'name': 'Livestock Consultancy', 'description': 'Animal health, breeding, and farm management', 'price': 75000, 'duration_minutes': 90, 'is_featured': True},
            {'category': agri, 'name': 'Soil Analysis', 'description': 'Comprehensive soil testing and recommendations', 'price': 45000, 'duration_minutes': 60, 'is_featured': False},
            {'category': env, 'name': 'Environmental Impact Assessment', 'description': 'Comprehensive EIA for your projects', 'price': 150000, 'duration_minutes': 120, 'is_featured': True},
            {'category': env, 'name': 'Workplace Safety Audit', 'description': 'OHS compliance and safety recommendations', 'price': 100000, 'duration_minutes': 90, 'is_featured': True},
            {'category': env, 'name': 'Waste Management Consultancy', 'description': 'Sustainable waste management solutions', 'price': 80000, 'duration_minutes': 90, 'is_featured': False},
            {'category': bus, 'name': 'Business Strategic Planning', 'description': 'Develop winning business strategies', 'price': 200000, 'duration_minutes': 120, 'is_featured': True},
            {'category': bus, 'name': 'Market Research', 'description': 'In-depth market analysis and insights', 'price': 125000, 'duration_minutes': 90, 'is_featured': False},
            {'category': bus, 'name': 'Financial Advisory', 'description': 'Expert financial planning and analysis', 'price': 175000, 'duration_minutes': 90, 'is_featured': False},
        ]
        for s in services:
            ConsultationService.objects.create(
                category=s['category'],
                name=s['name'],
                description=s['description'],
                price=s['price'],
                duration_minutes=s['duration_minutes'],
                is_featured=s['is_featured'],
                is_active=True
            )
        self.stdout.write('  ✅ Consultation services created')
    
    def _seed_consultation_requests(self):
        # Get or create a test user
        user, _ = User.objects.get_or_create(
            username='testclient',
            defaults={
                'email': 'test@example.com',
                'role': 'client',
                'is_active': True
            }
        )
        if user.pk:
            user.set_password('test123')
            user.save()
        
        service = ConsultationService.objects.first()
        if service:
            ConsultationRequest.objects.create(
                client=user,
                service=service,
                preferred_date=timezone.now() + timedelta(days=7),
                message='I need consultation on crop management',
                budget_range='50,000 - 100,000 TZS',
                status='pending'
            )
        self.stdout.write('  ✅ Consultation requests created')
    
    def _seed_team_departments(self):
        departments = [
            {'name': 'Management', 'order': 1},
            {'name': 'Consultancy', 'order': 2},
            {'name': 'Administration', 'order': 3},
        ]
        for dept in departments:
            Department.objects.create(
                name=dept['name'],
                order=dept['order'],
                is_active=True
            )
        self.stdout.write('  ✅ Team departments created')
    
    def _seed_team_members(self):
        dept = Department.objects.first()
        team_members = [
            {'name': 'Dennis Simon Ryoba', 'role': 'Founder & CEO', 'bio': 'Experienced consultant in Agriculture and Business', 'order': 1, 'email': 'dennis@feevert.co.tz'},
            {'name': 'Jane Mwakibete', 'role': 'Senior Environmental Consultant', 'bio': 'Expert in environmental management and OHS', 'order': 2, 'email': 'jane@feevert.co.tz'},
            {'name': 'John Mushi', 'role': 'Agricultural Specialist', 'bio': 'Specialist in crop management and agribusiness', 'order': 3, 'email': 'john@feevert.co.tz'},
            {'name': 'Mary Mwakyembe', 'role': 'Business Advisor', 'bio': 'Strategic planning and business development expert', 'order': 4, 'email': 'mary@feevert.co.tz'},
        ]
        for member in team_members:
            TeamMember.objects.create(
                full_name=member['name'],
                role=member['role'],
                bio=member['bio'],
                email=member['email'],
                department=dept,
                order=member['order'],
                is_featured=True,
                is_active=True
            )
        self.stdout.write('  ✅ Team members created')
    
    def _seed_project_categories(self):
        categories = [
            {'name': 'Agriculture Projects', 'slug': 'agriculture-projects'},
            {'name': 'Environment Projects', 'slug': 'environment-projects'},
            {'name': 'Business Projects', 'slug': 'business-projects'},
        ]
        for cat in categories:
            ProjectCategory.objects.get_or_create(
                slug=cat['slug'],
                defaults={
                    'name': cat['name'],
                    'is_active': True
                }
            )
        self.stdout.write('  ✅ Project categories created')
    
    def _seed_project_tags(self):
        tags = ['Agriculture', 'Environment', 'Business', 'Consultancy', 'Training']
        for tag in tags:
            ProjectTag.objects.get_or_create(name=tag, slug=tag.lower())
        self.stdout.write('  ✅ Project tags created')
    
    def _seed_projects(self):
        cat = ProjectCategory.objects.first()
        tag = ProjectTag.objects.first()
        
        projects = [
            {'title': 'Agricultural Transformation Project', 'client': 'Ministry of Agriculture', 'description': 'Led a major agricultural transformation initiative across 5 regions', 'is_featured': True},
            {'title': 'Environmental Impact Assessment', 'client': 'Mining Company Ltd', 'description': 'Conducted comprehensive EIA for large-scale mining operations', 'is_featured': True},
            {'title': 'SME Strategic Planning', 'client': 'SME Association of Tanzania', 'description': 'Developed strategic plans for 50+ small and medium enterprises', 'is_featured': True},
            {'title': 'Workplace Safety Implementation', 'client': 'Manufacturing Corp', 'description': 'Implemented full OHS system for a manufacturing facility', 'is_featured': False},
            {'title': 'Market Entry Strategy', 'client': 'International Company', 'description': 'Developed market entry strategy for East African region', 'is_featured': False},
        ]
        for proj in projects:
            project = Project.objects.create(
                title=proj['title'],
                client_name=proj['client'],
                description=proj['description'],
                category=cat,
                status='published',
                is_featured=proj['is_featured'],
                is_active=True
            )
            project.tags.add(tag)
        self.stdout.write('  ✅ Projects created')
    
    def _seed_job_categories(self):
        categories = [
            {'name': 'Consulting', 'order': 1},
            {'name': 'Administration', 'order': 2},
            {'name': 'Technical', 'order': 3},
        ]
        for cat in categories:
            JobCategory.objects.create(
                name=cat['name'],
                order=cat['order'],
                is_active=True
            )
        self.stdout.write('  ✅ Job categories created')
    
    def _seed_job_posts(self):
        cat = JobCategory.objects.first()
        jobs = [
            {'title': 'Senior Agriculture Consultant', 'location': 'Dar es Salaam', 'employment_type': 'full_time', 'deadline': date.today() + timedelta(days=30)},
            {'title': 'Environmental Specialist', 'location': 'Arusha', 'employment_type': 'full_time', 'deadline': date.today() + timedelta(days=30)},
            {'title': 'Business Development Manager', 'location': 'Dar es Salaam', 'employment_type': 'full_time', 'deadline': date.today() + timedelta(days=30)},
        ]
        for job in jobs:
            JobPost.objects.create(
                title=job['title'],
                slug=job['title'].lower().replace(' ', '-'),
                category=cat,
                location=job['location'],
                employment_type=job['employment_type'],
                description='We are looking for a qualified professional to join our team.',
                requirements='Bachelor degree, 5+ years experience',
                responsibilities='Lead projects, client management, reporting',
                deadline=job['deadline'],
                is_active=True
            )
        self.stdout.write('  ✅ Job posts created')
    
    def _seed_news_categories(self):
        categories = [
            {'name': 'Company News', 'slug': 'company-news'},
            {'name': 'Industry Updates', 'slug': 'industry-updates'},
            {'name': 'Announcements', 'slug': 'announcements'},
        ]
        for cat in categories:
            NewsCategory.objects.create(
                name=cat['name'],
                slug=cat['slug'],
                is_active=True
            )
        self.stdout.write('  ✅ News categories created')
    
    def _seed_news_posts(self):
        cat = NewsCategory.objects.first()
        user = User.objects.first()
        
        posts = [
            {'title': 'Fee-Vert Expands Operations', 'content': 'We are excited to announce our expansion to new regions across East Africa. This strategic move will allow us to serve more clients and provide better support.', 'is_featured': True},
            {'title': 'New Environmental Regulations 2025', 'content': 'Stay updated with the latest environmental regulations coming into effect in 2025. Our team is ready to help you comply.', 'is_featured': True},
            {'title': 'Upcoming Training Sessions', 'content': 'Register for our upcoming training sessions on OHS and Environmental Management. Limited seats available.', 'is_featured': False},
        ]
        for post in posts:
            NewsPost.objects.create(
                title=post['title'],
                slug=post['title'].lower().replace(' ', '-'),
                category=cat,
                content=post['content'],
                excerpt=post['content'][:150],
                author=user,
                is_published=True,
                is_featured=post['is_featured'],
                is_active=True
            )
        self.stdout.write('  ✅ News posts created')
    
    def _seed_reviews(self):
        user = User.objects.first()
        service = ConsultationService.objects.first()
        
        if user and service:
            Review.objects.create(
                client=user,
                consultation=None,
                booking=None,
                rating=5,
                title='Excellent Service!',
                comment='Very professional and knowledgeable consultants. Highly recommended!',
                verified_purchase=True,
                is_approved=True
            )
        self.stdout.write('  ✅ Reviews created')
    
    def _seed_notification_templates(self):
        templates = [
            {'name': 'booking_confirmation', 'category': 'booking', 'subject': 'Booking Confirmation', 'body_text': 'Your booking has been confirmed. Thank you for choosing Fee-Vert.'},
            {'name': 'consultation_reminder', 'category': 'consultation', 'subject': 'Consultation Reminder', 'body_text': 'Reminder for your upcoming consultation. Please be on time.'},
            {'name': 'payment_receipt', 'category': 'payment', 'subject': 'Payment Receipt', 'body_text': 'Thank you for your payment. Your transaction has been completed successfully.'},
        ]
        for template in templates:
            NotificationTemplate.objects.get_or_create(
                name=template['name'],
                defaults={
                    'category': template['category'],
                    'subject': template['subject'],
                    'body_text': template['body_text'],
                    'is_active': True
                }
            )
        self.stdout.write('  ✅ Notification templates created')

