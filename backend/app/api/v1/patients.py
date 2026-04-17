import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.models.patient import Patient, Vital
from app.schemas.patient import (
    PatientCreate, PatientUpdate, PatientResponse,
    PatientDashboardResponse, VitalCreate, VitalResponse,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=list[PatientResponse])
async def list_patients(
    unit: Optional[str] = None,
    assigned_to_me: bool = False,
    current_user: User = Depends(require_permission("patients:read")),
    db: AsyncSession = Depends(get_db),
):
    """List patients. Nurses see their assigned patients by default."""
    query = select(Patient)
    if assigned_to_me:
        query = query.where(Patient.assigned_nurse_id == current_user.id)
    if unit:
        query = query.where(Patient.unit == unit)
    query = query.order_by(Patient.acuity_score.desc().nullslast())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    current_user: User = Depends(require_permission("patients:create")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new patient record."""
    # Check for duplicate MRN
    existing = await db.execute(select(Patient).where(Patient.mrn == payload.mrn))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Patient with this MRN already exists")

    patient = Patient(**payload.model_dump())
    db.add(patient)
    await db.flush()
    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_permission("patients:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get patient details."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: uuid.UUID,
    payload: PatientUpdate,
    current_user: User = Depends(require_permission("patients:update")),
    db: AsyncSession = Depends(get_db),
):
    """Update patient information."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    await db.flush()
    return patient


# --- Vitals ---
@router.post("/{patient_id}/vitals", response_model=VitalResponse, status_code=status.HTTP_201_CREATED)
async def record_vitals(
    patient_id: uuid.UUID,
    payload: VitalCreate,
    current_user: User = Depends(require_permission("vitals:create")),
    db: AsyncSession = Depends(get_db),
):
    """Record patient vital signs."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    vital = Vital(patient_id=patient_id, **payload.model_dump(exclude={"patient_id"}))
    db.add(vital)
    await db.flush()
    return vital


@router.get("/{patient_id}/vitals", response_model=list[VitalResponse])
async def get_vitals(
    patient_id: uuid.UUID,
    limit: int = Query(default=20, le=100),
    current_user: User = Depends(require_permission("vitals:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get patient vital signs history."""
    result = await db.execute(
        select(Vital)
        .where(Vital.patient_id == patient_id)
        .order_by(Vital.recorded_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
