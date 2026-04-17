import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.models.handoff import HandoffStatus


class HandoffCreate(BaseModel):
    patient_id: uuid.UUID
    shift_date: datetime
    incoming_nurse_id: Optional[uuid.UUID] = None
    situation: Optional[str] = None
    background: Optional[str] = None
    assessment: Optional[str] = None
    recommendation: Optional[str] = None


class HandoffUpdate(BaseModel):
    situation: Optional[str] = None
    background: Optional[str] = None
    assessment: Optional[str] = None
    recommendation: Optional[str] = None
    incoming_nurse_id: Optional[uuid.UUID] = None
    status: Optional[HandoffStatus] = None
    nurse_edits: Optional[Dict[str, Any]] = None


class HandoffSignOff(BaseModel):
    role: str  # "outgoing" or "incoming"


class HandoffGenerateRequest(BaseModel):
    patient_id: uuid.UUID
    shift_date: datetime
    hours_lookback: int = 12


class HandoffResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    outgoing_nurse_id: uuid.UUID
    incoming_nurse_id: Optional[uuid.UUID]
    situation: Optional[str]
    background: Optional[str]
    assessment: Optional[str]
    recommendation: Optional[str]
    ai_generated_situation: Optional[str]
    ai_generated_background: Optional[str]
    ai_generated_assessment: Optional[str]
    ai_generated_recommendation: Optional[str]
    status: HandoffStatus
    audio_url: Optional[str]
    outgoing_signed: bool
    incoming_signed: bool
    shift_date: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
