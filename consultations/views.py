# consultations/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import ConsultationCategory, ConsultationService, ConsultationRequest, ConsultationDocument, ConsultationFollowup
from .serializers import (
    ConsultationCategorySerializer, ConsultationServiceSerializer,
    ConsultationRequestSerializer, ConsultationRequestCreateSerializer,
    ConsultationDocumentSerializer, ConsultationFollowupSerializer
)


class ConsultationCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Consultation Categories (public)"""
    queryset = ConsultationCategory.objects.filter(is_active=True)
    serializer_class = ConsultationCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'name']


class ConsultationServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Consultation Services (public)"""
    queryset = ConsultationService.objects.filter(is_active=True)
    serializer_class = ConsultationServiceSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'name', 'price']


class ConsultationRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for Consultation Requests"""
    queryset = ConsultationRequest.objects.all()
    serializer_class = ConsultationRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'service']
    ordering_fields = ['created_at', 'preferred_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'consultant':
            return ConsultationRequest.objects.all()
        return ConsultationRequest.objects.filter(client=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ConsultationRequestCreateSerializer
        return ConsultationRequestSerializer
    
    def perform_create(self, serializer):
        serializer.save(client=self.request.user, status='pending')
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update consultation request status"""
        consultation = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        consultation.status = new_status
        consultation.save()
        
        return Response({'success': True, 'status': new_status})
    
    @action(detail=True, methods=['post'])
    def assign_consultant(self, request, pk=None):
        """Assign a consultant to the request"""
        consultation = self.get_object()
        consultant_id = request.data.get('consultant_id')
        
        from accounts.models import User
        try:
            consultant = User.objects.get(id=consultant_id, role='consultant')
            consultation.assigned_to = consultant
            consultation.save()
            return Response({'success': True, 'consultant': consultant.username})
        except User.DoesNotExist:
            return Response({'error': 'Consultant not found'}, status=status.HTTP_404_NOT_FOUND)


class ConsultationDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Consultation Documents"""
    queryset = ConsultationDocument.objects.all()
    serializer_class = ConsultationDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role in ['admin', 'consultant']:
            return ConsultationDocument.objects.all()
        return ConsultationDocument.objects.filter(request__client=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ConsultationFollowupViewSet(viewsets.ModelViewSet):
    """ViewSet for Consultation Followups"""
    queryset = ConsultationFollowup.objects.all()
    serializer_class = ConsultationFollowupSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role in ['admin', 'consultant']:
            return ConsultationFollowup.objects.all()
        return ConsultationFollowup.objects.filter(request__client=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save()