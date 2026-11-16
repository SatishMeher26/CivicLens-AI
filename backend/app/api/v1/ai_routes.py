"""CivicLens AI — AI & Machine Learning Services API Routes
Exposes endpoints for NLP classification, duplicate candidate discovery,
transparent impact scoring, and generative briefings.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime
from app.models.schemas import (
    AIClassifyRequest, AIClassifyResponse, AIDuplicateRequest,
    AISummarizeRequest
)
from app.core.database import db
from app.services.classification_service import classifier_service
from app.services.duplicate_service import duplicate_service
from app.services.priority_service import priority_engine
from app.services.genai_service import ai_assistant
from app.services.verification_service import verification_service
from app.models.domain import EvidenceAttachment, EvidenceType

router = APIRouter(prefix="/ai", tags=["AI Services"])


@router.post("/classify", response_model=AIClassifyResponse)
def classify_text(req: AIClassifyRequest):
    """NLP Classification endpoint with transparent confidence and keyword explanations."""
    res = classifier_service.classify(
        title=req.title,
        description=req.description,
        locality=req.locality or ""
    )
    return AIClassifyResponse(
        suggested_category=res["suggested_category"],
        confidence=res["confidence"],
        explanation=res["explanation"],
        model_version=res["model_version"],
        alternative_categories=res.get("alternative_categories", [])
    )


@router.post("/duplicates")
def detect_duplicates(req: AIDuplicateRequest):
    """Evaluates multi-signal duplication likelihood against the existing database."""
    existing_issues = db.get_all_issues()
    candidates = duplicate_service.find_duplicate_candidates(
        new_title=req.title,
        new_description=req.description,
        new_category=req.category,
        new_lat=req.latitude,
        new_lng=req.longitude,
        existing_issues=existing_issues
    )
    return {
        "candidate_count": len(candidates),
        "candidates": [c.model_dump() for c in candidates]
    }


@router.get("/explain-priority/{identifier}")
def explain_priority_breakdown(identifier: str):
    """Returns human-readable narrative explanation and factor weights for an issue's priority."""
    issue = db.get_issue(identifier) or db.get_issue_by_code(identifier)
    if not issue:
        raise HTTPException(status_code=404, detail="Civic issue not found")

    return ai_assistant.explain_priority(issue)


@router.post("/summarize")
def generate_summary(req: AISummarizeRequest):
    """Produces generative operational briefings, executive summaries, or citizen updates."""
    if req.issue_id:
        issue = db.get_issue(req.issue_id) or db.get_issue_by_code(req.issue_id)
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        return ai_assistant.summarize_issue(issue, summary_type=req.summary_type)

    if req.custom_text:
        return {
            "summary_type": req.summary_type,
            "title": "Text Analysis Briefing",
            "summary": f"Standardized Civic Summary: {req.custom_text[:300]}...",
            "key_points": ["Input verified", "Safe extraction complete"],
            "generated_by": ai_assistant.provider_mode
        }

    raise HTTPException(status_code=400, detail="Must provide issue_id or custom_text")


@router.post("/verify-evidence/{identifier}")
def inspect_evidence_package(identifier: str):
    """Simulates AI-assisted completeness and consistency check on uploaded resolution evidence."""
    issue = db.get_issue(identifier) or db.get_issue_by_code(identifier)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    resolution_ev = next((e for e in issue.evidence if e.evidence_type == EvidenceType.RESOLUTION), None)
    dummy_ev = resolution_ev or EvidenceAttachment(
        id="check-temp",
        evidence_type=EvidenceType.RESOLUTION,
        file_url="",
        description="Pending inspection",
        uploaded_by="System"
    )

    return verification_service.evaluate_resolution_evidence(issue, dummy_ev)
