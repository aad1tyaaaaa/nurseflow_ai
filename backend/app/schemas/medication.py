import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.models.medication import MedicationStatus, UrgencyLevel


class MedicationCreate(BaseModel):
    patient_id: uuid.UUID
    drug_name: str
    drug_code: Optional[str] = None
    dosage: str
    route: str
    frequency: Optional[str] = None
    scheduled_time: datetime
    notes: Optional[str] = None
    fhir_medication_id: Optional[str] = None


class MedicationAdminister(BaseModel):
    notes: Optional[str] = None


class MedicationStatusUpdate(BaseModel):
    status: MedicationStatus
    notes: Optional[str] = None


class MedicationResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    drug_name: str
    drug_code: Optional[str]
    dosage: str
    route: str
    frequency: Optional[str]
    scheduled_time: datetime
    administered_time: Optional[datetime]
    administered_by_id: Optional[uuid.UUID]
    urgency: UrgencyLevel
    priority_score: float
    priority_reasoning: Optional[str]
    status: MedicationStatus
    interaction_warnings: Optional[list]
    allergy_flag: bool
    duplicate_flag: bool
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class MedicationQueueResponse(BaseModel):
    queue: List[MedicationResponse]
    total_pending: int
    critical_count: int
    overdue_count: int
