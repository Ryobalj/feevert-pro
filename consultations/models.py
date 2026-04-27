# consultations/models.py

from django.db import models
from django.conf import settings
from django.utils.text import slugify
from core.models import BaseModel


class ConsultationCategory(BaseModel):
    """
    Hierarchical categories for consultation services
    Supports up to 3 levels: Main Category > Sub Category > Sub-Sub Category
    """
    name = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=500, blank=True, help_text="Emoji or text icon")
    image = models.ImageField(upload_to='consultation_categories/', blank=True, null=True)
    
    # Self-referencing for hierarchy
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    
    # Level tracking
    level = models.IntegerField(default=0, editable=False, help_text="0=Main, 1=Sub, 2=Sub-Sub")
    
    # Ordering & Status
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # SEO
    seo_title = models.TextField(blank=True)
    seo_description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['level', 'order', 'name']
        verbose_name_plural = "Consultation Categories"
        indexes = [
            models.Index(fields=['is_active', 'level', 'order']),
            models.Index(fields=['parent', 'is_active']),
            models.Index(fields=['slug']),
            models.Index(fields=['level']),
        ]
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        
        if self.parent:
            self.level = self.parent.level + 1
            if self.level > 2:
                raise ValueError("Maximum category depth is 3 levels (Main > Sub > Sub-Sub)")
        else:
            self.level = 0
        
        super().save(*args, **kwargs)
    
    @property
    def is_main_category(self):
        return self.level == 0
    
    @property
    def is_sub_category(self):
        return self.level == 1
    
    @property
    def is_sub_sub_category(self):
        return self.level == 2
    
    @property
    def level_name(self):
        names = {0: 'Main Category', 1: 'Sub Category', 2: 'Sub-Sub Category'}
        return names.get(self.level, 'Unknown')
    
    @property
    def service_count(self):
        count = self.services.filter(is_active=True).count()
        for child in self.children.filter(is_active=True):
            count += child.services.filter(is_active=True).count()
        return count
    
    @property
    def direct_service_count(self):
        return self.services.filter(is_active=True).count()
    
    @property
    def has_children(self):
        return self.children.filter(is_active=True).exists()
    
    @property
    def ancestors(self):
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return list(reversed(ancestors))
    
    @property
    def full_path(self):
        path = [self.name]
        current = self.parent
        while current:
            path.insert(0, current.name)
            current = current.parent
        return ' > '.join(path)
    
    def get_descendants(self, include_self=False):
        descendants = []
        if include_self:
            descendants.append(self)
        for child in self.children.filter(is_active=True):
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants
    
    def get_all_services(self):
        categories = self.get_descendants(include_self=True)
        return ConsultationService.objects.filter(
            category__in=categories,
            is_active=True
        )


class ConsultationService(BaseModel):
    """
    Individual consultation services offered
    """
    PRICE_TYPES = (
        ('fixed', 'Fixed Price'),
        ('hourly', 'Per Hour'),
        ('range', 'Price Range'),
        ('quote', 'Get Quote'),
    )
    
    category = models.ForeignKey(
        ConsultationCategory, 
        on_delete=models.CASCADE, 
        related_name='services'
    )
    name = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500, unique=True, blank=True)
    description = models.TextField()
    
    # Main image (primary/thumbnail)
    image = models.ImageField(
        upload_to='services/',
        blank=True, 
        null=True,
        help_text="Main service image (thumbnail/primary)"
    )
    
    # Pricing
    price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=10, default='TZS')
    price_type = models.CharField(max_length=50, choices=PRICE_TYPES, default='fixed')
    price_range_min = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    price_range_max = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    
    # Details
    duration_minutes = models.IntegerField(default=60)
    estimated_delivery_days = models.IntegerField(default=7)
    max_clients = models.IntegerField(default=1, help_text="Maximum clients per session")
    
    # Display
    icon = models.CharField(max_length=500, blank=True, help_text="Emoji or text icon")
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    popularity_score = models.IntegerField(default=0)
    order = models.IntegerField(default=0)
    
    # Content
    benefits = models.JSONField(default=list, blank=True, help_text="List of benefit strings")
    faq = models.JSONField(default=list, blank=True, help_text="List of {question, answer}")
    prerequisites = models.JSONField(default=list, blank=True, help_text="List of prerequisite strings")
    deliverables = models.JSONField(default=list, blank=True, help_text="List of deliverable strings")
    
    # SEO
    seo_title = models.TextField(blank=True)
    seo_description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['is_active', 'order']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['is_featured', 'is_active']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        if self.category.parent:
            return f"{self.category.full_path} > {self.name}"
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            if self.category:
                self.slug = f"{self.category.slug}-{base_slug}"
            else:
                self.slug = base_slug
        super().save(*args, **kwargs)
    
    @property
    def display_price(self):
        if self.price_type == 'fixed' and self.price:
            return f"{self.currency} {self.price:,.0f}"
        elif self.price_type == 'range' and self.price_range_min and self.price_range_max:
            return f"{self.currency} {self.price_range_min:,.0f} - {self.price_range_max:,.0f}"
        elif self.price_type == 'hourly' and self.price:
            return f"{self.currency} {self.price:,.0f}/hr"
        return "Get Quote"
    
    @property
    def category_path(self):
        return self.category.full_path if self.category else ''
    
    @property
    def request_count(self):
        return self.requests.count()
    
    @property
    def all_images(self):
        """Returns main image + all gallery images"""
        images = []
        if self.image:
            images.append({
                'id': None,
                'image': self.image,
                'is_primary': True,
                'caption': self.name,
            })
        for img in self.gallery.filter(is_active=True):
            images.append({
                'id': img.id,
                'image': img.image,
                'is_primary': False,
                'caption': img.caption or self.name,
            })
        return images
    
    @property
    def primary_image_url(self):
        if self.image:
            return self.image.url
        first_gallery = self.gallery.filter(is_active=True).first()
        if first_gallery:
            return first_gallery.image.url
        return None


