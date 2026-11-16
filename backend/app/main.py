"""CivicLens AI — Main FastAPI Application Entrypoint
From Citizen Complaints to Civic Intelligence.
Developed by Team VisionX.
"""

from fastapi import FastAPI
from app.core.config import config
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time

from app.api.v1.router import api_v1_router
from app.data.seeds import seed_database
from app.core.database import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure high-fidelity seed data is initialized
    seed_database()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title="CivicLens AI",
    description="AI-Powered Urban Civic Issue Mapping, Reporting & Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for development and demonstration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 master router
app.include_router(api_v1_router)


@app.get("/api/v1/health", tags=["System Health"])
@app.get("/health", tags=["System Health"])
def health_check():
    """System health check and diagnostic inspection."""
    return {
        "status": "operational",
        "service": "CivicLens AI Intelligence Core",
        "version": "1.0.0",
        "team": "VisionX",
        "database_records": {
            "issues": len(db.issues),
            "citizen_reports": len(db.reports),
            "audit_events": len(db.audit_events)
        },
        "ai_subsystems": {
            "nlp_classifier": "active",
            "duplicate_detection": "active",
            "priority_scoring_engine": "active",
            "routing_engine": "active",
            "spatio_temporal_recurrence": "active",
            "resolution_verifier": "active",
            "genai_assistant": "active"
        },
        "server_time_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

