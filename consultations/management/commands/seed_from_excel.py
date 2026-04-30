# consultations/management/commands/seed_from_excel.py

import pandas as pd
from django.core.management.base import BaseCommand
from consultations.models import ConsultationCategory, ConsultationService
import os
import json

class Command(BaseCommand):
    help = 'Seed consultation data from Excel file (consultations/fixtures/seed_data.xlsx)'

    def handle(self, *args, **options):
        file_path = 'consultations/fixtures/seed_data.xlsx'
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'❌ File not found: {file_path}'))
            self.stdout.write('   Using default seed_data.json instead...')
            return

        self.stdout.write(self.style.SUCCESS('📊 Loading data from Excel...'))

        # 1. Load Categories (Main)
        df_cats = pd.read_excel(file_path, sheet_name='categories')
        created_cats = 0
        
        for _, row in df_cats.iterrows():
            cat, created = ConsultationCategory.objects.update_or_create(
                slug=str(row['slug']),
                defaults={
                    'name': str(row['name']),
                    'description': str(row.get('description', '')),
                    'icon': str(row.get('icon', '')),
                    'parent': None,
                    'level': int(row.get('level', 0)),
                    'order': int(row.get('order', 0)),
                    'is_active': str(row.get('is_active', 'TRUE')).upper() == 'TRUE',
                }
            )
            if created:
                created_cats += 1
        
        self.stdout.write(f'   📁 Main Categories: {created_cats} created')

        # 2. Load Sub-Categories
        df_subs = pd.read_excel(file_path, sheet_name='sub_categories')
        created_subs = 0
        
        for _, row in df_subs.iterrows():
            parent = None
            parent_slug = str(row.get('parent_slug', '')).strip()
            if parent_slug:
                parent = ConsultationCategory.objects.filter(slug=parent_slug).first()
                if not parent:
                    self.stdout.write(self.style.WARNING(f'   ⚠️ Parent "{parent_slug}" not found for {row["name"]}'))
                    continue
            
            sub, created = ConsultationCategory.objects.update_or_create(
                slug=str(row['slug']),
                defaults={
                    'name': str(row['name']),
                    'description': str(row.get('description', '')),
                    'icon': str(row.get('icon', '')),
                    'parent': parent,
                    'level': int(row.get('level', 1)),
                    'order': int(row.get('order', 0)),
                    'is_active': str(row.get('is_active', 'TRUE')).upper() == 'TRUE',
                }
            )
            if created:
                created_subs += 1
        
        self.stdout.write(f'   📂 Sub-Categories: {created_subs} created')

        # 3. Load Services
        df_services = pd.read_excel(file_path, sheet_name='services')
        created_svc = 0
        
        for _, row in df_services.iterrows():
            category_slug = str(row.get('category_slug', '')).strip()
            category = ConsultationCategory.objects.filter(slug=category_slug).first()
            
            if not category:
                self.stdout.write(self.style.WARNING(f'   ⚠️ Category "{category_slug}" not found for {row["name"]}'))
                continue
            
            # Helper to parse JSON-like strings safely
            def parse_list(val):
                if pd.isna(val) or not val:
                    return []
                try:
                    val_str = str(val).strip()
                    if val_str.startswith('['):
                        return json.loads(val_str)
                    return [x.strip() for x in val_str.split(',')]
                except:
                    return []

            def parse_faq(val):
                if pd.isna(val) or not val:
                    return []
                try:
                    return json.loads(str(val))
                except:
                    return []

            service, created = ConsultationService.objects.update_or_create(
                slug=str(row['slug']),
                defaults={
                    'category': category,
                    'name': str(row['name']),
                    'description': str(row.get('description', '')),
                    'icon': str(row.get('icon', '')),
                    'price': float(row['price']) if pd.notna(row.get('price')) and row['price'] else None,
                    'currency': 'TZS',
                    'price_type': str(row.get('price_type', 'quote')),
                    'price_range_min': float(row['price_min']) if pd.notna(row.get('price_min')) else None,
                    'price_range_max': float(row['price_max']) if pd.notna(row.get('price_max')) else None,
                    'duration_minutes': int(row['duration']) if pd.notna(row.get('duration')) else 0,
                    'estimated_delivery_days': int(row['delivery_days']) if pd.notna(row.get('delivery_days')) else 7,
                    'max_clients': int(row['max_clients']) if pd.notna(row.get('max_clients')) else 1,
                    'is_featured': str(row.get('is_featured', 'FALSE')).upper() == 'TRUE',
                    'popularity_score': int(row['popularity']) if pd.notna(row.get('popularity')) else 0,
                    'order': int(row['order']) if pd.notna(row.get('order')) else 0,
                    'benefits': parse_list(row.get('benefits')),
                    'faq': parse_faq(row.get('faq')),
                    'prerequisites': parse_list(row.get('prerequisites')),
                    'deliverables': parse_list(row.get('deliverables')),
                    'seo_title': str(row.get('seo_title', '')),
                    'seo_description': str(row.get('seo_description', '')),
                    'is_active': str(row.get('is_active', 'TRUE')).upper() == 'TRUE',
                }
            )
            if created:
                created_svc += 1
        
        self.stdout.write(f'   🛠️ Services: {created_svc} created')
        self.stdout.write(self.style.SUCCESS('🌱 Seed from Excel complete!'))