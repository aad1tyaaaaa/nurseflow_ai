from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=UserResponse)
async def get_settings(current_user: User = Depends(get_current_user)):
    """Retrieve the current user's profile/settings."""
    return current_user


@router.put("", response_model=UserResponse)
async def update_settings(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile/settings."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.unit is not None:
        current_user.unit = payload.unit
    if payload.is_on_shift is not None:
        current_user.is_on_shift = payload.is_on_shift
    if payload.is_active is not None:
        current_user.is_active = payload.is_active
    await db.flush()
    return current_user
