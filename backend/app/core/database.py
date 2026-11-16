"""CivicLens AI — Persistence and State Machine Engine
Maintains in-memory and file-backed civic issues, citizen reports,
audit logs, and strict state transition validation.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone
import uuid
import json
from app.models.domain import (
    CivicIssue, CivicReport, IssueStatus, UserRole, StatusHistory,
    EvidenceAttachment, PriorityAssessment, DuplicateCandidate,
    Department, AuditEvent, IssueCategory
)

# Formal State Transition Matrix
VALID_TRANSITIONS: Dict[IssueStatus, List[IssueStatus]] = {
    IssueStatus.SUBMITTED: [IssueStatus.UNDER_REVIEW, IssueStatus.ASSIGNED, IssueStatus.REJECTED],
    IssueStatus.UNDER_REVIEW: [IssueStatus.ASSIGNED, IssueStatus.REJECTED],
    IssueStatus.ASSIGNED: [IssueStatus.IN_PROGRESS, IssueStatus.UNDER_REVIEW, IssueStatus.REJECTED],
    IssueStatus.IN_PROGRESS: [IssueStatus.AWAITING_VERIFICATION, IssueStatus.ASSIGNED],
    IssueStatus.AWAITING_VERIFICATION: [IssueStatus.RESOLVED, IssueStatus.IN_PROGRESS],
    IssueStatus.RESOLVED: [IssueStatus.REOPENED],
    IssueStatus.REOPENED: [IssueStatus.UNDER_REVIEW, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS],
    IssueStatus.REJECTED: [IssueStatus.UNDER_REVIEW],
}


class CivicDatabase:
    """Central data repository for CivicLens AI."""

    def __init__(self):
        self.issues: Dict[str, CivicIssue] = {}
        self.reports: Dict[str, CivicReport] = {}
        self.audit_events: List[AuditEvent] = []
        self.users: Dict[str, Any] = {}
        self.sessions: Dict[str, Any] = {}
        self.invitations: Dict[str, Any] = {}
        self.password_resets: Dict[str, Any] = {}
        self.login_history: List[Dict[str, Any]] = []

    def get_all_users(self) -> List[Any]:
        return list(self.users.values())

    def get_user_by_id(self, user_id: str) -> Optional[Any]:
        return self.users.get(user_id)

    def get_user_by_identifier(self, identifier: str) -> Optional[Any]:
        ident = identifier.strip().lower()
        for u in self.users.values():
            if u.email and u.email.lower() == ident:
                return u
            if u.mobile and u.mobile.strip() == ident:
                return u
            if u.employee_id and u.employee_id.strip().lower() == ident:
                return u
        return None

    def add_user(self, user: Any) -> None:
        self.users[user.id] = user

    def add_session(self, session: Any) -> None:
        self.sessions[session.token] = session

    def get_session(self, token: str) -> Optional[Any]:
        s = self.sessions.get(token)
        if not s:
            return None
        # Check session expiry
        if datetime.utcnow() > s.expires_at:
            del self.sessions[token]
            return None
        return s

    def delete_session(self, token: str) -> None:
        self.sessions.pop(token, None)

    def add_invitation(self, inv: Any) -> None:
        self.invitations[inv.invite_token] = inv

    def get_invitation_by_token(self, token: str) -> Optional[Any]:
        return self.invitations.get(token)

    def log_login_event(self, user_id: str, role: str, status: str, ip: str = "127.0.0.1", user_agent: str = "Unknown"):
        self.login_history.append({
            "id": f"log-{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "role": role,
            "status": status,
            "ip": ip,
            "user_agent": user_agent,
            "timestamp": datetime.utcnow().isoformat()
        })

    def get_all_issues(self) -> List[CivicIssue]:
        return list(self.issues.values())

    def get_issue(self, issue_id: str) -> Optional[CivicIssue]:
        return self.issues.get(issue_id)

    def get_issue_by_code(self, issue_code: str) -> Optional[CivicIssue]:
        for iss in self.issues.values():
            if iss.issue_code.upper() == issue_code.upper():
                return iss
        return None

    def get_report(self, report_id: str) -> Optional[CivicReport]:
        return self.reports.get(report_id)

    def get_report_by_tracking(self, tracking_code: str) -> Optional[CivicReport]:
        for rep in self.reports.values():
            if rep.tracking_code.upper() == tracking_code.upper():
                return rep
        return None

    def add_report(self, report: CivicReport) -> None:
        self.reports[report.id] = report
        self.record_audit(
            entity_name="CivicReport",
            entity_id=report.id,
            action="REPORT_CREATED",
            actor=report.reported_by_name,
            actor_role=UserRole.CITIZEN,
            metadata={"tracking_code": report.tracking_code, "category": report.category.value}
        )

    def add_issue(self, issue: CivicIssue) -> None:
        self.issues[issue.id] = issue
        self.record_audit(
            entity_name="CivicIssue",
            entity_id=issue.id,
            action="ISSUE_INITIALIZED",
            actor="SYSTEM_AUTO_TRIAGE",
            actor_role=UserRole.ADMIN,
            metadata={"issue_code": issue.issue_code, "priority": issue.priority.priority_level.value}
        )

    def update_issue_status(
        self,
        issue_id: str,
        to_status: IssueStatus,
        reason: str,
        changed_by: str,
        role: UserRole
    ) -> Tuple[bool, str, Optional[CivicIssue]]:
        """Executes a strictly validated lifecycle transition with audit history."""
        issue = self.issues.get(issue_id)
        if not issue:
            return False, "Issue not found", None

        # Check transition validity
        current = issue.status
        allowed = VALID_TRANSITIONS.get(current, [])
        if to_status not in allowed:
            return False, f"Illegal state transition from '{current.value}' to '{to_status.value}'. Allowed: {[s.value for s in allowed]}", None

        # Record history
        history_entry = StatusHistory(
            id=str(uuid.uuid4())[:8],
            from_status=current,
            to_status=to_status,
            changed_by=changed_by,
            role=role,
            timestamp=datetime.utcnow(),
            reason=reason
        )
        issue.status = to_status
        issue.status_history.append(history_entry)
        issue.updated_at = datetime.utcnow()

        self.record_audit(
            entity_name="CivicIssue",
            entity_id=issue.id,
            action=f"STATUS_CHANGED_TO_{to_status.value.upper()}",
            actor=changed_by,
            actor_role=role,
            metadata={"from": current.value, "to": to_status.value, "reason": reason}
        )

        return True, f"Successfully transitioned to {to_status.value}", issue

    def assign_issue(
        self,
        issue_id: str,
        department: Department,
        officer: str,
        changed_by: str,
        role: UserRole,
        notes: Optional[str] = None
    ) -> Tuple[bool, str, Optional[CivicIssue]]:
        issue = self.issues.get(issue_id)
        if not issue:
            return False, "Issue not found", None

        issue.assigned_department_id = department.id
        issue.assigned_department_name = department.name
        issue.assigned_officer = officer
        issue.updated_at = datetime.utcnow()

        # If currently submitted or under_review, advance to assigned
        if issue.status in [IssueStatus.SUBMITTED, IssueStatus.UNDER_REVIEW]:
            history_entry = StatusHistory(
                id=str(uuid.uuid4())[:8],
                from_status=issue.status,
                to_status=IssueStatus.ASSIGNED,
                changed_by=changed_by,
                role=role,
                timestamp=datetime.utcnow(),
                reason=f"Assigned to {department.name} ({officer}). {notes or ''}"
            )
            issue.status = IssueStatus.ASSIGNED
            issue.status_history.append(history_entry)

        self.record_audit(
            entity_name="CivicIssue",
            entity_id=issue.id,
            action="ISSUE_ASSIGNED",
            actor=changed_by,
            actor_role=role,
            metadata={"department": department.name, "officer": officer}
        )

        return True, "Issue assigned successfully", issue

    def add_evidence(
        self,
        issue_id: str,
        attachment: EvidenceAttachment
    ) -> Tuple[bool, str, Optional[CivicIssue]]:
        issue = self.issues.get(issue_id)
        if not issue:
            return False, "Issue not found", None

        issue.evidence.append(attachment)
        issue.updated_at = datetime.utcnow()

        # If evidence is resolution proof, advance issue to AWAITING_VERIFICATION if in progress
        if attachment.evidence_type.value == "resolution" and issue.status == IssueStatus.IN_PROGRESS:
            history_entry = StatusHistory(
                id=str(uuid.uuid4())[:8],
                from_status=issue.status,
                to_status=IssueStatus.AWAITING_VERIFICATION,
                changed_by=attachment.uploaded_by,
                role=UserRole.OPERATOR,
                timestamp=datetime.utcnow(),
                reason="Work completed. Field crew uploaded remediation proof photo."
            )
            issue.status = IssueStatus.AWAITING_VERIFICATION
            issue.status_history.append(history_entry)

        self.record_audit(
            entity_name="CivicIssue",
            entity_id=issue.id,
            action="EVIDENCE_UPLOADED",
            actor=attachment.uploaded_by,
            actor_role=UserRole.OPERATOR,
            metadata={"type": attachment.evidence_type.value, "file": attachment.file_url}
        )

        return True, "Evidence added successfully", issue

    def add_community_confirmation(self, issue_id: str, user_id: str) -> Tuple[bool, int]:
        issue = self.issues.get(issue_id)
        if not issue:
            return False, 0

        issue.community_confirmations += 1
        issue.updated_at = datetime.utcnow()
        return True, issue.community_confirmations

    def record_audit(
        self,
        entity_name: str,
        entity_id: str,
        action: str,
        actor: str,
        actor_role: UserRole,
        metadata: Dict[str, Any]
    ) -> None:
        event = AuditEvent(
            id=str(uuid.uuid4())[:12],
            entity_name=entity_name,
            entity_id=entity_id,
            action=action,
            actor=actor,
            actor_role=actor_role,
            timestamp=datetime.utcnow(),
            metadata=metadata
        )
        self.audit_events.append(event)


db = CivicDatabase()
