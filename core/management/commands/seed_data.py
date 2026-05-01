# core/management/commands/seed_data.py

import json
import os
import pandas as pd
from django.core.management.base import BaseCommand
from django.apps import apps
from django.conf import settings


class Command(BaseCommand):
    help = 'ULTIMATE SEED - Smart sync ALL data from Excel (fixtures/seed_data.xlsx)'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Delete all existing data first')

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔄 ULTIMATE DATA SYNC FROM EXCEL...'))

        file_path = os.path.join(settings.BASE_DIR, 'fixtures', 'seed_data.xlsx')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'❌ File not found: {file_path}'))
            return

        force = options.get('force', False)
        if force:
            self._delete_all_data()

        # ✅ SMART CHECK & REBUILD CATEGORIES + SERVICES
        self._smart_rebuild_categories(file_path)

        total_created = 0
        total_updated = 0
        total_skipped = 0

        sheets = [
            # PROJECTS
            ('project_categories', 'projects', 'ProjectCategory', self._sync_simple('name', {'name', 'slug', 'description', 'order', 'is_active'})),
            ('projects', 'projects', 'Project', self._sync_project),
            # TEAM
            ('departments', 'team', 'Department', self._sync_simple('name', {'name', 'slug', 'description', 'order', 'is_active'})),
            ('team', 'team', 'TeamMember', self._sync_team),
            # HOME
            ('site_settings', 'home', 'SiteSetting', self._sync_site_setting),
            ('hero_slides', 'home', 'HeroSection', self._sync_hero),
            ('about', 'home', 'AboutSection', self._sync_about),
            ('testimonials', 'home', 'Testimonial', self._sync_testimonial),
            ('partners', 'home', 'Partner', self._sync_partner),
            ('faqs', 'home', 'Faq', self._sync_faq),
            # NEWS
            ('news_categories', 'news', 'NewsCategory', self._sync_simple('name', {'name', 'slug', 'description', 'order', 'is_active'})),
            ('news', 'news', 'NewsPost', self._sync_news),
            # CAREERS
            ('job_categories', 'careers', 'JobCategory', self._sync_simple('name', {'name', 'slug', 'description', 'order', 'is_active'})),
            ('jobs', 'careers', 'JobPost', self._sync_job),
            # BOOKINGS
            ('time_slots', 'bookings', 'TimeSlot', self._sync_time_slot),
            # 🆕 SHOP
            ('product_categories', 'shop', 'ProductCategory', self._sync_shop_category),
            ('products', 'shop', 'Product', self._sync_shop_product),
        ]

        for sheet_name, app_label, model_name, sync_func in sheets:
            try:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                c, u, s = sync_func(df, app_label, model_name)
                total_created += c
                total_updated += u
                total_skipped += s
                self.stdout.write(f'   ✅ {sheet_name}: +{c} ~{u} ={s}')
            except ValueError:
                self.stdout.write(f'   ⚠️ Sheet "{sheet_name}" not found in Excel (skipped)')
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'   ⚠️ {sheet_name}: {e}'))

        self._create_superuser()

        self.stdout.write(self.style.SUCCESS(f'✅ SYNC COMPLETE!'))
        self.stdout.write(f'   📝 Created: {total_created}')
        self.stdout.write(f'   🔄 Updated: {total_updated}')
        self.stdout.write(f'   ⏭️ Skipped: {total_skipped}')

    # ==================== SMART CATEGORY REBUILD ====================

    def _smart_rebuild_categories(self, file_path):
        """
        Smart check: 
        1. Read Excel categories + sub_categories + services
        2. Compare with database
        3. If mismatch → DELETE & REBUILD categories + services
        """
        from consultations.models import ConsultationCategory, ConsultationService
        
        df_cats = pd.read_excel(file_path, sheet_name='categories')
        df_subs = pd.read_excel(file_path, sheet_name='sub_categories')
        df_services = pd.read_excel(file_path, sheet_name='services')
        
        expected_main_count = len(df_cats)
        expected_sub_count = len(df_subs)
        expected_service_count = len(df_services)
        
        actual_main_count = ConsultationCategory.objects.filter(level=0).count()
        actual_sub_count = ConsultationCategory.objects.filter(level=1).count()
        actual_service_count = ConsultationService.objects.count()
        
        needs_rebuild = False
        
        if actual_main_count != expected_main_count:
            self.stdout.write(self.style.WARNING(f'⚠️ Main cats: DB={actual_main_count} Excel={expected_main_count}'))
            needs_rebuild = True
        
        if actual_sub_count != expected_sub_count:
            self.stdout.write(self.style.WARNING(f'⚠️ Sub-cats: DB={actual_sub_count} Excel={expected_sub_count}'))
            needs_rebuild = True
            
        if actual_service_count != expected_service_count:
            self.stdout.write(self.style.WARNING(f'⚠️ Services: DB={actual_service_count} Excel={expected_service_count}'))
            needs_rebuild = True
        
        if needs_rebuild:
            self.stdout.write(self.style.WARNING('🔄 REBUILDING categories + services from Excel...'))
            
            # Delete existing (services first due to FK, then categories)
            ConsultationService.objects.all().delete()
            ConsultationCategory.objects.all().delete()
            self.stdout.write('   🗑️ Existing categories & services deleted')
        
        # ⚠️ ALWAYS BUILD - ensures fresh data
        self.stdout.write('   🔨 Building categories & services...')
        
        # Build main categories
        c, u, s = self._sync_category(df_cats, 'consultations', 'ConsultationCategory')
        self.stdout.write(f'   📁 Main Categories: +{c} ~{u} ={s}')
        
        # Build sub-categories
        c, u, s = self._sync_sub_category(df_subs, 'consultations', 'ConsultationCategory')
        self.stdout.write(f'   📂 Sub-Categories: +{c} ~{u} ={s}')
        
        # Build services
        c, u, s = self._sync_service(df_services, 'consultations', 'ConsultationService')
        self.stdout.write(f'   🛠️ Services: +{c} ~{u} ={s}')

    # ==================== SYNC FUNCTIONS ====================

    def _sync_category(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        created, updated, skipped = 0, 0, 0
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            slug = str(row.get('slug', name.lower().replace(' ', '-'))).strip()
            if not name or not slug:
                skipped += 1
                continue
            
            fields = {
                'name': name,
                'slug': slug,
                'description': str(row.get('description', '')),
                'icon': str(row.get('icon', '')),
                'parent': None,
                'level': 0,
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            obj = model.objects.filter(slug=slug).first()
            if not obj:
                try:
                    model.objects.create(**fields)
                    created += 1
                    self.stdout.write(f'     ✨ Created category: {name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create category "{name}": {e}'))
                    skipped += 1
            else:
                changed = self._update_obj(obj, fields)
                if changed: 
                    updated += 1
                    self.stdout.write(f'     🔄 Updated category: {name}')
                else: 
                    skipped += 1
        return created, updated, skipped

    def _sync_sub_category(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        created, updated, skipped = 0, 0, 0
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            slug = str(row.get('slug', name.lower().replace(' ', '-'))).strip()
            parent_slug = str(row.get('parent_slug', '')).strip()
            
            if not name or not slug:
                skipped += 1
                continue
            
            parent = model.objects.filter(slug=parent_slug).first() if parent_slug else None
            
            if not parent and parent_slug:
                self.stdout.write(self.style.WARNING(f'     ⚠️ Parent not found: {parent_slug} for {name}'))
                skipped += 1
                continue
            
            fields = {
                'name': name,
                'slug': slug,
                'description': str(row.get('description', '')),
                'icon': str(row.get('icon', '')),
                'parent': parent,
                'level': 1,
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            obj = model.objects.filter(slug=slug).first()
            if not obj:
                try:
                    model.objects.create(**fields)
                    created += 1
                    self.stdout.write(f'     ✨ Created sub-category: {name} (parent: {parent_slug})')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create sub-category "{name}": {e}'))
                    skipped += 1
            else:
                changed = self._update_obj(obj, fields)
                if changed:
                    updated += 1
                    self.stdout.write(f'     🔄 Updated sub-category: {name}')
                else:
                    skipped += 1
        return created, updated, skipped

    # 🔧 FIXED: Correct field names matching ConsultationService model
    def _sync_service(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('consultations', 'ConsultationCategory')
        created, updated, skipped = 0, 0, 0
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            slug = str(row.get('slug', name.lower().replace(' ', '-'))).strip()
            category_slug = str(row.get('category_slug', '')).strip()
            
            if not name or not slug:
                skipped += 1
                continue
            
            category = Category.objects.filter(slug=category_slug).first() if category_slug else None
            
            if not category and category_slug:
                self.stdout.write(self.style.WARNING(f'     ⚠️ Category not found: {category_slug} for {name}'))
                skipped += 1
                continue
            
            fields = {
                'category': category,
                'name': name,
                'slug': slug,
                'description': str(row.get('description', '')),
                'icon': str(row.get('icon', '')),
                'price': self._float(row.get('price')),
                'currency': 'TZS',
                'price_type': str(row.get('price_type', 'quote')),
                'price_range_min': self._float(row.get('price_min')),       # ✅ FIXED
                'price_range_max': self._float(row.get('price_max')),       # ✅ FIXED
                'duration_minutes': self._int(row.get('duration'), 0),      # ✅ FIXED
                'estimated_delivery_days': self._int(row.get('delivery_days'), 7),  # ✅ FIXED
                'max_clients': self._int(row.get('max_clients'), 1),
                'is_featured': self._bool(row.get('is_featured'), False),
                'popularity_score': self._int(row.get('popularity'), 0),    # ✅ FIXED
                'order': self._int(row.get('order'), 0),
                'benefits': self._parse_json(row.get('benefits')),
                'faq': self._parse_json(row.get('faq')),
                'prerequisites': self._parse_json(row.get('prerequisites')),
                'deliverables': self._parse_json(row.get('deliverables')),
                'seo_title': str(row.get('seo_title', '')),
                'seo_description': str(row.get('seo_description', '')),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            obj = model.objects.filter(slug=slug).first()
            if not obj:
                try:
                    model.objects.create(**fields)
                    created += 1
                    self.stdout.write(f'     ✨ Created service: {name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create service "{name}": {e}'))
                    skipped += 1
            else:
                changed = self._update_obj(obj, fields)
                if changed:
                    updated += 1
                    self.stdout.write(f'     🔄 Updated service: {name}')
                else:
                    skipped += 1
        return created, updated, skipped

    def _sync_project(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('projects', 'ProjectCategory')

        def get_fields(row):
            cat_slug = str(row.get('category_slug', '')).strip()
            category = Category.objects.filter(slug=cat_slug).first() if cat_slug else None
            return {
                'title': str(row['title']),
                'slug': str(row.get('slug', row['title'].lower().replace(' ', '-'))),
                'description': str(row.get('description', '')),
                'category': category,
                'client_name': str(row.get('client_name', '')),
                'status': str(row.get('status', 'published')),
                'challenges': str(row.get('challenges', '')),
                'solutions': str(row.get('solutions', '')),
                'results': str(row.get('results', '')),
                'is_featured': self._bool(row.get('is_featured'), False),
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
            }

        return self._sync_rows(df, model, 'slug', get_fields)

    def _sync_team(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        Department = apps.get_model('team', 'Department')

        def get_fields(row):
            dept_name = str(row.get('department', '')).strip()
            department = Department.objects.filter(name=dept_name).first() if dept_name else None
            return {
                'full_name': str(row['full_name']),
                'role': str(row.get('role', '')),
                'department': department,
                'bio': str(row.get('bio', '')),
                'email': str(row.get('email', '')),
                'phone': str(row.get('phone', '')),
                'is_featured': self._bool(row.get('is_featured'), False),
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
            }

        return self._sync_rows(df, model, 'full_name', get_fields)

    def _sync_testimonial(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        return self._sync_rows(df, model, 'client_name', lambda row: {
            'client_name': str(row['client_name']),
            'client_role': str(row.get('client_role', '')),
            'client_company': str(row.get('client_company', '')),
            'content': str(row.get('content', '')),
            'rating': self._int(row.get('rating'), 5),
            'order': self._int(row.get('order'), 0),
            'is_active': self._bool(row.get('is_active'), True),
            'is_approved': self._bool(row.get('is_approved'), True),
        })

    def _sync_partner(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        return self._sync_rows(df, model, 'name', lambda row: {
            'name': str(row['name']),
            'website_url': str(row.get('website_url', '')),
            'description': str(row.get('description', '')),
            'order': self._int(row.get('order'), 0),
            'is_active': self._bool(row.get('is_active'), True),
        })

    def _sync_faq(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        return self._sync_rows(df, model, 'question', lambda row: {
            'question': str(row['question']),
            'answer': str(row.get('answer', '')),
            'category': str(row.get('category', 'general')),
            'order': self._int(row.get('order'), 0),
            'is_active': self._bool(row.get('is_active'), True),
        })

    def _sync_about(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        c, u, s = 0, 0, 0
        for _, row in df.iterrows():
            fields = {
                'title': str(row.get('title', 'About Us')),
                'description': str(row.get('description', '')),
                'mission': str(row.get('mission', '')),
                'vision': str(row.get('vision', '')),
                'video_url': str(row.get('video_url', '')),
                'core_values': self._parse_json(row.get('core_values')),
                'stats': self._parse_json(row.get('stats')),
                'why_choose_us': self._parse_json(row.get('why_choose_us')),
                'is_active': self._bool(row.get('is_active'), True),
            }
            obj = model.objects.first()
            if not obj:
                model.objects.create(**fields); c += 1
            else:
                changed = self._update_obj(obj, fields)
                if changed: u += 1
                else: s += 1
        return c, u, s

    def _sync_site_setting(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        c, u, s = 0, 0, 0
        for _, row in df.iterrows():
            fields = {
                'site_name': str(row.get('site_name', 'FeeVert')),
                'site_tagline': str(row.get('site_tagline', '')),
                'contact_email': str(row.get('contact_email', 'info@feevert.co.tz')),
                'contact_phone': str(row.get('contact_phone', '')),
                'contact_address': str(row.get('contact_address', '')),
                'footer_copyright_text': str(row.get('footer_copyright_text', '')),
                'footer_about_text': str(row.get('footer_about_text', '')),
                'primary_color': str(row.get('primary_color', '#2d6a4f')),
                'secondary_color': str(row.get('secondary_color', '#1a1a1a')),
                'accent_color': str(row.get('accent_color', '#d8f3dc')),
                'enable_maintenance_mode': self._bool(row.get('enable_maintenance_mode'), False),
            }
            obj = model.objects.first()
            if not obj:
                model.objects.create(**fields); c += 1
            else:
                changed = self._update_obj(obj, fields)
                if changed: u += 1
                else: s += 1
        return c, u, s

    def _sync_hero(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        return self._sync_rows(df, model, 'title', lambda row: {
            'title': str(row['title']),
            'subtitle': str(row.get('subtitle', '')),
            'cta_text': str(row.get('cta_text', 'Get Started')),
            'cta_link': str(row.get('cta_link', '/home')),
            'background_overlay': self._float(row.get('background_overlay'), 0.5),
            'animation_type': str(row.get('animation_type', 'fade-up')),
            'order': self._int(row.get('order'), 0),
            'is_active': self._bool(row.get('is_active'), True),
        })

    def _sync_news(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('news', 'NewsCategory')
        def get_fields(row):
            cat_name = str(row.get('category', '')).strip()
            category = Category.objects.filter(name=cat_name).first() if cat_name else None
            return {
                'title': str(row['title']),
                'slug': str(row.get('slug', row['title'].lower().replace(' ', '-'))),
                'content': str(row.get('content', '')),
                'excerpt': str(row.get('excerpt', '')),
                'category': category,
                'is_featured': self._bool(row.get('is_featured'), False),
                'is_published': self._bool(row.get('is_published'), True),
            }
        return self._sync_rows(df, model, 'slug', get_fields)

    def _sync_job(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('careers', 'JobCategory')
        def get_fields(row):
            cat_name = str(row.get('category', '')).strip()
            category = Category.objects.filter(name=cat_name).first() if cat_name else None
            return {
                'title': str(row['title']),
                'slug': str(row.get('slug', row['title'].lower().replace(' ', '-'))),
                'description': str(row.get('description', '')),
                'requirements': str(row.get('requirements', '')),
                'responsibilities': str(row.get('responsibilities', '')),
                'category': category,
                'location': str(row.get('location', '')),
                'employment_type': str(row.get('employment_type', 'full_time')),
                'salary_range_min': self._float(row.get('salary_range_min')),
                'salary_range_max': self._float(row.get('salary_range_max')),
                'deadline': self._datetime(row.get('deadline')),
                'is_active': self._bool(row.get('is_active'), True),
                'is_featured': self._bool(row.get('is_featured'), False),
            }
        return self._sync_rows(df, model, 'slug', get_fields)

    def _sync_time_slot(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        User = apps.get_model('accounts', 'User')
        default_consultant = User.objects.first()
        def get_fields(row):
            consultant_id = self._int(row.get('consultant_id'), None)
            consultant = User.objects.filter(pk=consultant_id).first() if consultant_id else default_consultant
            return {
                'consultant': consultant,
                'date': self._datetime(row.get('date')),
                'start_time': str(row.get('start_time', '09:00')),
                'end_time': str(row.get('end_time', '17:00')),
                'is_active': self._bool(row.get('is_active'), True),
            }
        return self._sync_rows(df, model, 'date', get_fields)

    # 🆕 SHOP SYNC FUNCTIONS
    def _sync_shop_category(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        created, updated, skipped = 0, 0, 0
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            slug = str(row.get('slug', name.lower().replace(' ', '-'))).strip()
            if not name or not slug:
                skipped += 1
                continue
            
            fields = {
                'name': name,
                'slug': slug,
                'description': str(row.get('description', '')),
                'icon': str(row.get('icon', '')),
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            obj = model.objects.filter(slug=slug).first()
            if not obj:
                try:
                    model.objects.create(**fields)
                    created += 1
                    self.stdout.write(f'     ✨ Created shop category: {name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create shop category "{name}": {e}'))
                    skipped += 1
            else:
                changed = self._update_obj(obj, fields)
                if changed: updated += 1
                else: skipped += 1
        return created, updated, skipped

    def _sync_shop_product(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('shop', 'ProductCategory')
        created, updated, skipped = 0, 0, 0
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            slug = str(row.get('slug', name.lower().replace(' ', '-'))).strip()
            category_slug = str(row.get('category_slug', '')).strip()
            
            if not name or not slug:
                skipped += 1
                continue
            
            category = Category.objects.filter(slug=category_slug).first() if category_slug else None
            
            fields = {
                'category': category,
                'name': name,
                'slug': slug,
                'description': str(row.get('description', '')),
                'short_description': str(row.get('short_description', '')),
                'product_type': str(row.get('product_type', 'other')),
                'price': self._float(row.get('price'), 0),
                'sale_price': self._float(row.get('sale_price')),
                'currency': str(row.get('currency', 'TZS')),
                'stock': self._int(row.get('stock'), 0),
                'sku': str(row.get('sku', '')),
                'weight': str(row.get('weight', '')),
                'dimensions': str(row.get('dimensions', '')),
                'ingredients': str(row.get('ingredients', '')),
                'usage_instructions': str(row.get('usage_instructions', '')),
                'benefits': self._parse_json(row.get('benefits')),
                'is_featured': self._bool(row.get('is_featured'), False),
                'is_active': self._bool(row.get('is_active'), True),
                'is_digital': self._bool(row.get('is_digital'), False),
                'popularity_score': self._int(row.get('popularity_score'), 0),
                'order': self._int(row.get('order'), 0),
            }
            
            obj = model.objects.filter(slug=slug).first()
            if not obj:
                try:
                    model.objects.create(**fields)
                    created += 1
                    self.stdout.write(f'     ✨ Created product: {name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create product "{name}": {e}'))
                    skipped += 1
            else:
                changed = self._update_obj(obj, fields)
                if changed: updated += 1
                else: skipped += 1
        return created, updated, skipped

    def _sync_simple(self, lookup_field, field_names):
        def sync_func(df, app_label, model_name):
            model = apps.get_model(app_label, model_name)
            def get_fields(row):
                fields = {}
                for f in field_names:
                    val = row.get(f)
                    if f == 'is_active': fields[f] = self._bool(val, True)
                    elif f == 'order': fields[f] = self._int(val, 0)
                    elif f == 'slug': fields[f] = str(val) if pd.notna(val) and val else ''
                    else: fields[f] = str(val) if pd.notna(val) and val else ''
                return fields
            return self._sync_rows(df, model, lookup_field, get_fields)
        return sync_func

    # ==================== CORE HELPERS ====================

    def _sync_rows(self, df, model, lookup_field, get_fields_func, skip_if=None):
        created, updated, skipped = 0, 0, 0
        for _, row in df.iterrows():
            fields = get_fields_func(row)
            lookup_value = fields.get(lookup_field)
            if not lookup_value: skipped += 1; continue
            if skip_if and skip_if(row, fields): skipped += 1; continue
            obj = model.objects.filter(**{lookup_field: lookup_value}).first()
            if not obj:
                try:
                    model.objects.create(**fields); created += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create {model.__name__} "{lookup_value}": {e}'))
                    skipped += 1
            else:
                changed = self._update_obj(obj, fields)
                if changed: updated += 1
                else: skipped += 1
        return created, updated, skipped

    def _update_obj(self, obj, fields):
        changed = False
        changed_fields = []
        for key, new_value in fields.items():
            if key in ['parent', 'category', 'department', 'project', 'service', 'consultant']:
                old_id = getattr(obj, f'{key}_id', None)
                new_id = new_value.pk if new_value and hasattr(new_value, 'pk') else None
                if old_id != new_id:
                    setattr(obj, key, new_value); changed = True; changed_fields.append(key)
            elif hasattr(obj, key):
                old_value = getattr(obj, key)
                if isinstance(old_value, (list, dict)) and isinstance(new_value, (list, dict)):
                    if old_value != new_value:
                        setattr(obj, key, new_value); changed = True; changed_fields.append(key)
                elif str(old_value) != str(new_value) and new_value is not None:
                    setattr(obj, key, new_value); changed = True; changed_fields.append(key)
        if changed:
            try:
                obj.save()
                if changed_fields: self.stdout.write(f'     🔄 {obj.__class__.__name__} "{obj}": {", ".join(changed_fields[:3])}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'     ❌ Update {obj.__class__.__name__} "{obj}": {e}'))
        return changed

    def _bool(self, val, default=True):
        if pd.isna(val) or val is None: return default
        return str(val).upper() in ['TRUE', '1', 'YES', 'T']

    def _int(self, val, default=0):
        try:
            if pd.isna(val) or val is None: return default
            return int(float(str(val)))
        except: return default

    def _float(self, val, default=None):
        try:
            if pd.isna(val) or val is None or str(val).strip() == '': return default
            return float(str(val))
        except: return default

    def _datetime(self, val, default=None):
        try:
            if pd.isna(val) or val is None: return default
            return pd.to_datetime(val).to_pydatetime()
        except: return default

    def _parse_json(self, val):
        if pd.isna(val) or val is None or str(val).strip() == '': return []
        try: return json.loads(str(val))
        except: return str(val) if str(val).strip() else []

    def _delete_all_data(self):
        models_order = [
            'consultations.ConsultationService', 'consultations.ConsultationCategory',
            'projects.Project', 'projects.ProjectCategory',
            'team.TeamMember', 'team.Department',
            'home.Testimonial', 'home.Partner', 'home.Faq', 'home.AboutSection', 'home.SiteSetting', 'home.HeroSection',
            'news.NewsPost', 'news.NewsCategory',
            'careers.JobPost', 'careers.JobCategory',
            'bookings.TimeSlot',
            'shop.Product', 'shop.ProductCategory',
        ]
        for model_path in models_order:
            try:
                app_label, model_name = model_path.split('.')
                model = apps.get_model(app_label, model_name)
                count, _ = model.objects.all().delete()
                if count > 0: self.stdout.write(f'     🗑️ {model_name}: {count} deleted')
            except: pass
        self.stdout.write('  ✅ All data cleared')

    def _create_superuser(self):
        admin_password = os.environ.get('ADMIN_PASSWORD')
        if not admin_password: return
        try:
            from accounts.models import User, Role
            admin_role, _ = Role.objects.get_or_create(
                name='admin', defaults={'description': 'System Administrator', 'is_system_role': True, 'priority_level': 100}
            )
            if not User.objects.filter(username='admin').exists():
                User.objects.create_superuser(username='admin', email='admin@feevert.co.tz', password=admin_password, role=admin_role)
                self.stdout.write(self.style.SUCCESS("✅ Superuser 'admin' created!"))
            else:
                self.stdout.write("ℹ️ Superuser 'admin' already exists.")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠️ Superuser error: {e}"))