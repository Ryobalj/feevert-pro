# notifications/views.py

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from accounts.permissions import IsAdminRole
from .models import (
    Notification, NotificationTemplate, UserNotificationSetting, NotificationLog,
    IncomingEmail, EmailAccount
)
from .serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    NotificationCreateSerializer,
    NotificationTemplateSerializer,
    NotificationTemplatePreviewSerializer,
    UserNotificationSettingSerializer,
    UserNotificationSettingUpdateSerializer,
    NotificationLogSerializer,
    NotificationMarkReadSerializer,
    EmailTestSerializer,
    SMSTestSerializer,
    BulkNotificationSerializer,
    CommunicationSerializer,
    IncomingEmailSerializer,
    IncomingEmailListSerializer,
    EmailReplySerializer,
    EmailAccountSerializer,
)


# ============================================================
# NOTIFICATION VIEWS
# ============================================================

class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet kamili ya Notifications.
    Inasaidia: list, detail, create, mark_read, unread_count.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['notification_type', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'notification_type']
    ordering = ['-created_at']

    def get_queryset(self):
        """Angalia notifications za mtumiaji tu"""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('recipient')

    def get_serializer_class(self):
        """Chagua serializer kulingana na action"""
        if self.action == 'list':
            return NotificationListSerializer
        elif self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer

    def perform_create(self, serializer):
        """Unda notification na itume kupitia NotificationDispatcher"""
        notification = serializer.save()

        # Tuma notification instantly
        from .services.notification_dispatcher import NotificationDispatcher
        NotificationDispatcher.send(
            recipient=notification.recipient,
            notification_type=notification.notification_type,
            title=notification.title,
            message=notification.message,
            related_link=notification.related_link,
        )

    # ============================================================
    # CUSTOM ACTIONS
    # ============================================================

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Soma notifications kwa wingi"""
        serializer = NotificationMarkReadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        queryset = Notification.objects.filter(recipient=request.user, is_read=False)

        if serializer.validated_data.get('mark_all'):
            count = queryset.update(is_read=True)
        else:
            notification_ids = serializer.validated_data.get('notification_ids', [])
            count = queryset.filter(id__in=notification_ids).update(is_read=True)

        return Response({'success': True, 'marked_read': count})

    @action(detail=True, methods=['post'])
    def mark_read_single(self, request, pk=None):
        """Soma notification moja"""
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'success': True, 'notification_id': str(notification.id)})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Idadi ya notifications ambazo hazijasomwa"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({
            'unread_count': count,
            'has_unread': count > 0,
        })

    @action(detail=False, methods=['post'])
    def resend(self, request):
        """Tuma upya notification"""
        notification_id = request.data.get('notification_id')
        try:
            notification = self.get_queryset().get(id=notification_id)
            from .services.notification_dispatcher import NotificationDispatcher
            NotificationDispatcher.send(
                recipient=notification.recipient,
                notification_type=notification.notification_type,
                title=notification.title,
                message=notification.message,
                related_link=notification.related_link,
            )
            return Response({'success': True, 'message': 'Notification resent'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=404)


# ============================================================
# TEMPLATE VIEWS
# ============================================================

class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet kwa ajili ya Notification Templates (Admin pekee)"""
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'subject', 'body_text']

    def get_permissions(self):
        """Create/Update/Delete ni kwa admin pekee"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """Preview template na variables"""
        template = self.get_object()
        variables = request.data.get('variables', {})
        serializer = NotificationTemplatePreviewSerializer(
            template,
            context={'variables': variables}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Tuma template kwa mtumiaji"""
        template = self.get_object()
        recipient_id = request.data.get('recipient_id')
        notification_type = request.data.get('notification_type', 'email')

        if not recipient_id:
            return Response({'error': 'recipient_id required'}, status=400)

        from accounts.models import User
        from .services.notification_dispatcher import NotificationDispatcher

        try:
            user = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Render template na variables
        context = request.data.get('variables', {})
        subject = template.subject
        body = template.body_text

        for key, value in context.items():
            subject = subject.replace(f'{{{{{key}}}}}', str(value))
            body = body.replace(f'{{{{{key}}}}}', str(value))

        NotificationDispatcher.send(
            recipient=user,
            notification_type=notification_type,
            title=subject,
            message=body,
        )

        return Response({'success': True, 'message': f'Template sent to {user.email}'})


