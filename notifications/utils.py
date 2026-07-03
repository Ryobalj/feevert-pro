# notifications/utils.py

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _fernet():
    """
    Derive a stable Fernet key from SECRET_KEY so mailbox passwords aren't
    stored in plaintext in the database (unlike the .env-based IMAP_*
    settings, which are file-system-only secrets, DB rows are readable by
    anyone with query access - e.g. Django admin, backups, other services).
    """
    digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_secret(raw_value):
    if not raw_value:
        return ''
    return _fernet().encrypt(raw_value.encode()).decode()


def decrypt_secret(encrypted_value):
    if not encrypted_value:
        return ''
    try:
        return _fernet().decrypt(encrypted_value.encode()).decode()
    except InvalidToken:
        return ''