class ServiceImage(BaseModel):
    """
    Multiple images for a consultation service (Gallery/Inline)
    """
    service = models.ForeignKey(
        ConsultationService,
        on_delete=models.CASCADE,
        related_name='gallery'
    )
    image = models.ImageField(upload_to='services/gallery/')
    caption = models.CharField(max_length=500, blank=True)
    alt_text = models.CharField(max_length=500, blank=True, help_text="Alternative text for accessibility")
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = "Service Image"
        verbose_name_plural = "Service Images (Gallery)"
        indexes = [
            models.Index(fields=['service', 'is_active', 'order']),
        ]
    
    def __str__(self):
        return f"Image for {self.service.name} - {self.caption or 'No caption'}"
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None


class ConsultationRequest(BaseModel):
    """
    Client requests for consultation
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='consultation_requests'
    )
    service = models.ForeignKey(
        ConsultationService, 
        on_delete=models.CASCADE, 
        related_name='requests'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='assigned_consultations'
    )
    
    preferred_date = models.DateTimeField()
    preferred_time = models.TimeField(blank=True, null=True)
    alternative_date = models.DateTimeField(blank=True, null=True)
    message = models.TextField(blank=True)
    budget_range = models.CharField(max_length=500, blank=True)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=50, choices=PRIORITY_CHOICES, default='medium')
    
    admin_notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    response_sent_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    attachments = models.JSONField(default=list, blank=True)
    client_feedback = models.TextField(blank=True)
    client_rating = models.IntegerField(blank=True, null=True, choices=[(i, str(i)) for i in range(1, 6)])
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['client', '-created_at']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['priority', 'status']),
        ]
    
    def __str__(self):
        return f"{self.client.username} - {self.service.name} ({self.get_status_display()})"


class ConsultationDocument(BaseModel):
    """
    Documents related to consultation
    """
    DOCUMENT_TYPES = (
        ('proposal', 'Proposal'),
        ('contract', 'Contract'),
        ('report', 'Report'),
        ('invoice', 'Invoice'),
        ('other', 'Other'),
    )
    
    request = models.ForeignKey(ConsultationRequest, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='consultation_documents/')
    title = models.CharField(max_length=500)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES, default='other')
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    file_size = models.IntegerField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.request.client.username} - {self.title}"


class ConsultationFollowup(BaseModel):
    """
    Follow-ups for consultations
    """
    request = models.ForeignKey(ConsultationRequest, on_delete=models.CASCADE, related_name='followups')
    followup_date = models.DateTimeField()
    notes = models.TextField()
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='followup_tasks')
    status = models.CharField(max_length=50, default='pending', choices=(
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ))
    completed_at = models.DateTimeField(blank=True, null=True)
    reminder_sent = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['followup_date']
    
    def __str__(self):
        return f"Followup for {self.request.client.username} on {self.followup_date.strftime('%Y-%m-%d')}"