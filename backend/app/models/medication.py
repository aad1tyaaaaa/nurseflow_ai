import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, DateTime, Enum as SAEnum, ForeignKey, Boolean, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MedicationStatus(str, enum.Enum):
    PENDING = "pending"
    DUE = "due"
    OVERDUE = "overdue"
    ADMINISTERED = "administered"
    HELD = "held"
    REFUSED = "refused"
    CANCELLED = "cancelled"


class UrgencyLevel(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    ROUTINE = "routine"


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)

    # Drug info
    drug_name: Mapped[str] = mapped_column(String(255), nullable=False)
    drug_code: Mapped[str] = mapped_column(String(50), nullable=True)  # NDC / RxNorm code
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    route: Mapped[str] = mapped_column(String(50), nullable=False)  # oral, IV, IM, etc.
    frequency: Mapped[str] = mapped_column(String(100), nullable=True)

    # Scheduling
    scheduled_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    administered_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    administered_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # AI Priority
    urgency: Mapped[UrgencyLevel] = mapped_column(SAEnum(UrgencyLevel), default=UrgencyLevel.ROUTINE)
    priority_score: Mapped[float] = mapped_column(Float, default=0.0)
    priority_reasoning: Mapped[str] = mapped_column(Text, nullable=True)  # AI explanation

    # Safety
    status: Mapped[MedicationStatus] = mapped_column(SAEnum(MedicationStatus), default=MedicationStatus.PENDING)
    interaction_warnings: Mapped[dict] = mapped_column(JSON, nullable=True, default=list)
    allergy_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    duplicate_flag: Mapped[bool] = mapped_column(Boolean, default=False)

    notes: Mapped[str] = mapped_column(Text, nullable=True)
    fhir_medication_id: Mapped[str] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="medications")
    administered_by = relationship("User", foreign_keys=[administered_by_id])
