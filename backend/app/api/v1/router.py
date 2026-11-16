"""CivicLens AI — v1 Master API Router
Consolidates authentication, citizen reports, issue management, AI inference, GIS, and analytics.
"""

from fastapi import APIRouter
from app.api.v1.auth_routes import router as auth_router
from app.api.v1.reports_routes import router as reports_router
from app.api.v1.issues_routes import router as issues_router
from app.api.v1.ai_routes import router as ai_router
from app.api.v1.gis_routes import router as gis_router
from app.api.v1.analytics_routes import router as analytics_router
from app.api.v1.department_routes import router as department_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(issues_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(gis_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(department_router)
