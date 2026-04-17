import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Text, JSON, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mrn: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)  # Medical Record Number
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=True)
    room_number: Mapped[str] = mapped_column(String(20), nullable=True)
    bed_number: Mapped[str] = mapped_column(String(20), nullable=True)
    unit: Mapped[str] = mapped_column(String(100), nullable=True)
    hospital_id: Mapped[str] = mapped_column(String(100), nullable=True)

    # Clinical
    primary_diagnosis: Mapped[str] = mapped_column(Text, nullable=True)
    allergies: Mapped[dict] = mapped_column(JSON, nullable=True, default=list)
    acuity_score: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    fall_risk_score: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    news2_score: Mapped[int] = mapped_column(Integer, nullable=True, default=0)

    # Assignment
    assigned_nurse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    admission_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    discharge_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # FHIR
    fhir_patient_id: Mapped[str] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    assigned_nurse = relationship("User", foreign_keys=[assigned_nurse_id])
    vitals = relationship("Vital", back_populates="patient", order_by="desc(Vital.recorded_at)")
    medications = relationship("Medication", back_populates="patient")
    handoffs = relationship("Handoff", back_populates="patient")
    alerts = relationship("Alert", back_populates="patient")
    voice_notes = relationship("VoiceNote", back_populates="patient")
    fall_risk_assessments = relationship("FallRiskAssessment", back_populates="patient")


class Vital(Base):
    __tablename__ = "vitals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)

    heart_rate: Mapped[float] = mapped_column(Float, nullable=True)
    blood_pressure_systolic: Mapped[float] = mapped_column(Float, nullable=True)
    blood_pressure_diastolic: Mapped[float] = mapped_column(Float, nullable=True)
    respiratory_rate: Mapped[float] = mapped_column(Float, nullable=True)
    temperature: Mapped[float] = mapped_column(Float, nullable=True)
    spo2: Mapped[float] = mapped_column(Float, nullable=True)
    consciousness_level: Mapped[str] = mapped_column(String(20), nullable=True)  # AVPU scale

    source: Mapped[str] = mapped_column(String(50), nullable=True, default="manual")  # manual, monitor, fhir
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="vitals")
