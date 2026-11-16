"""CivicLens AI — Authentication and Authorization Domain Models
Defines user accounts, role-based access permissions, sessions, invitations,
and credentials schemas for Pune Municipal governance platform.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


class RoleEnum(str, Enum):
    CITIZEN = "citizen"
    MUNICIPAL_OPERATOR = "operator"
    QUALITY_REVIEWER = "reviewer"
    CIVIC_ADMINISTRATOR = "admin"


class AccountStatus(str, Enum):
    ACTIVE = "active"
    INVITED = "invited"
    DEACTIVATED = "deactivated"
    LOCKED = "locked"


class Permission(str, Enum):
    # Citizen permissions
    REPORT_SUBMIT = "report:submit"
    REPORT_CONFIRM = "report:confirm"
    REPORT_TRACK = "report:track"
    FEEDBACK_SUBMIT = "feedback:submit"

    # Municipal Operator permissions
    ISSUE_TRIAGE = "issue:triage"
    ISSUE_ASSIGN = "issue:assign"
    ISSUE_PROGRESS = "issue:progress"
    ISSUE_NOTES = "issue:notes"
    EVIDENCE_UPLOAD = "evidence:upload"

    # Quality Reviewer permissions
    VERIFY_INSPECT = "verify:inspect"
    VERIFY_APPROVE = "verify:approve"
    VERIFY_REJECT = "verify:reject"

    # Civic Administrator permissions
    ADMIN_USERS_MANAGE = "admin:users_manage"
    ADMIN_SYSTEM_CONFIG = "admin:system_config"
    ADMIN_AUDIT_VIEW = "admin:audit_view"
    ADMIN_ANALYTICS_FULL = "admin:analytics_full"
    ADMIN_OVERRIDE = "admin:override"


ROLE_PERMISSIONS: Dict[RoleEnum, List[Permission]] = {
    RoleEnum.CITIZEN: [
        Permission.REPORT_SUBMIT,
        Permission.REPORT_CONFIRM,
        Permission.REPORT_TRACK,
        Permission.FEEDBACK_SUBMIT,
    ],
    RoleEnum.MUNICIPAL_OPERATOR: [
        Permission.REPORT_TRACK,
        Permission.ISSUE_TRIAGE,
        Permission.ISSUE_ASSIGN,
        Permission.ISSUE_PROGRESS,
        Permission.ISSUE_NOTES,
        Permission.EVIDENCE_UPLOAD,
    ],
    RoleEnum.QUALITY_REVIEWER: [
        Permission.REPORT_TRACK,
        Permission.VERIFY_INSPECT,
        Permission.VERIFY_APPROVE,
        Permission.VERIFY_REJECT,
    ],
    RoleEnum.CIVIC_ADMINISTRATOR: [
        Permission.REPORT_SUBMIT,
        Permission.REPORT_CONFIRM,
        Permission.REPORT_TRACK,
        Permission.FEEDBACK_SUBMIT,
        Permission.ISSUE_TRIAGE,
        Permission.ISSUE_ASSIGN,
        Permission.ISSUE_PROGRESS,
        Permission.ISSUE_NOTES,
        Permission.EVIDENCE_UPLOAD,
        Permission.VERIFY_INSPECT,
        Permission.VERIFY_APPROVE,
        Permission.VERIFY_REJECT,
        Permission.ADMIN_USERS_MANAGE,
        Permission.ADMIN_SYSTEM_CONFIG,
        Permission.ADMIN_AUDIT_VIEW,
        Permission.ADMIN_ANALYTICS_FULL,
        Permission.ADMIN_OVERRIDE,
    ],
}


class UserRecord(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    password_hash: str
    salt: str
    role: RoleEnum
    status: AccountStatus = AccountStatus.ACTIVE
    employee_id: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    jurisdiction_ward: Optional[str] = None  # Specific Pune ward or 'ALL'
    designation: Optional[str] = None
    locality: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None
    failed_attempts: int = 0
    locked_until: Optional[datetime] = None
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None

    def has_permission(self, perm: Permission) -> bool:
        if self.status != AccountStatus.ACTIVE:
            return False
        perms = ROLE_PERMISSIONS.get(self.role, [])
        return perm in perms


class AccountInvitation(BaseModel):
    id: str
    email: str
    name: str
    role: RoleEnum
    employee_id: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    jurisdiction_ward: Optional[str] = None
    designation: Optional[str] = None
    invite_token: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    created_by: str
    used_at: Optional[datetime] = None


class AuthSession(BaseModel):
    token: str
    user_id: str
    role: RoleEnum
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None


# API Schemas

class CitizenRegisterRequest(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = None
    password: str
    locality: str
    consent_terms: bool = True


class LoginRequest(BaseModel):
    identifier: str  # Email, Mobile, or Employee ID
    password: str
    role: Optional[RoleEnum] = None
    otp_code: Optional[str] = None
    mfa_code: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    role: RoleEnum
    status: AccountStatus
    employee_id: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    jurisdiction_ward: Optional[str] = None
    designation: Optional[str] = None
    locality: Optional[str] = None
    permissions: List[str]
    created_at: datetime
    last_login_at: Optional[datetime] = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
    message: str


class InviteUserRequest(BaseModel):
    email: str
    name: str
    role: RoleEnum
    employee_id: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    jurisdiction_ward: Optional[str] = None
    designation: str


class ActivateInviteRequest(BaseModel):
    invite_token: str
    password: str
    name: Optional[str] = None


class PasswordResetRequest(BaseModel):
    identifier: str


class PasswordResetConfirmRequest(BaseModel):
    reset_token: str
    new_password: str
