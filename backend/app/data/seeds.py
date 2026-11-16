"""CivicLens AI — Seed Data Generator
Generates 20 high-fidelity fictional civic grievances, issues, evidence attachments,
and audit logs across diverse municipal zones in Pune, Maharashtra (PMC & PCMC).
"""

from datetime import datetime, timedelta
import uuid
from app.models.domain import (
    CivicIssue, CivicReport, IssueCategory, IssueStatus, PriorityLevel,
    IssueLocation, EvidenceAttachment, EvidenceType, StatusHistory, UserRole
)
from app.services.priority_service import priority_engine
from app.services.routing_service import routing_service
from app.services.duplicate_service import duplicate_service
from app.core.database import db

# Curated fictional issues across Pune municipal wards (PMC & PCMC)
SEED_RECORDS = [
    {
        "code": "CVL-2026-101",
        "title": "Severe deep pothole causing two-wheeler skids on main arterial corridor",
        "description": "Deep asphalt crater measuring approximately 2.5 feet wide and 8 inches deep right in the center lane. Several motorcycle commuters have skidded during evening peak hours. Immediate patchwork repair required.",
        "category": IssueCategory.ROADS_INFRASTRUCTURE,
        "address": "Near Syngenta Chowk, Baner High Street",
        "locality": "Baner",
        "ward": "Ward 9 (Baner - Balewadi)",
        "lat": 18.5590,
        "lng": 73.7868,
        "status": IssueStatus.ASSIGNED,
        "reporter": "Arjun Deshmukh",
        "days_ago": 2,
        "is_recurring": True,
        "recurrence_count": 3,
        "recurrence_notes": "Repeated asphalt degradation at same stormwater crossover point on Baner Road.",
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-102",
        "title": "Hazardous open storm drain manhole near Sassoon General Hospital entrance",
        "description": "Concrete manhole lid has shattered, leaving an exposed 4-foot deep stormwater opening on the pedestrian sidewalk. Extremely dangerous for patients, elderly pedestrians, and emergency ambulances.",
        "category": IssueCategory.DRAINAGE_FLOODING,
        "address": "Hospital Main Gate, Station Road",
        "locality": "Shivajinagar",
        "ward": "Ward 7 (Ghole Road - Shivajinagar)",
        "lat": 18.5284,
        "lng": 73.8742,
        "status": IssueStatus.IN_PROGRESS,
        "reporter": "Dr. Sunita Kulkarni",
        "days_ago": 1,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-103",
        "title": "Remediated streetlight pole replacement awaiting final municipal inspection",
        "description": "Faulty luminaire and exposed junction box reported by citizens. Field electrical crew has installed new LED luminaire and insulated wiring. Ready for visual verification sign-off.",
        "category": IssueCategory.STREETLIGHTING,
        "address": "Lane 4, Near Vanaz Metro Station, Paud Road",
        "locality": "Kothrud",
        "ward": "Ward 12 (Kothrud - Bavdhan)",
        "lat": 18.5074,
        "lng": 73.8077,
        "status": IssueStatus.AWAITING_VERIFICATION,
        "reporter": "Pooja Joshi",
        "days_ago": 3,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": True
    },
    {
        "code": "CVL-2026-104",
        "title": "Chronic garbage dump accumulation behind community shopping complex",
        "description": "Massive overflow of non-segregated municipal solid waste blocking public footpath. Foul odor and stray dog menace affecting residential apartments adjacent to the alleyway.",
        "category": IssueCategory.SOLID_WASTE,
        "address": "Behind Market Complex, Paud Road",
        "locality": "Kothrud",
        "ward": "Ward 12 (Kothrud - Bavdhan)",
        "lat": 18.5078,
        "lng": 73.8080,
        "status": IssueStatus.UNDER_REVIEW,
        "reporter": "Vikram Gokhale",
        "days_ago": 4,
        "is_recurring": True,
        "recurrence_count": 4,
        "recurrence_notes": "Illegal dumping black-spot recurring every weekend near vegetable market.",
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-105",
        "title": "High-pressure potable drinking water pipeline leak flooding street",
        "description": "Major underground distribution pipe rupture gushing clean potable water onto road surface. Hundreds of gallons wasted per hour while nearby tenements experience zero water pressure.",
        "category": IssueCategory.WATER_SUPPLY,
        "address": "DP Road, Near Bremen Chowk",
        "locality": "Aundh",
        "ward": "Ward 10 (Aundh - Bopodi)",
        "lat": 18.5626,
        "lng": 73.8087,
        "status": IssueStatus.IN_PROGRESS,
        "reporter": "Nitin Shinde",
        "days_ago": 1,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-106",
        "title": "Traffic signal timer stuck on permanent red at busy four-way junction",
        "description": "Automated traffic light controller malfunction causing perpetual red signal in northbound direction, creating gridlock and bumper-to-bumper vehicle jams for 2 kilometers.",
        "category": IssueCategory.TRAFFIC_SIGNALS,
        "address": "Jedhe Chowk / Swargate Junction",
        "locality": "Swargate",
        "ward": "Ward 15 (Kasba - Swargate)",
        "lat": 18.5018,
        "lng": 73.8586,
        "status": IssueStatus.ASSIGNED,
        "reporter": "Karan Singhania",
        "days_ago": 1,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-107",
        "title": "Broken children swing set and rusted slide at municipal public garden",
        "description": "Heavy rusted chain on play swing has snapped; sharp jagged edge exposed. Dangerous hazard for toddlers and neighborhood children visiting the park.",
        "category": IssueCategory.PUBLIC_PARKS,
        "address": "Pu La Deshpande Garden, Sinhagad Road",
        "locality": "Sinhagad Road",
        "ward": "Ward 13 (Sinhagad Road - Anandnagar)",
        "lat": 18.4905,
        "lng": 73.8341,
        "status": IssueStatus.RESOLVED,
        "reporter": "Meera Chitale",
        "days_ago": 7,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": True,
        "feedback_rating": 5,
        "feedback_comment": "Replaced with brand new heavy-duty chain within 48 hours. Excellent prompt action by PMC Garden dept!"
    },
    {
        "code": "CVL-2026-108",
        "title": "Severe road crater near Baner Road flyover descent",
        "description": "Dangerous pothole directly on the descending ramp from Baner flyover towards Balewadi Phata. Sharp rim bursting tires of high-speed vehicles.",
        "category": IssueCategory.ROADS_INFRASTRUCTURE,
        "address": "Flyover Ramp, Baner Main Road",
        "locality": "Baner",
        "ward": "Ward 9 (Baner - Balewadi)",
        "lat": 18.5593,
        "lng": 73.7872,
        "status": IssueStatus.SUBMITTED,
        "reporter": "Siddharth Phadke",
        "days_ago": 0,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-109",
        "title": "Clogged stormwater inlet causing 1-foot waterlogging during evening showers",
        "description": "Plastic bottles and leaves choking the street gutter grate. Water backing up into shop entrances along FC Road.",
        "category": IssueCategory.DRAINAGE_FLOODING,
        "address": "Near Goodluck Chowk, Fergusson College Road",
        "locality": "Deccan Gymkhana",
        "ward": "Ward 8 (Deccan Gymkhana)",
        "lat": 18.5186,
        "lng": 73.8415,
        "status": IssueStatus.ASSIGNED,
        "reporter": "Rashid Inamdar",
        "days_ago": 3,
        "is_recurring": True,
        "recurrence_count": 2,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-110",
        "title": "Continuous sewage overflow spilling onto primary school approach road",
        "description": "Underground sewer manhole spewing foul wastewater across the approach lane leading into St. Vincent's High School approach. Children forced to walk through contaminated runoff.",
        "category": IssueCategory.DRAINAGE_FLOODING,
        "address": "School Access Road, Camp",
        "locality": "Pune Camp",
        "ward": "Pune Cantonment Division",
        "lat": 18.5167,
        "lng": 73.8792,
        "status": IssueStatus.IN_PROGRESS,
        "reporter": "Father Joseph D'Souza",
        "days_ago": 1,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-111",
        "title": "Three consecutive non-functioning streetlights creating unsafe dark corridor",
        "description": "Entire 200-meter residential stretch pitch black after sunset. Senior citizens unable to walk, safety concern for evening commuters returning from metro.",
        "category": IssueCategory.STREETLIGHTING,
        "address": "North Main Road, Lane 5 Junction",
        "locality": "Koregaon Park",
        "ward": "Ward 21 (Koregaon Park - Bund Garden)",
        "lat": 18.5362,
        "lng": 73.8938,
        "status": IssueStatus.RESOLVED,
        "reporter": "Sneha Apte",
        "days_ago": 5,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": True,
        "feedback_rating": 4,
        "feedback_comment": "Lights are working well now. Appreciate the swift turnaround by MSEDCL and PMC."
    },
    {
        "code": "CVL-2026-112",
        "title": "Illegal construction debris dumped along riverside walking promenade",
        "description": "Truckload of demolished concrete blocks, rebar, and dry plaster dumped overnight along the riverfront jogging track. Obstructing morning walkers.",
        "category": IssueCategory.SOLID_WASTE,
        "address": "Mula-Mutha Riverfront Promenade, Bund Garden Road",
        "locality": "Koregaon Park",
        "ward": "Ward 21 (Koregaon Park - Bund Garden)",
        "lat": 18.5375,
        "lng": 73.8890,
        "status": IssueStatus.AWAITING_VERIFICATION,
        "reporter": "Ramesh Kelkar",
        "days_ago": 2,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": True
    },
    {
        "code": "CVL-2026-113",
        "title": "Contaminated brownish tap water with pungent chemical odor",
        "description": "Water supplied through municipal tap lines since yesterday morning is turbid brown with oily odor. Suspected cross-contamination with broken sewer line.",
        "category": IssueCategory.WATER_SUPPLY,
        "address": "Galli 3, Kondhwa Khurd Main Road",
        "locality": "Kondhwa",
        "ward": "Ward 18 (Kondhwa - Wanowrie)",
        "lat": 18.4795,
        "lng": 73.8920,
        "status": IssueStatus.ASSIGNED,
        "reporter": "Ayesha Qureshi",
        "days_ago": 1,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-114",
        "title": "Massive tree branch hanging precariously above electrical transformer",
        "description": "Large dead bough of old banyan tree cracked during storm and resting directly on 11kV step-down transformer wires. Fire hazard imminent.",
        "category": IssueCategory.PUBLIC_PARKS,
        "address": "Near Post Office, Jangali Maharaj Road",
        "locality": "Shivajinagar",
        "ward": "Ward 7 (Ghole Road - Shivajinagar)",
        "lat": 18.5250,
        "lng": 73.8480,
        "status": IssueStatus.IN_PROGRESS,
        "reporter": "Gopal Ranade",
        "days_ago": 0,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-115",
        "title": "Faded pedestrian zebra crossing markings outside central metro station",
        "description": "Road crossing stripes completely eroded due to traffic wear. Pedestrians unable to safely cross busy road with fast turning vehicles.",
        "category": IssueCategory.TRAFFIC_SIGNALS,
        "address": "Civil Court Metro Interchange Exit Gate 1",
        "locality": "Shivajinagar",
        "ward": "Ward 7 (Ghole Road - Shivajinagar)",
        "lat": 18.5298,
        "lng": 73.8568,
        "status": IssueStatus.UNDER_REVIEW,
        "reporter": "Ananya Kulkarni",
        "days_ago": 5,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-116",
        "title": "Overfilled street corner dustbins overflowing onto vehicular carriageway",
        "description": "Community bins packed beyond capacity with domestic trash spilling over a 15-meter radius across the road corner near Paud Road market.",
        "category": IssueCategory.SOLID_WASTE,
        "address": "Near Paud Road Vegetable Market, Kothrud",
        "locality": "Kothrud",
        "ward": "Ward 12 (Kothrud - Bavdhan)",
        "lat": 18.5076,
        "lng": 73.8079,
        "status": IssueStatus.SUBMITTED,
        "reporter": "Tanya Marathe",
        "days_ago": 0,
        "is_recurring": True,
        "recurrence_count": 3,
        "recurrence_notes": "Garbage collection vehicle skips morning pickup cycle routinely.",
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-117",
        "title": "Deep asphalt trench left unfilled after utility optical fiber digging",
        "description": "Broad trench 15 meters long dug across residential avenue left unpaved with gravel heaps. Vehicle underbellies scraping daily.",
        "category": IssueCategory.ROADS_INFRASTRUCTURE,
        "address": "Kunad Road, Near Linear Garden",
        "locality": "Pimple Saudagar",
        "ward": "PCMC Ward 27 (Pimple Saudagar)",
        "lat": 18.5987,
        "lng": 73.7997,
        "status": IssueStatus.ASSIGNED,
        "reporter": "Deepak More",
        "days_ago": 4,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-118",
        "title": "Low water pressure in municipal pipeline serving senior citizen housing",
        "description": "Pressure drop lasting 6 days; overhead tanks unable to fill without private booster pumps. Multiple elderly residents facing drinking water crisis.",
        "category": IssueCategory.WATER_SUPPLY,
        "address": "Sahakarnagar Colony, Off Pune-Satara Road",
        "locality": "Swargate",
        "ward": "Ward 15 (Kasba - Swargate)",
        "lat": 18.4920,
        "lng": 73.8540,
        "status": IssueStatus.UNDER_REVIEW,
        "reporter": "Capt. Prabhakar Dixit",
        "days_ago": 6,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": False
    },
    {
        "code": "CVL-2026-119",
        "title": "Flickering high-mast sodium light pole causing strobe glare for drivers",
        "description": "High mast luminaire at rotary circle switching on and off every 3 seconds like a strobe light, disorienting night drivers entering roundabout.",
        "category": IssueCategory.STREETLIGHTING,
        "address": "Alka Talkies Chowk Roundabout",
        "locality": "Deccan Gymkhana",
        "ward": "Ward 8 (Deccan Gymkhana)",
        "lat": 18.5150,
        "lng": 73.8450,
        "status": IssueStatus.RESOLVED,
        "reporter": "Varun Kadam",
        "days_ago": 8,
        "is_recurring": False,
        "recurrence_count": 1,
        "has_original_img": True,
        "has_resolution_img": True,
        "feedback_rating": 4,
        "feedback_comment": "Ballast replaced by electrical squad. Steady illumination restored."
    },
    {
        "code": "CVL-2026-120",
        "title": "Collapsed stone culvert slab causing dangerous gap on school van route",
        "description": "Stone masonry slab bridging roadside drainage ditch has caved in under heavy vehicle weight. School minibuses unable to pass safely.",
        "category": IssueCategory.ROADS_INFRASTRUCTURE,
        "address": "Near Hinjawadi Bridge, Phase 1 Access Road",
        "locality": "Hinjawadi",
        "ward": "PCMC / Hinjawadi Zone",
        "lat": 18.5920,
        "lng": 73.7395,
        "status": IssueStatus.IN_PROGRESS,
        "reporter": "Suresh Bhosale",
        "days_ago": 2,
        "is_recurring": True,
        "recurrence_count": 2,
        "has_original_img": True,
        "has_resolution_img": False
    }
]


