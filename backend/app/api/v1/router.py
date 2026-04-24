from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.handoffs import router as handoffs_router
from app.api.v1.medications import router as medications_router
from app.api.v1.fall_risk import router as fall_risk_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.voice_notes import router as voice_notes_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.settings import router as settings_router
from app.api.v1.ai import router as ai_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(handoffs_router)
api_router.include_router(medications_router)
api_router.include_router(fall_risk_router)
api_router.include_router(alerts_router)
api_router.include_router(voice_notes_router)
api_router.include_router(dashboard_router)
api_router.include_router(analytics_router)
api_router.include_router(settings_router)
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
