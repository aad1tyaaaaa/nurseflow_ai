import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# --- Vital ---
class VitalCreate(BaseModel):
    patient_id: uuid.UUID
    heart_rate: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None
    respiratory_rate: Optional[float] = None
    temperature: Optional[float] = None
    spo2: Optional[float] = None
    consciousness_level: Optional[str] = None
    source: str = "manual"


class VitalResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    heart_rate: Optional[float]
    blood_pressure_systolic: Optional[float]
    blood_pressure_diastolic: Optional[float]
    respiratory_rate: Optional[float]
    temperature: Optional[float]
    spo2: Optional[float]
    consciousness_level: Optional[str]
    source: str
    recorded_at: datetime

    model_config = {"from_attributes": True}


# --- Patient ---
class PatientCreate(BaseModel):
    mrn: str
    first_name: str
    last_name: str
    date_of_birth: datetime
    gender: Optional[str] = None
    room_number: Optional[str] = None
    bed_number: Optional[str] = None
    unit: Optional[str] = None
    hospital_id: Optional[str] = None
    primary_diagnosis: Optional[str] = None
    allergies: Optional[List[str]] = None
    assigned_nurse_id: Optional[uuid.UUID] = None
    fhir_patient_id: Optional[str] = None


class PatientUpdate(BaseModel):
    room_number: Optional[str] = None
    bed_number: Optional[str] = None
    unit: Optional[str] = None
    primary_diagnosis: Optional[str] = None
    allergies: Optional[List[str]] = None
    assigned_nurse_id: Optional[uuid.UUID] = None
    acuity_score: Optional[float] = None
    fall_risk_score: Optional[float] = None
    news2_score: Optional[int] = None


class PatientResponse(BaseModel):
    id: uuid.UUID
    mrn: str
    first_name: str
    last_name: str
    date_of_birth: datetime
    gender: Optional[str]
    room_number: Optional[str]
    bed_number: Optional[str]
    unit: Optional[str]
    hospital_id: Optional[str]
    primary_diagnosis: Optional[str]
    allergies: Optional[list]
    acuity_score: Optional[float]
    fall_risk_score: Optional[float]
    news2_score: Optional[int]
    assigned_nurse_id: Optional[uuid.UUID]
    admission_date: Optional[datetime]
    discharge_date: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class PatientDashboardResponse(BaseModel):
    id: uuid.UUID
    mrn: str
    first_name: str
    last_name: str
    room_number: Optional[str]
    bed_number: Optional[str]
    primary_diagnosis: Optional[str]
    acuity_score: Optional[float]
    fall_risk_score: Optional[float]
    news2_score: Optional[int]
    active_alerts_count: int = 0
    pending_medications_count: int = 0
    latest_vitals: Optional[VitalResponse] = None

    model_config = {"from_attributes": True}
