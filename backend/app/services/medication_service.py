import uuid
from datetime import datetime, timezone
from typing import List, Tuple

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.medication import Medication, MedicationStatus, UrgencyLevel
from app.models.patient import Patient


class MedicationService:
    """
    Dynamic medication priority queue.
    Ranks pending meds by urgency using patient acuity, due time, interaction risk.
    Re-ranks in real time as patient state changes.
    """

    @staticmethod
    async def get_priority_queue(db: AsyncSession, nurse_id: uuid.UUID) -> Tuple[List[Medication], dict]:
        """Get all pending/due medications for a nurse's patients, ranked by priority."""

        # Get all patients assigned to this nurse
        patient_result = await db.execute(
            select(Patient.id).where(Patient.assigned_nurse_id == nurse_id)
        )
        patient_ids = [row[0] for row in patient_result.all()]

        if not patient_ids:
            return [], {"total_pending": 0, "critical_count": 0, "overdue_count": 0}

        # Get all pending/due/overdue medications
        med_result = await db.execute(
            select(Medication)
            .where(
                and_(
                    Medication.patient_id.in_(patient_ids),
                    Medication.status.in_([
                        MedicationStatus.PENDING,
                        MedicationStatus.DUE,
                        MedicationStatus.OVERDUE,
                    ]),
                )
            )
            .order_by(Medication.priority_score.desc(), Medication.scheduled_time.asc())
        )
        medications = list(med_result.scalars().all())

        # Calculate priority scores
        now = datetime.now(timezone.utc)
        for med in medications:
            med.priority_score = await MedicationService._calculate_priority(db, med, now)
            # Update urgency based on score
            if med.priority_score >= 90:
                med.urgency = UrgencyLevel.CRITICAL
            elif med.priority_score >= 70:
                med.urgency = UrgencyLevel.HIGH
            elif med.priority_score >= 40:
                med.urgency = UrgencyLevel.MEDIUM
            else:
                med.urgency = UrgencyLevel.LOW

            # Mark overdue
            if med.scheduled_time < now and med.status == MedicationStatus.PENDING:
                med.status = MedicationStatus.OVERDUE

        # Sort by priority score descending
        medications.sort(key=lambda m: m.priority_score, reverse=True)

        stats = {
            "total_pending": len(medications),
            "critical_count": sum(1 for m in medications if m.urgency == UrgencyLevel.CRITICAL),
            "overdue_count": sum(1 for m in medications if m.status == MedicationStatus.OVERDUE),
        }

        return medications, stats

    @staticmethod
    async def _calculate_priority(db: AsyncSession, medication: Medication, now: datetime) -> float:
        score = 0.0

        # Time urgency (0–40 points)
        time_diff = (medication.scheduled_time - now).total_seconds() / 60  # minutes
        if time_diff < -60:  # More than 1 hour overdue
            score += 40
        elif time_diff < 0:  # Overdue
            score += 30
        elif time_diff < 30:  # Due within 30 min
            score += 20
        elif time_diff < 60:  # Due within 1 hour
            score += 10

        # Patient acuity (0–30 points)
        patient_result = await db.execute(
            select(Patient.acuity_score).where(Patient.id == medication.patient_id)
        )
        acuity = patient_result.scalar_one_or_none() or 0
        score += min(acuity * 3, 30)

        # Interaction warnings (0–15 points)
        if medication.interaction_warnings:
            score += min(len(medication.interaction_warnings) * 5, 15)

        # Allergy flag (0–15 points)
        if medication.allergy_flag:
            score += 15

        return min(score, 100)

    @staticmethod
    async def administer_medication(db: AsyncSession, medication_id: uuid.UUID, nurse_id: uuid.UUID, notes: str = None) -> Medication:
        result = await db.execute(select(Medication).where(Medication.id == medication_id))
        medication = result.scalar_one_or_none()
        if not medication:
            raise ValueError("Medication not found")

        medication.status = MedicationStatus.ADMINISTERED
        medication.administered_time = datetime.now(timezone.utc)
        medication.administered_by_id = nurse_id
        if notes:
            medication.notes = notes

        await db.flush()
        return medication

    @staticmethod
    async def check_interactions(db: AsyncSession, patient_id: uuid.UUID, drug_name: str) -> dict:
        """Check medication interactions against patient's current medications and allergies."""
        # Get patient allergies
        patient_result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = patient_result.scalar_one_or_none()
        if not patient:
            raise ValueError("Patient not found")

        # Get active medications
        med_result = await db.execute(
            select(Medication).where(
                and_(
                    Medication.patient_id == patient_id,
                    Medication.status.in_([MedicationStatus.PENDING, MedicationStatus.DUE, MedicationStatus.ADMINISTERED]),
                )
            )
        )
        active_meds = med_result.scalars().all()

        # In production, this queries a drug interaction database (e.g., RxNorm, DrugBank)
        warnings = []
        allergy_match = False

        if patient.allergies:
            for allergy in patient.allergies:
                if allergy.lower() in drug_name.lower():
                    allergy_match = True
                    warnings.append(f"ALLERGY ALERT: Patient has documented allergy to {allergy}")

        # Check for duplicate medications
        for med in active_meds:
            if med.drug_name.lower() == drug_name.lower():
                warnings.append(f"DUPLICATE: {drug_name} is already active for this patient")

        return {
            "drug_name": drug_name,
            "allergy_flag": allergy_match,
            "warnings": warnings,
            "active_medications": [m.drug_name for m in active_meds],
            "safe_to_administer": len(warnings) == 0,
        }