def seed_database():
    """Populates in-memory database with representative Pune issues and relationships."""
    if len(db.issues) > 0:
        return

    now = datetime.utcnow()

    for idx, rec in enumerate(SEED_RECORDS):
        issue_id = f"iss-{rec['code'].lower()}"
        report_id = f"rep-{rec['code'].lower()}"
        created_dt = now - timedelta(days=rec["days_ago"], hours=idx % 8)

        # Department routing recommendation
        dept_info = routing_service.recommend_department(
            category=rec["category"],
            locality=rec["locality"],
            ward=rec["ward"]
        )

        location = IssueLocation(
            address=rec["address"],
            locality=rec["locality"],
            ward=rec["ward"],
            latitude=rec["lat"],
            longitude=rec["lng"],
            landmark=f"Near {rec['locality']} Landmark"
        )

        # Create linked citizen report
        report = CivicReport(
            id=report_id,
            tracking_code=f"TRK-{rec['code'][-3:]}-{idx + 10}",
            title=rec["title"],
            description=rec["description"],
            category=rec["category"],
            ai_suggested_category=rec["category"],
            location=location,
            reported_by_name=rec["reporter"],
            reported_by_contact=f"{rec['reporter'].lower().replace(' ', '.')}@example.com",
            submitted_at=created_dt,
            images=[f"https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80"] if rec.get("has_original_img") else [],
            upvotes=2 + (idx % 5),
            linked_issue_id=issue_id
        )
        db.add_report(report)

        # Calculate explainable priority score
        priority = priority_engine.calculate_priority(
            category=rec["category"],
            title=rec["title"],
            description=rec["description"],
            latitude=rec["lat"],
            longitude=rec["lng"],
            report_count=1 + (1 if rec.get("is_recurring") else 0),
            confirmations=report.upvotes,
            evidence_count=1 if rec.get("has_original_img") else 0,
            hours_open=rec["days_ago"] * 24.0
        )

        # Build Status History
        hist = [
            StatusHistory(
                id=str(uuid.uuid4())[:8],
                from_status=None,
                to_status=IssueStatus.SUBMITTED,
                changed_by=rec["reporter"],
                role=UserRole.CITIZEN,
                timestamp=created_dt,
                reason="Citizen grievance registered via CivicLens mobile portal"
            )
        ]

        if rec["status"] in [IssueStatus.UNDER_REVIEW, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.AWAITING_VERIFICATION, IssueStatus.RESOLVED]:
            hist.append(
                StatusHistory(
                    id=str(uuid.uuid4())[:8],
                    from_status=IssueStatus.SUBMITTED,
                    to_status=IssueStatus.UNDER_REVIEW,
                    changed_by="Control Desk Triage",
                    role=UserRole.OPERATOR,
                    timestamp=created_dt + timedelta(hours=2),
                    reason="Automated triage completed; validated geo-coordinates"
                )
            )

        if rec["status"] in [IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.AWAITING_VERIFICATION, IssueStatus.RESOLVED]:
            hist.append(
                StatusHistory(
                    id=str(uuid.uuid4())[:8],
                    from_status=IssueStatus.UNDER_REVIEW,
                    to_status=IssueStatus.ASSIGNED,
                    changed_by="Dispatcher Pawar",
                    role=UserRole.OPERATOR,
                    timestamp=created_dt + timedelta(hours=5),
                    reason=f"Routed to {dept_info['department_name']}"
                )
            )

        if rec["status"] in [IssueStatus.IN_PROGRESS, IssueStatus.AWAITING_VERIFICATION, IssueStatus.RESOLVED]:
            hist.append(
                StatusHistory(
                    id=str(uuid.uuid4())[:8],
                    from_status=IssueStatus.ASSIGNED,
                    to_status=IssueStatus.IN_PROGRESS,
                    changed_by=dept_info["recommended_officer"],
                    role=UserRole.OPERATOR,
                    timestamp=created_dt + timedelta(hours=12),
                    reason="Field engineering squad mobilized to site"
                )
            )

        if rec["status"] in [IssueStatus.AWAITING_VERIFICATION, IssueStatus.RESOLVED]:
            hist.append(
                StatusHistory(
                    id=str(uuid.uuid4())[:8],
                    from_status=IssueStatus.IN_PROGRESS,
                    to_status=IssueStatus.AWAITING_VERIFICATION,
                    changed_by="Field Crew Lead",
                    role=UserRole.OPERATOR,
                    timestamp=created_dt + timedelta(hours=28),
                    reason="Remediation work executed. Resolution photographic evidence uploaded."
                )
            )

        if rec["status"] == IssueStatus.RESOLVED:
            hist.append(
                StatusHistory(
                    id=str(uuid.uuid4())[:8],
                    from_status=IssueStatus.AWAITING_VERIFICATION,
                    to_status=IssueStatus.RESOLVED,
                    changed_by="Senior Quality Reviewer",
                    role=UserRole.REVIEWER,
                    timestamp=created_dt + timedelta(hours=34),
                    reason="Verified field repair meets municipal safety standards. Closed ticket."
                )
            )

        # Evidence Attachments
        evidence = []
        if rec.get("has_original_img"):
            evidence.append(
                EvidenceAttachment(
                    id=f"evi-orig-{idx}",
                    evidence_type=EvidenceType.ORIGINAL,
                    file_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
                    description=f"Initial grievance photo submitted by citizen: {rec['title'][:40]}",
                    uploaded_by=rec["reporter"],
                    uploaded_at=created_dt
                )
            )
        if rec.get("has_resolution_img"):
            evidence.append(
                EvidenceAttachment(
                    id=f"evi-res-{idx}",
                    evidence_type=EvidenceType.RESOLUTION,
                    file_url="https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80",
                    description="Field repair completion photo: site restored and cleared.",
                    uploaded_by="Field Crew Lead",
                    uploaded_at=created_dt + timedelta(hours=26),
                    confidence_score=0.88,
                    verification_notes="Structural remediation confirmed by site engineer."
                )
            )

        issue = CivicIssue(
            id=issue_id,
            issue_code=rec["code"],
            title=rec["title"],
            description=rec["description"],
            category=rec["category"],
            category_human_verified=True,
            status=rec["status"],
            priority=priority,
            location=location,
            assigned_department_id=dept_info["department_id"],
            assigned_department_name=dept_info["department_name"],
            assigned_officer=dept_info["recommended_officer"],
            created_at=created_dt,
            updated_at=created_dt + timedelta(hours=10),
            sla_deadline=created_dt + timedelta(hours=priority.sla_deadline_hours),
            reports_count=1 + (1 if rec.get("is_recurring") else 0),
            linked_report_ids=[report_id],
            status_history=hist,
            evidence=evidence,
            community_confirmations=report.upvotes,
            is_recurring=rec.get("is_recurring", False),
            recurrence_count=rec.get("recurrence_count", 1),
            recurrence_notes=rec.get("recurrence_notes"),
            citizen_feedback_rating=rec.get("feedback_rating"),
            citizen_feedback_comment=rec.get("feedback_comment")
        )

        db.add_issue(issue)

    # Post-process duplicate candidates among seeded issues
    all_issues = db.get_all_issues()
    for issue in all_issues:
        candidates = duplicate_service.find_duplicate_candidates(
            new_title=issue.title,
            new_description=issue.description,
            new_category=issue.category,
            new_lat=issue.location.latitude,
            new_lng=issue.location.longitude,
            existing_issues=[other for other in all_issues if other.id != issue.id]
        )
        issue.duplicate_candidates = candidates


# Initialize seeds on import
seed_database()
