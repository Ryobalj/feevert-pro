# core/workspace_api.py
"""API for the staff workspace: tasks people are given, and their own notes."""

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.roles import is_staff_role
from .models import Task, StickyNote, WorkDocument, CalendarEvent


# ---------------------------------------------------------------- serializers
class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.username', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    attachment_url = serializers.SerializerMethodField()
    email_subject = serializers.CharField(source='related_email.subject', read_only=True, default=None)
    email_sender = serializers.CharField(source='related_email.sender', read_only=True, default=None)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description',
            'assigned_to', 'assigned_to_name', 'assigned_by', 'assigned_by_name',
            'status', 'status_display', 'priority', 'priority_display',
            'due_date', 'completed_at', 'is_overdue',
            'related_request', 'attachment', 'attachment_url',
            'related_email', 'email_subject', 'email_sender',
            'submitted_at', 'review_notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'assigned_by', 'completed_at', 'submitted_at',
                            'created_at', 'updated_at']

    def get_attachment_url(self, obj):
        # Served by us — see core/file_views.py for why the storage URL isn't
        # good enough.
        if not obj.attachment:
            return None
        path = f'/api/v1/files/task-attachment/{obj.id}/'
        request = self.context.get('request')
        return request.build_absolute_uri(path) if request else path


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

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Assignee hands the work back for review."""
        task = self.get_object()
        if task.assigned_to_id != request.user.id:
            return Response({'error': 'Only the person doing the work can submit it.'}, status=403)
        task.status = 'submitted'
        task.submitted_at = timezone.now()
        task.save(update_fields=['status', 'submitted_at'])
        self._notify(task.assigned_by, 'Work submitted for review',
                     f'{request.user.username} submitted: {task.title}')
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Whoever handed the task out accepts it, or sends it back with a
        note saying what still needs doing."""
        task = self.get_object()
        user = request.user
        if not (task.assigned_by_id == user.id or self._can_delegate(user)):
            return Response({'error': 'Only the person who assigned this can review it.'}, status=403)

        approve = str(request.data.get('approve', True)).lower() not in ('false', '0', 'no')
        task.review_notes = request.data.get('notes', '') or ''
        if approve:
            task.status = 'done'
            task.completed_at = timezone.now()
            message = f'Approved: {task.title}'
        else:
            task.status = 'returned'
            task.completed_at = None
            message = f'Sent back for changes: {task.title}'
            if task.review_notes:
                message += f' — {task.review_notes}'
        task.save()
        self._notify(task.assigned_to, 'Task reviewed', message)
        return Response(self.get_serializer(task).data)

    @staticmethod
    def _notify(recipient, title, message):
        if not recipient:
            return
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=recipient, notification_type='system',
                title=title, message=message, related_link='/workspace',
            )
        except Exception:
            pass

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
    owner_name = serializers.SerializerMethodField()
    shared_with_names = serializers.SerializerMethodField()

    class Meta:
        model = WorkDocument
        fields = [
            'id', 'title', 'kind', 'content', 'data', 'external_url',
            'shared_with', 'shared_with_names', 'related_request',
            'owner', 'owner_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    @staticmethod
    def _name(user):
        full = f'{user.first_name} {user.last_name}'.strip()
        return full or user.get_username()

    def get_owner_name(self, obj):
        return self._name(obj.owner) if obj.owner_id else None

    def get_shared_with_names(self, obj):
        return [self._name(u) for u in obj.shared_with.all()]


class WorkDocumentViewSet(viewsets.ModelViewSet):
    """Drafts: your own, plus the ones a colleague named you on.

    Private is the default. There is no "everyone" — a draft is either yours
    or shared with the specific people you chose.
    """
    serializer_class = WorkDocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['kind', 'related_request']
    search_fields = ['title', 'content']
    ordering_fields = ['updated_at', 'title']

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        return WorkDocument.objects.filter(
            Q(owner=user) | Q(shared_with=user)
        ).select_related('owner').prefetch_related('shared_with').distinct()

    def perform_create(self, serializer):
        doc = serializer.save(owner=self.request.user)
        self._tell_the_tagged(doc, set())

    def perform_update(self, serializer):
        # Only the owner can change a draft, including who else may read it.
        if serializer.instance.owner_id != self.request.user.id:
            raise serializers.ValidationError('Only the owner can edit this draft.')
        before = set(serializer.instance.shared_with.values_list('pk', flat=True))
        doc = serializer.save()
        self._tell_the_tagged(doc, before)

    def _tell_the_tagged(self, doc, already_knew):
        """Being given someone's draft is only useful if you are told."""
        for person in doc.shared_with.all():
            if person.pk in already_knew or person.pk == doc.owner_id:
                continue
            TaskViewSet._notify(
                person, f'{doc.title} was shared with you',
                f'{self.request.user.get_username()} shared a {doc.get_kind_display().lower()} with you.',
            )

    def perform_destroy(self, instance):
        if instance.owner_id != self.request.user.id:
            raise serializers.ValidationError('Only the owner can delete this draft.')
        instance.delete()


# ============================================================
# FINANCE — the accountant's view of the business
# ============================================================
def is_finance_user(user):
    """Prisila keeps the books; admins oversee them. Everyone else has no
    business reading the company's money."""
    from accounts.roles import is_admin_role
    if is_admin_role(user):
        return True
    role = (getattr(user, 'role_name', '') or '').strip().lower()
    if role in ('accountant', 'finance', 'muhasibu'):
        return True
    # Whoever reads accounts@ is the accountant, whatever their role is called.
    from notifications.models import EmailAccount
    return EmailAccount.objects.filter(
        owner_user=user, email_address__istartswith='accounts@'
    ).exists()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def finance_summary(request):
    """Money in, money owed, and what it came from — the numbers an accountant
    opens the day with, rather than the generic staff workspace."""
    from django.db.models import Sum, Count, Q as _Q
    from datetime import timedelta

    if not is_finance_user(request.user):
        return Response({'error': 'Not available for this account'}, status=403)

    from payments.models import PaymentTransaction
    from consultations.models import ConsultationRequest
    from bookings.models import Booking

    days = int(request.query_params.get('days', 30) or 30)
    since = timezone.now() - timedelta(days=days)

    tx = PaymentTransaction.objects.all()
    recent = tx.filter(created_at__gte=since)

    def money(qs):
        return float(qs.aggregate(s=Sum('amount'))['s'] or 0)

    by_status = {
        row['status']: {'count': row['n'], 'amount': float(row['total'] or 0)}
        for row in tx.values('status').annotate(n=Count('id'), total=Sum('amount'))
    }

    return Response({
        'period_days': days,
        'currency': (tx.first().currency if tx.exists() else 'TZS'),
        'received': money(tx.filter(status='completed')),
        'received_period': money(recent.filter(status='completed')),
        'pending': money(tx.filter(status='pending')),
        'by_status': by_status,
        'transactions': [
            {
                'id': str(t.id),
                'invoice_number': t.invoice_number,
                'customer': t.customer_name or (t.user.get_username() if t.user_id else ''),
                'customer_email': t.customer_email,
                'amount': float(t.amount),
                'currency': t.currency,
                'status': t.status,
                'gateway': t.gateway,
                'created_at': t.created_at,
            }
            for t in tx.select_related('user').order_by('-created_at')[:50]
        ],
        'work': {
            # What is in flight, so the accountant knows what is about to bill.
            'requests_open': ConsultationRequest.objects.exclude(
                status__in=['completed', 'delivered', 'cancelled']).count(),
            'requests_delivered': ConsultationRequest.objects.filter(status='delivered').count(),
            'bookings_upcoming': Booking.objects.filter(
                status__in=['pending', 'confirmed']).count(),
        },
    })


# ============================================================
# CALENDAR EVENTS
# ============================================================

class CalendarEventSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    attendee_names = serializers.SerializerMethodField()

    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'title', 'description', 'location', 'kind',
            'starts_at', 'ends_at', 'all_day', 'remind_minutes', 'reminded_at',
            'owner', 'owner_name', 'attendees', 'attendee_names', 'guests',
            'related_request', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'reminded_at', 'created_at', 'updated_at']

    @staticmethod
    def _name(user):
        full = f'{user.first_name} {user.last_name}'.strip()
        return full or user.get_username()

    def get_owner_name(self, obj):
        return self._name(obj.owner) if obj.owner_id else None

    def get_attendee_names(self, obj):
        return [self._name(u) for u in obj.attendees.all()]


