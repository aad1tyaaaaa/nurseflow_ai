import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.models.fall_risk import FallRiskAssessment
from app.schemas.fall_risk import FallRiskAssessmentCreate, FallRiskAssessmentResponse
from app.services.fall_risk_service import FallRiskService

router = APIRouter(prefix="/fall-risk", tags=["Fall Risk Monitoring"])


@router.post("/assess/{patient_id}", response_model=FallRiskAssessmentResponse)
async def assess_fall_risk(
    patient_id: uuid.UUID,
    mobility_event: Optional[dict] = None,
    current_user: User = Depends(require_permission("fall_risk:read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a fall-risk assessment for a patient.
    Uses vitals, EHR history, and optional camera-detected mobility events.
    Returns score, risk level, contributing factors, and recommended interventions.
    Automatically triggers alerts if threshold is crossed.
    """
    try:
        assessment = await FallRiskService.assess_patient(db, patient_id, mobility_event)
        return assessment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/patient/{patient_id}", response_model=list[FallRiskAssessmentResponse])
async def get_patient_assessments(
    patient_id: uuid.UUID,
    limit: int = Query(default=20, le=100),
    current_user: User = Depends(require_permission("fall_risk:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get fall risk assessment history for a patient."""
    result = await db.execute(
        select(FallRiskAssessment)
        .where(FallRiskAssessment.patient_id == patient_id)
        .order_by(FallRiskAssessment.assessed_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


@router.post("/mobility-event", response_model=FallRiskAssessmentResponse)
async def report_mobility_event(
    patient_id: uuid.UUID,
    event_type: str,
    confidence: float = 0.0,
    current_user: User = Depends(require_permission("fall_risk:create")),
    db: AsyncSession = Depends(get_db),
):
    """
    Report a camera-detected mobility event (from edge CV module).
    Event types: bed_exit_attempt, unsteady_gait, repositioning, standing_unassisted.
    Triggers immediate fall-risk re-assessment.
    """
    mobility_event = {
        "event_type": event_type,
        "confidence": confidence,
        "source": "camera_cv",
    }
    try:
        assessment = await FallRiskService.assess_patient(db, patient_id, mobility_event)
        return assessment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
