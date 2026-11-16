"""CivicLens AI — Authentication and Authority Management API Routes
Endpoints for user registration, multi-role login, invitation workflows,
session management, and administrative user controls.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List, Dict, Any
from app.models.auth import (
    CitizenRegisterRequest, LoginRequest, AuthTokenResponse,
    UserProfileResponse, InviteUserRequest, ActivateInviteRequest,
    RoleEnum, AccountStatus
)
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user, require_role
from app.core.database import db

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])


@router.post("/register-citizen", response_model=AuthTokenResponse)
def register_citizen(req: CitizenRegisterRequest, request: Request):
    """Citizen self-registration endpoint."""
    ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown")

    success, msg, user = auth_service.register_citizen(req)
    if not success or not user:
        raise HTTPException(status_code=400, detail=msg)

    # Automatically authenticate newly registered citizen
    login_req = LoginRequest(
        identifier=req.mobile or req.email,
        password=req.password,
        role=RoleEnum.CITIZEN
    )
    auth_ok, auth_msg, session, auth_user = auth_service.authenticate_user(login_req, ip, user_agent)
    if not auth_ok or not session or not auth_user:
        raise HTTPException(status_code=400, detail=auth_msg)

    return AuthTokenResponse(
        access_token=session.token,
        user=auth_service.to_profile_response(auth_user),
        message="Citizen account registered and logged in successfully."
    )


@router.post("/login", response_model=AuthTokenResponse)
def login(req: LoginRequest, request: Request):
    """Unified multi-role login endpoint for Citizens, Operators, Reviewers, and Administrators."""
    ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown")

    success, msg, session, user = auth_service.authenticate_user(req, ip, user_agent)
    if not success or not session or not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    return AuthTokenResponse(
        access_token=session.token,
        user=auth_service.to_profile_response(user),
        message=f"Welcome, {user.name}! Authenticated as {user.role.value}."
    )


@router.post("/logout")
def logout(current_user=Depends(get_current_user), request: Request = None):
    """Terminates active user session."""
    auth_header = request.headers.get("authorization") if request else None
    if auth_header:
        token = auth_header.split(" ")[-1]
        auth_service.logout_token(token)
    return {"status": "success", "message": "Logged out successfully."}


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(current_user=Depends(get_current_user)):
    """Returns the profile and granular permissions of the authenticated user."""
    return auth_service.to_profile_response(current_user)


@router.get("/demo-accounts")
def get_demo_accounts():
    """Returns development demo credentials for local UI quick-fill."""
    return {
        "status": "active",
        "accounts": [
            {
                "role": "citizen",
                "label": "Citizen Demo",
                "identifier": "9876543210",
                "password": "CitizenDemo@123",
                "name": "Aarav Deshmukh",
                "description": "Public Pune resident (Report, Track & Confirm)"
            },
            {
                "role": "operator",
                "label": "Municipal Operator Demo",
                "identifier": "PMC-OP-2041",
                "password": "OperatorDemo@123",
                "name": "Er. Rajesh Verma",
                "description": "Zonal Dispatcher (Shivajinagar Roads Dept)"
            },
            {
                "role": "reviewer",
                "label": "Quality Reviewer Demo",
                "identifier": "PCMC-QR-5012",
                "password": "ReviewerDemo@123",
                "name": "Dr. Sunita Kulkarni",
                "description": "Quality Auditor (Verify Remediation Proof)"
            },
            {
                "role": "admin",
                "label": "Civic Administrator Demo",
                "identifier": "PMC-ADM-001",
                "password": "AdminDemo@123",
                "name": "Commissioner Vikram Shinde (IAS)",
                "description": "Municipal Commissioner & Executive Authority"
            }
        ]
    }


# ==============================================================================
# AUTHORITY ACCOUNT MANAGEMENT (ADMINISTRATOR ONLY)
# ==============================================================================

@router.get("/authority-users", response_model=List[UserProfileResponse])
def list_authority_users(admin=Depends(require_role(RoleEnum.CIVIC_ADMINISTRATOR))):
    """Lists all municipal staff accounts with assigned roles, departments, and jurisdictions."""
    return auth_service.list_authority_users()


@router.post("/invite")
def invite_authority_official(
    req: InviteUserRequest,
    admin=Depends(require_role(RoleEnum.CIVIC_ADMINISTRATOR))
):
    """Generates a secure, single-use invitation link for a new municipal official."""
    success, msg, inv = auth_service.invite_authority_user(req, admin_name=admin.name)
    if not success or not inv:
        raise HTTPException(status_code=400, detail=msg)

    # In production, this link is emailed. We return it securely to the admin in this response.
    invitation_url = f"/activate?token={inv.invite_token}"
    return {
        "status": "success",
        "message": msg,
        "invitation_id": inv.id,
        "invite_token": inv.invite_token,
        "activation_url": invitation_url,
        "expires_at": inv.expires_at.isoformat()
    }


@router.post("/activate-invite", response_model=UserProfileResponse)
def activate_invited_official(req: ActivateInviteRequest):
    """Invited official sets password to activate their municipal account."""
    success, msg, user = auth_service.activate_invitation(req)
    if not success or not user:
        raise HTTPException(status_code=400, detail=msg)
    return auth_service.to_profile_response(user)


@router.post("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    new_status: AccountStatus,
    admin=Depends(require_role(RoleEnum.CIVIC_ADMINISTRATOR))
):
    """Activates or deactivates an authority account."""
    success, msg = auth_service.set_user_status(user_id, new_status, admin_name=admin.name)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}


@router.post("/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: str,
    payload: Dict[str, str],
    admin=Depends(require_role(RoleEnum.CIVIC_ADMINISTRATOR))
):
    """Administrator sets a temporary or new password for a municipal staff member."""
    new_password = payload.get("new_password")
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")

    success, msg = auth_service.reset_user_password(user_id, new_password, admin_name=admin.name)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}
