# projects/views.py

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import ProjectCategory, ProjectTag, Project, ProjectImage, ProjectAward
from .serializers import (
    ProjectCategorySerializer, ProjectTagSerializer,
    ProjectSerializer, ProjectListSerializer,
    ProjectImageSerializer, ProjectAwardSerializer
)


class ProjectCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Project Categories (public)"""
    queryset = ProjectCategory.objects.filter(is_active=True)
    serializer_class = ProjectCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'name']


class ProjectTagViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Project Tags (public)"""
    queryset = ProjectTag.objects.all()
    serializer_class = ProjectTagSerializer
    permission_classes = [AllowAny]
    search_fields = ['name']


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Projects (public)"""
    queryset = Project.objects.filter(status='published')
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'tags', 'is_featured']
    search_fields = ['title', 'description', 'client_name']
    ordering_fields = ['order', '-completion_date', '-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer


class ProjectImageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Project Images (public)"""
    queryset = ProjectImage.objects.all()
    serializer_class = ProjectImageSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return ProjectImage.objects.filter(project__status='published')


class ProjectAwardViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Project Awards (public)"""
    queryset = ProjectAward.objects.all()
    serializer_class = ProjectAwardSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return ProjectAward.objects.filter(project__status='published')