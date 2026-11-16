"""CivicLens AI — Intelligent Department Routing Service
Maintains the municipal department registry and provides deterministic,
rules-based assignment recommendations based on issue category, ward, and locality.
"""

from typing import Dict, Any, List, Optional
from app.models.domain import Department, IssueCategory

DEFAULT_DEPARTMENTS: List[Department] = [
    Department(
        id="dept-roads",
        name="Roads & Public Infrastructure Division",
        code="RPID",
        categories_handled=[IssueCategory.ROADS_INFRASTRUCTURE],
        contact_email="roads.control@civiclens.gov",
        phone="+91-20-2550-1001",
        active_crew_count=8,
        sla_hours_default=36
    ),
    Department(
        id="dept-drainage",
        name="Stormwater Drainage & Flood Mitigation",
        code="SDFM",
        categories_handled=[IssueCategory.DRAINAGE_FLOODING],
        contact_email="drainage.mitigation@civiclens.gov",
        phone="+91-20-2550-1002",
        active_crew_count=6,
        sla_hours_default=24
    ),
    Department(
        id="dept-waste",
        name="Solid Waste Management & Sanitation",
        code="SWMS",
        categories_handled=[IssueCategory.SOLID_WASTE],
        contact_email="sanitation.swm@civiclens.gov",
        phone="+91-20-2550-1003",
        active_crew_count=12,
        sla_hours_default=24
    ),
    Department(
        id="dept-electrical",
        name="Electrical Engineering & Streetlighting",
        code="EESD",
        categories_handled=[IssueCategory.STREETLIGHTING],
        contact_email="lighting.grid@civiclens.gov",
        phone="+91-20-2550-1004",
        active_crew_count=5,
        sla_hours_default=48
    ),
    Department(
        id="dept-water",
        name="Municipal Water Supply & Sewerage Board",
        code="MWSSB",
        categories_handled=[IssueCategory.WATER_SUPPLY],
        contact_email="water.hotline@civiclens.gov",
        phone="+91-20-2550-1005",
        active_crew_count=7,
        sla_hours_default=24
    ),
    Department(
        id="dept-parks",
        name="Horticulture & Public Parks Directorate",
        code="HPPD",
        categories_handled=[IssueCategory.PUBLIC_PARKS],
        contact_email="parks.maintenance@civiclens.gov",
        phone="+91-20-2550-1006",
        active_crew_count=4,
        sla_hours_default=72
    ),
    Department(
        id="dept-traffic",
        name="Traffic Engineering & Signal Control",
        code="TESC",
        categories_handled=[IssueCategory.TRAFFIC_SIGNALS],
        contact_email="traffic.signals@civiclens.gov",
        phone="+91-20-2550-1007",
        active_crew_count=4,
        sla_hours_default=24
    ),
    Department(
        id="dept-general",
        name="General Municipal Works & Grievance Triage",
        code="GMWGT",
        categories_handled=[IssueCategory.OTHER],
        contact_email="grievances@civiclens.gov",
        phone="+91-20-2550-1000",
        active_crew_count=5,
        sla_hours_default=72
    )
]


class RoutingService:
    """Configurable routing rules engine for municipal jurisdiction."""

    def __init__(self):
        self._departments: Dict[str, Department] = {d.id: d for d in DEFAULT_DEPARTMENTS}

    def list_departments(self) -> List[Department]:
        return list(self._departments.values())

    def get_department_by_id(self, dept_id: str) -> Optional[Department]:
        return self._departments.get(dept_id)

    def recommend_department(self, category: IssueCategory, locality: str = "", ward: str = "") -> Dict[str, Any]:
        """Recommends department based on primary category jurisdiction."""
        matched = None
        for dept in self._departments.values():
            if category in dept.categories_handled:
                matched = dept
                break

        if not matched:
            matched = self._departments.get("dept-general", DEFAULT_DEPARTMENTS[-1])

        officer_suggestions = {
            "dept-roads": f"Er. Sachin Patil (Zonal Exec. Engg - {ward or 'Ward 7 Ghole Road'})",
            "dept-drainage": f"Er. Snehal Kulkarni (Drainage Inspector - {locality or 'Deccan Zone'})",
            "dept-waste": f"Dr. Pradeep Jadhav (Chief Sanitary Supervisor - {ward or 'Kothrud'})",
            "dept-electrical": f"Er. Vilas Shinde (MSEDCL / PMC Line Maintenance Lead)",
            "dept-water": f"Er. Amol Deshmukh (PMC Water Works Pipeline Engg)",
            "dept-parks": f"Smt. Manisha Bhosale (PMC Garden Superintendent)",
            "dept-traffic": f"Insp. Santosh More (Pune City Traffic Branch)",
            "dept-general": f"Sri. Nitin Gaikwad (PMC Civic Triage Officer)"
        }

        return {
            "department_id": matched.id,
            "department_name": matched.name,
            "department_code": matched.code,
            "recommended_officer": officer_suggestions.get(matched.id, "Zonal Officer on Duty"),
            "sla_hours": matched.sla_hours_default,
            "reason": f"Standard civic jurisdiction for category '{category.value.replace('_', ' ').title()}'"
        }


routing_service = RoutingService()
