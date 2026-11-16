"""CivicLens AI — Backend Unit & Integration Test Suite
Validates NLP classification, multi-signal duplicate detection, transparent priority scoring,
strict state transition rules, and end-to-end API workflows.
"""

import pytest
from app.models.domain import (
    IssueCategory, IssueStatus, PriorityLevel, UserRole, EvidenceType,
    EvidenceAttachment, IssueLocation
)
from app.services.classification_service import classifier_service
from app.services.duplicate_service import duplicate_service
from app.services.priority_service import priority_engine
from app.services.routing_service import routing_service
from app.services.recurrence_service import recurrence_service
from app.core.database import db
from app.models.schemas import ReportCreateRequest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


# ==============================================================================
# 1. AI CLASSIFICATION TESTS
# ==============================================================================

def test_classification_roads_pothole():
    res = classifier_service.classify(
        title="Huge pothole on main road",
        description="The crater is damaging motorcycle tires and causing accidents",
        locality="Baner"
    )
    assert res["suggested_category"] == IssueCategory.ROADS_INFRASTRUCTURE
    assert res["confidence"] >= 0.50
    assert "pothole" in res["explanation"].lower() or "roads" in res["explanation"].lower()


def test_classification_drainage_flooding():
    res = classifier_service.classify(
        title="Open manhole and sewer overflow",
        description="Waterlogging on street after rain, black sewage spreading",
        locality="Shivajinagar"
    )
    assert res["suggested_category"] == IssueCategory.DRAINAGE_FLOODING
    assert res["confidence"] >= 0.50


def test_classification_streetlighting():
    res = classifier_service.classify(
        title="Streetlight pole fused and dark street",
        description="The lamppost bulb is broken and street is completely dark at night",
        locality="Kothrud"
    )
    assert res["suggested_category"] == IssueCategory.STREETLIGHTING


def test_classification_ambiguous_fallback():
    res = classifier_service.classify(
        title="Something feels weird",
        description="General miscellaneous query without municipal keywords",
        locality="Unknown"
    )
    assert res["suggested_category"] == IssueCategory.OTHER
    assert res["confidence"] <= 0.40


# ==============================================================================
# 2. DUPLICATE CANDIDATE DETECTION TESTS
# ==============================================================================

def test_duplicate_detection_nearby_same_defect():
    # Issue at Baner High Street (18.5590, 73.7868)
    all_issues = db.get_all_issues()
    candidates = duplicate_service.find_duplicate_candidates(
        new_title="Severe pothole crater on main road",
        new_description="Large asphalt hole causing bikes to skid near junction",
        new_category=IssueCategory.ROADS_INFRASTRUCTURE,
        new_lat=18.5591,  # within 15 meters
        new_lng=73.7869,
        existing_issues=all_issues
    )
    assert len(candidates) >= 1
    assert candidates[0].distance_meters < 60.0
    assert candidates[0].category_match is True
    assert candidates[0].overall_confidence >= 0.60


def test_duplicate_detection_distant_different_location():
    # Test faraway location (e.g. 15km away)
    all_issues = db.get_all_issues()
    candidates = duplicate_service.find_duplicate_candidates(
        new_title="Severe pothole crater",
        new_description="Large asphalt hole",
        new_category=IssueCategory.ROADS_INFRASTRUCTURE,
        new_lat=18.7500,  # Far North
        new_lng=73.5000,
        existing_issues=all_issues
    )
    assert len(candidates) == 0  # Should NOT flag as duplicate


# ==============================================================================
# 3. TRANSPARENT PRIORITY SCORING TESTS
# ==============================================================================

def test_priority_scoring_critical_factors():
    # High risk drainage next to hospital with urgent keywords in Pune
    assessment = priority_engine.calculate_priority(
        category=IssueCategory.DRAINAGE_FLOODING,
        title="Open manhole emergency near hospital",
        description="Ambulance cannot pass, deep open manhole causing grave danger to elderly patients",
        latitude=18.5284,  # Sassoon General Hospital location
        longitude=73.8742,
        report_count=3,
        confirmations=5,
        evidence_count=2,
        hours_open=12.0
    )
    assert assessment.priority_level in [PriorityLevel.CRITICAL, PriorityLevel.HIGH]
    assert assessment.raw_score >= 65.0
    assert len(assessment.factors) == 6
    # Factor weights sum to 1.0 (25% + 20% + 20% + 15% + 10% + 10%)
    total_weight = sum(f.weight for f in assessment.factors)
    assert pytest.approx(total_weight, 0.01) == 1.0


def test_priority_scoring_low_risk():
    # Park bench with no urgent keywords and no nearby hospital
    assessment = priority_engine.calculate_priority(
        category=IssueCategory.PUBLIC_PARKS,
        title="Minor park bench paint peeled",
        description="Faded paint on wooden park bench",
        latitude=18.4905,
        longitude=73.8341,
        report_count=1,
        confirmations=1,
        evidence_count=0,
        hours_open=2.0
    )
    assert assessment.priority_level == PriorityLevel.LOW
    assert assessment.raw_score < 40.0


