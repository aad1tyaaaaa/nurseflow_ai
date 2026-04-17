import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.models.patient import Patient, Vital
from app.models.medication import Medication, MedicationStatus
from app.models.alert import Alert, AlertStatus
from app.schemas.patient import PatientDashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/patients", response_model=list[PatientDashboardResponse])
async def get_dashboard(
    current_user: User = Depends(require_permission("dashboard:read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Unified Patient Dashboard — single-screen view of all assigned patients.
    Ranked by AI acuity score with alert flags, pending tasks, and quick-access SBAR.
    Designed for shift overview and rapid triage.
    """
    # Get assigned patients ranked by acuity
    result = await db.execute(
        select(Patient)
        .where(Patient.assigned_nurse_id == current_user.id)
        .order_by(Patient.acuity_score.desc().nullslast())
    )
    patients = result.scalars().all()

    dashboard = []
    for patient in patients:
        # Active alerts count
        alert_count = await db.execute(
            select(func.count(Alert.id)).where(
                Alert.patient_id == patient.id,
                Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ESCALATED]),
            )
        )

        # Pending medications count
        med_count = await db.execute(
            select(func.count(Medication.id)).where(
                Medication.patient_id == patient.id,
                Medication.status.in_([MedicationStatus.PENDING, MedicationStatus.DUE, MedicationStatus.OVERDUE]),
            )
        )

        # Latest vitals
        vitals_result = await db.execute(
            select(Vital)
            .where(Vital.patient_id == patient.id)
            .order_by(Vital.recorded_at.desc())
            .limit(1)
        )
        latest_vital = vitals_result.scalar_one_or_none()

        dashboard.append(PatientDashboardResponse(
            id=patient.id,
            mrn=patient.mrn,
            first_name=patient.first_name,
            last_name=patient.last_name,
            room_number=patient.room_number,
            bed_number=patient.bed_number,
            primary_diagnosis=patient.primary_diagnosis,
            acuity_score=patient.acuity_score,
            fall_risk_score=patient.fall_risk_score,
            news2_score=patient.news2_score,
            active_alerts_count=alert_count.scalar() or 0,
            pending_medications_count=med_count.scalar() or 0,
            latest_vitals=latest_vital,
        ))

    return dashboard


@router.get("/summary")
async def get_shift_summary(
    current_user: User = Depends(require_permission("dashboard:read")),
    db: AsyncSession = Depends(get_db),
):
    """Quick shift summary stats for the current nurse."""
    patient_count = await db.execute(
        select(func.count(Patient.id)).where(Patient.assigned_nurse_id == current_user.id)
    )

    active_alerts = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.assigned_nurse_id == current_user.id,
            Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ESCALATED]),
        )
    )

    pending_meds = await db.execute(
        select(func.count(Medication.id)).where(
            Medication.status.in_([MedicationStatus.PENDING, MedicationStatus.DUE, MedicationStatus.OVERDUE]),
        )
    )

    return {
        "total_patients": patient_count.scalar() or 0,
        "active_alerts": active_alerts.scalar() or 0,
        "pending_medications": pending_meds.scalar() or 0,
        "nurse_name": current_user.full_name,
        "unit": current_user.unit,
        "is_on_shift": current_user.is_on_shift,
    }
