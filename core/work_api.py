# core/work_api.py
"""The work itself: the notes kept against a job, and the field data behind it.

Everything this company sells ends in a report, and every report starts as
something written down on site — a checklist walked through, a column of
readings, a risk rated. That has been happening in notebooks and loose Excel
files. Here it belongs to the job, it adds itself up, and the person reviewing
the work can see where the numbers came from.
"""

import csv

from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.roles import is_staff_role
from consultations.models import ConsultationRequest
from .models import FieldSheet, Task, WorkNote


# ---------------------------------------------------------------- templates
#
# Starting points that match the work actually sold — an empty grid is a
# blank page nobody fills in. Every one of them is editable once created;
# these only save the first ten minutes.
SHEET_TEMPLATES = {
    'ohs_risk': {
        'kind': 'risk',
        'title': 'Risk assessment',
        'service': 'Occupational Health & Safety',
        'rows': [
            {'hazard': 'Working at height', 'who': 'Technicians', 'likelihood': 3, 'severity': 4, 'control': ''},
            {'hazard': 'Moving machinery', 'who': 'Operators', 'likelihood': 2, 'severity': 5, 'control': ''},
            {'hazard': 'Electrical', 'who': 'All staff', 'likelihood': 2, 'severity': 4, 'control': ''},
            {'hazard': 'Manual handling', 'who': 'Store staff', 'likelihood': 3, 'severity': 2, 'control': ''},
            {'hazard': 'Chemical exposure', 'who': 'Lab staff', 'likelihood': 2, 'severity': 4, 'control': ''},
        ],
    },
    'workplace_compliance': {
        'kind': 'checklist',
        'title': 'General workplace compliance',
        'service': 'Occupational Health & Safety',
        'rows': [
            {'item': 'OSHA registration certificate displayed', 'status': '', 'note': ''},
            {'item': 'Fire extinguishers serviced and accessible', 'status': '', 'note': ''},
            {'item': 'Emergency exits marked and clear', 'status': '', 'note': ''},
            {'item': 'First aid kit stocked, trained first aider', 'status': '', 'note': ''},
            {'item': 'PPE issued and worn', 'status': '', 'note': ''},
            {'item': 'Safety committee minutes available', 'status': '', 'note': ''},
            {'item': 'Incident register maintained', 'status': '', 'note': ''},
            {'item': 'Machine guarding in place', 'status': '', 'note': ''},
            {'item': 'Welfare facilities adequate', 'status': '', 'note': ''},
        ],
    },
    'env_audit': {
        'kind': 'checklist',
        'title': 'Environmental audit walk-through',
        'service': 'Environmental Services',
        'rows': [
            {'item': 'EIA certificate and conditions on file', 'status': '', 'note': ''},
            {'item': 'Effluent discharge permit valid', 'status': '', 'note': ''},
            {'item': 'Waste segregation and licensed disposal', 'status': '', 'note': ''},
            {'item': 'Hazardous material storage bunded', 'status': '', 'note': ''},
            {'item': 'Air emission controls working', 'status': '', 'note': ''},
            {'item': 'Noise controls in place', 'status': '', 'note': ''},
            {'item': 'Water abstraction permit valid', 'status': '', 'note': ''},
            {'item': 'Grievance register kept', 'status': '', 'note': ''},
            {'item': 'Rehabilitation / closure provisions', 'status': '', 'note': ''},
        ],
    },
    'noise_survey': {
        'kind': 'measurements',
        'title': 'Noise survey',
        'service': 'Environmental Services',
        'parameter': 'Noise level',
        'unit': 'dB(A)',
        'limit_value': 85,
        'limit_source': 'Occupational limit, 8-hour exposure',
        'rows': [{'point': f'Point {i}', 'value': '', 'time': '', 'note': ''} for i in range(1, 6)],
    },
    'dust_survey': {
        'kind': 'measurements',
        'title': 'Dust (PM10) survey',
        'service': 'Environmental Services',
        'parameter': 'PM10',
        'unit': 'µg/m³',
        'limit_value': 50,
        'limit_source': '24-hour guideline',
        'rows': [{'point': f'Point {i}', 'value': '', 'time': '', 'note': ''} for i in range(1, 6)],
    },
    'water_quality': {
        'kind': 'measurements',
        'title': 'Water quality — pH',
        'service': 'Environmental Services',
        'parameter': 'pH',
        'unit': '',
        'limit_value': 9.0,
        'limit_source': 'Effluent discharge standard (6.5–9.0)',
        'rows': [{'point': f'Sample {i}', 'value': '', 'time': '', 'note': ''} for i in range(1, 6)],
    },
    'apiary_inspection': {
        'kind': 'checklist',
        'title': 'Apiary inspection',
        'service': 'Commercial Beekeeping',
        'rows': [
            {'item': 'Hives sited away from disturbance and flooding', 'status': '', 'note': ''},
            {'item': 'Colony strength adequate', 'status': '', 'note': ''},
            {'item': 'Queen present and laying', 'status': '', 'note': ''},
            {'item': 'Brood pattern healthy', 'status': '', 'note': ''},
            {'item': 'No signs of pests or disease', 'status': '', 'note': ''},
            {'item': 'Sufficient forage within range', 'status': '', 'note': ''},
            {'item': 'Water source available', 'status': '', 'note': ''},
            {'item': 'Equipment in good repair', 'status': '', 'note': ''},
            {'item': 'Records up to date', 'status': '', 'note': ''},
        ],
    },
    'honey_yield': {
        'kind': 'measurements',
        'title': 'Honey harvest per hive',
        'service': 'Commercial Beekeeping',
        'parameter': 'Yield',
        'unit': 'kg',
        'rows': [{'point': f'Hive {i}', 'value': '', 'time': '', 'note': ''} for i in range(1, 11)],
    },
}


