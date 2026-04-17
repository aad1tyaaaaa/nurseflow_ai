import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

from app.models.fall_risk import RiskLevel, AssessmentSource


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
