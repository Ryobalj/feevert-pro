# core/seed_guard.py

import os


def should_skip_seed():
    """
    True when auto-seeding must NOT run - i.e. on any real deployment.

    Robust to casing on purpose: Render injects RENDER=true (lowercase)
    into every service automatically, so the old `== 'True'` check
    silently failed on production and let the post_migrate seed_data run
    on EVERY deploy, overwriting content that admins had edited live.
    """
    render = os.environ.get('RENDER', '').strip().lower() == 'true'
    skip = os.environ.get('SKIP_SEED_DATA', '').strip().lower() in ('true', '1', 'yes')
    return render or skip
