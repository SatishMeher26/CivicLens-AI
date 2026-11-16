"""CivicLens AI — API Request and Response Schemas
Pydantic schemas with strict validation for public and authority APIs.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from app.models.domain import (
    IssueCategory, IssueStatus, PriorityLevel, EvidenceType,
    UserRole, CivicReport, CivicIssue, Department, PriorityAssessment, DuplicateCandidate
)


class ReportCreateRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=150, description="Concise summary of the civic issue")
    description: str = Field(..., min_length=10, max_length=2000, description="Detailed explanation of the issue")
    category: Optional[IssueCategory] = Field(None, description="Optional category selected by citizen")
    address: str = Field(..., min_length=3, max_length=250)
    locality: str = Field(..., min_length=2, max_length=100)
    ward: str = Field(..., min_length=1, max_length=50)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    landmark: Optional[str] = None
    reported_by_name: str = Field("Concerned Citizen", min_length=2, max_length=100)
    reported_by_contact: Optional[str] = None
    images: List[str] = Field(default_factory=list, description="Base64 or image URLs representing evidence")


class ReportCreateResponse(BaseModel):
    report: CivicReport
    linked_issue: CivicIssue
    ai_classification: Dict[str, Any]
    duplicate_detection: Dict[str, Any]
    priority_calculation: PriorityAssessment
    department_recommendation: Dict[str, Any]
    message: str


class IssueStatusUpdateRequest(BaseModel):
    to_status: IssueStatus
    reason: str = Field(..., min_length=3, max_length=500)
    changed_by: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.OPERATOR


class IssueAssignRequest(BaseModel):
    department_id: str
    assigned_officer: Optional[str] = "Zone Duty Inspector"
    notes: Optional[str] = None
    changed_by: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.OPERATOR


class EvidenceUploadRequest(BaseModel):
    evidence_type: EvidenceType = EvidenceType.RESOLUTION
    file_url: str
    description: Optional[str] = None
    uploaded_by: str


class VerificationReviewRequest(BaseModel):
    approved: bool
    notes: str = Field(..., min_length=3, max_length=1000)
    reviewer_name: str = Field(..., min_length=2, max_length=100)


class FeedbackSubmitRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    citizen_name: Optional[str] = "Citizen"


class ConfirmationRequest(BaseModel):
    user_id: str = "anon-user"
    comment: Optional[str] = None


class AIClassifyRequest(BaseModel):
    title: str
    description: str
    locality: Optional[str] = None


class AIClassifyResponse(BaseModel):
    suggested_category: IssueCategory
    confidence: float
    explanation: str
    model_version: str
    alternative_categories: List[Dict[str, Any]] = []


class AIDuplicateRequest(BaseModel):
    title: str
    description: str
    category: IssueCategory
    latitude: float
    longitude: float


class AISummarizeRequest(BaseModel):
    issue_id: Optional[str] = None
    custom_text: Optional[str] = None
    summary_type: str = "executive"  # executive, citizen_friendly, operational


class DepartmentRuleUpdateRequest(BaseModel):
    category: IssueCategory
    department_id: str
    default_sla_hours: int
    auto_assign: bool = False
