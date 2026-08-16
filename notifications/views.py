# notifications/views.py

import logging

import django_filters
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

logger = logging.getLogger(__name__)

from accounts.permissions import IsAdminRole
from .models import (
    Notification, NotificationTemplate, UserNotificationSetting, NotificationLog,
    IncomingEmail, EmailAccount, OutgoingEmail
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
    OutgoingEmailSerializer,
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

class IncomingEmailFilter(django_filters.FilterSet):
    """Same as filterset_fields, except `assigned_to` also accepts 'me' (the
    logged-in user) and 'none' (unassigned) — the two views a team inbox is
    built around, which a plain ModelChoiceFilter can't express."""
    assigned_to = django_filters.CharFilter(method='filter_assigned_to')
    # info@ receives mail for several aliases (asia.abdallah@, saidina@, …), so
    # "which address was this actually sent to" is a different question from
    # "which mailbox holds it" — filter on the recipient header for that.
    to = django_filters.CharFilter(method='filter_to')

    class Meta:
        model = IncomingEmail
        fields = ['is_read', 'source', 'folder', 'account', 'is_archived', 'assigned_to']

    def filter_to(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(recipient__icontains=value)

    def filter_assigned_to(self, queryset, name, value):
        if value == 'me':
            return queryset.filter(assigned_to=self.request.user)
        if value in ('none', 'null', 'unassigned'):
            return queryset.filter(assigned_to__isnull=True)
        return queryset.filter(assigned_to_id=value)


class IncomingEmailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Unified inbox for emails received at staff/shared mailboxes (via
    Outlook/Microsoft 365 or IMAP - see
    notifications/services/email_inbound_service.py). Staff-only: reading
    business email doesn't belong to a specific client.

    Visibility (TeamInbox-style), the same rule for everyone including admins:
      * shared mailbox (is_shared, e.g. info@)  -> every staff member
      * personal mailbox (owner_user set)       -> that owner only
      * unassigned mailbox (neither)            -> nobody here

    Admins deliberately get no bypass: an admin reads their own mailbox plus
    the shared one, not their colleagues' private mail. Full oversight lives in
    the Django admin, which is audited and off the day-to-day path.
    """
    queryset = IncomingEmail.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = IncomingEmailFilter
    search_fields = ['sender', 'sender_name', 'subject', 'body']
    ordering = ['-received_at']

    def get_queryset(self):
        user = self.request.user
        qs = IncomingEmail.objects.filter(
            Q(account__owner_user=user) | Q(account__is_shared=True)
        ).select_related('account', 'assigned_to')

        # Several aliases (nicole.abbas@, prisila.neema@, …) all land in the
        # shared info@ mailbox. A message addressed to a colleague by name is
        # theirs, not the team's, so keep it out of everyone else's shared view;
        # what stays shared is mail nobody was singled out for (info@,
        # allstaff@). Mail addressed to *you* is of course still yours.
        for addr in self._colleague_addresses(user):
            qs = qs.exclude(Q(account__is_shared=True) & Q(recipient__icontains=addr))
        return qs

    @staticmethod
    def _colleague_addresses(user):
        """Addresses that identify someone other than `user` — their login
        address and any mailbox they own."""
        from django.contrib.auth import get_user_model

        mine = {(user.email or '').lower()}
        mine |= {a.lower() for a in EmailAccount.objects
                 .filter(owner_user=user).values_list('email_address', flat=True)}

        theirs = set()
        for addr in get_user_model().objects.exclude(pk=user.pk).exclude(
                email='').values_list('email', flat=True):
            theirs.add(addr.lower())
        for acc in EmailAccount.objects.filter(owner_user__isnull=False).exclude(owner_user=user):
            theirs.add(acc.email_address.lower())
            for alias in (acc.aliases or []):
                theirs.add(str(alias).lower())
        # ...and my own aliases stay mine
        for acc in EmailAccount.objects.filter(owner_user=user):
            for alias in (acc.aliases or []):
                mine.add(str(alias).lower())

        return {a for a in theirs if a and a not in mine}

    def get_serializer_class(self):
        if self.action == 'list':
            return IncomingEmailListSerializer
        return IncomingEmailSerializer

    @action(detail=False, methods=['get'])
    def mailboxes(self, request):
        """The mailboxes this user can read, with unread counts — the sidebar
        of the team inbox. Unlike /email-accounts/ (admin-only, and full of
        credentials) this is safe for any staff member."""
        user = request.user
        visible = self.get_queryset()
        rows = []
        seen = set()
        for e in visible.select_related('account').values(
            'account', 'account__email_address', 'account__is_shared',
            'account__owner_user__username',
        ).annotate(total=Count('id'), unread=Count('id', filter=Q(is_read=False))):
            key = e['account']
            if key in seen:
                continue
            seen.add(key)
            rows.append({
                'id': key,
                'email_address': e['account__email_address'] or 'Other',
                'is_shared': bool(e['account__is_shared']),
                'owner': e['account__owner_user__username'],
                'total': e['total'],
                'unread': e['unread'],
            })
        rows.sort(key=lambda r: (not r['is_shared'], r['email_address']))

        # "Sent to" answers one question: what came to *my* addresses? Scanning
        # every recipient in view listed colleagues too (their names appear in
        # the To/Cc of mail sitting in a shared mailbox), which is neither mine
        # nor useful. Build the list from the addresses I actually answer to.
        import html as _html
        import re as _re

        my_addresses = []
        if user.email:
            # Mail addressed to me by name is mine wherever it landed, and it
            # is the first thing people look for here.
            my_addresses.append(user.email.strip().lower())
        for acc in EmailAccount.objects.filter(
                Q(owner_user=user) | Q(is_shared=True)).order_by('email_address'):
            my_addresses.append(acc.email_address.lower())
            my_addresses += [str(a).lower() for a in (acc.aliases or [])]
        # An alias of a colleague's mailbox is theirs, even if it reads as
        # shared mail — leave it out.
        colleagues = self._colleague_addresses(user)
        my_addresses = [a for a in dict.fromkeys(my_addresses) if a not in colleagues]

        counts = {a: 0 for a in my_addresses}
        for rec in visible.exclude(recipient='').values_list('recipient', flat=True):
            # Recipient headers arrive HTML-escaped ("&lt;info@…&gt;"), so
            # unescape before matching or every address keeps a stray "&gt".
            found = {x.lower() for x in _re.findall(r'[\w.+-]+@[\w.-]+\.\w+', _html.unescape(str(rec)))}
            for a in my_addresses:
                if a in found:
                    counts[a] += 1
        alias_rows = [{'address': a, 'count': c} for a, c in
                      sorted(counts.items(), key=lambda kv: -kv[1]) if c]

        folder_rows = {
            r['folder']: {'total': r['total'], 'unread': r['unread']}
            for r in visible.values('folder').annotate(
                total=Count('id'), unread=Count('id', filter=Q(is_read=False)))
        }

        # The addresses this person may answer as: their own mailboxes with
        # every alias on them, plus a shared mailbox's own address.
        #
        # A shared mailbox's aliases belong to individual people (nicole.abbas@
        # and saidina@ both land in info@), so only the one that is this
        # person's own address is offered — otherwise everyone with access to
        # the team inbox could write as any colleague.
        my_login = (user.email or '').strip().lower()
        from_options = []
        for acc in EmailAccount.objects.filter(is_active=True).filter(
                Q(owner_user=user) | Q(is_shared=True)):
            from_options.append(acc.email_address)
            for a in (acc.aliases or []):
                if acc.owner_user_id == user.id or str(a).strip().lower() == my_login:
                    from_options.append(a)
        # Their own work address is theirs to answer as even if nobody has
        # recorded it as an alias yet — provided it is on the same domain as a
        # mailbox they can already send from.
        domains = {a.split('@')[-1].lower() for a in from_options if '@' in a}
        if my_login and my_login.split('@')[-1] in domains:
            from_options.append(my_login)

        return Response({
            'mailboxes': rows,
            'aliases': alias_rows,
            'folders': folder_rows,
            'from_options': sorted(set(a.lower() for a in from_options if a)),
            'total': visible.count(),
            'unread': visible.filter(is_read=False).count(),
        })

    @action(detail=False, methods=['get'])
    def contacts(self, request):
        """Everyone who has ever written in, newest first — the address book the
        old cPanel mail was being kept around for."""
        term = (request.query_params.get('search') or '').strip()
        qs = self.get_queryset().exclude(sender='')
        if term:
            qs = qs.filter(Q(sender__icontains=term) | Q(sender_name__icontains=term))
        rows = {}
        for e in qs.values(
            'sender', 'sender_name', 'received_at'
        ).order_by('-received_at')[:5000]:
            import html as _h
            addr = _h.unescape((e['sender'] or '')).strip().strip('<>').lower()
            if not addr or '@' not in addr:
                continue
            row = rows.get(addr)
            if row:
                row['messages'] += 1
                if not row['name'] and e['sender_name']:
                    row['name'] = e['sender_name']
            else:
                rows[addr] = {
                    'email': addr,
                    'name': e['sender_name'] or '',
                    'messages': 1,
                    'last_seen': e['received_at'],
                }
        contacts = sorted(rows.values(), key=lambda r: r['last_seen'] or '', reverse=True)
        return Response({'count': len(contacts), 'contacts': contacts})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        email = self.get_object()
        email.is_read = True
        email.save(update_fields=['is_read'])
        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        email = self.get_object()
        email.is_read = False
        email.save(update_fields=['is_read'])
        return Response({'success': True})

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        """Act on several messages at once — ticking a few boxes, or "select
        all" on the folder you're looking at.

        Pass `ids` for a specific set, or `all: true` to mean every message in
        the current view. "All" is resolved through the same filters the list
        used (folder, search, assignment), never the whole database, so
        selecting all in Spam can't touch the Inbox.
        """
        what = (request.data.get('action') or '').strip()
        ids = request.data.get('ids') or []
        take_all = bool(request.data.get('all'))

        actions = {
            'read': {'is_read': True},
            'unread': {'is_read': False},
            'archive': {'is_archived': True},
            'unarchive': {'is_archived': False},
        }
        if what not in actions:
            return Response({'error': f'Unknown action "{what}"'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not ids and not take_all:
            return Response({'error': 'Select at least one message'},
                            status=status.HTTP_400_BAD_REQUEST)

        qs = self.filter_queryset(self.get_queryset())
        if not take_all:
            qs = qs.filter(id__in=ids)
        count = qs.update(**actions[what])
        return Response({'success': True, 'action': what, 'updated': count})

    @staticmethod
    def _document_ids(request):
        """Files already on a client job that should ride along.

        Multipart repeats the field; JSON sends a list. Accept both rather
        than making the caller know which."""
        ids = request.data.getlist('document_ids') if hasattr(request.data, 'getlist')             else request.data.get('document_ids')
        if isinstance(ids, str):
            ids = [ids]
        return [i for i in (ids or []) if i]

    @action(detail=False, methods=['post'])
    def compose(self, request):
        """Send a new email from one of the user's own mailboxes — the "New
        mail" button. Without this the mail page can only ever reply."""
        to_email = (request.data.get('to') or '').strip()
        subject = (request.data.get('subject') or '').strip()
        body = request.data.get('body') or ''
        account_id = request.data.get('account')

        if not to_email:
            return Response({'error': 'A recipient is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not body.strip() and not subject:
            return Response({'error': 'Write a subject or a message'}, status=status.HTTP_400_BAD_REQUEST)

        # Only send from a mailbox this user is allowed to use.
        allowed = EmailAccount.objects.filter(is_active=True).filter(
            Q(owner_user=request.user) | Q(is_shared=True)
        )
        account = allowed.filter(id=account_id).first() if account_id else allowed.first()

        # Recorded before it's sent, so a refusal by the mail server becomes a
        # scheduled retry instead of a lost message.
        from .services import outgoing_mail
        try:
            out = outgoing_mail.send_now(
                to_email=to_email, subject=subject, body=body,
                account=account, user=request.user,
                attachments=request.FILES.getlist('attachments'),
                document_ids=self._document_ids(request),
            )
        except outgoing_mail.AttachmentError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'success': out.status == 'sent',
            'queued': out.status in ('queued', 'failed'),
            'status': out.status,
            'error': out.last_error or None,
            'outgoing_id': str(out.id),
            'from': account.email_address if account else None,
        })

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Give this conversation an owner so the team can see who's on it.
        Pass user_id, or omit it to take the conversation yourself; pass
        user_id=null to unassign."""
        from django.contrib.auth import get_user_model
        email = self.get_object()
        if 'user_id' in request.data:
            uid = request.data.get('user_id')
            if uid in (None, '', 'null'):
                email.assigned_to = None
            else:
                user = get_user_model().objects.filter(id=uid, is_active=True).first()
                if not user:
                    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
                email.assigned_to = user
        else:
            email.assigned_to = request.user
        email.save(update_fields=['assigned_to'])
        return Response(IncomingEmailSerializer(email, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Clear a finished conversation out of the working views (reversible:
        pass archived=false to bring it back)."""
        email = self.get_object()
        email.is_archived = str(request.data.get('archived', True)).lower() not in ('false', '0', 'no')
        email.save(update_fields=['is_archived'])
        return Response({'success': True, 'is_archived': email.is_archived})

    @action(detail=True, methods=['post'])
    def snooze(self, request, pk=None):
        """Hide until a time (hours from now, or until=<iso datetime>);
        hours=0 / until=null wakes it immediately."""
        email = self.get_object()
        until = request.data.get('until')
        hours = request.data.get('hours')
        if until in (None, '', 'null') and hours in (None, '', 0, '0'):
            email.snoozed_until = None
        elif until:
            from django.utils.dateparse import parse_datetime
            parsed = parse_datetime(until)
            if not parsed:
                return Response({'error': 'Invalid datetime'}, status=status.HTTP_400_BAD_REQUEST)
            email.snoozed_until = parsed
        else:
            from datetime import timedelta
            try:
                email.snoozed_until = timezone.now() + timedelta(hours=float(hours))
            except (TypeError, ValueError):
                return Response({'error': 'Invalid hours'}, status=status.HTTP_400_BAD_REQUEST)
        email.save(update_fields=['snoozed_until'])
        return Response({'success': True, 'snoozed_until': email.snoozed_until})

    @action(detail=True, methods=['post'])
    def tag(self, request, pk=None):
        """Set the conversation's tags (send the full list)."""
        email = self.get_object()
        tags = request.data.get('tags', [])
        if not isinstance(tags, list):
            return Response({'error': 'tags must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        email.tags = [str(t)[:40] for t in tags][:12]
        email.save(update_fields=['tags'])
        return Response({'success': True, 'tags': email.tags})

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

        # Answer as whichever of the user's own addresses fits — a person who
        # reads accounts@ may need to reply as prisila.neema@.
        from_address = (request.data.get('from_address') or '').strip().lower()
        send_account = email.account
        if from_address:
            allowed = EmailAccount.objects.filter(is_active=True).filter(
                Q(owner_user=request.user) | Q(is_shared=True)
            )
            match = next(
                (a for a in allowed
                 if a.email_address.lower() == from_address
                 or from_address in [x.lower() for x in (a.aliases or [])]),
                None,
            )
            if not match:
                return Response({'error': 'You cannot send from that address.'}, status=403)
            send_account = match

        from .services import outgoing_mail
        try:
            out = outgoing_mail.send_now(
                to_email=email.sender,
                subject=reply_subject,
                body=serializer.validated_data['body'],
                html_body=serializer.validated_data.get('body_html'),
                account=send_account,
                user=request.user,
                reply_to_email=email,
                # A client sees a document when it is sent to them, so this is
                # the only door files go out of — from a laptop, or off the job.
                attachments=request.FILES.getlist('attachments'),
                document_ids=self._document_ids(request),
            )
        except outgoing_mail.AttachmentError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        email.is_processed = True
        email.save(update_fields=['is_processed'])
        return Response({
            'success': out.status == 'sent',
            'queued': out.status in ('queued', 'failed'),
            'status': out.status,
            'error': out.last_error or None,
            'outgoing_id': str(out.id),
        })

    @action(detail=False, methods=['post'])
    def sync_now(self, request):
        """Fetch new emails on demand for whichever accounts this user is
        allowed to see. Until a scheduled job (Render Cron Job or Celery
        beat) is set up, this button is how new emails actually arrive in
        the unified inbox."""
        from .models import EmailAccount
        from .services.email_inbound_service import EmailInboundService

        user = request.user
        # The Zoho API sync pulls every mailbox in one call and files each
        # message under its own account, so visibility is enforced on read
        # (get_queryset) rather than by limiting the fetch.
        try:
            from .services import zoho_mail_api
            if zoho_mail_api.is_configured():
                # A button press should return promptly, so check recent mail
                # here; the full mirror is `manage.py sync_zoho_inbox`.
                saved = zoho_mail_api.sync(limit=200)
                return Response({'zoho_api': {'success': True, 'saved': saved}})
        except Exception as e:
            logger.warning(f'Zoho sync_now failed, falling back: {e}')

        if user.role_name == 'admin' or user.is_staff:
            results = EmailInboundService.fetch_all_sources()
        else:
            accounts = EmailAccount.objects.filter(is_active=True).filter(
                Q(owner_user=user) | Q(is_shared=True)
            )
            results = EmailInboundService.fetch_all_accounts(accounts=accounts) if accounts.exists() else {}
        return Response(results)


# ============================================================
# OUTGOING EMAIL (delivery tracking)
# ============================================================

class OutgoingEmailViewSet(viewsets.ReadOnlyModelViewSet):
    """What became of the mail we sent: accepted by the server, opened by the
    recipient, or refused and waiting for its next retry.

    Same visibility rule as the inbox — your own sends, plus anything sent
    from a mailbox you can read.
    """
    serializer_class = OutgoingEmailSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'account']
    search_fields = ['to_email', 'subject']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        return OutgoingEmail.objects.filter(
            Q(sent_by=user) | Q(account__owner_user=user) | Q(account__is_shared=True)
        ).select_related('account', 'sent_by', 'reply_to_email').distinct()

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = self.get_queryset()
        counts = {row['status']: row['n'] for row in
                  qs.values('status').annotate(n=Count('id'))}
        return Response({
            'total': qs.count(),
            'sent': counts.get('sent', 0),
            'opened': counts.get('opened', 0),
            'queued': counts.get('queued', 0),
            'failed': counts.get('failed', 0),
            'gave_up': counts.get('gave_up', 0),
            # What still needs a human: the ones that stopped retrying.
            'needs_attention': counts.get('gave_up', 0),
        })

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Send it again now — including messages that had given up, since a
        fixed password or a corrected address deserves a fresh start."""
        from .services import outgoing_mail

        out = self.get_object()
        if out.status in ('sent', 'opened'):
            return Response({'error': 'That message already went out.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if out.status == 'gave_up':
            out.attempts = 0
            out.status = 'queued'
            out.save(update_fields=['attempts', 'status'])
        ok = outgoing_mail.attempt(out)
        out.refresh_from_db()
        return Response({'success': ok, 'status': out.status,
                         'error': out.last_error or None})


@api_view(['GET'])
@permission_classes([AllowAny])
def track_email_open(request, tracking_id):
    """The 1x1 image at the bottom of every message we send. Loading it is
    what turns "sent" into "opened".

    Public by design — it's fetched by the recipient's mail client, which
    carries none of our credentials. The id is a random UUID, so it reveals
    nothing and can't be guessed; the response is the same tiny GIF whether
    the id is known or not, so nobody can probe it for valid ids.
    """
    from django.http import HttpResponse

    from .services import outgoing_mail

    try:
        ip = (request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
              or request.META.get('REMOTE_ADDR', ''))
        outgoing_mail.mark_opened(tracking_id, ip)
    except Exception as e:
        logger.warning('Open-tracking failed for %s: %s', tracking_id, e)

    # 43-byte transparent GIF
    pixel = (b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00!\xf9\x04'
             b'\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D'
             b'\x01\x00;')
    response = HttpResponse(pixel, content_type='image/gif')
    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response


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


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def cron_sync_emails(request):
    """
    Triggers a fetch of every active EmailAccount's mailbox. Meant to be
    called by an external scheduler (e.g. cron-job.org) every few minutes,
    since Render's own Cron Jobs aren't available on the free plan.

    Auth is a shared secret (settings.EMAIL_SYNC_CRON_SECRET) passed as
    ?secret=... - not a real user login, since an external cron service
    can't do an OAuth/JWT flow. Compared with hmac.compare_digest to avoid
    leaking the secret's length/content via timing.
    """
    import hmac
    from django.conf import settings
    from .services.email_inbound_service import EmailInboundService

    provided = request.GET.get('secret') or request.data.get('secret', '')
    expected = getattr(settings, 'EMAIL_SYNC_CRON_SECRET', '')
    if not expected or not hmac.compare_digest(str(provided), str(expected)):
        return Response({'error': 'Invalid or missing secret'}, status=403)

    # Mail that the server refused earlier is retried on the same tick, so a
    # brief outage costs a few minutes rather than the message.
    from .services import outgoing_mail
    retried = outgoing_mail.retry_pending()

    # The same tick is also when appointment reminders go out — there is no
    # second scheduler, and adding one for this would be a lot of moving parts
    # for a notification.
    try:
        from core.workspace_api import send_due_reminders
        reminders = send_due_reminders()
    except Exception as e:
        logger.warning('Calendar reminders failed: %s', e)
        reminders = 0

    from .services import zoho_mail_api
    if zoho_mail_api.is_configured():
        # IMAP is geo-blocked from Render; the API path is the one that works.
        # Runs every few minutes, so check a short window — the deep backfill
        # is `manage.py sync_zoho_inbox` with no --limit.
        saved = zoho_mail_api.sync(limit=50)
        return Response({'zoho_api': {'success': True, 'saved': saved},
                         'outgoing_retry': retried, 'reminders_sent': reminders})

    results = EmailInboundService.fetch_all_sources()
    return Response({**results, 'outgoing_retry': retried, 'reminders_sent': reminders})