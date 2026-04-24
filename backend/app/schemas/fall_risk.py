import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from app.models.fall_risk import RiskLevel, AssessmentSource


class MobilityEventRequest(BaseModel):
    """Structured mobility event emitted by the CV module."""
    patient_id: uuid.UUID
    event_type: str = Field(
        ...,
        description="Detected mobility state: lying, sitting, standing, "
                    "unstable_standing, bed_exit_attempt, unsteady_gait, repositioning",
    )
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    timestamp: Optional[datetime] = None
    source: str = "camera_cv"
    frame_metadata: Optional[Dict[str, Any]] = None


class MobilityEventResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    event_type: Optional[str]
    confidence_note: Optional[str] = None
    risk_level: RiskLevel
    score: float
    assessed_at: datetime

    model_config = {"from_attributes": True}


class FallRiskAssessmentCreate(BaseModel):
    patient_id: uuid.UUID
    score: float
    risk_level: RiskLevel
    source: AssessmentSource = AssessmentSource.MANUAL
    contributing_factors: Optional[Dict[str, float]] = None
    recommended_interventions: Optional[List[str]] = None
    mobility_event_detected: bool = False
    mobility_event_type: Optional[str] = None


class FallRiskAssessmentResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    score: float
    previous_score: Optional[float]
    risk_level: RiskLevel
    source: AssessmentSource
    contributing_factors: Optional[dict]
    recommended_interventions: Optional[list]
    mobility_event_detected: bool
    mobility_event_type: Optional[str]
    assessed_at: datetime

    model_config = {"from_attributes": True}
