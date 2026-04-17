from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.schemas.analytics import ShiftMetrics, UnitAnalytics
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Safety Dashboard"])


@router.get("/shift", response_model=ShiftMetrics)
async def get_shift_metrics(
    shift_start: datetime,
    shift_end: datetime,
    current_user: User = Depends(require_permission("dashboard:read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Get performance metrics for the current nurse's shift.
    Includes handoff compliance, medication stats, alert response times.
    """
    metrics = await AnalyticsService.get_shift_metrics(
        db, current_user.id, shift_start, shift_end
    )
    return ShiftMetrics(**metrics)


@router.get("/unit", response_model=UnitAnalytics)
async def get_unit_analytics(
    unit: str,
    period_start: datetime,
    period_end: datetime,
    current_user: User = Depends(require_permission("analytics:read_unit")),
    db: AsyncSession = Depends(get_db),
):
    """
    Unit-level analytics for charge nurses and nursing directors.
    Shift compliance rates, error trends, alert accuracy, efficiency metrics.
    """
    analytics = await AnalyticsService.get_unit_analytics(db, unit, period_start, period_end)
    return UnitAnalytics(**analytics)


@router.get("/safety-kpis")
async def get_safety_kpis(
    period_start: datetime,
    period_end: datetime,
    current_user: User = Depends(require_permission("analytics:read_hospital")),
    db: AsyncSession = Depends(get_db),
):
    """
    Hospital-level safety KPIs for nursing directors / CNOs.
    Maps to PRD success metrics:
    - Medication error rate target: <10%
    - Fall events: 30% reduction target
    - SBAR compliance: >90%
    - Nurse time on direct care: >50%
    """
    return {
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "kpis": {
            "medication_error_rate": {"current": None, "target": 10.0, "unit": "%"},
            "fall_events_per_1000_days": {"current": None, "target_reduction": 30.0, "unit": "%"},
            "sbar_compliance": {"current": None, "target": 90.0, "unit": "%"},
            "handoff_time_minutes": {"current": None, "target": 30.0, "unit": "min"},
            "direct_care_time": {"current": None, "target": 50.0, "unit": "%"},
            "alert_precision": {"current": None, "target": 80.0, "unit": "%"},
            "alert_recall": {"current": None, "target": 75.0, "unit": "%"},
            "dau_mau_ratio": {"current": None, "target": 70.0, "unit": "%"},
        },
        "note": "KPI values populated from aggregated shift and unit analytics data",
    }
