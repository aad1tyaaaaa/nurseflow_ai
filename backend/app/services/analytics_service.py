import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient
from app.models.handoff import Handoff, HandoffStatus
from app.models.medication import Medication, MedicationStatus
from app.models.alert import Alert, AlertStatus, AlertType
from app.models.fall_risk import FallRiskAssessment


class AnalyticsService:
    """
    Analytics for shift metrics, unit performance, and safety dashboards.
    Used by charge nurses, nursing directors, and hospital administrators.
    """

    @staticmethod
    async def get_shift_metrics(db: AsyncSession, nurse_id: uuid.UUID, shift_start: datetime, shift_end: datetime) -> dict:
        # Total patients
        patient_count = await db.execute(
            select(func.count(Patient.id)).where(Patient.assigned_nurse_id == nurse_id)
        )
        total_patients = patient_count.scalar() or 0

        # Handoffs
        handoff_result = await db.execute(
            select(
                func.count(Handoff.id),
                func.count(case((Handoff.status == HandoffStatus.SIGNED_OFF, 1))),
            ).where(
                and_(
                    Handoff.outgoing_nurse_id == nurse_id,
                    Handoff.shift_date >= shift_start,
                    Handoff.shift_date <= shift_end,
                )
            )
        )
        handoff_row = handoff_result.one()
        total_handoffs = handoff_row[0]
        completed_handoffs = handoff_row[1]
        sbar_compliance = (completed_handoffs / total_handoffs * 100) if total_handoffs > 0 else 0

        # Medications
        med_result = await db.execute(
            select(
                func.count(Medication.id),
                func.count(case((Medication.status == MedicationStatus.ADMINISTERED, 1))),
                func.count(case((Medication.status == MedicationStatus.OVERDUE, 1))),
            ).where(
                and_(
                    Medication.administered_by_id == nurse_id,
                    Medication.scheduled_time >= shift_start,
                    Medication.scheduled_time <= shift_end,
                )
            )
        )
        med_row = med_result.one()

        # Alerts
        alert_result = await db.execute(
            select(
                func.count(Alert.id),
                func.count(case((Alert.status.in_([AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED]), 1))),
            ).where(
                and_(
                    Alert.assigned_nurse_id == nurse_id,
                    Alert.created_at >= shift_start,
                    Alert.created_at <= shift_end,
                )
            )
        )
        alert_row = alert_result.one()

        # Average alert response time
        resp_result = await db.execute(
            select(
                func.avg(func.extract("epoch", Alert.acknowledged_at - Alert.created_at))
            ).where(
                and_(
                    Alert.assigned_nurse_id == nurse_id,
                    Alert.acknowledged_at.isnot(None),
                    Alert.created_at >= shift_start,
                    Alert.created_at <= shift_end,
                )
            )
        )
        avg_response = resp_result.scalar()

        # Fall events
        fall_count = await db.execute(
            select(func.count(Alert.id)).where(
                and_(
                    Alert.assigned_nurse_id == nurse_id,
                    Alert.alert_type == AlertType.FALL_RISK,
                    Alert.created_at >= shift_start,
                    Alert.created_at <= shift_end,
                )
            )
        )

        return {
            "total_patients": total_patients,
            "total_handoffs": total_handoffs,
            "handoffs_completed": completed_handoffs,
            "sbar_compliance_rate": round(sbar_compliance, 1),
            "medications_administered": med_row[1],
            "medications_overdue": med_row[2],
            "alerts_triggered": alert_row[0],
            "alerts_acknowledged": alert_row[1],
            "avg_alert_response_time_seconds": round(avg_response, 1) if avg_response else None,
            "fall_events": fall_count.scalar() or 0,
            "fall_alerts_accuracy": None,  # Requires outcome data correlation
        }

    @staticmethod
    async def get_unit_analytics(db: AsyncSession, unit: str, period_start: datetime, period_end: datetime) -> dict:
        # Nurse count
        from app.models.user import User
        nurse_count = await db.execute(
            select(func.count(User.id)).where(and_(User.unit == unit, User.is_active == True))
        )

        # Patient count
        patient_count = await db.execute(
            select(func.count(Patient.id)).where(Patient.unit == unit)
        )

        # Medication errors (overdue as proxy)
        total_meds = await db.execute(
            select(func.count(Medication.id)).where(
                and_(
                    Medication.scheduled_time >= period_start,
                    Medication.scheduled_time <= period_end,
                )
            )
        )
        overdue_meds = await db.execute(
            select(func.count(Medication.id)).where(
                and_(
                    Medication.status == MedicationStatus.OVERDUE,
                    Medication.scheduled_time >= period_start,
                    Medication.scheduled_time <= period_end,
                )
            )
        )
        total_m = total_meds.scalar() or 1
        overdue_m = overdue_meds.scalar() or 0
        error_rate = (overdue_m / total_m * 100)

        return {
            "unit": unit,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "total_nurses": nurse_count.scalar() or 0,
            "total_patients": patient_count.scalar() or 0,
            "medication_error_rate": round(error_rate, 2),
            "fall_rate_per_1000_patient_days": 0.0,  # Requires extended outcome tracking
            "avg_handoff_time_minutes": 0.0,  # Requires timing instrumentation
            "sbar_compliance_rate": 0.0,  # Aggregated from shift metrics
            "alert_fatigue_score": 0.0,
            "nurse_satisfaction_score": None,
        }
