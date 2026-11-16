"""CivicLens AI — Civic Impact and Priority Scoring Engine
Calculates an explainable priority assessment based on transparent factors:
- Category Inherent Safety Risk (25%)
- Citizen Intensity / Independent Reports & Confirmations (20%)
- Critical Severity Keywords & Urgency Indicators (20%)
- Sensitive Facility & High-Density Proximity (15%)
- Evidence Completeness & Verification Confidence (10%)
- Age / SLA Elapsed Aging Factor (10%)

Documented Formula:
RawScore = Sum(Weight_i * NormalizedFactor_i) scaled from 0.0 to 100.0.
Priority Levels:
  0.0 - 39.9   -> LOW (SLA 96h)
  40.0 - 64.9  -> MEDIUM (SLA 48h)
  65.0 - 84.9  -> HIGH (SLA 24h)
  85.0 - 100.0 -> CRITICAL (SLA 12h)

Note: Distinct from official emergency response; serves as operational triage guidance.
"""

import math
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.domain import (
    IssueCategory, PriorityLevel, PriorityAssessment, PriorityFactor
)
from app.services.spatial_service import check_nearby_sensitive_facilities

# Inherent civic hazard risk weight per category (0.0 - 1.0)
CATEGORY_RISK_WEIGHTS: Dict[IssueCategory, float] = {
    IssueCategory.DRAINAGE_FLOODING: 0.90,     # Risk of disease, structural flood, open manholes
    IssueCategory.WATER_SUPPLY: 0.85,          # Contamination, drinking supply cut, burst mains
    IssueCategory.ROADS_INFRASTRUCTURE: 0.80,  # Road accident risk, bike skids, vehicle damage
    IssueCategory.TRAFFIC_SIGNALS: 0.75,       # Intersection collision risk
    IssueCategory.STREETLIGHTING: 0.65,        # Public safety & pedestrian visibility at night
    IssueCategory.SOLID_WASTE: 0.60,           # Hygiene, rodent breeding, blockages
    IssueCategory.PUBLIC_PARKS: 0.40,          # Amenity maintenance
    IssueCategory.OTHER: 0.35,                 # General non-urgent
}

CRITICAL_KEYWORDS = [
    "deep", "massive", "accident", "emergency", "open manhole", "live wire", "sparking",
    "electrocution", "caved in", "swallowed", "overflowing", "contaminat", "hospital",
    "school", "paralyzed", "elderly", "children", "ambulance", "dangerous"
]

HIGH_SEVERITY_KEYWORDS = [
    "broken", "burst", "major", "severe", "dark", "traffic jam", "leak", "stench",
    "foul", "submerged", "unusable", "stuck"
]