# ==============================================================================
# 4. DEPARTMENT ROUTING TESTS
# ==============================================================================

def test_routing_matrix():
    roads_dept = routing_service.recommend_department(IssueCategory.ROADS_INFRASTRUCTURE)
    assert roads_dept["department_id"] == "dept-roads"

    drain_dept = routing_service.recommend_department(IssueCategory.DRAINAGE_FLOODING)
    assert drain_dept["department_id"] == "dept-drainage"

    waste_dept = routing_service.recommend_department(IssueCategory.SOLID_WASTE)
    assert waste_dept["department_id"] == "dept-waste"


# ==============================================================================
# 5. STATE TRANSITION LIFECYCLE TESTS
# ==============================================================================

def test_state_transitions_valid_and_invalid():
    # Get any seeded issue currently in submitted or under_review
    issues = db.get_all_issues()
    target = next((i for i in issues if i.status == IssueStatus.SUBMITTED), None)
    if not target:
        target = issues[0]
        target.status = IssueStatus.SUBMITTED

    # Valid: SUBMITTED -> UNDER_REVIEW
    ok, msg, updated = db.update_issue_status(
        issue_id=target.id,
        to_status=IssueStatus.UNDER_REVIEW,
        reason="Triage in progress",
        changed_by="Operator Dave",
        role=UserRole.OPERATOR
    )
    assert ok is True
    assert updated.status == IssueStatus.UNDER_REVIEW

    # Invalid: UNDER_REVIEW -> RESOLVED (Illegal direct leap without completion/verification!)
    bad_ok, bad_msg, _ = db.update_issue_status(
        issue_id=target.id,
        to_status=IssueStatus.RESOLVED,
        reason="Skipping all stages",
        changed_by="Operator Dave",
        role=UserRole.OPERATOR
    )
    assert bad_ok is False
    assert "Illegal state transition" in bad_msg


# ==============================================================================
# 6. END-TO-END API INTEGRATION TEST
# ==============================================================================

def test_e2e_api_flow(client):
    # 1. Citizen reports issue via API
    payload = {
        "title": "Severe broken stormwater grate causing pedestrian fall risk",
        "description": "Metal grating over drainage channel has buckled and broken. Pedestrians could slip and injure themselves.",
        "category": "drainage_flooding",
        "address": "FC Road Junction 5",
        "locality": "Shivajinagar",
        "ward": "Ward 7 (Ghole Road)",
        "latitude": 18.5314,
        "longitude": 73.8446,
        "reported_by_name": "Test Citizen User",
        "reported_by_contact": "test.citizen@example.com",
        "images": ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600"]
    }
    create_res = client.post("/api/v1/reports", json=payload)
    assert create_res.status_code == 200
    data = create_res.json()
    assert "tracking_code" in data["report"]
    issue_id = data["linked_issue"]["id"]
    issue_code = data["linked_issue"]["issue_code"]

    # 2. Verify issue exists in issues list
    get_res = client.get(f"/api/v1/issues/{issue_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "submitted"

    # 3. Assign issue to Drainage Department
    assign_res = client.post(
        f"/api/v1/issues/{issue_id}/assign",
        json={
            "department_id": "dept-drainage",
            "assigned_officer": "Er. Anita Roy",
            "changed_by": "Senior Dispatcher",
            "role": "operator"
        }
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "assigned"

    # 4. Advance to In Progress
    prog_res = client.post(
        f"/api/v1/issues/{issue_id}/status",
        json={
            "to_status": "in_progress",
            "reason": "Engineering team deployed on-site",
            "changed_by": "Er. Anita Roy",
            "role": "operator"
        }
    )
    assert prog_res.status_code == 200
    assert prog_res.json()["status"] == "in_progress"

    # 5. Upload resolution evidence (triggers awaiting_verification)
    evi_res = client.post(
        f"/api/v1/issues/{issue_id}/evidence",
        json={
            "evidence_type": "resolution",
            "file_url": "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600",
            "description": "Installed reinforced steel drain grate and repaved curb.",
            "uploaded_by": "Field Crew Foreman"
        }
    )
    assert evi_res.status_code == 200
    assert evi_res.json()["status"] == "awaiting_verification"

    # 6. Authoritative Reviewer verifies and approves
    verify_res = client.post(
        f"/api/v1/issues/{issue_id}/verify",
        json={
            "approved": True,
            "notes": "Verified new grating adheres to municipal safety standards.",
            "reviewer_name": "Chief Zonal Auditor Sharma"
        }
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "resolved"

    # 7. Citizen submits satisfaction feedback
    feedback_res = client.post(
        f"/api/v1/issues/{issue_id}/feedback",
        json={
            "rating": 5,
            "comment": "Quick and clean repair. Sidewalk is safe again!",
            "citizen_name": "Test Citizen User"
        }
    )
    assert feedback_res.status_code == 200
    assert feedback_res.json()["citizen_feedback_rating"] == 5
