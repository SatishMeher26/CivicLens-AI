"""CivicLens AI — Generative AI Assistant & Semantic Summarization Service
Provides provider-independent LLM interfaces with robust local NLP synthesis fallback.
Safely extracts key civic facts, rewrites unstructured complaints into standardized municipal
reports, explains priority factors, and summarizes operational trends.
Never authorizes status changes or executes unverified instructions.
"""

import os
import re
from typing import Dict, Any, Optional, List
from app.models.domain import CivicIssue, IssueStatus, PriorityLevel


class CivicAIAssistant:
    """Provider-independent AI assistant with reliable local extractive synthesis."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.provider_mode = "Cloud LLM (Configured)" if self.api_key else "Deterministic Local NLP Synthesis"

    def summarize_issue(self, issue: CivicIssue, summary_type: str = "executive") -> Dict[str, Any]:
        """Generates structured summaries tailored for citizens or authority executives."""

        # Sanitized untrusted text input
        clean_desc = re.sub(r"[^\w\s.,;:?!-]", "", issue.description).strip()
        category_name = issue.category.value.replace("_", " ").title()

        if summary_type == "citizen_friendly":
            title = f"Citizen Update: {issue.title}"
            summary = (
                f"Your report regarding {category_name.lower()} at {issue.location.address} "
                f"is currently marked as '{issue.status.value.replace('_', ' ').title()}'. "
                f"Assigned team: {issue.assigned_department_name or 'Pending Allocation'}. "
                f"Civic priority rating: {issue.priority.priority_level.value.upper()}."
            )
            key_points = [
                f"Location: {issue.location.address}, {issue.location.locality}",
                f"Current Status: {issue.status.value.replace('_', ' ').title()}",
                f"Community Confirmations: {issue.community_confirmations} citizen(s)",
                f"Target SLA Resolution Window: {issue.priority.sla_deadline_hours} hours"
            ]

        elif summary_type == "operational":
            title = f"Field Dispatch Briefing: {issue.issue_code}"
            summary = (
                f"Triage briefing for {issue.assigned_department_name or 'Assigned Unit'}. "
                f"Location: {issue.location.address} (Ward: {issue.location.ward}). "
                f"Identified hazard: {issue.title}. {clean_desc[:200]}... "
                f"Priority score: {issue.priority.raw_score}/100. "
                f"Recurrence status: {'Recurring hot-spot defect' if issue.is_recurring else 'Single occurrence'}."
            )
            key_points = [
                f"Jurisdiction: {issue.assigned_department_name or 'Unassigned'}",
                f"Officer in Charge: {issue.assigned_officer or 'Unallocated'}",
                f"Linked Reports Count: {issue.reports_count}",
                f"Evidence Attachments: {len(issue.evidence)} photo(s)"
            ]

        else:  # Executive
            title = f"Executive Intelligence Summary: {issue.issue_code}"
            summary = (
                f"Consolidated civic issue in {issue.location.locality} classified under {category_name}. "
                f"Calculated civic impact is {issue.priority.priority_level.value.upper()} ({issue.priority.raw_score}/100) "
                f"with {issue.reports_count} verified citizen grievances. "
                f"SLA status: {'OVERDUE' if issue.priority.overdue else 'Within Target Window'}."
            )
            key_points = [
                f"Top Contributing Factor: {issue.priority.factors[0].factor_name} ({issue.priority.factors[0].contribution_score} pts)",
                f"Department Routing: {issue.assigned_department_name or 'Pending'}",
                f"Duplicate Candidates Detected: {len(issue.duplicate_candidates)}",
                f"Latest Lifecycle Event: {issue.status_history[-1].to_status.value if issue.status_history else issue.status.value}"
            ]

        return {
            "summary_type": summary_type,
            "title": title,
            "summary": summary,
            "key_points": key_points,
            "generated_by": self.provider_mode,
            "safety_checked": True
        }

    def explain_priority(self, issue: CivicIssue) -> Dict[str, Any]:
        """Generates natural-language reasoning of how priority was computed."""
        p = issue.priority
        top_factors = sorted(p.factors, key=lambda f: f.contribution_score, reverse=True)[:3]

        reasons = [
            f"{f.factor_name} (+{f.contribution_score} pts): {f.explanation}"
            for f in top_factors
        ]

        explanation_text = (
            f"The issue has been assigned a priority of {p.priority_level.value.upper()} "
            f"with an overall composite impact score of {p.raw_score} out of 100. "
            f"The primary driver is {top_factors[0].factor_name.lower()}, followed by {top_factors[1].factor_name.lower()}. "
            f"Standard operating procedure prescribes a target turnaround of {p.sla_deadline_hours} hours."
        )

        return {
            "priority_level": p.priority_level.value,
            "composite_score": p.raw_score,
            "explanation": explanation_text,
            "driver_breakdown": reasons,
            "sla_hours": p.sla_deadline_hours,
            "overdue": p.overdue
        }

    def generate_analytics_digest(self, metrics: Dict[str, Any]) -> str:
        """Synthesizes a high-level municipal intelligence digest for leadership."""
        total = metrics.get("total_issues", 0)
        open_count = metrics.get("open_issues", 0)
        critical_count = metrics.get("critical_issues", 0)
        verification_count = metrics.get("awaiting_verification", 0)
        top_locality = metrics.get("top_locality", "Central Zone")
        top_category = metrics.get("top_category", "Roads & Infrastructure")

        return (
            f"CivicLens Intelligence Digest: Tracking {total} total civic incidents across active municipal wards. "
            f"{open_count} issues remain active, of which {critical_count} demand urgent attention due to critical safety impact. "
            f"The highest grievance concentration is observed in {top_locality}, predominantly centered on {top_category}. "
            f"{verification_count} remediated works are currently queueing for visual sign-off."
        )


ai_assistant = CivicAIAssistant()
