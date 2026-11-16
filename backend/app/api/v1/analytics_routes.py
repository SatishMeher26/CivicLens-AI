"""CivicLens AI — Analytics and Recurrence Intelligence Routes
Calculates live operational metrics, department workloads,
and spatio-temporal chronic defect hotspots from the unified dataset.
"""

from fastapi import APIRouter
from typing import Dict, Any, List
from collections import Counter
from app.core.database import db
from app.models.domain import IssueStatus, PriorityLevel, IssueCategory
from app.services.recurrence_service import recurrence_service
from app.services.genai_service import ai_assistant

router = APIRouter(prefix="/analytics", tags=["Analytics & Intelligence"])


@router.get("/summary")
def get_analytics_summary():
    """Generates comprehensive municipal metrics derived from the live dataset."""
    issues = db.get_all_issues()
    total = len(issues)

    open_statuses = [
        IssueStatus.SUBMITTED, IssueStatus.UNDER_REVIEW,
        IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS,
        IssueStatus.REOPENED
    ]
    open_count = sum(1 for i in issues if i.status in open_statuses)
    resolved_count = sum(1 for i in issues if i.status == IssueStatus.RESOLVED)
    awaiting_verification = sum(1 for i in issues if i.status == IssueStatus.AWAITING_VERIFICATION)

    critical_count = sum(1 for i in issues if i.priority.priority_level == PriorityLevel.CRITICAL)
    high_count = sum(1 for i in issues if i.priority.priority_level == PriorityLevel.HIGH)
    overdue_count = sum(1 for i in issues if i.priority.overdue)
    recurring_count = sum(1 for i in issues if i.is_recurring)

    # Distributions
    by_category = Counter(i.category.value for i in issues)
    by_status = Counter(i.status.value for i in issues)
    by_priority = Counter(i.priority.priority_level.value for i in issues)
    by_ward = Counter(i.location.ward for i in issues)
    by_locality = Counter(i.location.locality for i in issues)
    by_department = Counter(i.assigned_department_name or "Unassigned" for i in issues)

    # Top locality and category for synthesis
    top_loc = by_locality.most_common(1)[0][0] if by_locality else "Central Zone"
    top_cat = by_category.most_common(1)[0][0].replace("_", " ").title() if by_category else "Infrastructure"

    metrics_dict = {
        "total_issues": total,
        "open_issues": open_count,
        "resolved_issues": resolved_count,
        "awaiting_verification": awaiting_verification,
        "critical_issues": critical_count,
        "high_priority_issues": high_count,
        "overdue_issues": overdue_count,
        "recurring_issues": recurring_count,
        "top_locality": top_loc,
        "top_category": top_cat
    }

    ai_digest = ai_assistant.generate_analytics_digest(metrics_dict)

    return {
        "metrics": metrics_dict,
        "distributions": {
            "by_category": [{"name": k.replace("_", " ").title(), "value": v, "key": k} for k, v in by_category.items()],
            "by_status": [{"name": k.replace("_", " ").title(), "value": v, "key": k} for k, v in by_status.items()],
            "by_priority": [{"name": k.upper(), "value": v, "key": k} for k, v in by_priority.items()],
            "by_ward": [{"name": k, "value": v} for k, v in by_ward.most_common(8)],
            "by_department": [{"name": k, "value": v} for k, v in by_department.items()]
        },
        "executive_digest": ai_digest
    }


@router.get("/recurring")
def get_recurring_analysis():
    """Returns detected recurring issue clusters and repeat failure hotspots."""
    issues = db.get_all_issues()
    hotspots = recurrence_service.detect_all_chronic_hotspots(issues)
    recurring_items = [i for i in issues if i.is_recurring]

    return {
        "hotspot_count": len(hotspots),
        "hotspots": hotspots,
        "recurring_issues": [
            {
                "id": i.id,
                "issue_code": i.issue_code,
                "title": i.title,
                "category": i.category.value,
                "locality": i.location.locality,
                "ward": i.location.ward,
                "recurrence_count": i.recurrence_count,
                "status": i.status.value,
                "notes": i.recurrence_notes or "Chronic repeat defect detected across consecutive quarters."
            }
            for i in recurring_items
        ]
    }
