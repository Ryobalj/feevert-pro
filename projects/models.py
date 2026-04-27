# projects/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel

class ProjectCategory(BaseModel):
    """
    Categories for portfolio projects
    e.g., Agriculture, Environment, Consulting, Training
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text="FontAwesome icon class")
    image = models.ImageField(upload_to='project_categories/', blank=True, null=True)
    seo_title = models.CharField(max_length=60, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    parent_category = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = "Project Categories"
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ProjectTag(BaseModel):
    """
    Tags for filtering projects
    """
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Project(BaseModel):
    """
    Portfolio projects completed for clients
    """
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    category = models.ForeignKey(ProjectCategory, on_delete=models.CASCADE, related_name='projects')
    tags = models.ManyToManyField(ProjectTag, blank=True, related_name='projects')
    description = models.TextField()
    cover_image = models.ImageField(upload_to='project_covers/')
    gallery = models.JSONField(default=list, blank=True, help_text="List of image URLs for gallery")
    client_name = models.CharField(max_length=200, blank=True)
    completion_date = models.DateField(blank=True, null=True)
    technologies_used = models.JSONField(default=list, blank=True, help_text="List of technologies/tools used")
    video_url = models.URLField(blank=True, help_text="YouTube/Vimeo demo link")
    testimonial = models.TextField(blank=True, help_text="Client testimonial for this project")
    testimonial_author = models.CharField(max_length=200, blank=True)
    challenges = models.TextField(blank=True, help_text="Challenges faced during the project")
    solutions = models.TextField(blank=True, help_text="Solutions provided")
    results = models.TextField(blank=True, help_text="Results and outcomes")
    is_featured = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', '-completion_date', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status', 'is_featured']),
            models.Index(fields=['category', 'status']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class ProjectImage(BaseModel):
    """
    Individual images for project gallery
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='project_gallery/')
    caption = models.CharField(max_length=200, blank=True)
    is_cover = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"Image for {self.project.title} - {self.caption[:30]}"


class ProjectAward(BaseModel):
    """
    Awards received for specific projects
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='awards')
    award_name = models.CharField(max_length=200)
    awarding_body = models.CharField(max_length=200)
    year = models.IntegerField()
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-year']
    
    def __str__(self):
        return f"{self.project.title} - {self.award_name} ({self.year})"