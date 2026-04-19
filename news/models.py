# news/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel

class NewsCategory(BaseModel):
    """
    Categories for news and blog posts
    e.g., Company News, Industry Updates, Announcements, Events
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    seo_title = models.CharField(max_length=60, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = "News Categories"
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class NewsPost(BaseModel):
    """
    News articles and blog posts
    """
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    category = models.ForeignKey(NewsCategory, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(help_text="Full article content")
    excerpt = models.CharField(max_length=200, blank=True, help_text="Short summary for preview")
    featured_image = models.ImageField(upload_to='news/featured/', blank=True, null=True)
    gallery = models.JSONField(default=list, blank=True, help_text="List of additional image URLs")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='news_posts')
    tags = models.CharField(max_length=200, blank=True, help_text="Comma separated: technology, agriculture")
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False, help_text="Featured on homepage")
    allow_comments = models.BooleanField(default=True)
    views = models.IntegerField(default=0)
    seo_title = models.CharField(max_length=60, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    reading_time_minutes = models.IntegerField(default=0, help_text="Auto-calculated reading time")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_published', '-created_at']),
            models.Index(fields=['category', 'is_published']),
            models.Index(fields=['is_featured', 'is_published']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.title)
        
        # Auto-calculate reading time (assuming 200 words per minute)
        if self.content:
            word_count = len(self.content.split())
            self.reading_time_minutes = max(1, round(word_count / 200))
        
        super().save(*args, **kwargs)
    
    def increment_views(self):
        """Increment view count"""
        self.views += 1
        self.save(update_fields=['views'])


class Comment(BaseModel):
    """
    Comments on news posts
    """
    post = models.ForeignKey(NewsPost, on_delete=models.CASCADE, related_name='comments')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_approved = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'is_approved', '-created_at']),
            models.Index(fields=['parent_comment']),
        ]
    
    def __str__(self):
        return f"Comment by {self.name} on {self.post.title[:30]}"


class NewsletterSubscription(BaseModel):
    """
    Email subscribers for newsletter
    """
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    unsubscribed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.email


class NewsletterCampaign(BaseModel):
    """
    Email marketing campaigns
    """
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('scheduled', 'Scheduled'),
        ('failed', 'Failed'),
    )
    
    subject = models.CharField(max_length=200)
    content = models.TextField()
    scheduled_for = models.DateTimeField(blank=True, null=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    recipients_count = models.IntegerField(default=0)
    open_count = models.IntegerField(default=0)
    click_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subject} - {self.get_status_display()}"


class NewsPostView(BaseModel):
    """
    Analytics for individual post views
    """
    post = models.ForeignKey(NewsPost, on_delete=models.CASCADE, related_name='post_views')
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['post', '-viewed_at']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        return f"View on {self.post.title[:30]} at {self.viewed_at}"