import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient, Vital
from app.models.handoff import Handoff, HandoffStatus


class SBARService:
    """Service for AI-powered SBAR handoff generation.

    In production, this integrates with fine-tuned clinical LLMs.
    Currently provides structured rule-based generation from EHR data.
    """

    @staticmethod
    async def generate_sbar(db: AsyncSession, patient_id: uuid.UUID, nurse_id: uuid.UUID, shift_date: datetime, hours_lookback: int = 12) -> Handoff:
        # Fetch patient
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = result.scalar_one_or_none()
        if not patient:
            raise ValueError("Patient not found")

        # Fetch recent vitals
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_lookback)
        vitals_result = await db.execute(
            select(Vital)
            .where(Vital.patient_id == patient_id, Vital.recorded_at >= cutoff)
            .order_by(Vital.recorded_at.desc())
        )
        vitals = vitals_result.scalars().all()

        # Generate SBAR sections (rule-based; replace with LLM in production)
        situation = SBARService._generate_situation(patient, vitals)
        background = SBARService._generate_background(patient)
        assessment = SBARService._generate_assessment(patient, vitals)
        recommendation = SBARService._generate_recommendation(patient, vitals)

        handoff = Handoff(
            patient_id=patient_id,
            outgoing_nurse_id=nurse_id,
            situation=situation,
            background=background,
            assessment=assessment,
            recommendation=recommendation,
            ai_generated_situation=situation,
            ai_generated_background=background,
            ai_generated_assessment=assessment,
            ai_generated_recommendation=recommendation,
            status=HandoffStatus.DRAFT,
            shift_date=shift_date,
        )
        db.add(handoff)
        await db.flush()
        return handoff

    @staticmethod
    def _generate_situation(patient: Patient, vitals: list) -> str:
        latest = vitals[0] if vitals else None
        lines = [
            f"Patient {patient.first_name} {patient.last_name} (MRN: {patient.mrn}), "
            f"Room {patient.room_number or 'N/A'}, Bed {patient.bed_number or 'N/A'}.",
            f"Primary diagnosis: {patient.primary_diagnosis or 'Not documented'}.",
            f"Current acuity score: {patient.acuity_score or 'N/A'}.",
        ]
        if latest:
            lines.append(
                f"Latest vitals — HR: {latest.heart_rate}, BP: {latest.blood_pressure_systolic}/{latest.blood_pressure_diastolic}, "
                f"RR: {latest.respiratory_rate}, Temp: {latest.temperature}, SpO2: {latest.spo2}%."
            )
        return " ".join(lines)

    @staticmethod
    def _generate_background(patient: Patient) -> str:
        allergies = ", ".join(patient.allergies) if patient.allergies else "NKDA"
        return (
            f"Allergies: {allergies}. "
            f"Admission date: {patient.admission_date.strftime('%Y-%m-%d') if patient.admission_date else 'N/A'}. "
            f"Relevant history documented in EHR."
        )

    @staticmethod
    def _generate_assessment(patient: Patient, vitals: list) -> str:
        concerns = []
        if patient.fall_risk_score and patient.fall_risk_score > 50:
            concerns.append(f"Elevated fall risk (score: {patient.fall_risk_score})")
        if patient.news2_score and patient.news2_score >= 5:
            concerns.append(f"NEWS2 score elevated ({patient.news2_score})")
        if vitals:
            latest = vitals[0]
            if latest.heart_rate and (latest.heart_rate > 100 or latest.heart_rate < 50):
                concerns.append(f"Abnormal heart rate ({latest.heart_rate})")
            if latest.spo2 and latest.spo2 < 94:
                concerns.append(f"Low SpO2 ({latest.spo2}%)")

        if concerns:
            return "Active concerns: " + "; ".join(concerns) + "."
        return "Patient currently stable with no acute concerns identified."

    @staticmethod
    def _generate_recommendation(patient: Patient, vitals: list) -> str:
        recs = ["Continue current care plan.", "Monitor vitals per protocol."]
        if patient.fall_risk_score and patient.fall_risk_score > 50:
            recs.append("Maintain fall precautions.")
        if patient.news2_score and patient.news2_score >= 5:
            recs.append("Increase monitoring frequency to q1h.")
        return " ".join(recs)
