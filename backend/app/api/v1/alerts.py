import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.schemas.alert import AlertCreate, AlertAcknowledge, AlertResolve, AlertResponse
from app.services.alert_service import AlertService
from app.models.alert import Alert

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=list[AlertResponse])
async def get_my_alerts(
    current_user: User = Depends(require_permission("alerts:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all active/escalated alerts for the current nurse."""
    alerts = await AlertService.get_active_alerts(db, current_user.id)
    return alerts


@router.get("/patient/{patient_id}", response_model=list[AlertResponse])
async def get_patient_alerts(
    patient_id: uuid.UUID,
    include_resolved: bool = False,
    current_user: User = Depends(require_permission("alerts:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get alerts for a specific patient."""
    alerts = await AlertService.get_patient_alerts(db, patient_id, include_resolved)
    return alerts


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: AlertCreate,
    current_user: User = Depends(require_permission("alerts:create")),
    db: AsyncSession = Depends(get_db),
):
    """Manually create a clinical alert."""
    alert = Alert(**payload.model_dump())
    db.add(alert)
    await db.flush()
    return alert


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: uuid.UUID,
    payload: AlertAcknowledge = AlertAcknowledge(),
    current_user: User = Depends(require_permission("alerts:acknowledge")),
    db: AsyncSession = Depends(get_db),
):
    """Acknowledge an alert. Stops escalation timer."""
    try:
        alert = await AlertService.acknowledge_alert(db, alert_id, current_user.id, payload.resolution_notes)
        return alert
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: uuid.UUID,
    payload: AlertResolve,
    current_user: User = Depends(require_permission("alerts:resolve")),
    db: AsyncSession = Depends(get_db),
):
    """Resolve an alert with resolution notes."""
    try:
        alert = await AlertService.resolve_alert(db, alert_id, current_user.id, payload.resolution_notes)
        return alert
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/check-escalations")
async def check_escalations(
    current_user: User = Depends(require_permission("alerts:escalate")),
    db: AsyncSession = Depends(get_db),
):
    """
    Check and escalate unacknowledged alerts past the 3-minute threshold.
    In production, this runs as a background task / Celery job.
    """
    escalated = await AlertService.check_escalations(db)
    return {"escalated_count": len(escalated), "alert_ids": [str(a.id) for a in escalated]}