# ============================================================
# USER SETTINGS VIEWS
# ============================================================

class UserNotificationSettingViewSet(viewsets.GenericViewSet,
                                     generics.RetrieveUpdateAPIView):
    """
    ViewSet kwa ajili ya User Notification Settings.
    Kila mtumiaji ana settings moja tu.
    """
    serializer_class = UserNotificationSettingSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Pata au unda settings za mtumiaji"""
        obj, created = UserNotificationSetting.objects.get_or_create(user=self.request.user)
        return obj

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserNotificationSettingUpdateSerializer
        return UserNotificationSettingSerializer


# ============================================================
# NOTIFICATION LOG VIEWS
# ============================================================

class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet kwa ajili ya kuangalia delivery logs (Admin pekee)"""
    queryset = NotificationLog.objects.select_related('notification', 'notification__recipient')
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['notification__title', 'notification__recipient__email']
    ordering = ['-created_at']


# ============================================================
# EMAIL ACCOUNT VIEWS (per-staff mailbox management, admin-only)
# ============================================================

class EmailAccountViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD for staff mailboxes. Each account maps one email
    address to IMAP/SMTP credentials and, optionally, a specific staff
    user who's the only one (besides admins) who can see its mail.
    """
    queryset = EmailAccount.objects.select_related('owner_user').all()
    serializer_class = EmailAccountSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active', 'provider']
    search_fields = ['email_address', 'owner_user__username', 'owner_user__email']

    @action(detail=True, methods=['post'])
    def sync_now(self, request, pk=None):
        """Fetch this one account's mailbox on demand."""
        from .services.email_inbound_service import EmailInboundService
        account = self.get_object()
        result = EmailInboundService.fetch_for_account(account)
        return Response(result)


# ============================================================
# INCOMING EMAIL (UNIFIED INBOX) VIEWS
# ============================================================

class IncomingEmailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Unified inbox for emails received at staff/shared mailboxes (via
    Outlook/Microsoft 365 or IMAP - see
    notifications/services/email_inbound_service.py). Staff-only: reading
    business email doesn't belong to a specific client.

    Visibility: a shared mailbox (EmailAccount.owner_user is null, or
    legacy rows with no account at all) is visible to any staff member;
    a personal mailbox is visible only to its owner. Admins see everything
    for oversight.
    """
    queryset = IncomingEmail.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_read', 'source', 'folder', 'account']
    search_fields = ['sender', 'sender_name', 'subject', 'body']
    ordering = ['-received_at']

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        if user.role_name == 'admin' or user.is_staff:
            return IncomingEmail.objects.all()
        return IncomingEmail.objects.filter(
            Q(account__owner_user=user) | Q(account__owner_user__isnull=True) | Q(account__isnull=True)
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return IncomingEmailListSerializer
        return IncomingEmailSerializer

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        email = self.get_object()
        email.is_read = True
        email.save(update_fields=['is_read'])
        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Reply to this email, sent from whichever address received it
        (the linked EmailAccount, or the site default for legacy/unlinked
        emails) so the recipient sees a normal reply in their own inbox -
        not a notification from some other address."""
        email = self.get_object()
        serializer = EmailReplySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        reply_subject = email.subject if email.subject.lower().startswith('re:') else f'Re: {email.subject}'

        if email.account:
            from .services.email_outbound_service import EmailOutboundService
            result = EmailOutboundService.send_via_account(
                account=email.account,
                to_email=email.sender,
                subject=reply_subject,
                body=serializer.validated_data['body'],
                html_body=serializer.validated_data.get('body_html'),
            )
        else:
            from .services.email_outbound_service import EmailOutboundService
            result = EmailOutboundService.send(
                to_email=email.sender,
                subject=reply_subject,
                body=serializer.validated_data['body'],
                html_body=serializer.validated_data.get('body_html'),
            )
        if not result.get('success', True):
            return Response({'error': result.get('error', 'Failed to send reply')}, status=502)

        email.is_processed = True
        email.save(update_fields=['is_processed'])
        return Response({'success': True})

    @action(detail=False, methods=['post'])
    def sync_now(self, request):
        """Fetch new emails on demand for whichever accounts this user is
        allowed to see. Until a scheduled job (Render Cron Job or Celery
        beat) is set up, this button is how new emails actually arrive in
        the unified inbox."""
        from django.db.models import Q
        from .models import EmailAccount
        from .services.email_inbound_service import EmailInboundService

        user = request.user
        if user.role_name == 'admin' or user.is_staff:
            results = EmailInboundService.fetch_all_sources()
        else:
            accounts = EmailAccount.objects.filter(is_active=True).filter(
                Q(owner_user=user) | Q(owner_user__isnull=True)
            )
            results = EmailInboundService.fetch_all_accounts(accounts=accounts) if accounts.exists() else {}
        return Response(results)


