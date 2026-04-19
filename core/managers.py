# core/managers.py

from django.db import models

class SoftDeleteManager(models.Manager):
    """Manager that excludes soft-deleted records by default"""
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def all_with_deleted(self):
        """Return all records including soft-deleted ones"""
        return super().get_queryset()
    
    def deleted_only(self):
        """Return only soft-deleted records"""
        return super().get_queryset().filter(is_deleted=True)
