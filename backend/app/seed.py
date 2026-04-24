"""Seed the database with realistic demo data for NurseFlow AI.

Run from the backend directory (with venv activated):
    python -m app.seed
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import async_session, engine, Base
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.patient import Patient, Vital
from app.models.medication import Medication, MedicationStatus, UrgencyLevel
from app.models.alert import Alert, AlertType, AlertSeverity, AlertStatus
from app.models.handoff import Handoff, HandoffStatus
from app.models.fall_risk import FallRiskAssessment, RiskLevel, AssessmentSource
from app.models.voice_note import VoiceNote


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def seed():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # --- Idempotency guard ---
        existing = await db.execute(select(User).where(User.email == "priya.rn@hospital.com"))
        if existing.scalar_one_or_none():
            print("Seed data already present — skipping.")
            return

        # ===== USERS =====
        aditi = User(
            email="aditi@gmail.com",
            hashed_password=hash_password("Password123!"),
            full_name="Aditi Sharma, RN",
            role=UserRole.NURSE,
            unit="ICU Unit B",
            hospital_id="HOSP-001",
            is_active=True,
            is_on_shift=True,
        )
        priya = User(
            email="priya.rn@hospital.com",
            hashed_password=hash_password("Password123!"),
            full_name="Priya Sharma, RN",
            role=UserRole.NURSE,
            unit="ICU Unit B",
            hospital_id="HOSP-001",
            is_active=True,
            is_on_shift=True,
        )
        marcus = User(
            email="marcus.rn@hospital.com",
            hashed_password=hash_password("Password123!"),
            full_name="Marcus Davids, RN",
            role=UserRole.CHARGE_NURSE,
            unit="ICU Unit B",
            hospital_id="HOSP-001",
            is_active=True,
            is_on_shift=True,
        )
        amelia = User(
            email="amelia.rn@hospital.com",
            hashed_password=hash_password("Password123!"),
            full_name="Amelia Chen, RN",
            role=UserRole.NURSE,
            unit="ICU Unit B",
            hospital_id="HOSP-001",
            is_active=True,
            is_on_shift=False,
        )
        director = User(
            email="director@hospital.com",
            hashed_password=hash_password("Password123!"),
            full_name="Dr. Sarah Patel",
            role=UserRole.NURSING_DIRECTOR,
            unit="ICU Unit B",
            hospital_id="HOSP-001",
            is_active=True,
        )
        pharmacist = User(
            email="pharma@hospital.com",
            hashed_password=hash_password("Password123!"),
            full_name="James O'Connor, PharmD",
            role=UserRole.PHARMACIST,
            hospital_id="HOSP-001",
            is_active=True,
        )
        admin = User(
            email="admin@hospital.com",
            hashed_password=hash_password("Password123!"),
            full_name="System Admin",
            role=UserRole.ADMIN,
            hospital_id="HOSP-001",
            is_active=True,
        )
        db.add_all([aditi, priya, marcus, amelia, director, pharmacist, admin])
        await db.flush()

        # ===== PATIENTS =====
        now = utcnow()
        patients_data = [
            {
                "mrn": "482-991",
                "first_name": "Robert",
                "last_name": "Miller",
                "date_of_birth": datetime(1952, 4, 15),
                "gender": "male",
                "room_number": "207",
                "bed_number": "7",
                "primary_diagnosis": "COPD Exacerbation with Acute Respiratory Failure",
                "allergies": ["Penicillin", "Sulfa"],
                "acuity_score": 4.2,
                "fall_risk_score": 8.5,
                "news2_score": 7,
            },
            {
                "mrn": "511-204",
                "first_name": "Evelyn",
                "last_name": "Garcia",
                "date_of_birth": datetime(1948, 11, 3),
                "gender": "female",
                "room_number": "203",
                "bed_number": "3",
                "primary_diagnosis": "Post-op CABG Day 2",
                "allergies": ["Latex"],
                "acuity_score": 3.5,
                "fall_risk_score": 6.0,
                "news2_score": 4,
            },
            {
                "mrn": "623-877",
                "first_name": "David",
                "last_name": "Johnson",
                "date_of_birth": datetime(1967, 7, 22),
                "gender": "male",
                "room_number": "211",
                "bed_number": "11",
                "primary_diagnosis": "Sepsis, Urinary Source",
                "allergies": [],
                "acuity_score": 4.5,
                "fall_risk_score": 5.2,
                "news2_score": 6,
            },
            {
                "mrn": "770-112",
                "first_name": "Aisha",
                "last_name": "Khan",
                "date_of_birth": datetime(1985, 2, 10),
                "gender": "female",
                "room_number": "205",
                "bed_number": "5",
                "primary_diagnosis": "Diabetic Ketoacidosis",
                "allergies": ["Shellfish"],
                "acuity_score": 3.8,
                "fall_risk_score": 3.0,
                "news2_score": 3,
            },
            {
                "mrn": "891-456",
                "first_name": "William",
                "last_name": "Thompson",
                "date_of_birth": datetime(1941, 9, 28),
                "gender": "male",
                "room_number": "214",
                "bed_number": "14",
                "primary_diagnosis": "Acute Ischemic Stroke",
                "allergies": ["Aspirin"],
                "acuity_score": 4.8,
                "fall_risk_score": 9.1,
                "news2_score": 5,
            },
            {
                "mrn": "932-008",
                "first_name": "Maria",
                "last_name": "Rodriguez",
                "date_of_birth": datetime(1976, 6, 14),
                "gender": "female",
                "room_number": "209",
                "bed_number": "9",
                "primary_diagnosis": "Pneumonia, Community-Acquired",
                "allergies": [],
                "acuity_score": 2.9,
                "fall_risk_score": 2.5,
                "news2_score": 2,
            },
            {
                "mrn": "105-339",
                "first_name": "Kenji",
                "last_name": "Tanaka",
                "date_of_birth": datetime(1959, 12, 1),
                "gender": "male",
                "room_number": "201",
                "bed_number": "1",
                "primary_diagnosis": "Congestive Heart Failure Exacerbation",
                "allergies": ["Iodine"],
                "acuity_score": 3.7,
                "fall_risk_score": 5.8,
                "news2_score": 4,
            },
            {
                "mrn": "248-771",
                "first_name": "Olivia",
                "last_name": "Bennett",
                "date_of_birth": datetime(1993, 3, 19),
                "gender": "female",
                "room_number": "212",
                "bed_number": "12",
                "primary_diagnosis": "Post-op Appendectomy",
                "allergies": ["Morphine"],
                "acuity_score": 1.8,
                "fall_risk_score": 1.5,
                "news2_score": 1,
            },
        ]

        patients = []
        for data in patients_data:
            p = Patient(
                **data,
                unit="ICU Unit B",
                hospital_id="HOSP-001",
                assigned_nurse_id=aditi.id,
                admission_date=now - timedelta(days=2),
            )
            patients.append(p)
        db.add_all(patients)
        await db.flush()

        # ===== VITALS (recent hours) =====
        for p in patients:
            base_hr = 80 + int(p.acuity_score * 5)
            base_spo2 = 98 - int(p.news2_score)
            for i in range(6):
                v = Vital(
                    patient_id=p.id,
                    heart_rate=base_hr + (i * 2),
                    blood_pressure_systolic=130 + (i * 2),
                    blood_pressure_diastolic=82 + i,
                    respiratory_rate=16 + (p.news2_score // 2),
                    temperature=37.0 + (p.news2_score * 0.1),
                    spo2=max(88, base_spo2 - (i // 2)),
                    consciousness_level="A",
                    source="monitor",
                    recorded_at=now - timedelta(hours=5 - i),
                )
                db.add(v)

        # ===== MEDICATIONS =====
        meds_data = [
            # (patient_idx, drug, dose, route, freq, offset_minutes, urgency, status)
            (0, "Albuterol Sulfate", "2.5 mg", "Nebulizer", "Q4H", -15, UrgencyLevel.CRITICAL, MedicationStatus.OVERDUE),
            (0, "Methylprednisolone", "40 mg", "IV", "Q6H", 30, UrgencyLevel.HIGH, MedicationStatus.DUE),
            (0, "Heparin", "5000 units", "SubQ", "Q8H", 120, UrgencyLevel.MEDIUM, MedicationStatus.PENDING),
            (1, "Metoprolol", "25 mg", "Oral", "BID", 15, UrgencyLevel.HIGH, MedicationStatus.DUE),
            (1, "Acetaminophen", "650 mg", "Oral", "Q6H PRN", 60, UrgencyLevel.LOW, MedicationStatus.PENDING),
            (2, "Piperacillin-Tazobactam", "4.5 g", "IV", "Q8H", -5, UrgencyLevel.CRITICAL, MedicationStatus.OVERDUE),
            (2, "Norepinephrine", "0.1 mcg/kg/min", "IV Drip", "Continuous", 0, UrgencyLevel.CRITICAL, MedicationStatus.ADMINISTERED),
            (3, "Insulin Regular", "10 units/hr", "IV Drip", "Continuous", 0, UrgencyLevel.HIGH, MedicationStatus.ADMINISTERED),
            (3, "Potassium Chloride", "40 mEq", "IV", "Once", 45, UrgencyLevel.HIGH, MedicationStatus.DUE),
            (4, "Alteplase", "0.9 mg/kg", "IV", "Once", 0, UrgencyLevel.CRITICAL, MedicationStatus.ADMINISTERED),
            (4, "Atorvastatin", "80 mg", "Oral", "Daily", 240, UrgencyLevel.LOW, MedicationStatus.PENDING),
            (5, "Ceftriaxone", "1 g", "IV", "Daily", 90, UrgencyLevel.MEDIUM, MedicationStatus.PENDING),
            (5, "Azithromycin", "500 mg", "Oral", "Daily", 90, UrgencyLevel.MEDIUM, MedicationStatus.PENDING),
            (6, "Furosemide", "40 mg", "IV", "BID", 20, UrgencyLevel.HIGH, MedicationStatus.DUE),
            (6, "Lisinopril", "10 mg", "Oral", "Daily", 180, UrgencyLevel.LOW, MedicationStatus.PENDING),
            (7, "Ondansetron", "4 mg", "IV", "Q6H PRN", 30, UrgencyLevel.LOW, MedicationStatus.PENDING),
        ]

        for p_idx, drug, dose, route, freq, offset_min, urgency, status in meds_data:
            scheduled = now + timedelta(minutes=offset_min)
            administered = scheduled - timedelta(minutes=5) if status == MedicationStatus.ADMINISTERED else None
            med = Medication(
                patient_id=patients[p_idx].id,
                drug_name=drug,
                dosage=dose,
                route=route,
                frequency=freq,
                scheduled_time=scheduled,
                administered_time=administered,
                administered_by_id=aditi.id if administered else None,
                urgency=urgency,
                priority_score={
                    UrgencyLevel.CRITICAL: 0.95,
                    UrgencyLevel.HIGH: 0.75,
                    UrgencyLevel.MEDIUM: 0.50,
                    UrgencyLevel.LOW: 0.25,
                    UrgencyLevel.ROUTINE: 0.10,
                }[urgency],
                priority_reasoning=f"Urgency {urgency.value} based on NEWS2, diagnosis, and time-critical window.",
                status=status,
                interaction_warnings=[],
                allergy_flag=False,
                duplicate_flag=False,
            )
            db.add(med)

        # ===== ALERTS =====
        alerts_data = [
            (0, AlertType.DETERIORATION, AlertSeverity.CRITICAL, "Respiratory Decline — Bed 7",
             "RR ↑ from 18 → 24/min over 45 min. SpO2 92% on 4L O2. Consider escalation.",
             "Trend consistent with worsening COPD. NEWS2=7 (Red Zone).",
             ["Vitals trend", "Diagnosis: COPD", "Recent bronchodilator response poor"],
             ["Reassess in 15 min", "Notify attending", "Consider BiPAP"]),
            (2, AlertType.NEWS2_ESCALATION, AlertSeverity.URGENT, "NEWS2 Escalation — Bed 11",
             "Patient has NEWS2 = 6. Trigger sepsis bundle review.",
             "Two abnormal parameters persistent.",
             ["HR tachycardic", "Elevated lactate in last labs"],
             ["Lactate recheck in 1h", "Fluid bolus check"]),
            (0, AlertType.MEDICATION_OVERDUE, AlertSeverity.URGENT, "Albuterol Overdue — Bed 7",
             "Scheduled nebulizer 15 min overdue.",
             "Respiratory status worsening; delay may contribute.",
             ["Q4H schedule missed"],
             ["Administer now", "Reassess RR"]),
            (4, AlertType.FALL_RISK, AlertSeverity.URGENT, "Fall Risk High — Bed 14",
             "Camera detected bed-exit attempt at 14:22.",
             "Combined AI score 9.1 (Critical).",
             ["Stroke dx", "Left hemiparesis", "Attempted bed exit"],
             ["1-to-1 supervision", "Bed rails up", "Call light in reach"]),
            (3, AlertType.VITAL_ABNORMAL, AlertSeverity.ADVISORY, "Glucose Trend — Bed 5",
             "Glucose still elevated despite insulin drip titration.",
             "DKA management — monitor Q1H.",
             ["Glucose 312 mg/dL"],
             ["Check anion gap", "Verify drip rate"]),
        ]

        for p_idx, atype, sev, title, msg, reasoning, factors, actions in alerts_data:
            a = Alert(
                patient_id=patients[p_idx].id,
                assigned_nurse_id=aditi.id,
                alert_type=atype,
                severity=sev,
                status=AlertStatus.ACTIVE,
                title=title,
                message=msg,
                clinical_reasoning=reasoning,
                contributing_factors=factors,
                suggested_actions=actions,
                escalation_level=0,
            )
            db.add(a)

        # ===== FALL RISK ASSESSMENTS =====
        for p in patients:
            level = (
                RiskLevel.CRITICAL if p.fall_risk_score >= 8
                else RiskLevel.HIGH if p.fall_risk_score >= 5
                else RiskLevel.MODERATE if p.fall_risk_score >= 3
                else RiskLevel.LOW
            )
            fa = FallRiskAssessment(
                patient_id=p.id,
                score=p.fall_risk_score,
                previous_score=max(0.0, p.fall_risk_score - 1.2),
                risk_level=level,
                source=AssessmentSource.AI_COMBINED,
                contributing_factors={
                    "age": 0.20,
                    "medication_effects": 0.25,
                    "mobility_event": 0.30 if p.fall_risk_score >= 7 else 0.10,
                    "history": 0.15,
                    "cognition": 0.10,
                },
                recommended_interventions=(
                    ["1_to_1_supervision", "bed_rails_up", "call_light_check"]
                    if level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
                    else ["call_light_check", "reposition"]
                ),
                mobility_event_detected=p.fall_risk_score >= 8,
                mobility_event_type="bed_exit_attempt" if p.fall_risk_score >= 8 else None,
            )
            db.add(fa)

        # ===== HANDOFFS =====
        for i, p in enumerate(patients[:3]):
            h = Handoff(
                patient_id=p.id,
                outgoing_nurse_id=aditi.id,
                incoming_nurse_id=amelia.id,
                situation=f"{p.first_name} {p.last_name} admitted for {p.primary_diagnosis}.",
                background=f"PMH significant. Allergies: {', '.join(p.allergies) if p.allergies else 'NKDA'}.",
                assessment=f"Current NEWS2 {p.news2_score}. Acuity {p.acuity_score}. Fall risk score {p.fall_risk_score}.",
                recommendation="Continue monitoring Q1H vitals; titrate per protocol; escalate if NEWS2 ≥ 7.",
                ai_generated_situation="AI draft identical to current situation field.",
                ai_generated_background="AI draft from chart review.",
                ai_generated_assessment="AI summary of vitals & trends.",
                ai_generated_recommendation="Standard shift plan.",
                status=HandoffStatus.PENDING_REVIEW if i == 0 else HandoffStatus.DRAFT,
                outgoing_signed=False,
                incoming_signed=False,
                shift_date=now,
            )
            db.add(h)

        # ===== VOICE NOTES =====
        voice_notes_data = [
            (0, "Patient reports increased shortness of breath since morning. Placed on 4L nasal cannula. SpO2 improved from 89 to 93. Will notify RT.",
             {"symptoms": ["shortness of breath"], "interventions": ["O2 4L"], "outcomes": ["SpO2 89→93"]}),
            (2, "Lactate drawn. Foley output 30 mL last hour. Will push 500 mL NS bolus per sepsis protocol.",
             {"actions": ["lactate draw", "fluid bolus"], "values": {"urine_output_ml": 30}}),
            (4, "Patient attempted to get OOB unassisted. Redirected, bed alarm activated, family at bedside.",
             {"events": ["bed_exit_attempt"], "interventions": ["bed_alarm", "family_present"]}),
        ]
        for p_idx, transcript, structured in voice_notes_data:
            vn = VoiceNote(
                patient_id=patients[p_idx].id,
                nurse_id=aditi.id,
                audio_file_path=f"/uploads/voice-notes/seed-{uuid.uuid4()}.webm",
                duration_seconds=22.5,
                transcript=transcript,
                structured_data=structured,
                actionable_items=structured.get("actions", []),
                flagged_concerns=[],
                transcribed_at=now,
            )
            db.add(vn)

        await db.commit()
        print("✅ Database seeded successfully.")
        print("   Login credentials (all accounts): Password123!")
        print("   - aditi@gmail.com           (nurse — primary demo user)")
        print("   - priya.rn@hospital.com     (nurse)")
        print("   - marcus.rn@hospital.com    (charge nurse)")
        print("   - amelia.rn@hospital.com    (nurse)")
        print("   - director@hospital.com     (nursing director)")
        print("   - pharma@hospital.com       (pharmacist)")
        print("   - admin@hospital.com        (admin)")


if __name__ == "__main__":
    asyncio.run(seed())
