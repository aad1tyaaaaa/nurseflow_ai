from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ShiftMetrics(BaseModel):
    total_patients: int
    total_handoffs: int
    handoffs_completed: int
    sbar_compliance_rate: float
    medications_administered: int
    medications_overdue: int
    alerts_triggered: int
    alerts_acknowledged: int
    avg_alert_response_time_seconds: Optional[float]
    fall_events: int
    fall_alerts_accuracy: Optional[float]


class UnitAnalytics(BaseModel):
    unit: str
    period_start: datetime
    period_end: datetime
    total_nurses: int
    total_patients: int
    medication_error_rate: float
    fall_rate_per_1000_patient_days: float
    avg_handoff_time_minutes: float
    sbar_compliance_rate: float
    alert_fatigue_score: float  # based on suppressed/ignored alerts
    nurse_satisfaction_score: Optional[float]


class SafetyDashboard(BaseModel):
    period_start: datetime
    period_end: datetime
    medication_errors: int
    near_misses: int
    fall_events: int
    fall_prevented: int
    deterioration_alerts_accurate: int
    deterioration_alerts_total: int
    compliance_metrics: Dict[str, float]
    trending_risks: List[Dict[str, Any]]
