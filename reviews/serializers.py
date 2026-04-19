# reviews/serializers.py

from rest_framework import serializers
from .models import Review, ReviewImage, ReviewHelpfulVote
from accounts.serializers import UserSerializer


class ReviewImageSerializer(serializers.ModelSerializer):
    """Serializer for Review Image"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewImage
        fields = ['id', 'review', 'image', 'image_url', 'caption', 'is_featured', 'order']
        read_only_fields = ['id']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review"""
    client_name = serializers.CharField(source='client.username', read_only=True)
    client_avatar = serializers.SerializerMethodField()
    images = ReviewImageSerializer(many=True, read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'client', 'client_name', 'client_avatar', 'consultation', 'booking',
            'rating', 'rating_display', 'title', 'comment', 'verified_purchase',
            'helpful_count', 'not_helpful_count', 'response_from_owner',
            'responded_at', 'is_approved', 'images', 'created_at'
        ]
        read_only_fields = ['id', 'helpful_count', 'not_helpful_count', 'created_at']
    
    def get_client_avatar(self, obj):
        if obj.client.profile_picture:
            return obj.client.profile_picture.url
        return None


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a review"""
    class Meta:
        model = Review
        fields = ['consultation', 'booking', 'rating', 'title', 'comment']


class ReviewHelpfulVoteSerializer(serializers.ModelSerializer):
    """Serializer for Review Helpful Vote"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ReviewHelpfulVote
        fields = ['id', 'review', 'user', 'user_name', 'is_helpful', 'created_at']
        read_only_fields = ['id', 'created_at']