# accounts/permissions.py

from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Grants access to users whose custom Role is 'admin', or who are
    Django is_staff (covers the superuser account, which may not have a
    Role assigned at all).
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and (user.role_name == 'admin' or user.is_staff)
        )
