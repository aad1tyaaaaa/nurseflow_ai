import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.models.handoff import Handoff, HandoffStatus
from app.schemas.handoff import (
    HandoffCreate, HandoffUpdate, HandoffSignOff,
    HandoffGenerateRequest, HandoffResponse,
)
from app.services.sbar_service import SBARService

router = APIRouter(prefix="/handoffs", tags=["Handoffs / SBAR"])


@router.post("/generate", response_model=HandoffResponse, status_code=status.HTTP_201_CREATED)
async def generate_sbar(
    payload: HandoffGenerateRequest,
    current_user: User = Depends(require_permission("handoffs:create")),
    db: AsyncSession = Depends(get_db),
):
    """AI-generate SBAR handoff summary from EHR data and recent vitals."""
    try:
        handoff = await SBARService.generate_sbar(
            db,
            patient_id=payload.patient_id,
            nurse_id=current_user.id,
            shift_date=payload.shift_date,
            hours_lookback=payload.hours_lookback,
        )
        return handoff
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("", response_model=HandoffResponse, status_code=status.HTTP_201_CREATED)
async def create_handoff(
    payload: HandoffCreate,
    current_user: User = Depends(require_permission("handoffs:create")),
    db: AsyncSession = Depends(get_db),
):
    """Manually create a handoff."""
    handoff = Handoff(
        outgoing_nurse_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(handoff)
    await db.flush()
    return handoff


@router.get("", response_model=list[HandoffResponse])
async def list_handoffs(
    patient_id: Optional[uuid.UUID] = None,
    status_filter: Optional[HandoffStatus] = None,
    my_handoffs: bool = True,
    current_user: User = Depends(require_permission("handoffs:read")),
    db: AsyncSession = Depends(get_db),
):
    """List handoffs. By default shows current user's handoffs."""
    query = select(Handoff)
    if my_handoffs:
        query = query.where(
            (Handoff.outgoing_nurse_id == current_user.id) | (Handoff.incoming_nurse_id == current_user.id)
        )
    if patient_id:
        query = query.where(Handoff.patient_id == patient_id)
    if status_filter:
        query = query.where(Handoff.status == status_filter)
    query = query.order_by(Handoff.shift_date.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{handoff_id}", response_model=HandoffResponse)
async def get_handoff(
    handoff_id: uuid.UUID,
    current_user: User = Depends(require_permission("handoffs:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get handoff details."""
    result = await db.execute(select(Handoff).where(Handoff.id == handoff_id))
    handoff = result.scalar_one_or_none()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")
    return handoff


@router.patch("/{handoff_id}", response_model=HandoffResponse)
async def update_handoff(
    handoff_id: uuid.UUID,
    payload: HandoffUpdate,
    current_user: User = Depends(require_permission("handoffs:update")),
    db: AsyncSession = Depends(get_db),
):
    """Update/edit handoff SBAR content (nurse review step)."""
    result = await db.execute(select(Handoff).where(Handoff.id == handoff_id))
    handoff = result.scalar_one_or_none()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(handoff, field, value)

    # Track nurse edits vs AI-generated content
    if handoff.status == HandoffStatus.DRAFT:
        handoff.status = HandoffStatus.PENDING_REVIEW

    await db.flush()
    return handoff


@router.post("/{handoff_id}/sign", response_model=HandoffResponse)
async def sign_handoff(
    handoff_id: uuid.UUID,
    payload: HandoffSignOff,
    current_user: User = Depends(require_permission("handoffs:sign")),
    db: AsyncSession = Depends(get_db),
):
    """Digitally sign off on a handoff (outgoing or incoming nurse)."""
    result = await db.execute(select(Handoff).where(Handoff.id == handoff_id))
    handoff = result.scalar_one_or_none()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")

    if payload.role == "outgoing":
        if handoff.outgoing_nurse_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the outgoing nurse can sign as outgoing")
        handoff.outgoing_signed = True
        handoff.status = HandoffStatus.APPROVED
    elif payload.role == "incoming":
        if not handoff.incoming_nurse_id:
            handoff.incoming_nurse_id = current_user.id
        if handoff.incoming_nurse_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the assigned incoming nurse can sign")
        handoff.incoming_signed = True
        if handoff.outgoing_signed:
            handoff.status = HandoffStatus.SIGNED_OFF
    else:
        raise HTTPException(status_code=400, detail="Role must be 'outgoing' or 'incoming'")

    await db.flush()
    return handoff
