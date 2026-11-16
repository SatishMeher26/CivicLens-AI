"""CivicLens AI — AI-Assisted Resolution Verification Service
Supports automated evidence completeness inspection, resolution metadata verification,
and reviewer decision support.
Clearly labeled as decision assistance — does not replace authoritative human sign-off.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from app.models.domain import CivicIssue, EvidenceType, EvidenceAttachment


class VerificationService:
    """Provides decision-support heuristics and structural validation for resolution proof."""

    def evaluate_resolution_evidence(
        self,
        issue: CivicIssue,
        new_evidence: EvidenceAttachment
    ) -> Dict[str, Any]:
        """Evaluates whether submitted evidence satisfies resolution verification criteria."""

        original_evidence = [e for e in issue.evidence if e.evidence_type == EvidenceType.ORIGINAL]
        resolution_evidence = [e for e in issue.evidence if e.evidence_type == EvidenceType.RESOLUTION]

        has_original = len(original_evidence) > 0
        has_resolution = len(resolution_evidence) > 0 or new_evidence.evidence_type == EvidenceType.RESOLUTION
        has_description = bool(new_evidence.description and len(new_evidence.description) > 10)

        # Baseline heuristic verification confidence score
        confidence_score = 0.50
        inspection_findings = []

        if has_original:
            confidence_score += 0.20
            inspection_findings.append("Baseline original grievance photo available for spatial/visual comparison")
        else:
            inspection_findings.append("Original baseline photo missing; relying strictly on post-work proof")

        if has_resolution:
            confidence_score += 0.15
            inspection_findings.append("Post-remediation resolution proof photo submitted by field crew")

        if has_description:
            confidence_score += 0.10
            inspection_findings.append(f"Work completion remarks documented: '{new_evidence.description}'")

        confidence_score = round(min(0.95, confidence_score), 2)

        # Recommendation
        if confidence_score >= 0.80:
            recommended_action = "Approve Resolution"
            summary_statement = "Evidence package is complete. Recommended for municipal reviewer sign-off."
        elif confidence_score >= 0.60:
            recommended_action = "Manual Review Required"
            summary_statement = "Evidence contains basic photographs but lacks comprehensive inspector notes."
        else:
            recommended_action = "Request Supplementary Evidence"
            summary_statement = "Incomplete evidence package. Further photographic proof needed before closure."

        return {
            "evidence_id": new_evidence.id,
            "verification_confidence": confidence_score,
            "recommended_action": recommended_action,
            "summary_statement": summary_statement,
            "inspection_findings": inspection_findings,
            "disclaimer": (
                "Automated inspection provides structured validation assistance only. "
                "Final legal closure requires manual verification and sign-off by an authorized municipal reviewer."
            )
        }


verification_service = VerificationService()
