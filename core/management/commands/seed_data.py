# core/management/commands/seed_data.py

import json
import os
import pandas as pd
import re
from django.core.management.base import BaseCommand
from django.apps import apps
from django.conf import settings


class Command(BaseCommand):
    help = 'SMART SYNC - Update, Create, Delete based on Excel (fixtures/seed_data.xlsx)'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Delete all existing data first (full reset)')
        parser.add_argument('--no-delete', action='store_true', help='Update & Create only, no deletion')

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔄 SMART DATA SYNC FROM EXCEL...'))

        file_path = os.path.join(settings.BASE_DIR, 'fixtures', 'seed_data.xlsx')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'❌ File not found: {file_path}'))
            return

        force = options.get('force', False)
        no_delete = options.get('no_delete', False)

        if force:
            self.stdout.write(self.style.WARNING('🗑️ FORCE MODE: Deleting all data...'))
            self._delete_all_data()
        else:
            self.stdout.write(self.style.SUCCESS('🧠 SMART SYNC MODE: Update, Create, Delete (if removed from Excel)...'))

        # ✅ SMART REBUILD CATEGORIES + SERVICES (if mismatch or force)
        self._smart_rebuild_categories(file_path, force=force)

        total_created = 0
        total_updated = 0
        total_skipped = 0
        total_deleted = 0

        sheets = [
            # PROJECTS
            ('project_categories', 'projects', 'ProjectCategory', 'name', self._sync_smart('name', {'name', 'slug', 'description', 'order', 'is_active'})),
            ('projects', 'projects', 'Project', 'slug', self._sync_project_smart),
            # TEAM
            ('departments', 'team', 'Department', 'name', self._sync_smart('name', {'name', 'slug', 'description', 'order', 'is_active'})),
            ('team', 'team', 'TeamMember', 'full_name', self._sync_team_smart),
            # HOME
            ('site_settings', 'home', 'SiteSetting', None, self._sync_site_setting_smart),
            ('hero_slides', 'home', 'HeroSection', 'title', self._sync_hero_smart),
            ('about', 'home', 'AboutSection', None, self._sync_about_smart),
            ('testimonials', 'home', 'Testimonial', 'client_name', self._sync_testimonial_smart),
            ('partners', 'home', 'Partner', 'name', self._sync_partner_smart),
            ('faqs', 'home', 'Faq', 'question', self._sync_smart('question', {'question', 'answer', 'category', 'order', 'is_active'})),
            # ✅ WHAT WE DO - MPYA
            ('what_we_do', 'home', 'WhatWeDo', 'title', self._sync_what_we_do_smart),
            # NEWS
            ('news_categories', 'news', 'NewsCategory', 'name', self._sync_smart('name', {'name', 'slug', 'description', 'order', 'is_active'})),
            ('news', 'news', 'NewsPost', 'slug', self._sync_news_smart),
            # CAREERS
            ('job_categories', 'careers', 'JobCategory', 'name', self._sync_smart('name', {'name', 'slug', 'description', 'order', 'is_active'})),
            ('jobs', 'careers', 'JobPost', 'slug', self._sync_job_smart),
            # BOOKINGS
            ('time_slots', 'bookings', 'TimeSlot', 'date', self._sync_time_slot_smart),
            # SHOP
            ('product_categories', 'shop', 'ProductCategory', 'name', self._sync_smart('name', {'name', 'slug', 'description', 'icon', 'order', 'is_active'})),
            ('products', 'shop', 'Product', 'slug', self._sync_product_smart),
        ]

        for sheet_name, app_label, model_name, lookup_field, sync_func in sheets:
            try:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                c, u, s, d = sync_func(df, app_label, model_name, lookup_field=lookup_field, no_delete=no_delete)
                total_created += c
                total_updated += u
                total_skipped += s
                total_deleted += d
                self.stdout.write(f'   ✅ {sheet_name}: +{c} ~{u} ={s} 🗑️{d}')
            except ValueError:
                self.stdout.write(f'   ⚠️ Sheet "{sheet_name}" not found in Excel (skipped)')
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'   ⚠️ {sheet_name}: {e}'))

        self._create_superuser()

        self.stdout.write(self.style.SUCCESS(f'✅ SMART SYNC COMPLETE!'))
        self.stdout.write(f'   📝 Created: {total_created}')
        self.stdout.write(f'   🔄 Updated: {total_updated}')
        self.stdout.write(f'   ⏭️ Skipped: {total_skipped}')
        self.stdout.write(f'   🗑️ Deleted: {total_deleted}')

    # ==================== SMART SYNC FUNCTIONS ====================

    def _sync_smart(self, lookup_field, field_names):
        """Smart sync - Update, Create, Delete based on Excel"""
        def sync_func(df, app_label, model_name, lookup_field=lookup_field, no_delete=False):
            model = apps.get_model(app_label, model_name)
            created, updated, skipped, deleted = 0, 0, 0, 0
            
            # Get all existing records
            existing = {getattr(obj, lookup_field): obj for obj in model.objects.all()}
            excel_values = set()
            
            for _, row in df.iterrows():
                fields = {}
                for f in field_names:
                    val = row.get(f)
                    if f == 'is_active':
                        fields[f] = self._bool(val, True)
                    elif f == 'order':
                        fields[f] = self._int(val, 0)
                    elif f == 'slug':
                        fields[f] = str(val) if pd.notna(val) and val else ''
                    else:
                        fields[f] = str(val) if pd.notna(val) and val else ''
                
                lookup_value = fields.get(lookup_field)
                if not lookup_value:
                    skipped += 1
                    continue
                
                excel_values.add(lookup_value)
                
                if lookup_value in existing:
                    # Update existing record
                    obj = existing[lookup_value]
                    changed = self._update_obj_smart(obj, fields)
                    if changed:
                        updated += 1
                    else:
                        skipped += 1
                else:
                    # Create new record
                    try:
                        model.objects.create(**fields)
                        created += 1
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'     ❌ Create {model.__name__} "{lookup_value}": {e}'))
                        skipped += 1
            
            # Delete records not in Excel (unless --no-delete)
            if not no_delete:
                for key, obj in existing.items():
                    if key not in excel_values:
                        obj.delete()
                        deleted += 1
            
            return created, updated, skipped, deleted
        return sync_func

    # ============================================================
    # ✅ WHAT WE DO - SMART SYNC
    # ============================================================
    def _sync_what_we_do_smart(self, df, app_label, model_name, lookup_field='title', no_delete=False):
        """Smart sync What We Do sections"""
        model = apps.get_model(app_label, model_name)
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.title: obj for obj in model.objects.all()}
        excel_titles = set()
        
        for _, row in df.iterrows():
            title = str(row.get('title', '')).strip()
            if not title:
                skipped += 1
                continue
            
            excel_titles.add(title)
            
            fields = {
                'title': title,
                'subtitle': str(row.get('subtitle', '')),
                'description': str(row.get('description', '')),
                'services': self._parse_json_with_icons(row.get('services')),
                'slider_images': self._parse_json(row.get('slider_images')),
                'cta_text': str(row.get('cta_text', 'Learn More')),
                'cta_link': str(row.get('cta_link', '/services')),
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            if title in existing:
                obj = existing[title]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                    self.stdout.write(f'     🔄 Updated What We Do: {title}')
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                    self.stdout.write(f'     ✨ Created What We Do: {title}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create What We Do "{title}": {e}'))
                    skipped += 1
        
        if not no_delete:
            for title, obj in existing.items():
                if title not in excel_titles:
                    obj.delete()
                    deleted += 1
                    self.stdout.write(f'     🗑️ Deleted What We Do: {title}')
        
        return created, updated, skipped, deleted

    def _sync_team_smart(self, df, app_label, model_name, lookup_field='full_name', no_delete=False):
        """Smart sync Team Members"""
        model = apps.get_model(app_label, model_name)
        Department = apps.get_model('team', 'Department')
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.full_name: obj for obj in model.objects.all()}
        excel_names = set()
        
        for _, row in df.iterrows():
            full_name = str(row.get('full_name', '')).strip()
            if not full_name:
                skipped += 1
                continue
            
            excel_names.add(full_name)
            
            dept_name = str(row.get('department', '')).strip()
            department = Department.objects.filter(name=dept_name).first() if dept_name else None
            
            fields = {
                'full_name': full_name,
                'role': str(row.get('role', '')),
                'department': department,
                'bio': str(row.get('bio', '')),
                'email': str(row.get('email', '')),
                'phone': str(row.get('phone', '')),
                'is_featured': self._bool(row.get('is_featured'), False),
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            # Only update profile_image if new value provided
            profile_image_value = str(row.get('profile_image', '')).strip()
            if profile_image_value:
                fields['profile_image'] = profile_image_value
            
            if full_name in existing:
                obj = existing[full_name]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                    self.stdout.write(f'     ✨ Created team member: {full_name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create team member "{full_name}": {e}'))
                    skipped += 1
        
        # Delete team members not in Excel
        if not no_delete:
            for name, obj in existing.items():
                if name not in excel_names:
                    obj.delete()
                    deleted += 1
                    self.stdout.write(f'     🗑️ Deleted team member: {name}')
        
        return created, updated, skipped, deleted

    def _sync_project_smart(self, df, app_label, model_name, lookup_field='slug', no_delete=False):
        """Smart sync Projects"""
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('projects', 'ProjectCategory')
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.slug: obj for obj in model.objects.all()}
        excel_slugs = set()
        
        for _, row in df.iterrows():
            title = str(row.get('title', '')).strip()
            if not title:
                skipped += 1
                continue
            
            slug = str(row.get('slug', title.lower().replace(' ', '-'))).strip()
            excel_slugs.add(slug)
            
            cat_slug = str(row.get('category_slug', '')).strip()
            category = Category.objects.filter(slug=cat_slug).first() if cat_slug else None
            
            fields = {
                'title': title,
                'slug': slug,
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
            
            # Only update featured_image if new value provided
            featured_image_value = str(row.get('featured_image', '')).strip()
            if featured_image_value:
                fields['featured_image'] = featured_image_value
            
            if slug in existing:
                obj = existing[slug]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create project "{title}": {e}'))
                    skipped += 1
        
        if not no_delete:
            for slug, obj in existing.items():
                if slug not in excel_slugs:
                    obj.delete()
                    deleted += 1
        
        return created, updated, skipped, deleted

    def _sync_hero_smart(self, df, app_label, model_name, lookup_field='title', no_delete=False):
        """Smart sync Hero Slides"""
        model = apps.get_model(app_label, model_name)
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.title: obj for obj in model.objects.all()}
        excel_titles = set()
        
        for _, row in df.iterrows():
            title = str(row.get('title', '')).strip()
            if not title:
                skipped += 1
                continue
            
            excel_titles.add(title)
            
            fields = {
                'title': title,
                'subtitle': str(row.get('subtitle', '')),
                'cta_text': str(row.get('cta_text', 'Get Started')),
                'cta_link': str(row.get('cta_link', '/home')),
                'background_overlay': self._float(row.get('background_overlay'), 0.5),
                'animation_type': str(row.get('animation_type', 'fade-up')),
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            # Only update background_image if new value provided
            bg_image_value = str(row.get('background_image', '')).strip()
            if bg_image_value:
                fields['background_image'] = bg_image_value
            
            if title in existing:
                obj = existing[title]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create hero slide "{title}": {e}'))
                    skipped += 1
        
        if not no_delete:
            for title, obj in existing.items():
                if title not in excel_titles:
                    obj.delete()
                    deleted += 1
        
        return created, updated, skipped, deleted

    def _sync_partner_smart(self, df, app_label, model_name, lookup_field='name', no_delete=False):
        """Smart sync Partners"""
        model = apps.get_model(app_label, model_name)
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.name: obj for obj in model.objects.all()}
        excel_names = set()
        
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            if not name:
                skipped += 1
                continue
            
            excel_names.add(name)
            
            fields = {
                'name': name,
                'website_url': str(row.get('website_url', '')),
                'description': str(row.get('description', '')),
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            logo_value = str(row.get('logo', '')).strip()
            if logo_value:
                fields['logo'] = logo_value
            
            if name in existing:
                obj = existing[name]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create partner "{name}": {e}'))
                    skipped += 1
        
        if not no_delete:
            for name, obj in existing.items():
                if name not in excel_names:
                    obj.delete()
                    deleted += 1
        
        return created, updated, skipped, deleted

    def _sync_testimonial_smart(self, df, app_label, model_name, lookup_field='client_name', no_delete=False):
        """Smart sync Testimonials"""
        model = apps.get_model(app_label, model_name)
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.client_name: obj for obj in model.objects.all()}
        excel_names = set()
        
        for _, row in df.iterrows():
            client_name = str(row.get('client_name', '')).strip()
            if not client_name:
                skipped += 1
                continue
            
            excel_names.add(client_name)
            
            fields = {
                'client_name': client_name,
                'client_role': str(row.get('client_role', '')),
                'client_company': str(row.get('client_company', '')),
                'content': str(row.get('content', '')),
                'rating': self._int(row.get('rating'), 5),
                'order': self._int(row.get('order'), 0),
                'is_active': self._bool(row.get('is_active'), True),
                'is_approved': self._bool(row.get('is_approved'), True),
            }
            
            client_image_value = str(row.get('client_image', '')).strip()
            if client_image_value:
                fields['client_image'] = client_image_value
            
            if client_name in existing:
                obj = existing[client_name]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create testimonial "{client_name}": {e}'))
                    skipped += 1
        
        if not no_delete:
            for name, obj in existing.items():
                if name not in excel_names:
                    obj.delete()
                    deleted += 1
        
        return created, updated, skipped, deleted

    def _sync_news_smart(self, df, app_label, model_name, lookup_field='slug', no_delete=False):
        """Smart sync News"""
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('news', 'NewsCategory')
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.slug: obj for obj in model.objects.all()}
        excel_slugs = set()
        
        for _, row in df.iterrows():
            title = str(row.get('title', '')).strip()
            if not title:
                skipped += 1
                continue
            
            slug = str(row.get('slug', title.lower().replace(' ', '-'))).strip()
            excel_slugs.add(slug)
            
            cat_name = str(row.get('category', '')).strip()
            category = Category.objects.filter(name=cat_name).first() if cat_name else None
            
            fields = {
                'title': title,
                'slug': slug,
                'content': str(row.get('content', '')),
                'excerpt': str(row.get('excerpt', '')),
                'category': category,
                'is_featured': self._bool(row.get('is_featured'), False),
                'is_published': self._bool(row.get('is_published'), True),
            }
            
            featured_image_value = str(row.get('featured_image', '')).strip()
            if featured_image_value:
                fields['featured_image'] = featured_image_value
            
            if slug in existing:
                obj = existing[slug]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create news "{title}": {e}'))
                    skipped += 1
        
        if not no_delete:
            for slug, obj in existing.items():
                if slug not in excel_slugs:
                    obj.delete()
                    deleted += 1
        
        return created, updated, skipped, deleted

    def _sync_product_smart(self, df, app_label, model_name, lookup_field='slug', no_delete=False):
        """Smart sync Products"""
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('shop', 'ProductCategory')
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.slug: obj for obj in model.objects.all()}
        excel_slugs = set()
        
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            if not name:
                skipped += 1
                continue
            
            slug = str(row.get('slug', name.lower().replace(' ', '-'))).strip()
            excel_slugs.add(slug)
            
            category_slug = str(row.get('category_slug', '')).strip()
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
                'benefits': self._parse_json_with_icons(row.get('benefits')),
                'is_featured': self._bool(row.get('is_featured'), False),
                'is_active': self._bool(row.get('is_active'), True),
                'is_digital': self._bool(row.get('is_digital'), False),
                'popularity_score': self._int(row.get('popularity_score'), 0),
                'order': self._int(row.get('order'), 0),
            }
            
            image_value = str(row.get('image', '')).strip()
            if image_value:
                fields['image'] = image_value
            
            if slug in existing:
                obj = existing[slug]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create product "{name}": {e}'))
                    skipped += 1
        
        if not no_delete:
            for slug, obj in existing.items():
                if slug not in excel_slugs:
                    obj.delete()
                    deleted += 1
        
        return created, updated, skipped, deleted

    def _sync_job_smart(self, df, app_label, model_name, lookup_field='slug', no_delete=False):
        """Smart sync Jobs"""
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('careers', 'JobCategory')
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.slug: obj for obj in model.objects.all()}
        excel_slugs = set()
        
        for _, row in df.iterrows():
            title = str(row.get('title', '')).strip()
            if not title:
                skipped += 1
                continue
            
            slug = str(row.get('slug', title.lower().replace(' ', '-'))).strip()
            excel_slugs.add(slug)
            
            cat_name = str(row.get('category', '')).strip()
            category = Category.objects.filter(name=cat_name).first() if cat_name else None
            
            fields = {
                'title': title,
                'slug': slug,
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
            
            if slug in existing:
                obj = existing[slug]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create job "{title}": {e}'))
                    skipped += 1
        
        if not no_delete:
            for slug, obj in existing.items():
                if slug not in excel_slugs:
                    obj.delete()
                    deleted += 1
        
        return created, updated, skipped, deleted

    def _sync_time_slot_smart(self, df, app_label, model_name, lookup_field='date', no_delete=False):
        """Smart sync Time Slots"""
        model = apps.get_model(app_label, model_name)
        User = apps.get_model('accounts', 'User')
        default_consultant = User.objects.first()
        created, updated, skipped, deleted = 0, 0, 0, 0
        
        existing = {obj.date: obj for obj in model.objects.all()}
        excel_dates = set()
        
        for _, row in df.iterrows():
            date = self._datetime(row.get('date'))
            if not date:
                skipped += 1
                continue
            
            excel_dates.add(date)
            
            consultant_id = self._int(row.get('consultant_id'), None)
            consultant = User.objects.filter(pk=consultant_id).first() if consultant_id else default_consultant
            
            fields = {
                'consultant': consultant,
                'date': date,
                'start_time': str(row.get('start_time', '09:00')),
                'end_time': str(row.get('end_time', '17:00')),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            if date in existing:
                obj = existing[date]
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                try:
                    model.objects.create(**fields)
                    created += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create time slot "{date}": {e}'))
                    skipped += 1
        
        if not no_delete:
            for date, obj in existing.items():
                if date not in excel_dates:
                    obj.delete()
                    deleted += 1
        
        return created, updated, skipped, deleted

    def _sync_site_setting_smart(self, df, app_label, model_name, lookup_field=None, no_delete=False):
        """Smart sync Site Settings"""
        model = apps.get_model(app_label, model_name)
        c, u, s, d = 0, 0, 0, 0
        
        obj = model.objects.first()
        
        if obj is None:
            obj = model()
            c += 1
        
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
            
            # Only update images if new values provided
            for img_field in ['site_logo', 'site_logo_dark', 'favicon']:
                val = str(row.get(img_field, '')).strip()
                if val:
                    fields[img_field] = val
            
            changed = self._update_obj_smart(obj, fields)
            if changed:
                obj.save()
                u += 1
            else:
                s += 1
        
        return c, u, s, d

    def _sync_about_smart(self, df, app_label, model_name, lookup_field=None, no_delete=False):
        """Smart sync About"""
        model = apps.get_model(app_label, model_name)
        c, u, s, d = 0, 0, 0, 0
        
        obj = model.objects.first()
        
        if obj is None:
            obj = model()
            c += 1
        
        for _, row in df.iterrows():
            fields = {
                'title': str(row.get('title', 'About Us')),
                'description': str(row.get('description', '')),
                'mission': str(row.get('mission', '')),
                'vision': str(row.get('vision', '')),
                'video_url': str(row.get('video_url', '')),
                'core_values': self._parse_json_with_icons(row.get('core_values')),
                'stats': self._parse_json_with_icons(row.get('stats')),
                'why_choose_us': self._parse_json_with_icons(row.get('why_choose_us')),
                'is_active': self._bool(row.get('is_active'), True),
            }
            
            image_value = str(row.get('image', '')).strip()
            if image_value:
                fields['image'] = image_value
            
            changed = self._update_obj_smart(obj, fields)
            if changed:
                obj.save()
                u += 1
            else:
                s += 1
        
        return c, u, s, d

    # ==================== SMART CATEGORY REBUILD ====================

    def _smart_rebuild_categories(self, file_path, force=False):
        """Smart rebuild categories only if mismatch or force"""
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
        
        needs_rebuild = force or (
            actual_main_count != expected_main_count or
            actual_sub_count != expected_sub_count or
            actual_service_count != expected_service_count
        )
        
        if needs_rebuild:
            self.stdout.write(self.style.WARNING('🔄 REBUILDING categories + services...'))
            ConsultationService.objects.all().delete()
            ConsultationCategory.objects.all().delete()
            self.stdout.write('   🗑️ Existing categories & services deleted')
        else:
            self.stdout.write('   ℹ️ Categories & services match Excel (skipping rebuild)')
            # Still sync for updates
            self._sync_category(df_cats, 'consultations', 'ConsultationCategory')
            self._sync_sub_category(df_subs, 'consultations', 'ConsultationCategory')
            self._sync_service(df_services, 'consultations', 'ConsultationService')
            return
        
        self.stdout.write('   🔨 Building categories & services...')
        
        c, u, s, d = self._sync_category(df_cats, 'consultations', 'ConsultationCategory')
        self.stdout.write(f'   📁 Main Categories: +{c} ~{u} ={s}')
        
        c, u, s, d = self._sync_sub_category(df_subs, 'consultations', 'ConsultationCategory')
        self.stdout.write(f'   📂 Sub-Categories: +{c} ~{u} ={s}')
        
        c, u, s, d = self._sync_service(df_services, 'consultations', 'ConsultationService')
        self.stdout.write(f'   🛠️ Services: +{c} ~{u} ={s}')

    # ==================== SYNC FUNCTIONS (with delete support) ====================

    def _sync_category(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        created, updated, skipped, deleted = 0, 0, 0, 0
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
                'icon': self._fix_icon_string(str(row.get('icon', ''))),
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
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create category "{name}": {e}'))
                    skipped += 1
            else:
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
        return created, updated, skipped, deleted

    def _sync_sub_category(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        created, updated, skipped, deleted = 0, 0, 0, 0
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
                'icon': self._fix_icon_string(str(row.get('icon', ''))),
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
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create sub-category "{name}": {e}'))
                    skipped += 1
            else:
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
        return created, updated, skipped, deleted

    def _sync_service(self, df, app_label, model_name):
        model = apps.get_model(app_label, model_name)
        Category = apps.get_model('consultations', 'ConsultationCategory')
        created, updated, skipped, deleted = 0, 0, 0, 0
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
                'icon': self._fix_icon_string(str(row.get('icon', ''))),
                'price': self._float(row.get('price')),
                'currency': 'TZS',
                'price_type': str(row.get('price_type', 'quote')),
                'price_range_min': self._float(row.get('price_min')),
                'price_range_max': self._float(row.get('price_max')),
                'duration_minutes': self._int(row.get('duration'), 0),
                'estimated_delivery_days': self._int(row.get('delivery_days'), 7),
                'max_clients': self._int(row.get('max_clients'), 1),
                'is_featured': self._bool(row.get('is_featured'), False),
                'popularity_score': self._int(row.get('popularity'), 0),
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
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ❌ Create service "{name}": {e}'))
                    skipped += 1
            else:
                changed = self._update_obj_smart(obj, fields)
                if changed:
                    updated += 1
                else:
                    skipped += 1
        return created, updated, skipped, deleted

    # ==================== CORE HELPERS ====================

    def _update_obj_smart(self, obj, fields):
        """
        Smart update - only update changed fields
        """
        changed = False
        changed_fields = []
        
        for key, new_value in fields.items():
            if key in ['parent', 'category', 'department', 'project', 'service', 'consultant']:
                old_id = getattr(obj, f'{key}_id', None)
                new_id = new_value.pk if new_value and hasattr(new_value, 'pk') else None
                if old_id != new_id:
                    setattr(obj, key, new_value)
                    changed = True
                    changed_fields.append(key)
            elif hasattr(obj, key):
                old_value = getattr(obj, key)
                if isinstance(old_value, (list, dict)) and isinstance(new_value, (list, dict)):
                    if old_value != new_value:
                        setattr(obj, key, new_value)
                        changed = True
                        changed_fields.append(key)
                elif str(old_value) != str(new_value) and new_value is not None:
                    setattr(obj, key, new_value)
                    changed = True
                    changed_fields.append(key)
        
        if changed:
            try:
                obj.save()
                if changed_fields:
                    self.stdout.write(f'     🔄 {obj.__class__.__name__} "{obj}": {", ".join(changed_fields[:3])}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'     ❌ Update {obj.__class__.__name__} "{obj}": {e}'))
        
        return changed

    def _bool(self, val, default=True):
        if pd.isna(val) or val is None:
            return default
        return str(val).upper() in ['TRUE', '1', 'YES', 'T']

    def _int(self, val, default=0):
        try:
            if pd.isna(val) or val is None:
                return default
            return int(float(str(val)))
        except:
            return default

    def _float(self, val, default=None):
        try:
            if pd.isna(val) or val is None or str(val).strip() == '':
                return default
            return float(str(val))
        except:
            return default

    def _datetime(self, val, default=None):
        try:
            if pd.isna(val) or val is None:
                return default
            return pd.to_datetime(val).to_pydatetime()
        except:
            return default

    # ==================== ICON HELPERS ====================

    def _fix_icon_string(self, val):
        """Convert broken UTF-8 or emoji to :icon_name: format"""
        if not val or pd.isna(val):
            return val
        
        val_str = str(val)
        
        broken_icons = {
            'ðŸ’Ž': ':diamond:',
            'ðŸ¤': ':handshake:',
            'ðŸŒŸ': ':star:',
            'ðŸŒ±': ':leaf:',
            'ðŸ’¡': ':lightbulb:',
            'ðŸ‘¥': ':team:',
            'ðŸ“': ':clipboard:',
            'ðŸ˜Š': ':smile:',
            'ðŸ“…': ':calendar:',
            'ðŸŒ': ':globe:',
            'ðŸŽ“': ':graduate:',
            'âš¡': ':lightning:',
            'ðŸ’°': ':money:',
            'âœ…': ':check:',
            'ðŸ“‹': ':clipboard:',
            'ðŸ”„': ':link:',
            'ðŸ“': ':map:',
            'ðŸ”¬': ':map:',
            'ðŸŒ³': ':leaf:',
            'ðŸ': ':bee:',
            'ðŸ—ï¸': ':construction:',
            'ðŸ”': ':search:',
            'âš ï¸': ':warning:',
            'ðŸ’§': ':water:',
            'ðŸŒ¬ï¸': ':air:',
            'ðŸ§ª': ':soil:',
            'ðŸ“Š': ':chart:',
            'ðŸ¦‹': ':biodiversity:',
            'ðŸ›°ï¸': ':map:',
            'ðŸ”¥': ':fire:',
            'ðŸ¥': ':firstaid:',
            'ðŸš¨': ':emergency:',
            'ðŸ”Š': ':earprotection:',
            'ðŸ‘·': ':safety:',
            'ðŸ\x90„': ':cow:',
            'â˜€ï¸\x8f': ':sun:',
        }
        
        for old, new in broken_icons.items():
            if old in val_str:
                val_str = val_str.replace(old, new)
        
        return val_str

    def _parse_json_with_icons(self, val):
        """Parse JSON and fix icons inside the data"""
        if pd.isna(val) or val is None or str(val).strip() == '':
            return []
        
        try:
            val_str = self._fix_icon_string(str(val))
            data = json.loads(val_str)
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and 'icon' in item:
                        item['icon'] = self._fix_icon_string(item['icon'])
            return data
        except:
            try:
                cleaned = re.sub(r'[^\x00-\x7F]+', '', str(val))
                data = json.loads(cleaned)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and 'icon' in item:
                            item['icon'] = self._fix_icon_string(item['icon'])
                return data
            except:
                return str(val) if str(val).strip() else []

    def _parse_json(self, val):
        if pd.isna(val) or val is None or str(val).strip() == '':
            return []
        try:
            val_str = self._fix_icon_string(str(val))
            return json.loads(val_str)
        except:
            return str(val) if str(val).strip() else []

    def _delete_all_data(self):
        models_order = [
            'consultations.ConsultationService',
            'consultations.ConsultationCategory',
            'projects.Project',
            'projects.ProjectCategory',
            'team.TeamMember',
            'team.Department',
            'home.Testimonial',
            'home.Partner',
            'home.Faq',
            'home.AboutSection',
            'home.SiteSetting',
            'home.HeroSection',
            'home.WhatWeDo',  # ✅ Ongeza hii
            'news.NewsPost',
            'news.NewsCategory',
            'careers.JobPost',
            'careers.JobCategory',
            'bookings.TimeSlot',
            'shop.Product',
            'shop.ProductCategory',
        ]
        for model_path in models_order:
            try:
                app_label, model_name = model_path.split('.')
                model = apps.get_model(app_label, model_name)
                count, _ = model.objects.all().delete()
                if count > 0:
                    self.stdout.write(f'     🗑️ {model_name}: {count} deleted')
            except:
                pass
        self.stdout.write('  ✅ All data cleared')

    def _create_superuser(self):
        admin_password = os.environ.get('ADMIN_PASSWORD')
        if not admin_password:
            return
        try:
            from accounts.models import User, Role
            admin_role, _ = Role.objects.get_or_create(
                name='admin',
                defaults={'description': 'System Administrator', 'is_system_role': True, 'priority_level': 100}
            )
            if not User.objects.filter(username='admin').exists():
                User.objects.create_superuser(
                    username='admin',
                    email='admin@feevert.co.tz',
                    password=admin_password,
                    role=admin_role
                )
                self.stdout.write(self.style.SUCCESS("✅ Superuser 'admin' created!"))
            else:
                self.stdout.write("ℹ️ Superuser 'admin' already exists.")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠️ Superuser error: {e}"))