import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, Float, DateTime, Enum as SAEnum, ForeignKey, Boolean, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class AssessmentSource(str, enum.Enum):
    AI_VITALS = "ai_vitals"
    AI_CAMERA = "ai_camera"
    AI_COMBINED = "ai_combined"
    MANUAL = "manual"


class FallRiskAssessment(Base):
    __tablename__ = "fall_risk_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)

    score: Mapped[float] = mapped_column(Float, nullable=False)
    previous_score: Mapped[float] = mapped_column(Float, nullable=True)
    risk_level: Mapped[RiskLevel] = mapped_column(SAEnum(RiskLevel), nullable=False)
    source: Mapped[AssessmentSource] = mapped_column(SAEnum(AssessmentSource), default=AssessmentSource.AI_COMBINED)

    # Contributing factors (explainability)
    contributing_factors: Mapped[dict] = mapped_column(JSON, nullable=True)
    # e.g. {"age": 0.15, "medication_effects": 0.25, "mobility_event": 0.40, "history": 0.20}

    # Recommended interventions
    recommended_interventions: Mapped[dict] = mapped_column(JSON, nullable=True)
    # e.g. ["bed_rails_up", "call_light_check", "reposition", "1_to_1_supervision"]

    # Mobility event data (from camera CV)
    mobility_event_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    mobility_event_type: Mapped[str] = mapped_column(String(100), nullable=True)  # bed_exit_attempt, unsteady_gait, etc.

    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="fall_risk_assessments")