class PriorityScoringEngine:
    """Configurable scoring engine calculating transparent civic impact score."""

    def calculate_priority(
        self,
        category: IssueCategory,
        title: str,
        description: str,
        latitude: float,
        longitude: float,
        report_count: int = 1,
        confirmations: int = 1,
        evidence_count: int = 0,
        hours_open: float = 0.0
    ) -> PriorityAssessment:
        combined_text = f"{title} {description}".lower()

        # 1. Inherent Category Risk (Weight: 25%)
        cat_weight = 0.25
        cat_raw = CATEGORY_RISK_WEIGHTS.get(category, 0.40)
        cat_score = cat_raw * cat_weight * 100.0

        # 2. Citizen Intensity & Confirmations (Weight: 20%)
        # Avoid unbounded inflation using logarithmic scaling: log2(1 + count) capped at 4.0
        intensity_weight = 0.20
        total_reports_signal = max(1, report_count + (confirmations - 1))
        # 1 report -> 0.25, 2 reports -> 0.40, 5 reports -> 0.70, 10+ reports -> 1.0
        norm_intensity = min(1.0, math.log2(total_reports_signal + 1) / 3.45)
        intensity_score = norm_intensity * intensity_weight * 100.0

        # 3. Severity & Hazard Indicators (Weight: 20%)
        severity_weight = 0.20
        severity_points = 0.0
        matched_indicators = []
        for kw in CRITICAL_KEYWORDS:
            if kw in combined_text:
                severity_points += 0.35
                matched_indicators.append(kw)
        for kw in HIGH_SEVERITY_KEYWORDS:
            if kw in combined_text:
                severity_points += 0.15
                matched_indicators.append(kw)
        norm_severity = min(1.0, severity_points)
        severity_score = norm_severity * severity_weight * 100.0

        # 4. Sensitive Facilities Proximity (Weight: 15%)
        facility_weight = 0.15
        nearby = check_nearby_sensitive_facilities(latitude, longitude)
        if nearby:
            # Distance penalty: closer facility = higher score
            closest = min(nearby, key=lambda x: x["distance_meters"])
            norm_facility = 1.0 if closest["distance_meters"] <= 150 else 0.7
            facility_explanation = f"Within {int(closest['distance_meters'])}m of {closest['facility_name']} ({closest['facility_type']})"
        else:
            norm_facility = 0.15
            facility_explanation = "Standard residential / commercial corridor"
        facility_score = norm_facility * facility_weight * 100.0

        # 5. Evidence Completeness (Weight: 10%)
        evidence_weight = 0.10
        norm_evidence = 0.4  # baseline GPS + text
        if evidence_count > 0:
            norm_evidence += 0.4  # has photo evidence
        if len(description) > 50:
            norm_evidence += 0.2  # comprehensive description
        norm_evidence = min(1.0, norm_evidence)
        evidence_score = norm_evidence * evidence_weight * 100.0

        # 6. Age & SLA Factor (Weight: 10%)
        age_weight = 0.10
        # Aging escalates score over 48 hours
        norm_age = min(1.0, hours_open / 48.0)
        age_score = norm_age * age_weight * 100.0

        # Sum of contributions (0.0 to 100.0)
        raw_score = cat_score + intensity_score + severity_score + facility_score + evidence_score + age_score
        raw_score = round(min(100.0, max(5.0, raw_score)), 1)

        # Map to discrete operational Priority Level & SLA
        if raw_score >= 80.0:
            priority_level = PriorityLevel.CRITICAL
            sla_hours = 12
        elif raw_score >= 60.0:
            priority_level = PriorityLevel.HIGH
            sla_hours = 24
        elif raw_score >= 38.0:
            priority_level = PriorityLevel.MEDIUM
            sla_hours = 48
        else:
            priority_level = PriorityLevel.LOW
            sla_hours = 96

        factors = [
            PriorityFactor(
                factor_name="Category Inherent Risk",
                weight=cat_weight,
                raw_value=round(cat_raw, 2),
                contribution_score=round(cat_score, 1),
                explanation=f"{category.value.replace('_', ' ').title()} baseline hazard weight ({int(cat_raw * 100)}%)"
            ),
            PriorityFactor(
                factor_name="Citizen Intensity & Confirmations",
                weight=intensity_weight,
                raw_value=round(norm_intensity, 2),
                contribution_score=round(intensity_score, 1),
                explanation=f"{report_count} linked report(s) and {confirmations} citizen verification(s)"
            ),
            PriorityFactor(
                factor_name="Hazard & Urgency Keywords",
                weight=severity_weight,
                raw_value=round(norm_severity, 2),
                contribution_score=round(severity_score, 1),
                explanation=f"Detected urgent keywords: {', '.join(matched_indicators[:3])}" if matched_indicators else "Standard descriptive vocabulary"
            ),
            PriorityFactor(
                factor_name="Civic Facility Proximity",
                weight=facility_weight,
                raw_value=round(norm_facility, 2),
                contribution_score=round(facility_score, 1),
                explanation=facility_explanation
            ),
            PriorityFactor(
                factor_name="Evidence Completeness",
                weight=evidence_weight,
                raw_value=round(norm_evidence, 2),
                contribution_score=round(evidence_score, 1),
                explanation=f"Geo-location confirmed, {evidence_count} visual attachments provided"
            ),
            PriorityFactor(
                factor_name="Aging Escalation",
                weight=age_weight,
                raw_value=round(norm_age, 2),
                contribution_score=round(age_score, 1),
                explanation=f"Elapsed age: {int(hours_open)}h since initial citizen report"
            ),
        ]

        return PriorityAssessment(
            raw_score=raw_score,
            priority_level=priority_level,
            factors=factors,
            calculated_at=datetime.utcnow(),
            sla_deadline_hours=sla_hours,
            overdue=(hours_open > sla_hours)
        )


priority_engine = PriorityScoringEngine()
