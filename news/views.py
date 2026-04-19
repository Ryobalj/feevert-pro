# news/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import NewsCategory, NewsPost, Comment, NewsletterSubscription, NewsletterCampaign
from .serializers import (
    NewsCategorySerializer, NewsPostSerializer, NewsPostListSerializer,
    CommentSerializer, CommentCreateSerializer,
    NewsletterSubscriptionSerializer, NewsletterCampaignSerializer
)


class NewsCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for News Categories (public)"""
    queryset = NewsCategory.objects.filter(is_active=True)
    serializer_class = NewsCategorySerializer
    permission_classes = [AllowAny]
    search_fields = ['name']


class NewsPostViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for News Posts (public)"""
    queryset = NewsPost.objects.filter(is_published=True)
    serializer_class = NewsPostSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_featured']
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['-created_at', '-views']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NewsPostListSerializer
        return NewsPostSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Increment view count when a post is viewed"""
        instance = self.get_object()
        instance.increment_views()
        
        from .models import NewsPostView
        NewsPostView.objects.create(
            post=instance,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for Comments"""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['post', 'is_approved']
    
    def get_queryset(self):
        return Comment.objects.filter(is_approved=True)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommentCreateSerializer
        return CommentSerializer
    
    def perform_create(self, serializer):
        serializer.save(is_approved=False)


class NewsletterSubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for Newsletter Subscriptions"""
    queryset = NewsletterSubscription.objects.all()
    serializer_class = NewsletterSubscriptionSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return NewsletterSubscription.objects.filter(email=self.request.user.email)
        return NewsletterSubscription.objects.none()
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=False, methods=['post'])
    def unsubscribe(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            subscription = NewsletterSubscription.objects.get(email=email)
            subscription.is_active = False
            subscription.unsubscribed_at = timezone.now()
            subscription.save()
            return Response({'success': True})
        except NewsletterSubscription.DoesNotExist:
            return Response({'error': 'Email not found'}, status=status.HTTP_404_NOT_FOUND)


class NewsletterCampaignViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Newsletter Campaigns"""
    queryset = NewsletterCampaign.objects.filter(status='sent')
    serializer_class = NewsletterCampaignSerializer
    permission_classes = [IsAuthenticated]