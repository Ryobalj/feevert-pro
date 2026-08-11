# core/workspace_api.py
"""API for the staff workspace: tasks people are given, and their own notes."""

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.roles import is_staff_role
from .models import Task, StickyNote, WorkDocument


# ---------------------------------------------------------------- serializers
class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.username', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description',
            'assigned_to', 'assigned_to_name', 'assigned_by', 'assigned_by_name',
            'status', 'status_display', 'priority', 'priority_display',
            'due_date', 'completed_at', 'is_overdue',
            'related_request', 'attachment', 'attachment_url',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'assigned_by', 'completed_at', 'created_at', 'updated_at']

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get('request')
        url = obj.attachment.url
        return request.build_absolute_uri(url) if request else url


class StickyNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = StickyNote
        fields = ['id', 'content', 'color', 'is_pinned', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


# ------------------------------------------------------------------- viewsets
class TaskViewSet(viewsets.ModelViewSet):
    """Staff see the tasks assigned to them; admins and consultants also see
    (and hand out) everyone's, since they're the ones delegating."""
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'related_request']
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'created_at', 'priority', 'status']

    def _can_delegate(self, user):
        role = (getattr(user, 'role_name', '') or '').strip().lower()
        return role in ('admin', 'consultant') or user.is_superuser

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.select_related('assigned_to', 'assigned_by')
        if self._can_delegate(user):
            return qs
        return qs.filter(assigned_to=user)

    def perform_create(self, serializer):
        user = self.request.user
        if not self._can_delegate(user):
            # Everyone can still write their own to-dos, just not delegate.
            serializer.save(assigned_by=user, assigned_to=user)
            return
        serializer.save(assigned_by=user)

    def perform_update(self, serializer):
        task = serializer.save()
        if task.status == 'done' and not task.completed_at:
            task.completed_at = timezone.now()
            task.save(update_fields=['completed_at'])
        elif task.status != 'done' and task.completed_at:
            task.completed_at = None
            task.save(update_fields=['completed_at'])

    @action(detail=False, methods=['get'])
    def assignable_users(self, request):
        """Who a task can be handed to — used by the assign dropdown."""
        if not self._can_delegate(request.user):
            return Response([])
        from django.contrib.auth import get_user_model
        users = [u for u in get_user_model().objects.filter(is_active=True) if is_staff_role(u)]
        return Response([
            {'id': u.id, 'username': u.username,
             'full_name': getattr(u, 'full_name', '') or u.username,
             'role': getattr(u, 'role_name', '')}
            for u in users
        ])

    @action(detail=False, methods=['get'])
    def summary(self, request):
        qs = self.get_queryset().filter(assigned_to=request.user)
        return Response({
            'todo': qs.filter(status='todo').count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'done': qs.filter(status='done').count(),
            'overdue': sum(1 for t in qs.exclude(status__in=['done', 'cancelled']) if t.is_overdue),
        })


class StickyNoteViewSet(viewsets.ModelViewSet):
    """Private notes — never shared, so the queryset is always the owner's."""
    serializer_class = StickyNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StickyNote.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class WorkDocumentSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = WorkDocument
        fields = [
            'id', 'title', 'kind', 'content', 'data', 'external_url',
            'is_shared', 'related_request', 'owner', 'owner_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']


class WorkDocumentViewSet(viewsets.ModelViewSet):
    """Drafts: your own, plus anything a colleague marked as shared."""
    serializer_class = WorkDocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['kind', 'is_shared', 'related_request']
    search_fields = ['title', 'content']
    ordering_fields = ['updated_at', 'title']

    def get_queryset(self):
        from django.db.models import Q
        return WorkDocument.objects.filter(
            Q(owner=self.request.user) | Q(is_shared=True)
        ).select_related('owner')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        # Only the owner can change a draft, even a shared one.
        if serializer.instance.owner_id != self.request.user.id:
            raise serializers.ValidationError('Only the owner can edit this draft.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner_id != self.request.user.id:
            raise serializers.ValidationError('Only the owner can delete this draft.')
        instance.delete()
