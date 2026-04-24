import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.models.fall_risk import FallRiskAssessment
from app.schemas.fall_risk import (
    FallRiskAssessmentCreate,
    FallRiskAssessmentResponse,
    MobilityEventRequest,
)
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
    event: MobilityEventRequest,
    current_user: User = Depends(require_permission("fall_risk:create")),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest a structured mobility event from the Computer Vision module.

    The CV pipeline (camera + pose estimation) classifies patient posture into
    states such as lying, sitting, standing, unstable_standing, bed_exit_attempt,
    unsteady_gait, or repositioning, and posts the event here.

    The Fall Risk Engine re-scores the patient in real time and may raise an
    alert when the composite score crosses the HIGH threshold.
    """
    mobility_event = {
        "event_type": event.event_type,
        "confidence": event.confidence,
        "timestamp": event.timestamp.isoformat() if event.timestamp else None,
        "source": event.source,
    }
    try:
        assessment = await FallRiskService.assess_patient(db, event.patient_id, mobility_event)
        return assessment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/mobility-events/{patient_id}", response_model=list[FallRiskAssessmentResponse])
async def get_mobility_events(
    patient_id: uuid.UUID,
    limit: int = Query(default=20, le=100),
    current_user: User = Depends(require_permission("fall_risk:read")),
    db: AsyncSession = Depends(get_db),
):
    """Return recent CV-detected mobility events for a patient."""
    result = await db.execute(
        select(FallRiskAssessment)
        .where(
            FallRiskAssessment.patient_id == patient_id,
            FallRiskAssessment.mobility_event_detected.is_(True),
        )
        .order_by(FallRiskAssessment.assessed_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
