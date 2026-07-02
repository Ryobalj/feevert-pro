# home/models.py

from django.db import models
from django.conf import settings
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
    footer_copyright_text = models.CharField(max_length=200, default="(c) 2025 Fee-Vert Solution Limited. All rights reserved.")
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
    
    core_values = models.JSONField(
        default=list, 
        blank=True, 
        help_text="List of {icon, title, description, image}"
    )
    
    stats = models.JSONField(
        default=list, 
        blank=True, 
        help_text="List of {number, label, icon}"
    )
    
    why_choose_us = models.JSONField(
        default=list, 
        blank=True, 
        help_text="List of {icon, title, description, image}"
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "About Section"
        verbose_name_plural = "About Sections"
    
    def __str__(self):
        return self.title


class AboutImage(BaseModel):
    """
    Additional images for About section
    """
    about = models.ForeignKey(AboutSection, on_delete=models.CASCADE, related_name='gallery')
    image = models.ImageField(upload_to='about/gallery/')
    caption = models.CharField(max_length=500, blank=True)
    section = models.CharField(max_length=50, default='general', choices=(
        ('core_values', 'Core Values'),
        ('why_choose_us', 'Why Choose Us'),
        ('general', 'General'),
        ('stats', 'Statistics'),
    ))
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['section', 'order', '-created_at']
        verbose_name = "About Image"
        verbose_name_plural = "About Images (Gallery)"
        indexes = [
            models.Index(fields=['about', 'section', 'is_active']),
        ]
    
    def __str__(self):
        return f"Image for {self.about.title} - {self.section} ({self.caption or 'No caption'})"
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None


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


class Contact(BaseModel):
    """
    Central contact/lead database.
    Auto-populated from ContactMessage, consultations, bookings, and emails.
    """
    CONTACT_TYPES = [
        ('lead', 'Lead'),
        ('client', 'Client'),
        ('vendor', 'Vendor'),
        ('partner', 'Partner'),
        ('supplier', 'Supplier'),
        ('other', 'Other'),
    ]
    
    # Basic info
    first_name = models.CharField(max_length=200, blank=True)
    last_name = models.CharField(max_length=200, blank=True)
    company_name = models.CharField(max_length=300, blank=True)
    job_title = models.CharField(max_length=200, blank=True)
    contact_type = models.CharField(max_length=50, choices=CONTACT_TYPES, default='lead')
    
    # Contact details
    primary_email = models.EmailField(blank=True, db_index=True)
    secondary_emails = models.JSONField(default=list, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    alternate_phone = models.CharField(max_length=50, blank=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=200, blank=True)
    region = models.CharField(max_length=200, blank=True)
    country = models.CharField(max_length=200, default='Tanzania')
    
    # Source tracking
    source = models.CharField(max_length=200, blank=True, help_text="How did they find us?")
    source_channel = models.CharField(max_length=50, blank=True, choices=[
        ('contact_form', 'Contact Form'),
        ('email', 'Email'),
        ('consultation', 'Consultation'),
        ('booking', 'Booking'),
        ('referral', 'Referral'),
        ('social', 'Social Media'),
        ('other', 'Other'),
    ])
    
    # Linked user account
    linked_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='contact_profile'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Notes & Tags
    notes = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    # Stats (auto-updated)
    total_messages = models.IntegerField(default=0)
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    first_contacted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['primary_email']),
            models.Index(fields=['contact_type']),
            models.Index(fields=['phone']),
        ]
        verbose_name = "Contact"
        verbose_name_plural = "Contacts"
    
    def __str__(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name or self.primary_email or self.company_name or f"Contact #{self.id}"
    
    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else None
    
    @property
    def display_name(self):
        return self.full_name or self.company_name or self.primary_email or f"Contact #{self.id}"


class ContactMessage(BaseModel):
    """
    Unified Inbox - Messages from all communication channels
    including contact form, email, SMS, chat, consultations, and bookings.
    """
    CHANNEL_CHOICES = [
        ('contact_form', 'Contact Form'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('consultation', 'Consultation'),
        ('booking', 'Booking'),
        ('chat', 'Live Chat'),
        ('internal', 'Internal Note'),
    ]
    
    STATUS_CHOICES = [
        ('unread', 'Unread'),
        ('read', 'Read'),
        ('in_progress', 'In Progress'),
        ('responded', 'Responded'),
        ('resolved', 'Resolved'),
        ('spam', 'Spam'),
        ('archived', 'Archived'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # ========== SENDER INFORMATION ==========
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    
    # ========== CONTENT ==========
    subject = models.CharField(max_length=200)
    message = models.TextField()
    
    # ========== CHANNEL & STATUS ==========
    channel = models.CharField(
        max_length=50,
        choices=CHANNEL_CHOICES,
        default='contact_form',
        db_index=True
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='unread',
        db_index=True
    )
    priority = models.CharField(
        max_length=50,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    is_incoming = models.BooleanField(default=True)
    
    # ========== READ/REPLY TRACKING ==========
    is_read = models.BooleanField(default=False)
    is_replied = models.BooleanField(default=False)
    replied_at = models.DateTimeField(blank=True, null=True)
    responded_at = models.DateTimeField(blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    # ========== ASSIGNMENT ==========
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_messages'
    )
    
    # ========== CONTACT LINKING ==========
    contact = models.ForeignKey(
        'home.Contact',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='messages'
    )
    
    # ========== EMAIL-SPECIFIC (for Outlook/365 integration) ==========
    message_id = models.CharField(max_length=500, blank=True, db_index=True)
    thread_id = models.CharField(max_length=500, blank=True)
    in_reply_to = models.CharField(max_length=500, blank=True)
    cc_emails = models.JSONField(default=list, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    headers = models.JSONField(default=dict, blank=True)
    
    # ========== SLA TRACKING ==========
    sla_deadline = models.DateTimeField(blank=True, null=True)
    sla_breached = models.BooleanField(default=False)
    
    # ========== METADATA ==========
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_read', '-created_at']),
            models.Index(fields=['email']),
            models.Index(fields=['channel', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['priority', '-created_at']),
            models.Index(fields=['message_id']),
            models.Index(fields=['thread_id']),
            models.Index(fields=['contact', '-created_at']),
        ]
        verbose_name = "Unified Inbox"
        verbose_name_plural = "Unified Inbox (All Messages)"
    
    def __str__(self):
        channel_label = dict(self.CHANNEL_CHOICES).get(self.channel, self.channel)
        return f"[{channel_label}] {self.name} - {self.subject[:50]}"
    
    @property
    def is_overdue(self):
        if self.sla_deadline:
            from django.utils import timezone
            return timezone.now() > self.sla_deadline and self.status not in ['resolved', 'archived']
        return False
    
    @property
    def channel_label(self):
        return dict(self.CHANNEL_CHOICES).get(self.channel, self.channel)
    
    @property
    def status_label(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
    
    @property
    def priority_label(self):
        return dict(self.PRIORITY_CHOICES).get(self.priority, self.priority)


class WhatWeDo(BaseModel):
    """
    'What We Do' section shown on the homepage.
    Brief description of the company's services with supporting images.
    """
    
    # ========== HEADER & DESCRIPTION ==========
    title = models.CharField(
        max_length=200,
        default="What We Do",
        help_text="Section title"
    )
    subtitle = models.CharField(
        max_length=300,
        blank=True,
        help_text="Short subtitle/tagline"
    )
    description = models.TextField(
        help_text="Brief description about what the company does"
    )
    
    # ========== SERVICES/POINTS (JSON) ==========
    services = models.JSONField(
        default=list,
        blank=True,
        help_text='List of {icon, title, description}'
    )
    
    # ========== SLIDER IMAGES (JSON) ==========
    slider_images = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            'List of images for the slider. The FIRST entry is the main/'
            'background image; the rest are "related" images shown with '
            'their own caption. Each entry can be either a plain URL string '
            '(no caption) or an object: {"image": "<url>", "title": "...", '
            '"caption": "..."}.'
        )
    )
    
    # ========== CTA ==========
    cta_text = models.CharField(
        max_length=50,
        blank=True,
        default="Learn More",
        help_text="Button text"
    )
    cta_link = models.CharField(
        max_length=200,
        blank=True,
        default="/services",
        help_text="Button link"
    )
    
    # ========== STATUS ==========
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0, help_text="Order on page")
    
    class Meta:
        ordering = ['order']
        verbose_name = "What We Do Section"
        verbose_name_plural = "What We Do Sections"
    
    def __str__(self):
        return f"What We Do: {self.title[:50]}"
    
    def get_services_list(self):
        """Helper method to safely get services as list"""
        if isinstance(self.services, list):
            return self.services
        return []
    
    def get_slider_images_list(self):
        """
        Helper method to safely get slider images as a normalized list of
        {image, title, caption} dicts. Supports both the legacy format
        (plain URL strings) and the newer format (objects with a caption).
        """
        if not isinstance(self.slider_images, list):
            return []
        normalized = []
        for entry in self.slider_images:
            if isinstance(entry, str) and entry:
                normalized.append({'image': entry, 'title': '', 'caption': ''})
            elif isinstance(entry, dict) and entry.get('image'):
                normalized.append({
                    'image': entry.get('image'),
                    'title': entry.get('title', ''),
                    'caption': entry.get('caption', ''),
                })
        return normalized
