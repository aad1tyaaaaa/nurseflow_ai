import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.alert import AlertType, AlertSeverity, AlertStatus


class AlertCreate(BaseModel):
    patient_id: uuid.UUID
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    clinical_reasoning: Optional[str] = None
    contributing_factors: Optional[dict] = None
    suggested_actions: Optional[list] = None


class AlertAcknowledge(BaseModel):
    resolution_notes: Optional[str] = None


class AlertResolve(BaseModel):
    resolution_notes: str


class AlertResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    assigned_nurse_id: Optional[uuid.UUID]
    alert_type: AlertType
    severity: AlertSeverity
    status: AlertStatus
    title: str
    message: str
    clinical_reasoning: Optional[str]
    contributing_factors: Optional[dict]
    suggested_actions: Optional[list]
    escalation_level: int
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
