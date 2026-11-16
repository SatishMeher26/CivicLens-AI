"""CivicLens AI — Security and RBAC FastAPI Dependencies
Enforces authentication, role-based access control, and jurisdiction boundaries.
"""

from fastapi import Header, HTTPException, status, Depends
from typing import Optional, List
from app.services.auth_service import auth_service
from app.models.auth import UserRecord, RoleEnum, Permission


def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[UserRecord]:
    """Extracts bearer token from header and returns user if authenticated, None otherwise."""
    if not authorization:
        return None

    parts = authorization.split(" ")
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
    else:
        token = authorization.strip()

    return auth_service.get_user_from_token(token)


def get_current_user(authorization: Optional[str] = Header(None)) -> UserRecord:
    """Enforces valid authentication. Rejects unauthenticated requests with 401 Unauthorized."""
    user = get_current_user_optional(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in with a valid session token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


def require_role(*allowed_roles: RoleEnum):
    """Enforces that the authenticated user possesses one of the allowed roles."""
    def role_checker(current_user: UserRecord = Depends(get_current_user)) -> UserRecord:
        if current_user.role not in allowed_roles and current_user.role != RoleEnum.CIVIC_ADMINISTRATOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {[r.value for r in allowed_roles]}. Current role: {current_user.role.value}"
            )
        return current_user
    return role_checker


def require_permission(required_perm: Permission):
    """Enforces that the user has a specific granular permission."""
    def perm_checker(current_user: UserRecord = Depends(get_current_user)) -> UserRecord:
        if not current_user.has_permission(required_perm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Missing required permission: {required_perm.value}"
            )
        return current_user
    return perm_checker


def check_jurisdiction_scope(user: UserRecord, issue_ward: Optional[str]) -> bool:
    """Checks whether an operator has jurisdiction over a specific ward.
    Administrators and Reviewers have city-wide (ALL) scope.
    """
    if user.role in [RoleEnum.CIVIC_ADMINISTRATOR, RoleEnum.QUALITY_REVIEWER]:
        return True
    if not user.jurisdiction_ward or user.jurisdiction_ward.upper() == "ALL":
        return True
    if not issue_ward:
        return True
    return user.jurisdiction_ward.lower() in issue_ward.lower()
