import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Enum as SAEnum, ForeignKey, Boolean, Integer, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AlertType(str, enum.Enum):
    FALL_RISK = "fall_risk"
    DETERIORATION = "deterioration"
    MEDICATION_INTERACTION = "medication_interaction"
    MEDICATION_OVERDUE = "medication_overdue"
    VITAL_ABNORMAL = "vital_abnormal"
    NEWS2_ESCALATION = "news2_escalation"
    QSOFA_ESCALATION = "qsofa_escalation"


class AlertSeverity(str, enum.Enum):
    ADVISORY = "advisory"
    URGENT = "urgent"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    SUPPRESSED = "suppressed"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    assigned_nurse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    alert_type: Mapped[AlertType] = mapped_column(SAEnum(AlertType), nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(SAEnum(AlertSeverity), nullable=False)
    status: Mapped[AlertStatus] = mapped_column(SAEnum(AlertStatus), default=AlertStatus.ACTIVE)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    clinical_reasoning: Mapped[str] = mapped_column(Text, nullable=True)  # AI explainability
    contributing_factors: Mapped[dict] = mapped_column(JSON, nullable=True)
    suggested_actions: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Escalation
    escalation_level: Mapped[int] = mapped_column(Integer, default=0)  # 0=nurse, 1=charge_nurse, 2=attending
    escalated_to_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    escalation_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Response tracking
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    acknowledged_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="alerts")
    assigned_nurse = relationship("User", foreign_keys=[assigned_nurse_id])
    escalated_to = relationship("User", foreign_keys=[escalated_to_id])
    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_id])
