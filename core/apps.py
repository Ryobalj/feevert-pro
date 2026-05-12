# core/apps.py

import os
from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    
    def ready(self):
        # 🔧 Import signals ONLY if not on Render
        if os.environ.get('RENDER') == 'True' or os.environ.get('SKIP_SEED_DATA') == 'True':
            print("⏭️ Skipping signal imports (production mode)")
            return
        
        import core.signals
        print("✅ Signals loaded (development mode)")