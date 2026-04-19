# team/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel
from projects.models import Project

class Department(BaseModel):
    """
    Company departments
    e.g., Management, Consultancy, Administration, Marketing
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    head = models.ForeignKey('TeamMember', on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    icon = models.CharField(max_length=100, blank=True, help_text="FontAwesome icon class")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
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


class TeamMember(BaseModel):
    """
    Individual team members with their profiles
    """
    full_name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    role = models.CharField(max_length=100, help_text="Job title e.g., Senior Consultant")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    bio = models.TextField(help_text="Professional biography")
    profile_image = models.ImageField(upload_to='team/profiles/')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Professional details
    expertise_areas = models.JSONField(default=list, blank=True, help_text="List of expertise areas")
    education = models.JSONField(default=list, blank=True, help_text="List of {degree, institution, year}")
    work_experience = models.JSONField(default=list, blank=True, help_text="List of {position, company, years, description}")
    certifications = models.JSONField(default=list, blank=True, help_text="List of certifications")
    languages = models.JSONField(default=list, blank=True, help_text="List of languages spoken")
    
    # Social links
    linkedin = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    facebook = models.URLField(blank=True)
    instagram = models.URLField(blank=True)
    github = models.URLField(blank=True)
    
    # Display settings
    is_featured = models.BooleanField(default=False, help_text="Show on homepage")
    order = models.IntegerField(default=0)
    
    # Projects worked on
    projects = models.ManyToManyField(Project, blank=True, related_name='team_members')
    
    class Meta:
        ordering = ['order', 'full_name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['department', 'is_active']),
            models.Index(fields=['is_featured']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.role}"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.full_name)
        super().save(*args, **kwargs)


class TeamMemberSocial(BaseModel):
    """
    Additional social media links for team members
    """
    PLATFORM_CHOICES = (
        ('linkedin', 'LinkedIn'),
        ('twitter', 'Twitter/X'),
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('github', 'GitHub'),
        ('youtube', 'YouTube'),
        ('tiktok', 'TikTok'),
        ('whatsapp', 'WhatsApp'),
    )
    
    member = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='extra_socials')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    url = models.URLField()
    
    class Meta:
        unique_together = ['member', 'platform']
        ordering = ['platform']
    
    def __str__(self):
        return f"{self.member.full_name} - {self.get_platform_display()}"


class TeamTestimonial(BaseModel):
    """
    Testimonials specifically about team members
    (from clients who worked with them)
    """
    team_member = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='testimonials')
    client_name = models.CharField(max_length=200)
    client_company = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    rating = models.IntegerField(default=5, choices=(
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ))
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_testimonials')
    is_approved = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Testimonial for {self.team_member.full_name} from {self.client_name}"


class TeamAchievement(BaseModel):
    """
    Personal achievements or awards for team members
    """
    team_member = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateField(blank=True, null=True)
    issuer = models.CharField(max_length=200, blank=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.team_member.full_name} - {self.title}"