# core/signals.py

from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.core.management import call_command

from core.seed_guard import should_skip_seed


@receiver(post_migrate)
def seed_initial_data(sender, **kwargs):
    """Auto seed data after migrations - SKIP on production/Render"""

    # SKIP on any real deployment. seed_data is a smart-sync that can
    # overwrite/delete admin-edited content, so it must never run
    # automatically in production - only manually, or on a fresh setup.
    if should_skip_seed():
        print("⏭️ Skipping seed_data (production mode)")
        return
    
    if sender.name == 'core':
        try:
            call_command('seed_data')
            print("✅ seed_data completed")
        except Exception as e:
            print(f"⚠️ Error seeding data: {e}")