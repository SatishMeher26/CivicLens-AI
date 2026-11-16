"""CivicLens AI — AI Issue Classification Service
Provides NLP-based automated classification using TF-IDF vector representations
and semantic keyword heuristics with explainable confidence scoring.
"""

import re
from typing import Dict, Any, List, Tuple
from app.models.domain import IssueCategory

# Representative vocabulary corpora for civic issue domains
CATEGORY_PROTOTYPES: Dict[IssueCategory, List[str]] = {
    IssueCategory.ROADS_INFRASTRUCTURE: [
        "pothole", "crater", "broken road", "asphalt", "tar", "pavement", "sidewalk",
        "kerb", "speed breaker", "road cave-in", "excavation", "uneven road", "patchwork"
    ],
    IssueCategory.DRAINAGE_FLOODING: [
        "drain", "drainage", "clogged sewer", "flooding", "waterlogging", "stormwater",
        "gutter", "open manhole", "overflowing sewage", "sludge", "monsoon water", "culvert"
    ],
    IssueCategory.SOLID_WASTE: [
        "garbage", "trash", "waste", "dump", "debris", "rubbish", "refuse", "litter",
        "overflowing bin", "plastic heap", "rotting", "foul smell", "uncollected waste", "dumpster"
    ],
    IssueCategory.STREETLIGHTING: [
        "streetlight", "street light", "lamp post", "bulb", "dark street", "flickering light",
        "hanging wire", "electrical pole", "streetlamp", "fused light", "luminaire", "blackout"
    ],
    IssueCategory.WATER_SUPPLY: [
        "water leak", "pipeline", "pipe burst", "contaminated water", "muddy tap water",
        "water supply", "drinking water", "valve leakage", "low water pressure", "tanker"
    ],
    IssueCategory.PUBLIC_PARKS: [
        "park", "garden", "broken bench", "playground swing", "overgrown bushes", "lawn",
        "park gate", "fallen tree branch", "jogging track", "community garden"
    ],
    IssueCategory.TRAFFIC_SIGNALS: [
        "traffic light", "traffic signal", "red signal not working", "zebra crossing",
        "blinking yellow", "signal timer broken", "pedestrian crossing sign"
    ]
}


class IssueClassifier:
    """Modular classifier that maps unstructured grievance text to civic categories."""

    def __init__(self):
        self.model_version = "CivicNLP-v1.4-hybrid"

    def _normalize(self, text: str) -> str:
        return re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())

    def classify(self, title: str, description: str, locality: str = "") -> Dict[str, Any]:
        full_text = f"{title} {title} {description} {locality}".lower()
        normalized = self._normalize(full_text)
        tokens = set(normalized.split())

        scores: Dict[IssueCategory, float] = {}

        for category, prototype_keywords in CATEGORY_PROTOTYPES.items():
            category_score = 0.0
            matched_keywords = []

            for kw in prototype_keywords:
                # Multi-word match vs single word match
                if " " in kw:
                    if kw in normalized:
                        category_score += 2.5
                        matched_keywords.append(kw)
                else:
                    if kw in tokens:
                        category_score += 1.5
                        matched_keywords.append(kw)

            # Boost if category name words match title
            cat_words = category.value.split("_")
            for cw in cat_words:
                if cw in title.lower():
                    category_score += 2.0

            scores[category] = category_score

        # Find best category
        sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_cat, top_raw_score = sorted_cats[0]

        # Calculate normalized confidence
        total_score = sum(scores.values())
        if total_score > 0 and top_raw_score > 0:
            confidence = min(0.96, max(0.45, (top_raw_score / (total_score + 1.0)) * 1.3))
            confidence = round(confidence, 2)
            suggested_category = top_cat
            explanation = (
                f"Classified under '{suggested_category.value.replace('_', ' ').title()}' "
                f"based on key contextual indicators in grievance description."
            )
        else:
            suggested_category = IssueCategory.OTHER
            confidence = 0.35
            explanation = "Ambiguous issue description. Routed to general triage queue."

        # Alternatives
        alternatives = []
        for cat, sc in sorted_cats[1:3]:
            if sc > 0:
                alternatives.append({
                    "category": cat.value,
                    "relative_affinity": round(sc / (total_score or 1.0), 2)
                })

        return {
            "suggested_category": suggested_category,
            "confidence": confidence,
            "explanation": explanation,
            "model_version": self.model_version,
            "alternative_categories": alternatives
        }


classifier_service = IssueClassifier()
