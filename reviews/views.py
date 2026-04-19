# reviews/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Review, ReviewImage, ReviewHelpfulVote
from .serializers import (
    ReviewSerializer, ReviewCreateSerializer, ReviewImageSerializer,
    ReviewHelpfulVoteSerializer
)


class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for Reviews"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['rating', 'is_approved']
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Review.objects.all()
        return Review.objects.filter(is_approved=True)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer
    
    def perform_create(self, serializer):
        serializer.save(client=self.request.user, is_approved=False)
    
    @action(detail=True, methods=['post'])
    def helpful(self, request, pk=None):
        """Mark a review as helpful"""
        review = self.get_object()
        
        # Check if user already voted
        existing_vote = ReviewHelpfulVote.objects.filter(
            review=review,
            user=request.user
        ).first()
        
        if existing_vote:
            return Response({'error': 'Already voted'}, status=status.HTTP_400_BAD_REQUEST)
        
        vote = ReviewHelpfulVote.objects.create(
            review=review,
            user=request.user,
            is_helpful=True
        )
        
        # Update helpful count
        review.helpful_count += 1
        review.save()
        
        return Response({'success': True, 'helpful_count': review.helpful_count})
    
    @action(detail=True, methods=['post'])
    def not_helpful(self, request, pk=None):
        """Mark a review as not helpful"""
        review = self.get_object()
        
        existing_vote = ReviewHelpfulVote.objects.filter(
            review=review,
            user=request.user
        ).first()
        
        if existing_vote:
            return Response({'error': 'Already voted'}, status=status.HTTP_400_BAD_REQUEST)
        
        vote = ReviewHelpfulVote.objects.create(
            review=review,
            user=request.user,
            is_helpful=False
        )
        
        review.not_helpful_count += 1
        review.save()
        
        return Response({'success': True, 'not_helpful_count': review.not_helpful_count})


class ReviewImageViewSet(viewsets.ModelViewSet):
    """ViewSet for Review Images"""
    queryset = ReviewImage.objects.all()
    serializer_class = ReviewImageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ReviewImage.objects.filter(review__client=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save()


class ReviewHelpfulVoteViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Review Helpful Votes"""
    queryset = ReviewHelpfulVote.objects.all()
    serializer_class = ReviewHelpfulVoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ReviewHelpfulVote.objects.filter(user=self.request.user)