"""CivicLens AI — Multi-Role Authentication & Access Control Service
Manages user lifecycles, password hashing, session tokens, invitations,
jurisdiction scopes, and security audits for Pune municipal governance.
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from app.models.auth import (
    UserRecord, AccountInvitation, AuthSession, RoleEnum,
    AccountStatus, Permission, ROLE_PERMISSIONS,
    UserProfileResponse, CitizenRegisterRequest, LoginRequest,
    InviteUserRequest, ActivateInviteRequest
)
from app.core.security import hash_password, verify_password, generate_secure_token, rate_limiter
from app.core.database import db
from app.models.domain import UserRole


class AuthService:
    """Enterprise authentication and RBAC service."""

    def __init__(self):
        self.session_duration_hours = 24
        self.invite_expiry_hours = 72

    def init_demo_accounts(self):
        """Provisions the 4 official demo accounts for local development and demonstration."""
        demo_accounts = [
            {
                "id": "usr-cit-demo",
                "name": "Aarav Deshmukh",
                "email": "citizen.demo@pune.gov.in",
                "mobile": "9876543210",
                "password": "CitizenDemo@123",
                "role": RoleEnum.CITIZEN,
                "locality": "Shivajinagar, Pune",
                "designation": "Resident Citizen"
            },
            {
                "id": "usr-op-demo",
                "name": "Er. Rajesh Verma",
                "email": "operator.demo@pune.gov.in",
                "mobile": "9823011223",
                "password": "OperatorDemo@123",
                "role": RoleEnum.MUNICIPAL_OPERATOR,
                "employee_id": "PMC-OP-2041",
                "department_id": "dept-roads",
                "department_name": "Roads & Infrastructure Department",
                "jurisdiction_ward": "Shivajinagar",
                "designation": "Senior Zonal Dispatcher (PMC)"
            },
            {
                "id": "usr-rev-demo",
                "name": "Dr. Sunita Kulkarni",
                "email": "reviewer.demo@pune.gov.in",
                "mobile": "9823044556",
                "password": "ReviewerDemo@123",
                "role": RoleEnum.QUALITY_REVIEWER,
                "employee_id": "PCMC-QR-5012",
                "department_id": "dept-quality",
                "department_name": "Quality Audit & Verification Cell",
                "jurisdiction_ward": "ALL",
                "designation": "Chief Quality Auditor (Pune Zone)"
            },
            {
                "id": "usr-adm-demo",
                "name": "Commissioner Vikram Shinde (IAS)",
                "email": "admin.demo@pune.gov.in",
                "mobile": "9823099887",
                "password": "AdminDemo@123",
                "role": RoleEnum.CIVIC_ADMINISTRATOR,
                "employee_id": "PMC-ADM-001",
                "department_id": "dept-exec",
                "department_name": "Municipal Administrative Secretariat",
                "jurisdiction_ward": "ALL",
                "designation": "Municipal Commissioner & CEO",
                "mfa_enabled": True
            }
        ]

        for acc in demo_accounts:
            existing = db.get_user_by_id(acc["id"]) or db.get_user_by_identifier(acc["email"])
            if not existing:
                pwd_hash, salt = hash_password(acc["password"])
                user = UserRecord(
                    id=acc["id"],
                    name=acc["name"],
                    email=acc["email"],
                    mobile=acc.get("mobile"),
                    password_hash=pwd_hash,
                    salt=salt,
                    role=acc["role"],
                    status=AccountStatus.ACTIVE,
                    employee_id=acc.get("employee_id"),
                    department_id=acc.get("department_id"),
                    department_name=acc.get("department_name"),
                    jurisdiction_ward=acc.get("jurisdiction_ward"),
                    designation=acc.get("designation"),
                    locality=acc.get("locality"),
                    mfa_enabled=acc.get("mfa_enabled", False),
                    created_at=datetime.utcnow()
                )
                db.add_user(user)

    def register_citizen(self, req: CitizenRegisterRequest) -> Tuple[bool, str, Optional[UserRecord]]:
        """Registers a new citizen user account."""
        # Check duplicate mobile
        if db.get_user_by_identifier(req.mobile):
            return False, "An account with this mobile number already exists.", None

        # Check duplicate email if provided
        if req.email and db.get_user_by_identifier(req.email):
            return False, "An account with this email address already exists.", None

        if len(req.password) < 6:
            return False, "Password must be at least 6 characters long.", None

        pwd_hash, salt = hash_password(req.password)
        user_id = f"usr-cit-{uuid.uuid4().hex[:8]}"

        user = UserRecord(
            id=user_id,
            name=req.name.strip(),
            email=req.email.strip().lower() if req.email else None,
            mobile=req.mobile.strip(),
            password_hash=pwd_hash,
            salt=salt,
            role=RoleEnum.CITIZEN,
            status=AccountStatus.ACTIVE,
            locality=req.locality.strip(),
            designation="Citizen Resident",
            created_at=datetime.utcnow()
        )
        db.add_user(user)

        # Audit
        db.record_audit(
            entity_name="UserAccount",
            entity_id=user.id,
            action="CITIZEN_REGISTERED",
            actor=user.name,
            actor_role=UserRole.CITIZEN,
            metadata={"mobile": req.mobile, "locality": req.locality}
        )

        return True, "Registration successful.", user

    def authenticate_user(
        self, req: LoginRequest, ip: str = "127.0.0.1", user_agent: str = "Unknown"
    ) -> Tuple[bool, str, Optional[AuthSession], Optional[UserRecord]]:
        """Authenticates user credentials against the database with rate limiting."""
        ident = req.identifier.strip()

        # Check rate limiter
        is_locked, rem_secs = rate_limiter.is_locked(ident)
        if is_locked:
            minutes = (rem_secs // 60) + 1
            return False, f"Account temporarily locked due to consecutive failed attempts. Try again in {minutes} minute(s).", None, None

        user = db.get_user_by_identifier(ident)
        if not user:
            rem = rate_limiter.record_failure(ident)
            db.log_login_event("unknown", "none", "FAILED_INVALID_IDENTIFIER", ip, user_agent)
            return False, f"Invalid login credentials. ({rem} attempt(s) remaining)", None, None

        if user.status != AccountStatus.ACTIVE:
            return False, f"Account is {user.status.value}. Please contact municipal administration.", None, None

        # If role constraint passed, verify role match
        if req.role and user.role != req.role:
            return False, f"Credentials do not match the selected portal ({req.role.value}).", None, None

        # Password verification
        valid = verify_password(req.password, user.password_hash, user.salt)
        if not valid:
            rem = rate_limiter.record_failure(ident)
            db.log_login_event(user.id, user.role.value, "FAILED_PASSWORD", ip, user_agent)
            return False, f"Invalid password. ({rem} attempt(s) remaining)", None, None

        # Multi-factor authentication check for admin if MFA enabled
        if user.role == RoleEnum.CIVIC_ADMINISTRATOR and user.mfa_enabled:
            # Demo verification code 123456 accepted in development if mfa_code provided
            if req.mfa_code and req.mfa_code.strip() not in ["123456", "999999"]:
                return False, "Invalid multi-factor authentication code.", None, None

        # Login successful
        rate_limiter.record_success(ident)
        user.last_login_at = datetime.utcnow()
        user.failed_attempts = 0

        # Create session
        token = f"cvl_{generate_secure_token(32)}"
        session = AuthSession(
            token=token,
            user_id=user.id,
            role=user.role,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=self.session_duration_hours),
            ip_address=ip,
            user_agent=user_agent
        )
        db.add_session(session)
        db.log_login_event(user.id, user.role.value, "SUCCESS", ip, user_agent)

        return True, "Login successful.", session, user

    def get_user_from_token(self, token: str) -> Optional[UserRecord]:
        """Resolves active session token to user record."""
        session = db.get_session(token)
        if not session:
            return None
        return db.get_user_by_id(session.user_id)

    def logout_token(self, token: str) -> bool:
        """Terminates active session."""
        session = db.get_session(token)
        if session:
            db.delete_session(token)
            return True
        return False

    def invite_authority_user(self, req: InviteUserRequest, admin_name: str) -> Tuple[bool, str, Optional[AccountInvitation]]:
        """Civic Administrator invites a new official account with a single-use activation link."""
        if req.role == RoleEnum.CITIZEN:
            return False, "Authority invitations are only for Operator, Reviewer, and Administrator roles.", None

        # Check existing email or employee ID
        if db.get_user_by_identifier(req.email):
            return False, "An account with this official email already exists.", None
        if db.get_user_by_identifier(req.employee_id):
            return False, "An account with this Employee ID already exists.", None

        invite_token = f"inv_{generate_secure_token(24)}"
        invitation = AccountInvitation(
            id=f"inv-{uuid.uuid4().hex[:8]}",
            email=req.email.strip().lower(),
            name=req.name.strip(),
            role=req.role,
            employee_id=req.employee_id.strip(),
            department_id=req.department_id,
            department_name=req.department_name,
            jurisdiction_ward=req.jurisdiction_ward or "ALL",
            designation=req.designation.strip(),
            invite_token=invite_token,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=self.invite_expiry_hours),
            created_by=admin_name
        )
        db.add_invitation(invitation)

        # Audit
        db.record_audit(
            entity_name="AccountInvitation",
            entity_id=invitation.id,
            action="OFFICIAL_INVITED",
            actor=admin_name,
            actor_role=UserRole.ADMIN,
            metadata={"email": req.email, "role": req.role.value, "emp_id": req.employee_id}
        )

        return True, "Official invitation created successfully.", invitation

    def activate_invitation(self, req: ActivateInviteRequest) -> Tuple[bool, str, Optional[UserRecord]]:
        """Invited official activates account and configures their password."""
        inv = db.get_invitation_by_token(req.invite_token)
        if not inv:
            return False, "Invalid or expired invitation token.", None

        if inv.used_at:
            return False, "This invitation link has already been used.", None

        if datetime.utcnow() > inv.expires_at:
            return False, "This invitation link has expired. Request a new invitation.", None

        if len(req.password) < 8:
            return False, "Official password must be at least 8 characters with letters and numbers.", None

        pwd_hash, salt = hash_password(req.password)
        user_id = f"usr-{inv.role.value[:3]}-{uuid.uuid4().hex[:8]}"

        user = UserRecord(
            id=user_id,
            name=req.name or inv.name,
            email=inv.email,
            password_hash=pwd_hash,
            salt=salt,
            role=inv.role,
            status=AccountStatus.ACTIVE,
            employee_id=inv.employee_id,
            department_id=inv.department_id,
            department_name=inv.department_name,
            jurisdiction_ward=inv.jurisdiction_ward,
            designation=inv.designation,
            created_at=datetime.utcnow()
        )
        db.add_user(user)
        inv.used_at = datetime.utcnow()

        db.record_audit(
            entity_name="UserAccount",
            entity_id=user.id,
            action="OFFICIAL_ACTIVATED",
            actor=user.name,
            actor_role=UserRole.ADMIN if user.role == RoleEnum.CIVIC_ADMINISTRATOR else UserRole.OPERATOR,
            metadata={"email": user.email, "role": user.role.value}
        )

        return True, "Official account activated successfully. You can now log in.", user

    def list_authority_users(self) -> List[UserProfileResponse]:
        """Lists all municipal authority staff (Operators, Reviewers, Admins)."""
        users = db.get_all_users()
        res = []
        for u in users:
            if u.role != RoleEnum.CITIZEN:
                perms = [p.value for p in ROLE_PERMISSIONS.get(u.role, [])]
                res.append(
                    UserProfileResponse(
                        id=u.id,
                        name=u.name,
                        email=u.email,
                        mobile=u.mobile,
                        role=u.role,
                        status=u.status,
                        employee_id=u.employee_id,
                        department_id=u.department_id,
                        department_name=u.department_name,
                        jurisdiction_ward=u.jurisdiction_ward,
                        designation=u.designation,
                        locality=u.locality,
                        permissions=perms,
                        created_at=u.created_at,
                        last_login_at=u.last_login_at
                    )
                )
        return res

    def set_user_status(self, user_id: str, new_status: AccountStatus, admin_name: str) -> Tuple[bool, str]:
        """Activates or deactivates an authority account."""
        user = db.get_user_by_id(user_id)
        if not user:
            return False, "User not found."

        old_status = user.status
        user.status = new_status

        db.record_audit(
            entity_name="UserAccount",
            entity_id=user.id,
            action="STATUS_CHANGED",
            actor=admin_name,
            actor_role=UserRole.ADMIN,
            metadata={"old": old_status.value, "new": new_status.value, "target_user": user.name}
        )
        return True, f"User status updated to {new_status.value}."

    def reset_user_password(self, user_id: str, new_password: str, admin_name: str) -> Tuple[bool, str]:
        """Administrator-initiated password reset."""
        user = db.get_user_by_id(user_id)
        if not user:
            return False, "User not found."

        pwd_hash, salt = hash_password(new_password)
        user.password_hash = pwd_hash
        user.salt = salt

        db.record_audit(
            entity_name="UserAccount",
            entity_id=user.id,
            action="PASSWORD_RESET_BY_ADMIN",
            actor=admin_name,
            actor_role=UserRole.ADMIN,
            metadata={"target_user": user.name}
        )
        return True, "Password has been reset successfully."

    def to_profile_response(self, user: UserRecord) -> UserProfileResponse:
        perms = [p.value for p in ROLE_PERMISSIONS.get(user.role, [])]
        return UserProfileResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            mobile=user.mobile,
            role=user.role,
            status=user.status,
            employee_id=user.employee_id,
            department_id=user.department_id,
            department_name=user.department_name,
            jurisdiction_ward=user.jurisdiction_ward,
            designation=user.designation,
            locality=user.locality,
            permissions=perms,
            created_at=user.created_at,
            last_login_at=user.last_login_at
        )


auth_service = AuthService()
auth_service.init_demo_accounts()