class CalendarEventViewSet(viewsets.ModelViewSet):
    """Appointments people put on their own calendar, plus the ones they were
    invited to. `?from=` and `?to=` (ISO dates) fetch one month at a time so
    the grid doesn't pull a year of history."""
    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['kind']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['starts_at', 'created_at']
    ordering = ['starts_at']

    def get_queryset(self):
        from django.db.models import Q

        user = self.request.user
        qs = CalendarEvent.objects.filter(
            Q(owner=user) | Q(attendees=user)
        ).select_related('owner').prefetch_related('attendees').distinct()

        # A '+' in a query string arrives as a space, so "2026-08-13T00:00+00:00"
        # reaches us mangled and Django raises rather than filtering. Parse the
        # bounds here and ignore what can't be read — a bad date should narrow
        # nothing, not return a 500.
        for param, lookup in (('from', 'starts_at__gte'), ('to', 'starts_at__lte')):
            raw = (self.request.query_params.get(param) or '').strip()
            if not raw:
                continue
            moment = parse_datetime(raw.replace(' ', '+'))
            if moment is None:
                moment = parse_datetime(raw)
            if moment is None:
                continue
            if timezone.is_naive(moment):
                moment = timezone.make_aware(moment)
            qs = qs.filter(**{lookup: moment})
        return qs

    def perform_create(self, serializer):
        event = serializer.save(owner=self.request.user)
        # Being invited is news; tell them now rather than at reminder time.
        for person in event.attendees.exclude(pk=self.request.user.pk):
            TaskViewSet._notify(
                person, f'Invitation: {event.title}',
                f'{event.starts_at:%d %b %Y, %H:%M}'
                + (f' · {event.location}' if event.location else ''),
            )

    def perform_update(self, serializer):
        # A moved appointment must be able to remind people again.
        event = serializer.instance
        old_start = event.starts_at
        event = serializer.save()
        if event.starts_at != old_start and event.reminded_at:
            event.reminded_at = None
            event.save(update_fields=['reminded_at'])

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        if event.owner_id != request.user.id:
            return Response({'error': 'Only the person who created it can delete it.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """The next few appointments — what the workspace shows at a glance."""
        now = timezone.now()
        rows = self.get_queryset().filter(starts_at__gte=now)[:10]
        return Response(self.get_serializer(rows, many=True).data)


def send_due_reminders(limit=50):
    """Notify people about appointments that are about to start.

    Called from the mail cron, which already runs every couple of minutes.
    `reminded_at` is stamped first so a slow run can't send the same reminder
    twice, and events whose reminder time passed while nobody was looking are
    still sent once — late is better than silent.
    """
    now = timezone.now()
    sent = 0
    due = CalendarEvent.objects.filter(
        reminded_at__isnull=True, remind_minutes__gt=0, starts_at__gte=now,
    ).prefetch_related('attendees').select_related('owner')[:limit]

    for event in due:
        if event.remind_at and event.remind_at > now:
            continue          # still too early
        event.reminded_at = now
        event.save(update_fields=['reminded_at'])
        when = event.starts_at.strftime('%d %b %Y, %H:%M')
        people = [event.owner] + [u for u in event.attendees.all() if u.pk != event.owner_id]
        for person in people:
            TaskViewSet._notify(
                person, f'Coming up: {event.title}',
                f'{when}' + (f' · {event.location}' if event.location else ''),
            )
        sent += 1
    return sent


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def colleagues(request):
    """The people you can name — on a draft you're sharing, or an appointment.

    Two different questions, so two behaviours:

      no ?search=   the staff list. Short, and what sharing a draft needs.
      ?search=ali   anyone with an account, staff or client, matched on name,
                    username or email — because an appointment is often with a
                    client, not a colleague.

    Separate from /tasks/assignable_users/, which is deliberately empty for
    people who can't delegate: naming someone on your own work is not
    delegating, and everyone needs to be able to do it.
    """
    from django.contrib.auth import get_user_model
    from django.db.models import Q

    term = (request.query_params.get('search') or '').strip()
    qs = get_user_model().objects.filter(is_active=True).exclude(pk=request.user.pk)

    if term:
        qs = qs.filter(
            Q(first_name__icontains=term) | Q(last_name__icontains=term)
            | Q(username__icontains=term) | Q(email__icontains=term)
        )
        people = list(qs.order_by('first_name', 'username')[:20])
    else:
        people = [u for u in qs.order_by('first_name', 'username') if is_staff_role(u)]

    return Response([
        {
            'id': u.id,
            'username': u.get_username(),
            'full_name': (f'{u.first_name} {u.last_name}'.strip() or u.get_username()),
            'email': u.email or '',
            'is_staff_member': is_staff_role(u),
        }
        for u in people
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_activity(request):
    """Who signed in when, and what they last actually did.

    `last_login` alone is misleading — someone can sign in on Monday and be
    idle all week, or work all day on a session opened yesterday. So three
    separate answers are given and never conflated:

      last_login   when they last signed in
      last_seen    when a request of theirs last reached the server
      last_action  the newest real piece of work, named

    "Real work" is read from the records the system already keeps rather than
    from a new audit log: mail sent, tasks handed out or finished, drafts
    edited, notes written, appointments booked, and the account log's own
    entries (sign-in, password change).

    Admins only: this is oversight of colleagues, not something the whole
    team should hold.
    """
    from django.contrib.auth import get_user_model

    from accounts.models import UserActivityLog
    from accounts.roles import is_admin_role
    from notifications.models import OutgoingEmail

    if not is_admin_role(request.user):
        return Response({'error': 'Admins only.'}, status=status.HTTP_403_FORBIDDEN)

    User = get_user_model()
    people = [u for u in User.objects.filter(is_active=True).select_related('role')
              if is_staff_role(u)]
    ids = [u.pk for u in people]

    def newest(qs, user_field, time_field, label):
        """The most recent row per user, as {user_id: (when, label)}."""
        out = {}
        rows = (qs.filter(**{f'{user_field}__in': ids})
                  .values(user_field, time_field)
                  .order_by(f'-{time_field}')[:400])
        for row in rows:
            uid = row[user_field]
            when = row[time_field]
            if when and uid not in out:
                out[uid] = (when, label)
        return out

    sources = [
        newest(OutgoingEmail.objects.exclude(sent_by=None), 'sent_by', 'created_at', 'sent an email'),
        newest(Task.objects.all(), 'assigned_by', 'updated_at', 'assigned a task'),
        newest(Task.objects.all(), 'assigned_to', 'updated_at', 'worked on a task'),
        newest(WorkDocument.objects.all(), 'owner', 'updated_at', 'edited a draft'),
        newest(StickyNote.objects.all(), 'owner', 'updated_at', 'wrote a note'),
        newest(CalendarEvent.objects.all(), 'owner', 'created_at', 'booked an appointment'),
    ]

    # The account log covers what the other tables can't see — signing in,
    # changing a password.
    log_rows = {}
    for row in (UserActivityLog.objects.filter(user__in=ids)
                .values('user', 'action', 'details', 'created_at')
                .order_by('-created_at')[:400]):
        if row['user'] not in log_rows:
            action = (row['action'] or '').replace('_', ' ').lower()
            log_rows[row['user']] = (row['created_at'], action or 'account activity')
    sources.append(log_rows)

    rows = []
    for u in people:
        latest = None
        for source in sources:
            found = source.get(u.pk)
            if found and (latest is None or found[0] > latest[0]):
                latest = found
        rows.append({
            'id': u.pk,
            'username': u.get_username(),
            'full_name': (f'{u.first_name} {u.last_name}'.strip() or u.get_username()),
            'email': u.email or '',
            'role': getattr(u, 'role_name', '') or '',
            'last_login': u.last_login,
            'last_seen': getattr(u, 'last_seen', None),
            'last_action': latest[1] if latest else None,
            'last_action_at': latest[0] if latest else None,
        })

    # Most recently active first — the question is usually "who is working".
    from datetime import datetime, timezone as dt_timezone
    never = datetime.min.replace(tzinfo=dt_timezone.utc)
    rows.sort(key=lambda r: (r['last_seen'] or r['last_login'] or never), reverse=True)
    return Response(rows)
