from functools import wraps
from typing import List

from fastapi import HTTPException, status

from app.models.user import UserRole


# Permission matrix: which roles can access which resources
ROLE_PERMISSIONS = {
    UserRole.NURSE: [
        "patients:read",
        "patients:read_assigned",
        "vitals:read", "vitals:create",
        "handoffs:read", "handoffs:create", "handoffs:update", "handoffs:sign",
        "medications:read", "medications:administer",
        "alerts:read", "alerts:acknowledge", "alerts:resolve",
        "voice_notes:create", "voice_notes:read",
        "dashboard:read",
        "fall_risk:read",
    ],
    UserRole.CHARGE_NURSE: [
        "patients:read", "patients:create", "patients:update",
        "vitals:read", "vitals:create",
        "handoffs:read", "handoffs:create", "handoffs:update", "handoffs:sign",
        "medications:read", "medications:create", "medications:administer",
        "alerts:read", "alerts:create", "alerts:acknowledge", "alerts:resolve", "alerts:escalate",
        "voice_notes:create", "voice_notes:read",
        "dashboard:read",
        "fall_risk:read", "fall_risk:create",
        "analytics:read_unit",
    ],
    UserRole.NURSING_DIRECTOR: [
        "patients:read",
        "vitals:read",
        "handoffs:read",
        "medications:read",
        "alerts:read",
        "voice_notes:read",
        "dashboard:read",
        "fall_risk:read",
        "analytics:read_unit", "analytics:read_hospital",
    ],
    UserRole.PHARMACIST: [
        "patients:read",
        "medications:read", "medications:create", "medications:update",
        "alerts:read",
    ],
    UserRole.ADMIN: [
        "patients:read", "patients:create", "patients:update", "patients:delete",
        "vitals:read", "vitals:create",
        "handoffs:read", "handoffs:create", "handoffs:update",
        "medications:read", "medications:create", "medications:update",
        "alerts:read", "alerts:create", "alerts:acknowledge", "alerts:resolve",
        "voice_notes:read",
        "dashboard:read",
        "fall_risk:read", "fall_risk:create",
        "analytics:read_unit", "analytics:read_hospital",
        "users:read", "users:create", "users:update", "users:delete",
        "audit:read",
    ],
}


def check_permission(user_role: UserRole, required_permission: str) -> bool:
    permissions = ROLE_PERMISSIONS.get(user_role, [])
    return required_permission in permissions


def require_permissions(permissions: List[str]):
    """Dependency that checks if the current user has all required permissions."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # current_user is injected by the endpoint dependency
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )
            for perm in permissions:
                if not check_permission(current_user.role, perm):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Insufficient permissions. Required: {perm}",
                    )
            return await func(*args, **kwargs)
        return wrapper
    return decorator
