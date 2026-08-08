# core/apps.py

from django.apps import AppConfig

from core.seed_guard import should_skip_seed


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Only wire the auto-seed signal in local/dev. On any real deploy
        # (Render, or SKIP_SEED_DATA set) we never auto-seed - see
        # core/seed_guard.py for why the old check silently failed.
        if should_skip_seed():
            print("⏭️ Skipping signal imports (production mode)")
            return

        import core.signals
        print("✅ Signals loaded (development mode)")