# -------------------------------------------------------------- serializers
class WorkNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = WorkNote
        fields = ['id', 'job', 'task', 'body', 'is_internal',
                  'author', 'author_name', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

    def get_author_name(self, obj):
        if not obj.author:
            return None
        return f'{obj.author.first_name} {obj.author.last_name}'.strip() or obj.author.get_username()


class FieldSheetSerializer(serializers.ModelSerializer):
    summary = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = FieldSheet
        fields = [
            'id', 'job', 'task', 'kind', 'title', 'template_key',
            'parameter', 'unit', 'limit_value', 'limit_source',
            'location', 'collected_on', 'rows', 'summary',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_summary(self, obj):
        return obj.summary()

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
        return (f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
                or obj.created_by.get_username())


# ----------------------------------------------------------------- viewsets
class _WorkScopedViewSet(viewsets.ModelViewSet):
    """Shared rule: staff see work notes and sheets; a client sees neither.

    Field data and internal notes are working papers. What reaches the client
    is the finished deliverable, sent deliberately — not the workings.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['job', 'task']

    def get_queryset(self):
        if not is_staff_role(self.request.user):
            return self.model_class.objects.none()
        return self.model_class.objects.all()


class WorkNoteViewSet(_WorkScopedViewSet):
    serializer_class = WorkNoteSerializer
    model_class = WorkNote

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related('author')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class FieldSheetViewSet(_WorkScopedViewSet):
    serializer_class = FieldSheetSerializer
    model_class = FieldSheet

    def get_queryset(self):
        return super().get_queryset().select_related('created_by')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def templates(self, request):
        """The starting points, so the field team isn't handed a blank grid."""
        return Response([
            {'key': key, 'title': tpl['title'], 'kind': tpl['kind'],
             'service': tpl.get('service', ''), 'rows': len(tpl['rows'])}
            for key, tpl in SHEET_TEMPLATES.items()
        ])

    @action(detail=False, methods=['post'])
    def from_template(self, request):
        """Create a sheet already filled with the right questions."""
        key = request.data.get('template_key')
        tpl = SHEET_TEMPLATES.get(key)
        if not tpl:
            return Response({'error': f'Unknown template "{key}"'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not is_staff_role(request.user):
            return Response({'error': 'Staff only.'}, status=status.HTTP_403_FORBIDDEN)

        sheet = FieldSheet.objects.create(
            job_id=request.data.get('job') or None,
            task_id=request.data.get('task') or None,
            kind=tpl['kind'],
            title=request.data.get('title') or tpl['title'],
            template_key=key,
            parameter=tpl.get('parameter', ''),
            unit=tpl.get('unit', ''),
            limit_value=tpl.get('limit_value'),
            limit_source=tpl.get('limit_source', ''),
            location=request.data.get('location', ''),
            collected_on=timezone.now().date(),
            rows=[dict(r) for r in tpl['rows']],
            created_by=request.user,
        )
        return Response(self.get_serializer(sheet).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """The sheet as CSV — Excel for the annexes, or the report writer's
        own tables, without retyping anything."""
        sheet = self.get_object()
        response = HttpResponse(content_type='text/csv')
        safe = ''.join(c for c in sheet.title if c.isalnum() or c in ' -_')[:60]
        response['Content-Disposition'] = f'attachment; filename="{safe or "field-data"}.csv"'

        writer = csv.writer(response)
        writer.writerow([sheet.title])
        if sheet.location:
            writer.writerow(['Location', sheet.location])
        if sheet.collected_on:
            writer.writerow(['Collected', sheet.collected_on.isoformat()])
        if sheet.parameter:
            writer.writerow(['Parameter', f'{sheet.parameter} ({sheet.unit})'.strip()])
        if sheet.limit_value is not None:
            writer.writerow(['Limit', sheet.limit_value, sheet.limit_source])
        writer.writerow([])

        columns = {
            'measurements': ['point', 'value', 'time', 'note'],
            'risk': ['hazard', 'who', 'likelihood', 'severity', 'control'],
            'checklist': ['item', 'status', 'note'],
        }[sheet.kind]
        header = [c.title() for c in columns]
        if sheet.kind == 'risk':
            header += ['Score', 'Band']
        writer.writerow(header)

        for row in sheet.rows or []:
            line = [row.get(c, '') for c in columns]
            if sheet.kind == 'risk':
                try:
                    score = int(row.get('likelihood', 0)) * int(row.get('severity', 0))
                except (TypeError, ValueError):
                    score = ''
                line += [score, FieldSheet.risk_band(score) if score != '' else '']
            writer.writerow(line)

        writer.writerow([])
        for key, value in (sheet.summary() or {}).items():
            writer.writerow([key.replace('_', ' ').title(), value])
        return response
