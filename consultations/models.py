# consultations/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel

class ConsultationCategory(BaseModel):
    """
    Categories for consultation services
    e.g., Agriculture, Environment, Business, Livestock
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text="FontAwesome icon class")
    image = models.ImageField(upload_to='consultation_categories/', blank=True, null=True)
    order = models.IntegerField(default=0)
    seo_title = models.CharField(max_length=60, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = "Consultation Categories"
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ConsultationService(BaseModel):
    """
    Individual consultation services offered
    """
    category = models.ForeignKey(ConsultationCategory, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    duration_minutes = models.IntegerField(default=60)
    is_featured = models.BooleanField(default=False)
    popularity_score = models.IntegerField(default=0)
    estimated_delivery_days = models.IntegerField(default=7)
    faq = models.JSONField(default=list, blank=True, help_text="List of {question, answer}")
    prerequisites = models.JSONField(default=list, blank=True, help_text="List of prerequisites")
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


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
    
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='consultation_requests')
    service = models.ForeignKey(ConsultationService, on_delete=models.CASCADE, related_name='requests')
    preferred_date = models.DateTimeField()
    message = models.TextField(blank=True)
    budget_range = models.CharField(max_length=100, blank=True)
    attachments = models.JSONField(default=list, blank=True, help_text="List of file URLs")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_consultations')
    admin_notes = models.TextField(blank=True)
    response_sent_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['client', '-created_at']),
            models.Index(fields=['assigned_to', 'status']),
        ]
    
    def __str__(self):
        return f"{self.client.username} - {self.service.name} ({self.status})"


class ConsultationDocument(BaseModel):
    """
    Documents related to consultation (proposals, contracts, reports)
    """
    request = models.ForeignKey(ConsultationRequest, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='consultation_documents/')
    title = models.CharField(max_length=200)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    
    def __str__(self):
        return f"{self.request.client.username} - {self.title}"


class ConsultationFollowup(BaseModel):
    """
    Follow-ups for pending or ongoing consultations
    """
    request = models.ForeignKey(ConsultationRequest, on_delete=models.CASCADE, related_name='followups')
    followup_date = models.DateTimeField()
    notes = models.TextField()
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='followup_tasks')
    status = models.CharField(max_length=20, default='pending', choices=(
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ))
    
    class Meta:
        ordering = ['followup_date']
    
    def __str__(self):
        return f"Followup for {self.request.client.username} on {self.followup_date}"