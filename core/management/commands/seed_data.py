# core/management/commands/seed_data.py

import json
import os
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import transaction
from django.conf import settings

class Command(BaseCommand):
    help = 'Smart sync data from fixtures/initial_data.json (upsert - no delete)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force delete all existing data before loading (clean slate)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔄 Starting smart data sync from initial_data.json...'))
        
        fixture_path = os.path.join(settings.BASE_DIR, 'fixtures', 'initial_data.json')
        
        if not os.path.exists(fixture_path):
            self.stdout.write(self.style.ERROR(f'❌ Fixture not found: {fixture_path}'))
            return
        
        with open(fixture_path, 'r') as f:
            fixtures = json.load(f)
        
        self.stdout.write(f'📦 Loaded {len(fixtures)} objects from initial_data.json')
        
        force = options.get('force', False)
        
        if force:
            self.stdout.write(self.style.WARNING('⚠️ Force mode: Deleting all existing data...'))
            self._delete_all_data()
        
        created, updated, skipped = self._sync_fixtures(fixtures)
        
        self.stdout.write(self.style.SUCCESS(f'✅ Sync completed!'))
        self.stdout.write(f'   📝 Created: {created}')
        self.stdout.write(f'   🔄 Updated: {updated}')
        self.stdout.write(f'   ⏭️ Skipped: {skipped}')
        
        # Unda superuser kama ADMIN_PASSWORD ipo
        self._create_superuser()
    
    def _delete_all_data(self):
        """Delete all data from all relevant models"""
        models_to_delete = [
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
                pass
        
        self.stdout.write('  ✅ All existing data deleted')
    
    def _sync_fixtures(self, fixtures):
        """Sync fixtures using upsert (update or create)"""
        created = 0
        updated = 0
        skipped = 0
        
        with transaction.atomic():
            for fixture in fixtures:
                model_name = fixture['model']
                pk = fixture.get('pk')
                fields = fixture['fields']
                
                try:
                    app_label, model_name_short = model_name.split('.')
                    model = apps.get_model(app_label, model_name_short)
                    
                    # Process fields - handle ForeignKeys
                    processed_fields = self._process_fields(fields, model)
                    
                    # Try to get by pk first, then by unique fields
                    obj = None
                    obj_created = False
                    
                    if pk:
                        obj, obj_created = model.objects.get_or_create(
                            pk=pk,
                            defaults=processed_fields
                        )
                    elif 'slug' in processed_fields:
                        obj, obj_created = model.objects.get_or_create(
                            slug=processed_fields['slug'],
                            defaults=processed_fields
                        )
                    elif 'name' in processed_fields:
                        obj, obj_created = model.objects.get_or_create(
                            name=processed_fields['name'],
                            defaults=processed_fields
                        )
                    else:
                        obj = model.objects.create(**processed_fields)
                        obj_created = True
                    
                    if obj_created:
                        created += 1
                        self.stdout.write(f'     ✅ Created {model_name} pk={obj.pk}')
                    else:
                        # Check if any field has changed
                        has_changes = False
                        for key, value in processed_fields.items():
                            if hasattr(obj, key) and not key.startswith('_'):
                                current_value = getattr(obj, key)
                                if current_value != value and value is not None:
                                    setattr(obj, key, value)
                                    has_changes = True
                        
                        if has_changes:
                            obj.save()
                            updated += 1
                            self.stdout.write(f'     🔄 Updated {model_name} pk={obj.pk}')
                        else:
                            skipped += 1
                            
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Error processing {model_name}: {e}'))
        
        return created, updated, skipped
    
    def _process_fields(self, fields, model):
        """Process fields - handle ForeignKeys and remove those that don't exist on model"""
        processed = {}
        model_fields = [f.name for f in model._meta.get_fields()]
        
        # ForeignKey mapping
        fk_mapping = {
            'category': ('consultations', 'ConsultationCategory'),
            'user': ('accounts', 'User'),
            'client': ('accounts', 'User'),
            'consultant': ('accounts', 'User'),
            'service': ('consultations', 'ConsultationService'),
            'project': ('projects', 'Project'),
            'department': ('team', 'Department'),
            'role': ('accounts', 'Role'),
        }
        
        for key, value in fields.items():
            # Skip fields that don't exist on model
            if key not in model_fields and key not in fk_mapping.keys():
                continue
            
            # Handle ForeignKey fields
            if key in fk_mapping and value is not None:
                app_label, model_name = fk_mapping[key]
                try:
                    related_model = apps.get_model(app_label, model_name)
                    # Try to get by pk first
                    related_obj = related_model.objects.filter(pk=value).first()
                    if not related_obj:
                        # Try to get by name or slug
                        related_obj = related_model.objects.filter(name=value).first() or \
                                      related_model.objects.filter(slug=value).first()
                    if related_obj:
                        processed[key] = related_obj
                    else:
                        self.stdout.write(self.style.WARNING(f'     ⚠️ Related {model_name} with pk/name/slug "{value}" not found'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'     ⚠️ Error finding {model_name}: {e}'))
            else:
                processed[key] = value
        
        return processed
    
    def _create_superuser(self):
        """Create superuser if ADMIN_PASSWORD is set"""
        admin_password = os.environ.get('ADMIN_PASSWORD')
        if not admin_password:
            return
        
        try:
            from accounts.models import User, Role
            
            # Ensure admin role exists
            admin_role, _ = Role.objects.get_or_create(
                name='admin',
                defaults={
                    'description': 'System Administrator - Full Access',
                    'is_system_role': True,
                    'priority_level': 100
                }
            )
            
            if not User.objects.filter(username='admin').exists():
                User.objects.create_superuser(
                    username='admin',
                    email='admin@feevert.co.tz',
                    password=admin_password,
                    role=admin_role
                )
                self.stdout.write(self.style.SUCCESS("✅ Superuser 'admin' created successfully!"))
            else:
                # Update admin role if needed
                admin_user = User.objects.get(username='admin')
                if not admin_user.role:
                    admin_user.role = admin_role
                    admin_user.save()
                self.stdout.write("ℹ️ Superuser 'admin' already exists.")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠️ Could not create superuser: {e}"))