"""CivicLens AI — Municipal Departments API Routes
Lists registered municipal authorities, active crew capacities, and SLAs.
"""

from fastapi import APIRouter
from typing import List
from app.models.domain import Department
from app.services.routing_service import routing_service

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=List[Department])
def list_departments():
    return routing_service.list_departments()
