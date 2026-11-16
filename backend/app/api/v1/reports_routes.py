"""CivicLens AI — Citizen Reports API Routes
Endpoints for submitting and tracking citizen grievances.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from app.models.domain import (
    CivicReport, CivicIssue, IssueLocation, IssueStatus,
    EvidenceAttachment, EvidenceType, UserRole
)
from app.models.schemas import (
    ReportCreateRequest, ReportCreateResponse, ConfirmationRequest
)
from app.core.database import db
from app.services.classification_service import classifier_service
from app.services.duplicate_service import duplicate_service
from app.services.priority_service import priority_engine
from app.services.routing_service import routing_service

router = APIRouter(prefix="/reports", tags=["Citizen Reports"])


@router.post("", response_model=ReportCreateResponse)
def submit_citizen_report(req: ReportCreateRequest):
    """Submits a new citizen civic grievance, executing the complete intelligence pipeline:
    Data Validation -> AI Classification -> Duplicate Detection -> Priority Assessment -> Routing.
    """
    report_id = f"rep-{uuid.uuid4().hex[:8]}"
    issue_id = f"iss-{uuid.uuid4().hex[:8]}"
    tracking_code = f"TRK-{datetime.utcnow().strftime('%Y%m%d')}-{report_id[-4:].upper()}"
    issue_code = f"CVL-{datetime.utcnow().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"

    # 1. AI-Assisted Classification
    ai_classification = classifier_service.classify(
        title=req.title,
        description=req.description,
        locality=req.locality
    )
    final_category = req.category or ai_classification["suggested_category"]

    location = IssueLocation(
        address=req.address,
        locality=req.locality,
        ward=req.ward,
        latitude=req.latitude,
        longitude=req.longitude,
        landmark=req.landmark
    )

    # 2. Duplicate Candidate Detection
    existing_issues = db.get_all_issues()
    duplicates = duplicate_service.find_duplicate_candidates(
        new_title=req.title,
        new_description=req.description,
        new_category=final_category,
        new_lat=req.latitude,
        new_lng=req.longitude,
        existing_issues=existing_issues
    )

    # 3. Transparent Priority Scoring
    priority = priority_engine.calculate_priority(
        category=final_category,
        title=req.title,
        description=req.description,
        latitude=req.latitude,
        longitude=req.longitude,
        report_count=1,
        confirmations=1,
        evidence_count=len(req.images),
        hours_open=0.0
    )

    # 4. Department Jurisdiction Routing
    dept_rec = routing_service.recommend_department(
        category=final_category,
        locality=req.locality,
        ward=req.ward
    )

    # 5. Persist Citizen Report
    report = CivicReport(
        id=report_id,
        tracking_code=tracking_code,
        title=req.title,
        description=req.description,
        category=final_category,
        ai_suggested_category=ai_classification["suggested_category"],
        location=location,
        reported_by_name=req.reported_by_name,
        reported_by_contact=req.reported_by_contact,
        submitted_at=datetime.utcnow(),
        images=req.images,
        upvotes=1,
        linked_issue_id=issue_id
    )
    db.add_report(report)

    # 6. Initialize Underlying Civic Issue
    evidence = []
    for idx, img in enumerate(req.images):
        evidence.append(
            EvidenceAttachment(
                id=f"evi-{uuid.uuid4().hex[:6]}",
                evidence_type=EvidenceType.ORIGINAL,
                file_url=img,
                description=f"Citizen evidence photo #{idx + 1}",
                uploaded_by=req.reported_by_name,
                uploaded_at=datetime.utcnow()
            )
        )

    calculated_deadline = datetime.utcnow() + timedelta(hours=priority.sla_deadline_hours)

    issue = CivicIssue(
        id=issue_id,
        issue_code=issue_code,
        title=req.title,
        description=req.description,
        category=final_category,
        category_human_verified=False,
        status=IssueStatus.SUBMITTED,
        priority=priority,
        location=location,
        assigned_department_id=dept_rec["department_id"],
        assigned_department_name=dept_rec["department_name"],
        assigned_officer=dept_rec["recommended_officer"],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        sla_deadline=calculated_deadline,
        reports_count=1,
        linked_report_ids=[report_id],
        status_history=[],
        evidence=evidence,
        community_confirmations=1,
        duplicate_candidates=duplicates,
        is_recurring=False
    )
    db.add_issue(issue)

    return ReportCreateResponse(
        report=report,
        linked_issue=issue,
        ai_classification=ai_classification,
        duplicate_detection={"candidates_count": len(duplicates), "candidates": [d.model_dump() for d in duplicates]},
        priority_calculation=priority,
        department_recommendation=dept_rec,
        message=f"Grievance recorded successfully. Tracking Code: {tracking_code}"
    )


@router.get("", response_model=List[CivicReport])
def list_reports(limit: int = 50):
    reports = list(db.reports.values())
    reports.sort(key=lambda r: r.submitted_at, reverse=True)
    return reports[:limit]


@router.get("/{identifier}", response_model=CivicReport)
def get_report_by_id_or_code(identifier: str):
    q = identifier.strip().lower()
    # Check by report ID or tracking code
    rep = db.get_report(identifier) or db.get_report_by_tracking(identifier)
    if rep:
        return rep
    # Also support searching by reporter contact phone/email
    for r in db.reports.values():
        if r.reported_by_contact and q in r.reported_by_contact.lower():
            return r
    raise HTTPException(status_code=404, detail="No citizen report found for this identifier or contact")
