# careers/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import JobCategory, JobPost, JobApplication, SavedJob, JobAlert
from .serializers import (
    JobCategorySerializer, JobPostSerializer, JobPostListSerializer,
    JobApplicationSerializer, JobApplicationCreateSerializer,
    SavedJobSerializer, JobAlertSerializer
)


class JobCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Job Categories (public)"""
    queryset = JobCategory.objects.filter(is_active=True)
    serializer_class = JobCategorySerializer
    permission_classes = [AllowAny]
    search_fields = ['name']


class JobPostViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Job Posts (public)"""
    queryset = JobPost.objects.filter(is_active=True)
    serializer_class = JobPostSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'employment_type', 'location']
    search_fields = ['title', 'description']
    ordering_fields = ['-created_at', 'deadline']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobPostListSerializer
        return JobPostSerializer


class JobApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for Job Applications"""
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'hr':
            return JobApplication.objects.all()
        return JobApplication.objects.filter(email=user.email)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return JobApplicationCreateSerializer
        return JobApplicationSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update application status (admin/hr only)"""
        application = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = ['pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected']
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        application.status = new_status
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()
        
        return Response({'success': True, 'status': new_status})


class SavedJobViewSet(viewsets.ModelViewSet):
    """ViewSet for Saved Jobs"""
    queryset = SavedJob.objects.all()
    serializer_class = SavedJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class JobAlertViewSet(viewsets.ModelViewSet):
    """ViewSet for Job Alerts"""
    queryset = JobAlert.objects.all()
    serializer_class = JobAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return JobAlert.objects.filter(email=self.request.user.email)
    
    def perform_create(self, serializer):
        serializer.save(email=self.request.user.email)