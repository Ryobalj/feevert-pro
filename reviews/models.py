# reviews/models.py

from django.db import models
from django.conf import settings
from core.models import BaseModel
from consultations.models import ConsultationRequest
from bookings.models import Booking

class Review(BaseModel):
    """
    Customer reviews and ratings for services
    """
    RATING_CHOICES = (
        (1, '1 Star - Poor'),
        (2, '2 Stars - Fair'),
        (3, '3 Stars - Good'),
        (4, '4 Stars - Very Good'),
        (5, '5 Stars - Excellent'),
    )
    
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    consultation = models.ForeignKey(ConsultationRequest, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    rating = models.IntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200)
    comment = models.TextField()
    verified_purchase = models.BooleanField(default=False, help_text="Customer actually used this service")
    helpful_count = models.IntegerField(default=0)
    not_helpful_count = models.IntegerField(default=0)
    response_from_owner = models.TextField(blank=True)
    responded_at = models.DateTimeField(blank=True, null=True)
    is_approved = models.BooleanField(default=False, help_text="Admin approval before publishing")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rating']),
            models.Index(fields=['is_approved', '-created_at']),
            models.Index(fields=['client', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.client.username} - {self.rating} stars - {self.title[:50]}"


class ReviewImage(BaseModel):
    """
    Images attached to reviews (proof of work)
    """
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='review_images/')
    caption = models.CharField(max_length=200, blank=True)
    is_featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"Image for review {self.review.id} - {self.caption[:30]}"


class ReviewHelpfulVote(BaseModel):
    """
    Votes from other customers indicating if a review was helpful
    """
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='review_votes')
    is_helpful = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['review', 'user']
        indexes = [
            models.Index(fields=['review', 'is_helpful']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {'Helpful' if self.is_helpful else 'Not Helpful'} - Review {self.review.id}"