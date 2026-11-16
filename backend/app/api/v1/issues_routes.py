"""CivicLens AI — Issue Lifecycle & Management API Routes
Handles filtered querying, strictly validated state transitions,
department dispatching, evidence review, and verification.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import uuid
from datetime import datetime
from app.models.domain import (
    CivicIssue, IssueStatus, IssueCategory, PriorityLevel,
    EvidenceAttachment, EvidenceType, UserRole
)
from app.models.schemas import (
    IssueStatusUpdateRequest, IssueAssignRequest,
    EvidenceUploadRequest, VerificationReviewRequest,
    FeedbackSubmitRequest, ConfirmationRequest
)
from app.core.database import db
from app.services.routing_service import routing_service
from app.services.verification_service import verification_service
from app.services.priority_service import priority_engine

router = APIRouter(prefix="/issues", tags=["Civic Issues"])


@router.get("", response_model=List[CivicIssue])
def list_issues(
    category: Optional[IssueCategory] = None,
    status: Optional[IssueStatus] = None,
    priority: Optional[PriorityLevel] = None,
    ward: Optional[str] = None,
    locality: Optional[str] = None,
    is_recurring: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 100
):
    """Retrieves consolidated civic issues with multi-dimensional filtering."""
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
    if is_recurring is not None:
        issues = [i for i in issues if i.is_recurring == is_recurring]
    if search:
        q = search.lower()
        issues = [
            i for i in issues
            if q in i.title.lower() or q in i.description.lower()
            or q in i.issue_code.lower() or q in i.location.address.lower()
        ]

    # Sort critical and high priority first, then newest
    priority_weights = {
        PriorityLevel.CRITICAL: 4,
        PriorityLevel.HIGH: 3,
        PriorityLevel.MEDIUM: 2,
        PriorityLevel.LOW: 1
    }
    issues.sort(
        key=lambda x: (priority_weights.get(x.priority.priority_level, 0), x.created_at),
        reverse=True
    )
    return issues[:limit]


@router.get("/{identifier}", response_model=CivicIssue)
def get_issue(identifier: str):
    issue = db.get_issue(identifier) or db.get_issue_by_code(identifier)
    if not issue:
        raise HTTPException(status_code=404, detail="Civic issue not found")
    return issue


@router.post("/{identifier}/status", response_model=CivicIssue)
def update_status(identifier: str, req: IssueStatusUpdateRequest):
    """Enforces server-side validated lifecycle state machine transitions with RBAC checks."""
    if req.role == UserRole.CITIZEN:
        raise HTTPException(
            status_code=403,
            detail="Citizens are strictly restricted from directly modifying official complaint status."
        )

    issue = db.get_issue(identifier) or db.get_issue_by_code(identifier)
    if not issue:
        raise HTTPException(status_code=404, detail="Civic issue not found")

    success, msg, updated = db.update_issue_status(
        issue_id=issue.id,
        to_status=req.to_status,
        reason=req.reason,
        changed_by=req.changed_by,
        role=req.role
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return updated


@router.post("/{identifier}/assign", response_model=CivicIssue)
def assign_department(identifier: str, req: IssueAssignRequest):
    """Dispatches issue to municipal department and zonal officer. Requires Operator or Administrator role."""
    if req.role == UserRole.CITIZEN:
        raise HTTPException(status_code=403, detail="Citizens cannot assign department workflows.")

    issue = db.get_issue(identifier) or db.get_issue_by_code(identifier)
    if not issue:
        raise HTTPException(status_code=404, detail="Civic issue not found")

    dept = routing_service.get_department_by_id(req.department_id)
    if not dept:
        raise HTTPException(status_code=400, detail="Invalid department ID")

    success, msg, updated = db.assign_issue(
        issue_id=issue.id,
        department=dept,
        officer=req.assigned_officer or "Zonal Field Squad",
        changed_by=req.changed_by,
        role=req.role,
        notes=req.notes
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return updated


@router.post("/{identifier}/evidence", response_model=CivicIssue)
def submit_evidence(identifier: str, req: EvidenceUploadRequest):
    """Uploads remediation or original photographic proof."""
    issue = db.get_issue(identifier) or db.get_issue_by_code(identifier)
    if not issue:
        raise HTTPException(status_code=404, detail="Civic issue not found")

    attachment = EvidenceAttachment(
        id=f"evi-{uuid.uuid4().hex[:6]}",
        evidence_type=req.evidence_type,
        file_url=req.file_url,
        description=req.description,
        uploaded_by=req.uploaded_by,
        uploaded_at=datetime.utcnow()
    )

    success, msg, updated = db.add_evidence(issue.id, attachment)
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return updated


@router.post("/{identifier}/verify", response_model=CivicIssue)
def verify_issue_resolution(identifier: str, req: VerificationReviewRequest):
    """Authoritative review step for completed municipal works.
    Reviewer approves or rejects remediation evidence.
    """
    issue = db.get_issue(identifier) or db.get_issue_by_code(identifier)
    if not issue:
        raise HTTPException(status_code=404, detail="Civic issue not found")

    if issue.status != IssueStatus.AWAITING_VERIFICATION:
        raise HTTPException(
            status_code=400,
            detail=f"Issue cannot be verified from state '{issue.status.value}'. Must be 'awaiting_verification'."
        )

    if req.approved:
        to_status = IssueStatus.RESOLVED
        reason = f"Resolution proof inspected and approved by {req.reviewer_name}. Remarks: {req.notes}"
    else:
        to_status = IssueStatus.IN_PROGRESS
        reason = f"Resolution proof rejected by {req.reviewer_name}. Returned to field crew. Remarks: {req.notes}"

    success, msg, updated = db.update_issue_status(
        issue_id=issue.id,
        to_status=to_status,
        reason=reason,
        changed_by=req.reviewer_name,
        role=UserRole.REVIEWER
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return updated


@router.post("/{identifier}/confirm")
def community_confirmation(identifier: str, req: ConfirmationRequest):
    """Allows local residents to confirm/upvote an active civic issue."""
    issue = db.get_issue(identifier) or db.get_issue_by_code(identifier)
    if not issue:
        raise HTTPException(status_code=404, detail="Civic issue not found")

    success, count = db.add_community_confirmation(issue.id, req.user_id)
    # Recalculate priority with increased citizen intensity
    issue.priority = priority_engine.calculate_priority(
        category=issue.category,
        title=issue.title,
        description=issue.description,
        latitude=issue.location.latitude,
        longitude=issue.location.longitude,
        report_count=issue.reports_count,
        confirmations=count,
        evidence_count=len(issue.evidence),
        hours_open=(datetime.utcnow() - issue.created_at).total_seconds() / 3600.0
    )

    return {
        "success": True,
        "issue_id": issue.id,
        "confirmations": count,
        "updated_priority_score": issue.priority.raw_score,
        "priority_level": issue.priority.priority_level.value
    }


@router.post("/{identifier}/feedback", response_model=CivicIssue)
def submit_citizen_feedback(identifier: str, req: FeedbackSubmitRequest):
    """Allows citizens to rate the quality of resolution once issue is resolved."""
    issue = db.get_issue(identifier) or db.get_issue_by_code(identifier)
    if not issue:
        raise HTTPException(status_code=404, detail="Civic issue not found")

    if issue.status != IssueStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Feedback can only be submitted for resolved issues")

    issue.citizen_feedback_rating = req.rating
    issue.citizen_feedback_comment = req.comment
    issue.updated_at = datetime.utcnow()

    # If citizen gives 1-star rating with complaint, flag for reopening review
    if req.rating <= 1:
        db.record_audit(
            entity_name="CivicIssue",
            entity_id=issue.id,
            action="CITIZEN_DISSATISFACTION_ALERT",
            actor=req.citizen_name or "Citizen",
            actor_role=UserRole.CITIZEN,
            metadata={"rating": req.rating, "comment": req.comment}
        )

    return issue
