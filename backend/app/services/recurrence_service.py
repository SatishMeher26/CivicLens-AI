"""CivicLens AI — Recurring Issue Detection Service
Analyzes spatial and temporal patterns across civic issues to identify repeat failures,
chronic infrastructure bottlenecks, and unresolved root causes.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.models.domain import CivicIssue, IssueStatus, IssueCategory
from app.services.spatial_service import haversine_distance_meters


class RecurrenceAnalysisService:
    """Detects chronic and recurring civic issues based on spatio-temporal clustering."""

    def __init__(self, proximity_meters: float = 120.0, lookback_days: int = 180):
        self.proximity_meters = proximity_meters
        self.lookback_days = lookback_days

    def analyze_issue_recurrence(
        self,
        target_issue: CivicIssue,
        all_historical_issues: List[CivicIssue]
    ) -> Dict[str, Any]:
        """Evaluates whether an issue is part of a repeated failure pattern."""
        related_historical = []

        for other in all_historical_issues:
            if other.id == target_issue.id:
                continue

            # Must share the same category
            if other.category != target_issue.category:
                continue

            dist = haversine_distance_meters(
                target_issue.location.latitude,
                target_issue.location.longitude,
                other.location.latitude,
                other.location.longitude
            )

            if dist <= self.proximity_meters:
                # Calculate time gap
                time_diff = abs((target_issue.created_at - other.created_at).total_seconds()) / 86400.0
                if time_diff <= self.lookback_days:
                    related_historical.append({
                        "issue_id": other.id,
                        "issue_code": other.issue_code,
                        "title": other.title,
                        "status": other.status.value,
                        "created_at": other.created_at.isoformat(),
                        "distance_meters": round(dist, 1),
                        "days_difference": round(time_diff, 1),
                        "was_resolved": other.status in [IssueStatus.RESOLVED, IssueStatus.AWAITING_VERIFICATION]
                    })

        recurrence_count = len(related_historical) + 1
        is_recurring = recurrence_count >= 2

        if is_recurring:
            resolved_prior = [r for r in related_historical if r["was_resolved"]]
            if resolved_prior:
                recurrence_type = "Verified Repeat Failure"
                analysis_notes = (
                    f"Prior issue ({resolved_prior[0]['issue_code']}) was marked resolved {int(resolved_prior[0]['days_difference'])} "
                    f"days ago within {int(resolved_prior[0]['distance_meters'])}m. Indicates recurring defect or inadequate root-cause repair."
                )
            else:
                recurrence_type = "Suspected Chronic Cluster"
                analysis_notes = (
                    f"Cluster of {recurrence_count} concurrent or recent issues within {int(self.proximity_meters)}m "
                    f"in category '{target_issue.category.value}'. High localized infrastructure strain."
                )
        else:
            recurrence_type = "Isolated Incident"
            analysis_notes = "No prior category incidents recorded within spatial proximity threshold."

        return {
            "is_recurring": is_recurring,
            "recurrence_count": recurrence_count,
            "recurrence_type": recurrence_type,
            "analysis_notes": analysis_notes,
            "cluster_matches": related_historical
        }

    def detect_all_chronic_hotspots(self, issues: List[CivicIssue]) -> List[Dict[str, Any]]:
        """Identifies top recurring geographical clusters across the city."""
        clusters: List[Dict[str, Any]] = []
        seen_pairs = set()

        for i, issue in enumerate(issues):
            related = []
            for j, other in enumerate(issues):
                if i == j:
                    continue
                pair_key = tuple(sorted([issue.id, other.id]))
                if pair_key in seen_pairs:
                    continue

                if issue.category == other.category:
                    d = haversine_distance_meters(
                        issue.location.latitude, issue.location.longitude,
                        other.location.latitude, other.location.longitude
                    )
                    if d <= self.proximity_meters:
                        related.append(other)
                        seen_pairs.add(pair_key)

            if len(related) >= 1:
                cluster_issues = [issue] + related
                avg_lat = sum(it.location.latitude for it in cluster_issues) / len(cluster_issues)
                avg_lng = sum(it.location.longitude for it in cluster_issues) / len(cluster_issues)
                clusters.append({
                    "cluster_id": f"hotspot-{len(clusters) + 1}",
                    "locality": issue.location.locality,
                    "ward": issue.location.ward,
                    "category": issue.category.value,
                    "incident_count": len(cluster_issues),
                    "center_lat": round(avg_lat, 5),
                    "center_lng": round(avg_lng, 5),
                    "issue_codes": [it.issue_code for it in cluster_issues],
                    "recommendation": "Priority engineering inspection recommended for structural overhaul."
                })

        clusters.sort(key=lambda c: c["incident_count"], reverse=True)
        return clusters[:10]


recurrence_service = RecurrenceAnalysisService()
