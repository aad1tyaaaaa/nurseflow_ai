import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.models.medication import Medication
from app.schemas.medication import (
    MedicationCreate, MedicationAdminister, MedicationStatusUpdate,
    MedicationResponse, MedicationQueueResponse,
)
from app.services.medication_service import MedicationService

router = APIRouter(prefix="/medications", tags=["Medications"])


@router.get("/queue", response_model=MedicationQueueResponse)
async def get_medication_queue(
    current_user: User = Depends(require_permission("medications:read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Get AI-prioritized medication queue for all of the nurse's assigned patients.
    Medications are ranked by clinical urgency (due time, patient acuity, interaction risk).
    Re-ranked in real time as patient state changes.
    """
    medications, stats = await MedicationService.get_priority_queue(db, current_user.id)
    return MedicationQueueResponse(
        queue=medications,
        total_pending=stats["total_pending"],
        critical_count=stats["critical_count"],
        overdue_count=stats["overdue_count"],
    )


@router.post("", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(
    payload: MedicationCreate,
    current_user: User = Depends(require_permission("medications:create")),
    db: AsyncSession = Depends(get_db),
):
    """Add a medication order for a patient."""
    medication = Medication(**payload.model_dump())
    db.add(medication)
    await db.flush()
    return medication


@router.get("/{medication_id}", response_model=MedicationResponse)
async def get_medication(
    medication_id: uuid.UUID,
    current_user: User = Depends(require_permission("medications:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get medication details."""
    result = await db.execute(select(Medication).where(Medication.id == medication_id))
    medication = result.scalar_one_or_none()
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    return medication


@router.post("/{medication_id}/administer", response_model=MedicationResponse)
async def administer_medication(
    medication_id: uuid.UUID,
    payload: MedicationAdminister = MedicationAdminister(),
    current_user: User = Depends(require_permission("medications:administer")),
    db: AsyncSession = Depends(get_db),
):
    """
    Log medication administration. Voice shortcut: 'Given' maps to this endpoint.
    Auto-advances to next medication in queue.
    """
    try:
        medication = await MedicationService.administer_medication(
            db, medication_id, current_user.id, payload.notes
        )
        return medication
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{medication_id}/status", response_model=MedicationResponse)
async def update_medication_status(
    medication_id: uuid.UUID,
    payload: MedicationStatusUpdate,
    current_user: User = Depends(require_permission("medications:administer")),
    db: AsyncSession = Depends(get_db),
):
    """Update medication status (held, refused, cancelled)."""
    result = await db.execute(select(Medication).where(Medication.id == medication_id))
    medication = result.scalar_one_or_none()
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")

    medication.status = payload.status
    if payload.notes:
        medication.notes = payload.notes
    await db.flush()
    return medication


@router.get("/patient/{patient_id}", response_model=list[MedicationResponse])
async def get_patient_medications(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_permission("medications:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all medications for a specific patient."""
    result = await db.execute(
        select(Medication)
        .where(Medication.patient_id == patient_id)
        .order_by(Medication.scheduled_time.asc())
    )
    return list(result.scalars().all())


@router.post("/check-interactions")
async def check_interactions(
    patient_id: uuid.UUID,
    drug_name: str,
    current_user: User = Depends(require_permission("medications:read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Real-time cross-check of a medication against patient allergies,
    active prescriptions, and drug interaction databases.
    """
    try:
        result = await MedicationService.check_interactions(db, patient_id, drug_name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
