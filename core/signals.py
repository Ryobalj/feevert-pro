# core/signals.py

from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.core.management import call_command


@receiver(post_migrate)
def seed_initial_data(sender, **kwargs):
    """Auto seed data after migrations"""
    if sender.name == 'core':
        try:
            call_command('seed_data')
            print("✅ seed_data completed")
        except Exception as e:
            print(f"⚠️ Error seeding data: {e}")