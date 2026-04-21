# core/management/commands/seed_data.py

import json
import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from django.apps import apps
from django.conf import settings

class Command(BaseCommand):
    help = 'Smart sync data from fixtures/initial_data.json (upsert)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force delete all existing data before loading (clean slate)',
        )
        parser.add_argument(
            '--sync-only',
            action='store_true',
            help='Only sync without deleting anything',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🌱 Starting smart data sync...'))
        
        fixture_path = os.path.join(settings.BASE_DIR, 'fixtures', 'initial_data.json')
        
        if not os.path.exists(fixture_path):
            self.stdout.write(self.style.ERROR(f'❌ Fixture not found: {fixture_path}'))
            return
        
        with open(fixture_path, 'r') as f:
            fixtures = json.load(f)
        
        self.stdout.write(f'📦 Loaded {len(fixtures)} objects from fixture')
        
        force = options.get('force', False)
        sync_only = options.get('sync_only', False)
        
        if force:
            self.stdout.write(self.style.WARNING('⚠️ Force mode: Deleting all existing data...'))
            self._delete_all_data()
        
        # Sync data (upsert)
        created_count, updated_count, skipped_count = self._sync_fixtures(fixtures, sync_only)
        
        self.stdout.write(self.style.SUCCESS(f'✅ Sync completed!'))
        self.stdout.write(f'   📝 Created: {created_count}')
        self.stdout.write(f'   🔄 Updated: {updated_count}')
        self.stdout.write(f'   ⏭️ Skipped: {skipped_count}')
    
    def _delete_all_data(self):
        """Delete all data from all relevant models (reverse order to avoid FK issues)"""
        models_to_delete = [
            # Order matters - delete children first
            ('payments', 'PaymentTransaction'),
            ('payments', 'Invoice'),
            ('bookings', 'Booking'),
            ('bookings', 'TimeSlot'),
            ('consultations', 'ConsultationRequest'),
            ('consultations', 'ConsultationService'),
            ('consultations', 'ConsultationCategory'),
            ('reviews', 'Review'),
            ('news', 'NewsPost'),
            ('news', 'NewsCategory'),
            ('careers', 'JobPost'),
            ('careers', 'JobCategory'),
            ('projects', 'Project'),
            ('projects', 'ProjectCategory'),
            ('team', 'TeamMember'),
            ('team', 'Department'),
            ('home', 'Testimonial'),
            ('home', 'Partner'),
            ('home', 'Faq'),
            ('home', 'ServiceHighlight'),
            ('home', 'AboutSection'),
            ('home', 'HeroSection'),
            ('home', 'SeoData'),
            ('home', 'SiteSetting'),
            ('accounts', 'UserActivityLog'),
            ('accounts', 'Profile'),
            ('accounts', 'User'),
            ('accounts', 'Role'),
        ]
        
        for app_label, model_name in models_to_delete:
            try:
                model = apps.get_model(app_label, model_name)
                count, _ = model.objects.all().delete()
                if count > 0:
                    self.stdout.write(f'     Deleted {count} from {model_name}')
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'     Could not delete {model_name}: {e}'))
        
        self.stdout.write('  ✅ All existing data deleted')
    
    def _sync_fixtures(self, fixtures, sync_only):
        """Sync fixtures using upsert (update or create)"""
        created = 0
        updated = 0
        skipped = 0
        
        with transaction.atomic():
            for fixture in fixtures:
                model_name = fixture['model']
                pk = fixture['pk']
                fields = fixture['fields']
                
                try:
                    app_label, model_name_short = model_name.split('.')
                    model = apps.get_model(app_label, model_name_short)
                    
                    # Handle special fields (ForeignKeys, etc.)
                    processed_fields = self._process_fields(fields, model)
                    
                    # Try to get existing object
                    obj, obj_created = model.objects.get_or_create(
                        pk=pk,
                        defaults=processed_fields
                    )
                    
                    if obj_created:
                        created += 1
                        self.stdout.write(f'     ✅ Created {model_name} pk={pk}')
                    else:
                        # Check if any field has changed
                        has_changes = False
                        for key, value in processed_fields.items():
                            if hasattr(obj, key):
                                current_value = getattr(obj, key)
                                if current_value != value:
                                    setattr(obj, key, value)
                                    has_changes = True
                        
                        if has_changes:
                            obj.save()
                            updated += 1
                            self.stdout.write(f'     🔄 Updated {model_name} pk={pk}')
                        else:
                            skipped += 1
                            
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Error processing {model_name} pk={pk}: {e}'))
        
        return created, updated, skipped
    
    def _process_fields(self, fields, model):
        """Process special fields like ForeignKeys, JSON, etc."""
        processed = {}
        
        for key, value in fields.items():
            # Handle ForeignKey fields (field ending with _id or field that is FK)
            if key.endswith('_id') or key in ['user', 'client', 'consultant', 'category', 'service', 'project', 'department']:
                # Skip processing - Django's ORM handles FK by ID automatically
                processed[key] = value
            # Handle ManyToMany fields (process after save)
            elif key in ['permissions', 'tags', 'gallery']:
                # Store for later processing
                processed[f'_m2m_{key}'] = value
            else:
                processed[key] = value
        
        return processed