import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, AlertStatus, AlertSeverity


class AlertService:
    """
    Manages clinical alerts with tiered escalation.
    Alerts escalate: nurse → charge nurse → attending after configurable deadlines.
    """

    ESCALATION_TIMEOUT_MINUTES = 3  # Per PRD: escalate after 3 minutes unacknowledged

    @staticmethod
    async def get_active_alerts(db: AsyncSession, nurse_id: uuid.UUID) -> list:
        result = await db.execute(
            select(Alert)
            .where(
                and_(
                    Alert.assigned_nurse_id == nurse_id,
                    Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ESCALATED]),
                )
            )
            .order_by(
                Alert.severity.desc(),
                Alert.created_at.desc(),
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_patient_alerts(db: AsyncSession, patient_id: uuid.UUID, include_resolved: bool = False) -> list:
        query = select(Alert).where(Alert.patient_id == patient_id)
        if not include_resolved:
            query = query.where(Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ESCALATED, AlertStatus.ACKNOWLEDGED]))
        result = await db.execute(query.order_by(desc(Alert.created_at)))
        return list(result.scalars().all())

    @staticmethod
    async def acknowledge_alert(db: AsyncSession, alert_id: uuid.UUID, user_id: uuid.UUID, notes: str = None) -> Alert:
        result = await db.execute(select(Alert).where(Alert.id == alert_id))
        alert = result.scalar_one_or_none()
        if not alert:
            raise ValueError("Alert not found")

        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_at = datetime.now(timezone.utc)
        alert.acknowledged_by_id = user_id
        if notes:
            alert.resolution_notes = notes
        await db.flush()
        return alert

    @staticmethod
    async def resolve_alert(db: AsyncSession, alert_id: uuid.UUID, user_id: uuid.UUID, notes: str = "") -> Alert:
        result = await db.execute(select(Alert).where(Alert.id == alert_id))
        alert = result.scalar_one_or_none()
        if not alert:
            raise ValueError("Alert not found")

        alert.status = AlertStatus.RESOLVED
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolution_notes = notes
        await db.flush()
        return alert

    @staticmethod
    async def check_escalations(db: AsyncSession) -> list:
        """Check for unacknowledged alerts past the escalation deadline and escalate them."""
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=AlertService.ESCALATION_TIMEOUT_MINUTES)

        result = await db.execute(
            select(Alert).where(
                and_(
                    Alert.status == AlertStatus.ACTIVE,
                    Alert.created_at <= cutoff,
                    Alert.escalation_level == 0,
                )
            )
        )
        alerts = list(result.scalars().all())

        escalated = []
        for alert in alerts:
            alert.status = AlertStatus.ESCALATED
            alert.escalation_level = 1
            alert.escalation_deadline = datetime.now(timezone.utc) + timedelta(minutes=AlertService.ESCALATION_TIMEOUT_MINUTES)
            escalated.append(alert)

        if escalated:
            await db.flush()

        return escalated
