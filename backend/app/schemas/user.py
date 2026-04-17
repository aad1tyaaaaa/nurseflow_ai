import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


# --- Auth ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# --- User ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.NURSE
    unit: Optional[str] = None
    hospital_id: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    unit: Optional[str] = None
    is_active: Optional[bool] = None
    is_on_shift: Optional[bool] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    unit: Optional[str]
    hospital_id: Optional[str]
    is_active: bool
    is_on_shift: bool
    created_at: datetime

    model_config = {"from_attributes": True}
