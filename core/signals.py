# core/signals.py

import os
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.core.management import call_command


@receiver(post_migrate)
def seed_initial_data(sender, **kwargs):
    """Auto seed data after migrations - SKIP on production/Render"""
    
    # 🔧 SKIP if running on Render or SKIP_SEED_DATA is set
    if os.environ.get('RENDER') == 'True' or os.environ.get('SKIP_SEED_DATA') == 'True':
        print("⏭️ Skipping seed_data (production mode)")
        return
    
    if sender.name == 'core':
        try:
            call_command('seed_data')
            print("✅ seed_data completed")
        except Exception as e:
            print(f"⚠️ Error seeding data: {e}")