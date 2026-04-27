# team/views.py

from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Department, TeamMember, TeamMemberSocial, TeamTestimonial, TeamAchievement
from .serializers import (
    DepartmentSerializer, TeamMemberSerializer, TeamMemberListSerializer,
    TeamMemberSocialSerializer, TeamTestimonialSerializer, TeamAchievementSerializer
)


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Departments (public)"""
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]
    ordering_fields = ['order', 'name']


class TeamMemberViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Team Members (public)"""
    queryset = TeamMember.objects.filter(is_active=True)
    serializer_class = TeamMemberSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'is_featured']
    search_fields = ['full_name', 'role', 'bio']
    ordering_fields = ['order', 'full_name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TeamMemberListSerializer
        return TeamMemberSerializer


class TeamMemberSocialViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Team Member Social Links (public)"""
    queryset = TeamMemberSocial.objects.all()
    serializer_class = TeamMemberSocialSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return TeamMemberSocial.objects.filter(member__is_active=True)


class TeamTestimonialViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Team Testimonials (public)"""
    queryset = TeamTestimonial.objects.filter(is_approved=True)
    serializer_class = TeamTestimonialSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['team_member', 'rating']


class TeamAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Team Achievements (public)"""
    queryset = TeamAchievement.objects.all()
    serializer_class = TeamAchievementSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return TeamAchievement.objects.filter(team_member__is_active=True)