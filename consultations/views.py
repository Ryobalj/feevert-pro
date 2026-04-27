# consultations/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.utils import timezone

from .models import (
    ConsultationCategory, ConsultationService, ConsultationRequest,
    ConsultationDocument, ConsultationFollowup, ServiceImage
)
from .serializers import (
    ConsultationCategorySerializer, ConsultationCategoryTreeSerializer,
    ConsultationServiceSerializer, ConsultationServiceListSerializer,
    ConsultationRequestSerializer, ConsultationRequestCreateSerializer,
    ConsultationRequestUpdateSerializer,
    ConsultationDocumentSerializer, ConsultationFollowupSerializer,
    ServiceImageSerializer
)


# ============ CATEGORY VIEWSET ============
class ConsultationCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Consultation Categories (public)"""
    queryset = ConsultationCategory.objects.filter(is_active=True)
    serializer_class = ConsultationCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['parent', 'level', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        parent = self.request.query_params.get('parent')
        root_only = self.request.query_params.get('root_only')
        
        if root_only and root_only.lower() == 'true':
            queryset = queryset.filter(parent__isnull=True)
        elif parent:
            if parent.lower() == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent)
        
        return queryset.select_related('parent').prefetch_related('children')
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get full category tree with services"""
        categories = ConsultationCategory.objects.filter(
            is_active=True, parent__isnull=True
        ).order_by('order', 'name')
        serializer = ConsultationCategoryTreeSerializer(
            categories, many=True, context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def services(self, request, pk=None):
        """Get all services in a category and its descendants"""
        category = self.get_object()
        services = category.get_all_services()
        serializer = ConsultationServiceListSerializer(
            services, many=True, context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """Get direct child categories"""
        category = self.get_object()
        children = category.children.filter(is_active=True).order_by('order', 'name')
        serializer = ConsultationCategorySerializer(
            children, many=True, context={'request': request}
        )
        return Response(serializer.data)


# ============ SERVICE VIEWSET ============
class ConsultationServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Consultation Services (public)"""
    queryset = ConsultationService.objects.filter(is_active=True)
    serializer_class = ConsultationServiceSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_featured', 'price_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'name', 'price', 'popularity_score']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        category_slug = self.request.query_params.get('category_slug')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        include_subcategories = self.request.query_params.get('include_subcategories')
        if include_subcategories and include_subcategories.lower() == 'true':
            category_id = self.request.query_params.get('category')
            if category_id:
                category = get_object_or_404(ConsultationCategory, id=category_id)
                categories = category.get_descendants(include_self=True)
                queryset = queryset.filter(category__in=categories)
        
        return queryset.select_related('category').prefetch_related('gallery')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ConsultationServiceListSerializer
        return ConsultationServiceSerializer
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured services"""
        services = self.get_queryset().filter(is_featured=True).order_by('?')[:6]
        serializer = ConsultationServiceListSerializer(
            services, many=True, context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def gallery(self, request, pk=None):
        """Get service gallery images"""
        service = self.get_object()
        images = service.gallery.filter(is_active=True).order_by('order')
        serializer = ServiceImageSerializer(
            images, many=True, context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def price_range(self, request):
        """Get min and max prices"""
        services = self.get_queryset()
        prices = services.exclude(price__isnull=True).values_list('price', flat=True)
        if prices.exists():
            return Response({
                'min': min(prices),
                'max': max(prices),
                'currency': services.first().currency if services.exists() else 'TZS'
            })
        return Response({'min': 0, 'max': 0})


# ============ REQUEST VIEWSET ============
class ConsultationRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for Consultation Requests"""
    queryset = ConsultationRequest.objects.all()
    serializer_class = ConsultationRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'service', 'assigned_to']
    search_fields = ['client__username', 'client__email', 'service__name', 'message']
    ordering_fields = ['created_at', 'preferred_date', 'priority']
    
    def get_queryset(self):
        user = self.request.user
        queryset = ConsultationRequest.objects.select_related(
            'client', 'service', 'assigned_to'
        ).prefetch_related('documents', 'followups')
        
        if user.role in ['admin', 'consultant'] or user.is_staff:
            return queryset
        
        return queryset.filter(client=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ConsultationRequestCreateSerializer
        if self.action in ['update', 'partial_update']:
            user = self.request.user
            if user.role in ['admin', 'consultant'] or user.is_staff:
                return ConsultationRequestUpdateSerializer
        return ConsultationRequestSerializer
    
    def perform_create(self, serializer):
        serializer.save(client=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update consultation request status"""
        consultation = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        consultation.status = new_status
        
        if new_status == 'completed':
            consultation.completed_at = timezone.now()
        
        consultation.save()
        
        serializer = self.get_serializer(consultation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign a consultant to the request"""
        consultation = self.get_object()
        consultant_id = request.data.get('consultant_id')
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            consultant = User.objects.get(
                id=consultant_id, 
                role__in=['consultant', 'admin'],
                is_active=True
            )
            consultation.assigned_to = consultant
            consultation.status = 'confirmed'
            consultation.save()
            
            serializer = self.get_serializer(consultation)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Consultant not found or not active'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add admin note to consultation"""
        consultation = self.get_object()
        note = request.data.get('note', '')
        note_type = request.data.get('type', 'admin')
        
        if not note:
            return Response(
                {'error': 'Note is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        timestamp = timezone.now().strftime('%Y-%m-%d %H:%M')
        header = f"[{request.user.username} - {timestamp}]"
        
        if note_type == 'internal':
            consultation.internal_notes = (
                f"{consultation.internal_notes}\n\n{header}\n{note}"
                if consultation.internal_notes
                else f"{header}\n{note}"
            )
        else:
            consultation.admin_notes = (
                f"{consultation.admin_notes}\n\n{header}\n{note}"
                if consultation.admin_notes
                else f"{header}\n{note}"
            )
        
        consultation.save()
        serializer = self.get_serializer(consultation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """Submit client feedback and rating"""
        consultation = self.get_object()
        
        if consultation.client != request.user:
            return Response(
                {'error': 'Only the client can submit feedback'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        feedback = request.data.get('feedback', '')
        rating = request.data.get('rating')
        
        if rating is not None:
            try:
                rating = int(rating)
                if rating < 1 or rating > 5:
                    return Response(
                        {'error': 'Rating must be between 1 and 5'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Rating must be a number between 1 and 5'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        consultation.client_feedback = feedback
        if rating is not None:
            consultation.client_rating = rating
        consultation.save()
        
        serializer = self.get_serializer(consultation)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get consultation statistics for current user"""
        if request.user.role in ['admin', 'consultant'] or request.user.is_staff:
            queryset = ConsultationRequest.objects.all()
        else:
            queryset = ConsultationRequest.objects.filter(client=request.user)
        
        stats = queryset.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            confirmed=Count('id', filter=Q(status='confirmed')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            completed=Count('id', filter=Q(status='completed')),
            cancelled=Count('id', filter=Q(status='cancelled')),
        )
        
        return Response(stats)


# ============ DOCUMENT VIEWSET ============
class ConsultationDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Consultation Documents"""
    queryset = ConsultationDocument.objects.all()
    serializer_class = ConsultationDocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['document_type', 'request']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'consultant'] or user.is_staff:
            return ConsultationDocument.objects.all()
        return ConsultationDocument.objects.filter(request__client=user)
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


# ============ FOLLOWUP VIEWSET ============
class ConsultationFollowupViewSet(viewsets.ModelViewSet):
    """ViewSet for Consultation Followups"""
    queryset = ConsultationFollowup.objects.all()
    serializer_class = ConsultationFollowupSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'request', 'assigned_to']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'consultant'] or user.is_staff:
            return ConsultationFollowup.objects.all()
        return ConsultationFollowup.objects.filter(request__client=user)
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark followup as completed"""
        followup = self.get_object()
        followup.status = 'completed'
        followup.completed_at = timezone.now()
        followup.save()
        serializer = self.get_serializer(followup)
        return Response(serializer.data)


# ============ PUBLIC ENDPOINTS ============
@api_view(['GET'])
@permission_classes([AllowAny])
def public_services_list(request):
    """Public list of all active services with categories"""
    services = ConsultationService.objects.filter(
        is_active=True
    ).select_related('category').order_by('category__order', 'order')
    
    serializer = ConsultationServiceListSerializer(
        services, many=True, context={'request': request}
    )
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_categories_tree(request):
    """Public category tree with nested services"""
    categories = ConsultationCategory.objects.filter(
        is_active=True, parent__isnull=True
    ).order_by('order', 'name')
    
    serializer = ConsultationCategoryTreeSerializer(
        categories, many=True, context={'request': request}
    )
    return Response(serializer.data)