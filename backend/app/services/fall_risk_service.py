import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient, Vital
from app.models.fall_risk import FallRiskAssessment, RiskLevel, AssessmentSource
from app.models.alert import Alert, AlertType, AlertSeverity, AlertStatus


class FallRiskService:
    """
    Predictive fall-risk monitoring service.
    Continuously scores patients using vitals, mobility data, and EHR history.
    Triggers tiered alerts and suggests preventive interventions.
    """

    # Thresholds
    LOW_THRESHOLD = 30.0
    MODERATE_THRESHOLD = 50.0
    HIGH_THRESHOLD = 70.0
    CRITICAL_THRESHOLD = 85.0

    @staticmethod
    async def assess_patient(db: AsyncSession, patient_id: uuid.UUID, mobility_event: Optional[dict] = None) -> FallRiskAssessment:
        # Fetch patient
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = result.scalar_one_or_none()
        if not patient:
            raise ValueError("Patient not found")

        # Get latest vitals
        vitals_result = await db.execute(
            select(Vital)
            .where(Vital.patient_id == patient_id)
            .order_by(desc(Vital.recorded_at))
            .limit(1)
        )
        latest_vital = vitals_result.scalar_one_or_none()

        # Get previous assessment
        prev_result = await db.execute(
            select(FallRiskAssessment)
            .where(FallRiskAssessment.patient_id == patient_id)
            .order_by(desc(FallRiskAssessment.assessed_at))
            .limit(1)
        )
        previous = prev_result.scalar_one_or_none()

        # Calculate score
        score, factors = FallRiskService._calculate_score(patient, latest_vital, mobility_event)
        risk_level = FallRiskService._score_to_level(score)
        interventions = FallRiskService._recommend_interventions(score, factors)

        source = AssessmentSource.AI_COMBINED
        mobility_detected = False
        mobility_type = None

        if mobility_event:
            mobility_detected = True
            mobility_type = mobility_event.get("event_type")
            source = AssessmentSource.AI_CAMERA if not latest_vital else AssessmentSource.AI_COMBINED

        assessment = FallRiskAssessment(
            patient_id=patient_id,
            score=score,
            previous_score=previous.score if previous else None,
            risk_level=risk_level,
            source=source,
            contributing_factors=factors,
            recommended_interventions=interventions,
            mobility_event_detected=mobility_detected,
            mobility_event_type=mobility_type,
        )
        db.add(assessment)

        # Update patient's fall risk score
        patient.fall_risk_score = score

        # Trigger alert if threshold crossed
        if score >= FallRiskService.HIGH_THRESHOLD:
            if not previous or previous.score < FallRiskService.HIGH_THRESHOLD:
                await FallRiskService._create_alert(db, patient, score, risk_level, factors, interventions)

        await db.flush()
        return assessment

    @staticmethod
    def _calculate_score(patient: Patient, vital: Optional[Vital], mobility_event: Optional[dict]) -> tuple:
        factors = {}
        score = 0.0

        # Age factor (simulated — age from DOB)
        if patient.date_of_birth:
            age = (datetime.now(timezone.utc) - patient.date_of_birth.replace(tzinfo=timezone.utc)).days / 365.25
            if age > 80:
                factors["age"] = 20.0
            elif age > 65:
                factors["age"] = 12.0
            elif age > 50:
                factors["age"] = 5.0
            else:
                factors["age"] = 0.0
            score += factors["age"]

        # Vital signs factor
        if vital:
            vital_risk = 0.0
            if vital.blood_pressure_systolic and vital.blood_pressure_systolic < 90:
                vital_risk += 10
            if vital.heart_rate and (vital.heart_rate > 110 or vital.heart_rate < 50):
                vital_risk += 8
            if vital.spo2 and vital.spo2 < 92:
                vital_risk += 7
            factors["vitals"] = min(vital_risk, 20.0)
            score += factors["vitals"]

        # History / acuity
        if patient.acuity_score:
            factors["acuity"] = min(patient.acuity_score * 2, 15.0)
            score += factors["acuity"]

        # Mobility event (from camera CV)
        if mobility_event:
            event_type = mobility_event.get("event_type", "")
            if event_type == "bed_exit_attempt":
                factors["mobility_event"] = 30.0
            elif event_type == "unsteady_gait":
                factors["mobility_event"] = 25.0
            elif event_type == "repositioning":
                factors["mobility_event"] = 10.0
            else:
                factors["mobility_event"] = 15.0
            score += factors["mobility_event"]

        # Previous fall history (placeholder for EHR integration)
        factors["fall_history"] = 0.0

        return min(score, 100.0), factors

    @staticmethod
    def _score_to_level(score: float) -> RiskLevel:
        if score >= FallRiskService.CRITICAL_THRESHOLD:
            return RiskLevel.CRITICAL
        elif score >= FallRiskService.HIGH_THRESHOLD:
            return RiskLevel.HIGH
        elif score >= FallRiskService.MODERATE_THRESHOLD:
            return RiskLevel.MODERATE
        return RiskLevel.LOW

    @staticmethod
    def _recommend_interventions(score: float, factors: dict) -> list:
        interventions = []
        if score >= 30:
            interventions.append("call_light_within_reach")
        if score >= 50:
            interventions.extend(["bed_rails_up", "non_slip_footwear"])
        if score >= 70:
            interventions.extend(["reposition_check_q2h", "clear_pathway"])
        if score >= 85:
            interventions.extend(["1_to_1_supervision", "bed_alarm_activated"])
        if factors.get("mobility_event", 0) > 0:
            interventions.append("immediate_visual_check")
        return interventions

    @staticmethod
    async def _create_alert(db: AsyncSession, patient: Patient, score: float, risk_level: RiskLevel, factors: dict, interventions: list):
        severity = AlertSeverity.CRITICAL if risk_level == RiskLevel.CRITICAL else AlertSeverity.URGENT

        alert = Alert(
            patient_id=patient.id,
            assigned_nurse_id=patient.assigned_nurse_id,
            alert_type=AlertType.FALL_RISK,
            severity=severity,
            status=AlertStatus.ACTIVE,
            title=f"Fall Risk {risk_level.value.upper()} — {patient.first_name} {patient.last_name}",
            message=f"Patient in Room {patient.room_number}, Bed {patient.bed_number} — fall risk score increased to {score:.0f}. Suggest: {', '.join(interventions[:3])}.",
            clinical_reasoning=f"Score increased to {score:.0f} based on: {', '.join(f'{k}: {v}' for k, v in factors.items() if v > 0)}",
            contributing_factors=factors,
            suggested_actions=interventions,
        )
        db.add(alert)
