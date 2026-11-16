"""CivicLens AI — Core Domain Models and Enums
Defines the entities representing citizens, reports, consolidated civic issues,
spatial locations, department assignments, lifecycle transitions, and audit records.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    CITIZEN = "citizen"
    OPERATOR = "operator"
    REVIEWER = "reviewer"
    ADMIN = "admin"


class IssueCategory(str, Enum):
    ROADS_INFRASTRUCTURE = "roads_infrastructure"
    DRAINAGE_FLOODING = "drainage_flooding"
    SOLID_WASTE = "solid_waste"
    STREETLIGHTING = "streetlighting"
    WATER_SUPPLY = "water_supply"
    PUBLIC_PARKS = "public_parks"
    TRAFFIC_SIGNALS = "traffic_signals"
    OTHER = "other"


class IssueStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    AWAITING_VERIFICATION = "awaiting_verification"
    RESOLVED = "resolved"
    REOPENED = "reopened"
    REJECTED = "rejected"


class PriorityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EvidenceType(str, Enum):
    ORIGINAL = "original"
    RESOLUTION = "resolution"
    INSPECTION = "inspection"


class IssueLocation(BaseModel):
    address: str
    locality: str
    ward: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    landmark: Optional[str] = None


class EvidenceAttachment(BaseModel):
    id: str
    evidence_type: EvidenceType
    file_url: str
    description: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    confidence_score: Optional[float] = None
    verification_notes: Optional[str] = None


class StatusHistory(BaseModel):
    id: str
    from_status: Optional[IssueStatus] = None
    to_status: IssueStatus
    changed_by: str
    role: UserRole
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    reason: Optional[str] = None


class PriorityFactor(BaseModel):
    factor_name: str
    weight: float
    raw_value: float
    contribution_score: float
    explanation: str


class PriorityAssessment(BaseModel):
    raw_score: float  # 0.0 to 100.0
    priority_level: PriorityLevel
    factors: List[PriorityFactor]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    sla_deadline_hours: int
    overdue: bool = False


class DuplicateCandidate(BaseModel):
    candidate_id: str
    matched_issue_id: str
    matched_issue_title: str
    text_similarity: float  # 0.0 - 1.0
    distance_meters: float
    category_match: bool
    overall_confidence: float  # 0.0 - 1.0
    reason: str
    status: str = "pending"  # pending, confirmed, dismissed


class CivicReport(BaseModel):
    """An individual citizen grievance submission."""
    id: str
    tracking_code: str
    title: str
    description: str
    category: IssueCategory
    ai_suggested_category: Optional[IssueCategory] = None
    location: IssueLocation
    reported_by_name: str
    reported_by_contact: Optional[str] = None
    reported_by_user_id: str = "anon-citizen"
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    images: List[str] = []
    upvotes: int = 1
    upvoted_by_users: List[str] = []
    linked_issue_id: Optional[str] = None


class CivicIssue(BaseModel):
    """A consolidated municipal civic issue that may aggregate multiple citizen reports."""
    id: str
    issue_code: str
    title: str
    description: str
    category: IssueCategory
    category_human_verified: bool = False
    status: IssueStatus = IssueStatus.SUBMITTED
    priority: PriorityAssessment
    location: IssueLocation
    assigned_department_id: Optional[str] = None
    assigned_department_name: Optional[str] = None
    assigned_officer: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    sla_deadline: Optional[datetime] = None
    reports_count: int = 1
    linked_report_ids: List[str] = []
    status_history: List[StatusHistory] = []
    evidence: List[EvidenceAttachment] = []
    community_confirmations: int = 1
    duplicate_candidates: List[DuplicateCandidate] = []
    is_recurring: bool = False
    recurrence_count: int = 1
    recurrence_notes: Optional[str] = None
    citizen_feedback_rating: Optional[int] = None  # 1 to 5
    citizen_feedback_comment: Optional[str] = None


class Department(BaseModel):
    id: str
    name: str
    code: str
    categories_handled: List[IssueCategory]
    contact_email: str
    phone: str
    active_crew_count: int = 5
    sla_hours_default: int = 48


class AuditEvent(BaseModel):
    id: str
    entity_name: str
    entity_id: str
    action: str
    actor: str
    actor_role: UserRole
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}
