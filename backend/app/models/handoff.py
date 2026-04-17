import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Enum as SAEnum, ForeignKey, Boolean, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HandoffStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    DELIVERED = "delivered"
    SIGNED_OFF = "signed_off"
    ARCHIVED = "archived"


class Handoff(Base):
    __tablename__ = "handoffs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    outgoing_nurse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    incoming_nurse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # SBAR Sections
    situation: Mapped[str] = mapped_column(Text, nullable=True)
    background: Mapped[str] = mapped_column(Text, nullable=True)
    assessment: Mapped[str] = mapped_column(Text, nullable=True)
    recommendation: Mapped[str] = mapped_column(Text, nullable=True)

    # AI-generated content tracking
    ai_generated_situation: Mapped[str] = mapped_column(Text, nullable=True)
    ai_generated_background: Mapped[str] = mapped_column(Text, nullable=True)
    ai_generated_assessment: Mapped[str] = mapped_column(Text, nullable=True)
    ai_generated_recommendation: Mapped[str] = mapped_column(Text, nullable=True)

    # Metadata
    status: Mapped[HandoffStatus] = mapped_column(SAEnum(HandoffStatus), default=HandoffStatus.DRAFT)
    nurse_edits: Mapped[dict] = mapped_column(JSON, nullable=True)  # Track what nurse changed
    audio_url: Mapped[str] = mapped_column(String(500), nullable=True)
    outgoing_signed: Mapped[bool] = mapped_column(Boolean, default=False)
    incoming_signed: Mapped[bool] = mapped_column(Boolean, default=False)

    shift_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="handoffs")
    outgoing_nurse = relationship("User", back_populates="handoffs_created", foreign_keys=[outgoing_nurse_id])
    incoming_nurse = relationship("User", back_populates="handoffs_received", foreign_keys=[incoming_nurse_id])
