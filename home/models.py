# home/models.py

from django.db import models
from core.models import BaseModel
from projects.models import Project
from consultations.models import ConsultationService


class SiteSetting(BaseModel):
    """
    Global website settings
    """
    site_name = models.CharField(max_length=100, default="Fee-Vert Solution Limited")
    site_tagline = models.CharField(max_length=200, blank=True, help_text="Short slogan or tagline")
    site_logo = models.ImageField(upload_to='settings/', blank=True, null=True)
    site_logo_dark = models.ImageField(upload_to='settings/', blank=True, null=True, help_text="Logo for dark background")
    favicon = models.ImageField(upload_to='settings/', blank=True, null=True)
    
    # Contact information
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    contact_phone_alt = models.CharField(max_length=20, blank=True)
    contact_address = models.TextField()
    
    # Social media links
    social_facebook = models.URLField(blank=True)
    social_twitter = models.URLField(blank=True)
    social_linkedin = models.URLField(blank=True)
    social_instagram = models.URLField(blank=True)
    social_youtube = models.URLField(blank=True)
    social_whatsapp = models.CharField(max_length=20, blank=True, help_text="WhatsApp number")
    
    # SEO defaults
    meta_description = models.TextField(blank=True, help_text="Default meta description for SEO")
    meta_keywords = models.CharField(max_length=500, blank=True)
    google_analytics_id = models.CharField(max_length=50, blank=True)
    
    # Branding
    primary_color = models.CharField(max_length=20, default="#2d6a4f", help_text="Primary brand color")
    secondary_color = models.CharField(max_length=20, default="#1a1a1a", help_text="Secondary brand color")
    accent_color = models.CharField(max_length=20, default="#d8f3dc", help_text="Accent color")
    
    # Footer
    footer_copyright_text = models.CharField(max_length=200, default="© 2025 Fee-Vert Solution Limited. All rights reserved.")
    footer_about_text = models.TextField(blank=True, help_text="About text in footer")
    
    # Misc
    enable_maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Site Setting"
        verbose_name_plural = "Site Settings"
    
    def __str__(self):
        return self.site_name


class HeroSection(BaseModel):
    """
    Hero section on homepage
    """
    title = models.CharField(max_length=200)
    subtitle = models.TextField(blank=True)
    background_image = models.ImageField(upload_to='hero/')
    background_overlay = models.FloatField(default=0.5, help_text="Opacity of dark overlay (0-1)")
    cta_text = models.CharField(max_length=50, default="Get Started")
    cta_link = models.CharField(max_length=200, default="#contact")
    cta_second_text = models.CharField(max_length=50, blank=True)
    cta_second_link = models.CharField(max_length=200, blank=True)
    animation_type = models.CharField(max_length=50, default="fade-up", blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.title[:50]


class AboutSection(BaseModel):
    """
    About section on homepage
    """
    title = models.CharField(max_length=200, default="About Us")
    description = models.TextField()
    mission = models.TextField(blank=True)
    vision = models.TextField(blank=True)
    image = models.ImageField(upload_to='about/', blank=True, null=True)
    video_url = models.URLField(blank=True, help_text="YouTube/Vimeo about video")
    
    # 🆕 Core Values
    core_values = models.JSONField(
        default=list, 
        blank=True, 
        help_text="List of {icon, title, description}. Example: [{'icon': '💎', 'title': 'Integrity', 'description': '...'}]"
    )
    
    # Key statistics
    stats = models.JSONField(
        default=list, 
        blank=True, 
        help_text="List of {number, label}. Example: [{'number': '50', 'label': 'Projects Completed'}]"
    )
    
    # Why choose us
    why_choose_us = models.JSONField(
        default=list, 
        blank=True, 
        help_text="List of {icon, title, description}. Example: [{'icon': '🎓', 'title': 'Expert Team', 'description': '...'}]"
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "About Section"
        verbose_name_plural = "About Sections"
    
    def __str__(self):
        return self.title


class ServiceHighlight(BaseModel):
    """
    Services highlighted on homepage
    """
    service = models.ForeignKey(ConsultationService, on_delete=models.CASCADE, related_name='highlights')
    title = models.CharField(max_length=200)
    description = models.TextField()
    icon = models.CharField(max_length=100, blank=True, help_text="FontAwesome icon class")
    image = models.ImageField(upload_to='service_highlights/', blank=True, null=True)
    link = models.CharField(max_length=200, blank=True)
    badge_text = models.CharField(max_length=50, blank=True, help_text="e.g., Popular, New, Best Seller")
    is_featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.title


class SeoData(BaseModel):
    """
    SEO data for individual pages
    """
    PAGE_CHOICES = (
        ('home', 'Home Page'),
        ('about', 'About Page'),
        ('services', 'Services Page'),
        ('projects', 'Projects Page'),
        ('careers', 'Careers Page'),
        ('news', 'News Page'),
        ('contact', 'Contact Page'),
        ('booking', 'Booking Page'),
    )
    
    page_name = models.CharField(max_length=50, choices=PAGE_CHOICES, unique=True)
    meta_title = models.CharField(max_length=60)
    meta_description = models.CharField(max_length=160)
    og_image = models.ImageField(upload_to='seo/', blank=True, null=True, help_text="Open Graph image for social sharing")
    canonical_url = models.URLField(blank=True, help_text="Canonical URL if different from current")
    keywords = models.CharField(max_length=500, blank=True)
    no_index = models.BooleanField(default=False, help_text="Add noindex tag")
    no_follow = models.BooleanField(default=False, help_text="Add nofollow tag")
    
    class Meta:
        verbose_name = "SEO Data"
        verbose_name_plural = "SEO Data"
    
    def __str__(self):
        return f"SEO for {self.get_page_name_display()}"


class Faq(BaseModel):
    """
    Frequently Asked Questions
    """
    CATEGORY_CHOICES = (
        ('general', 'General'),
        ('services', 'Services'),
        ('booking', 'Booking'),
        ('payment', 'Payment'),
        ('consultation', 'Consultation'),
    )
    
    question = models.CharField(max_length=300)
    answer = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['category', 'order']
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"
    
    def __str__(self):
        return self.question[:100]


class Partner(BaseModel):
    """
    Business partners, clients, or affiliates
    """
    name = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='partners/')
    website_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.name


class Testimonial(BaseModel):
    """
    Customer testimonials displayed on homepage
    """
    client_name = models.CharField(max_length=100)
    client_role = models.CharField(max_length=100, blank=True)
    client_company = models.CharField(max_length=100, blank=True)
    client_image = models.ImageField(upload_to='testimonials/', blank=True, null=True)
    content = models.TextField()
    rating = models.IntegerField(default=5, choices=(
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ))
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='testimonials')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.client_name} - {self.rating} stars"


class ContactMessage(BaseModel):
    """
    Messages sent through contact form
    """
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    is_replied = models.BooleanField(default=False)
    replied_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_read', '-created_at']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.subject[:50]}"