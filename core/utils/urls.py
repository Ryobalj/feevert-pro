from django.conf import settings

def build_url(path: str) -> str:
    """
    Builds correct URL depending on environment
    """
    base = settings.BACKEND_URL
    return f"{base}{path}"