# ============================================================
# TEST & UTILITY ENDPOINTS
# ============================================================

class TestEndpointViewSet(viewsets.ViewSet):
    """Endpoints za kujaribu services zote"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def email(self, request):
        """Jaribu kutuma email"""
        serializer = EmailTestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        from .services.email_outbound_service import EmailOutboundService
        result = EmailOutboundService.send(
            to_email=serializer.validated_data['to_email'],
            subject=serializer.validated_data['subject'],
            body=serializer.validated_data['message'],
        )
        return Response({'success': result, 'message': 'Email sent' if result else 'Failed'})

    @action(detail=False, methods=['post'])
    def sms(self, request):
        """Jaribu kutuma SMS"""
        serializer = SMSTestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        from .services.sms_service import SMSService
        result = SMSService.send_sms(
            phone_number=serializer.validated_data['phone_number'],
            message=serializer.validated_data['message'],
        )
        return Response(result)

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        """Tuma notifications kwa wingi"""
        serializer = BulkNotificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        from accounts.models import User
        from .services.notification_dispatcher import NotificationDispatcher

        users = User.objects.filter(id__in=serializer.validated_data['user_ids'])
        data = serializer.validated_data

        count = 0
        for user in users:
            NotificationDispatcher.send(
                recipient=user,
                notification_type=data['notification_type'],
                title=data['title'],
                message=data['message'],
                priority=data.get('priority', 'medium'),
                related_link=data.get('related_link', ''),
            )
            count += 1

        return Response({'success': True, 'sent_to': count})

    @action(detail=False, methods=['post'])
    def communication(self, request):
        """Jaribu CommunicationService"""
        serializer = CommunicationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        from .services.communication_service import CommunicationService

        action = serializer.validated_data['action']
        result = {'success': True, 'action': action}

        if action == 'welcome':
            CommunicationService.send_welcome(request.user)
            result['message'] = 'Welcome email sent'

        elif action == 'test':
            from .services.notification_dispatcher import NotificationDispatcher
            NotificationDispatcher.send(
                recipient=request.user,
                notification_type=serializer.validated_data.get('send_via', 'email'),
                title='Test Notification',
                message='This is a test notification from FeeVert Communication Service.',
            )
            result['message'] = 'Test notification sent'

        return Response(result)


# ============================================================
# STANDALONE API VIEWS
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """Pata idadi ya notifications ambazo hazijasomwa"""
    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    return Response({
        'unread_count': count,
        'has_unread': count > 0,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):
    """Soma notifications zote"""
    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).update(is_read=True)
    return Response({'success': True, 'marked_read': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request, notification_id):
    """Soma notification moja"""
    try:
        notification = Notification.objects.get(
            id=notification_id,
            recipient=request.user
        )
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'success': True})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_notification_stats(request):
    """Pata statistics za notifications (Admin pekee)"""
    from django.db.models import Count

    total = Notification.objects.count()
    unread = Notification.objects.filter(is_read=False).count()

    by_type = Notification.objects.values('notification_type').annotate(count=Count('id'))
    by_status = NotificationLog.objects.values('status').annotate(count=Count('id'))

    return Response({
        'total': total,
        'unread': unread,
        'by_type': list(by_type),
        'by_status': list(by_status),
    })