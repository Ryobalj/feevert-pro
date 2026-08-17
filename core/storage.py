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


def read_file(path):
    """The bytes at `path`, whatever the backend does to get in the way.

    Cloudinary refuses public delivery of PDFs and raw files unless the
    account is set to allow it — it answers 401 for a file we uploaded
    ourselves — and its raw storage cannot open() what it saved either. So:
    the storage API, the plain URL, the URL signed with our own API secret,
    and a private download link, in that order, with every failure named if
    none of them work.

    Signing is the route that does not depend on a console setting, which
    matters when nobody can remember which account the console belongs to.
    """
    import logging

    import requests
    from django.core.files.storage import default_storage

    logger = logging.getLogger(__name__)
    storage = any_file_storage() or default_storage
    attempts = []

    try:
        with storage.open(path, 'rb') as fh:
            return fh.read()
    except Exception as e:
        attempts.append(f'storage.open: {e}')

    candidates = []
    try:
        candidates.append(storage.url(path))
    except Exception as e:
        attempts.append(f'storage.url: {e}')

    try:
        import cloudinary.utils
        try:
            signed, _ = cloudinary.utils.cloudinary_url(
                path, resource_type='raw', type='upload', sign_url=True, secure=True)
            candidates.append(signed)
        except Exception as e:
            logger.debug('Could not sign %s: %s', path, e)
        try:
            candidates.append(cloudinary.utils.private_download_url(
                path, None, resource_type='raw', type='upload'))
        except Exception as e:
            logger.debug('No private download url for %s: %s', path, e)
    except Exception:
        pass                                  # not a Cloudinary deployment

    for url in candidates:
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            attempts.append(f'{url.split("?")[0][:90]}: {e}')

    raise FileNotFoundError(' | '.join(attempts))
