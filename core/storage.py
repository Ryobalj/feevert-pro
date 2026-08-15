# core/storage.py
"""Where files that are not images get stored.

Production keeps media in Cloudinary, and the default Cloudinary backend
accepts images only — hand it a PDF and the upload 500s. Anything that can
legitimately be a document (a tender in Word, a report in PDF, a scanned
certificate) has to go to Cloudinary's raw storage instead.

Locally, media is the filesystem and this is simply the default.

The chat attachments worked this out first; this is the same answer in one
place, so the next FileField doesn't have to rediscover it.
"""

from django.conf import settings


def any_file_storage():
    """Storage that accepts any file type, or None to keep the default."""
    default = (getattr(settings, 'DEFAULT_FILE_STORAGE', '') or '').lower()
    if 'cloudinary' in default:
        try:
            from cloudinary_storage.storage import RawMediaCloudinaryStorage
            return RawMediaCloudinaryStorage()
        except Exception:
            return None
    return None
