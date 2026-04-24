from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.user import (
    LoginRequest, TokenResponse, RefreshTokenRequest,
    UserCreate, UserUpdate, UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user. In production, restricted to admin-created accounts."""
    try:
        user = await AuthService.register(
            db,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            role=payload.role,
            unit=payload.unit,
            hospital_id=payload.hospital_id,
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive JWT tokens."""
    user = await AuthService.authenticate(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return AuthService.generate_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token."""
    tokens = await AuthService.refresh(db, payload.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: User = Depends(get_current_user)):
    """Log out the current user. Client should discard tokens."""
    return None


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.unit is not None:
        current_user.unit = payload.unit
    if payload.is_on_shift is not None:
        current_user.is_on_shift = payload.is_on_shift
    await db.flush()
    return current_user


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    unit: str = None,
    role: UserRole = None,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.NURSING_DIRECTOR, UserRole.CHARGE_NURSE])),
    db: AsyncSession = Depends(get_db),
):
    """List users, optionally filtered by unit or role."""
    query = select(User).where(User.is_active == True)
    if unit:
        query = query.where(User.unit == unit)
    if role:
        query = query.where(User.role == role)
    result = await db.execute(query)
    return list(result.scalars().all())
