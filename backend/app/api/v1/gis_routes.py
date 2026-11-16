"""CivicLens AI — GIS and Geospatial API Routes
Provides geospatial points, bounding box queries, and real-time calculated heatmap layers.
"""

from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
from app.models.domain import CivicIssue, IssueCategory, IssueStatus, PriorityLevel
from app.core.database import db
from app.services.spatial_service import haversine_distance_meters

router = APIRouter(prefix="/map", tags=["Geospatial & GIS"])


@router.get("/issues")
def get_map_issues(
    category: Optional[IssueCategory] = None,
    status: Optional[IssueStatus] = None,
    priority: Optional[PriorityLevel] = None,
    ward: Optional[str] = None,
    locality: Optional[str] = None
):
    """Returns geospatial issue points formatted for Leaflet interactive mapping."""
    issues = db.get_all_issues()

    if category:
        issues = [i for i in issues if i.category == category]
    if status:
        issues = [i for i in issues if i.status == status]
    if priority:
        issues = [i for i in issues if i.priority.priority_level == priority]
    if ward:
        issues = [i for i in issues if ward.lower() in i.location.ward.lower()]
    if locality:
        issues = [i for i in issues if locality.lower() in i.location.locality.lower()]

    points = []
    for iss in issues:
        points.append({
            "id": iss.id,
            "issue_code": iss.issue_code,
            "title": iss.title,
            "category": iss.category.value,
            "status": iss.status.value,
            "priority": iss.priority.priority_level.value,
            "priority_score": iss.priority.raw_score,
            "latitude": iss.location.latitude,
            "longitude": iss.location.longitude,
            "address": iss.location.address,
            "locality": iss.location.locality,
            "ward": iss.location.ward,
            "reports_count": iss.reports_count,
            "is_recurring": iss.is_recurring,
            "created_at": iss.created_at.isoformat(),
            "department": iss.assigned_department_name
        })

    return {
        "count": len(points),
        "center": {"lat": 18.5204, "lng": 73.8567},
        "issues": points
    }


@router.get("/heatmap")
def get_heatmap_layer(
    category: Optional[IssueCategory] = None,
    priority: Optional[PriorityLevel] = None
):
    """Calculates weighted intensity points for GIS density heatmap based on live data and priority."""
    issues = db.get_all_issues()

    if category:
        issues = [i for i in issues if i.category == category]
    if priority:
        issues = [i for i in issues if i.priority.priority_level == priority]

    # Calculate weight: normalized between 0.3 and 1.0 based on priority raw score + confirmations
    intensity_points = []
    for iss in issues:
        weight = min(1.0, max(0.3, iss.priority.raw_score / 100.0))
        if iss.is_recurring:
            weight = min(1.0, weight + 0.2)
        intensity_points.append([
            iss.location.latitude,
            iss.location.longitude,
            round(weight, 2)
        ])

    return {
        "point_count": len(intensity_points),
        "points": intensity_points
    }
