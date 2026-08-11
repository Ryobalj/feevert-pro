# accounts/roles.py
"""One place to answer "is this person staff?".

Role names are editable in the admin, so they drift — the live DB has
"Normal Employee" where the code used to look for "employee", which silently
locked employees out of their own assigned work. Match on the normalised name
instead of hard-coded lists.
"""

# Anyone whose role isn't one of these is treated as internal staff.
CLIENT_ROLES = {'client', 'customer', 'guest'}


def is_staff_role(user):
    """True for internal staff (admin, consultant, employee, ...)."""
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    name = (getattr(user, 'role_name', '') or '').strip().lower()
    if not name or name == 'no role':
        return False
    return name not in CLIENT_ROLES


def is_admin_role(user):
    """True for admins/superusers only."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return (getattr(user, 'role_name', '') or '').strip().lower() == 'admin'
