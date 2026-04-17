import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    NURSE = "nurse"
    CHARGE_NURSE = "charge_nurse"
    NURSING_DIRECTOR = "nursing_director"
    PHARMACIST = "pharmacist"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False, default=UserRole.NURSE)
    unit: Mapped[str] = mapped_column(String(100), nullable=True)  # ICU, ER, General Ward
    hospital_id: Mapped[str] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_on_shift: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    handoffs_created = relationship("Handoff", back_populates="outgoing_nurse", foreign_keys="Handoff.outgoing_nurse_id")
    handoffs_received = relationship("Handoff", back_populates="incoming_nurse", foreign_keys="Handoff.incoming_nurse_id")
    voice_notes = relationship("VoiceNote", back_populates="nurse")
    audit_logs = relationship("AuditLog", back_populates="user")
