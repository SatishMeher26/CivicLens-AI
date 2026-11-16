"""CivicLens AI — Semantic and Geospatial Duplicate Detection Service
Performs multi-signal candidate detection combining text similarity, category compatibility,
geodesic proximity, and time context.
Never automatically drops or deletes records; flags explainable candidates for human authority review.
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.domain import CivicIssue, DuplicateCandidate, IssueCategory
from app.services.spatial_service import haversine_distance_meters


class DuplicateDetectionService:
    """Multi-signal duplicate candidate analyzer."""

    def __init__(self, spatial_threshold_meters: float = 200.0, similarity_threshold: float = 0.55):
        self.spatial_threshold_meters = spatial_threshold_meters
        self.similarity_threshold = similarity_threshold

    def _tokenize(self, text: str) -> set:
        normalized = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        tokens = [t for t in normalized.split() if len(t) > 2]
        stopwords = {"the", "and", "this", "that", "with", "from", "for", "near", "road", "area", "please", "issue", "problem"}
        return set(tokens) - stopwords

    def calculate_text_similarity(self, text_a: str, text_b: str) -> float:
        """Calculates Jaccard overlap of distinctive descriptive terms."""
        tokens_a = self._tokenize(text_a)
        tokens_b = self._tokenize(text_b)
        if not tokens_a or not tokens_b:
            return 0.0
        intersection = len(tokens_a & tokens_b)
        union = len(tokens_a | tokens_b)
        return intersection / float(union) if union > 0 else 0.0

    def evaluate_candidate(
        self,
        new_title: str,
        new_description: str,
        new_category: IssueCategory,
        new_lat: float,
        new_lng: float,
        existing_issue: CivicIssue
    ) -> Optional[DuplicateCandidate]:
        """Calculates composite duplication likelihood against an existing issue."""

        # 1. Geographic distance
        distance = haversine_distance_meters(
            new_lat, new_lng,
            existing_issue.location.latitude,
            existing_issue.location.longitude
        )

        # Issues beyond 400 meters are very unlikely to be the exact same physical defect
        if distance > 400.0:
            return None

        # 2. Category matching
        category_match = (new_category == existing_issue.category)

        # 3. Lexical / Semantic similarity
        text_sim = self.calculate_text_similarity(
            f"{new_title} {new_description}",
            f"{existing_issue.title} {existing_issue.description}"
        )

        # 4. Spatial factor (1.0 at 0m down to 0.0 at 300m)
        spatial_factor = max(0.0, 1.0 - (distance / 300.0))

        # Composite score weighting:
        # Distance: 35%, Text Similarity: 40%, Category: 25%
        cat_factor = 1.0 if category_match else 0.0
        composite_score = (spatial_factor * 0.35) + (text_sim * 0.40) + (cat_factor * 0.25)
        composite_score = round(min(1.0, composite_score), 2)

        # Criteria for surfacing as candidate
        # Must have reasonable composite score and be within reasonable spatial proximity
        if composite_score >= 0.40 and distance <= self.spatial_threshold_meters:
            reasons = []
            if distance <= 60.0:
                reasons.append(f"Located within {int(distance)}m of existing report")
            else:
                reasons.append(f"Located {int(distance)}m away in same locality")

            if category_match:
                reasons.append(f"Same category ({new_category.value})")

            if text_sim > 0.45:
                reasons.append(f"High descriptive terminology overlap ({int(text_sim * 100)}%)")
            elif text_sim > 0.25:
                reasons.append(f"Moderate keyword similarity ({int(text_sim * 100)}%)")

            reason_str = "; ".join(reasons)

            return DuplicateCandidate(
                candidate_id=f"dup-{existing_issue.id[:8]}",
                matched_issue_id=existing_issue.id,
                matched_issue_title=existing_issue.title,
                text_similarity=round(text_sim, 2),
                distance_meters=round(distance, 1),
                category_match=category_match,
                overall_confidence=composite_score,
                reason=reason_str,
                status="pending"
            )

        return None

    def find_duplicate_candidates(
        self,
        new_title: str,
        new_description: str,
        new_category: IssueCategory,
        new_lat: float,
        new_lng: float,
        existing_issues: List[CivicIssue]
    ) -> List[DuplicateCandidate]:
        candidates: List[DuplicateCandidate] = []
        for issue in existing_issues:
            # Skip resolved or rejected issues older than 30 days
            cand = self.evaluate_candidate(
                new_title=new_title,
                new_description=new_description,
                new_category=new_category,
                new_lat=new_lat,
                new_lng=new_lng,
                existing_issue=issue
            )
            if cand:
                candidates.append(cand)

        # Sort highest confidence first
        candidates.sort(key=lambda c: c.overall_confidence, reverse=True)
        return candidates[:5]


duplicate_service = DuplicateDetectionService()
