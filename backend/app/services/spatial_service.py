"""CivicLens AI — Spatial Operations Service
Provides coordinate validation, Haversine geodesic distance calculation,
spatial proximity filtering, and bounding box queries for Pune, Maharashtra.
"""

import math
from typing import Tuple, List, Dict, Any


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in meters using Haversine formula."""
    r = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return r * c


def is_within_radius(lat1: float, lon1: float, lat2: float, lon2: float, radius_meters: float) -> bool:
    """Returns True if (lat2, lon2) is within radius_meters of (lat1, lon1)."""
    return haversine_distance_meters(lat1, lon1, lat2, lon2) <= radius_meters


# Known sensitive civic infrastructure nodes in Pune, Maharashtra
SENSITIVE_CIVIC_FACILITIES = [
    {"name": "Sassoon General Hospital & BJ Medical College", "type": "hospital", "lat": 18.5284, "lng": 73.8742, "radius_m": 400},
    {"name": "Fergusson College & Educational Campus", "type": "school", "lat": 18.5222, "lng": 73.8407, "radius_m": 350},
    {"name": "Civil Court Central Metro Interchange Station", "type": "transit", "lat": 18.5298, "lng": 73.8568, "radius_m": 350},
    {"name": "Pune Municipal Corporation (PMC) Main Administrative Bhavan", "type": "civic_hq", "lat": 18.5246, "lng": 73.8553, "radius_m": 500},
    {"name": "Sahyadri Super Speciality Hospital (Deccan Gymkhana)", "type": "hospital", "lat": 18.5135, "lng": 73.8340, "radius_m": 350},
]


def check_nearby_sensitive_facilities(lat: float, lng: float) -> List[Dict[str, Any]]:
    """Identifies sensitive facilities within danger or proximity radius in Pune."""
    nearby = []
    for facility in SENSITIVE_CIVIC_FACILITIES:
        dist = haversine_distance_meters(lat, lng, facility["lat"], facility["lng"])
        if dist <= facility["radius_m"]:
            nearby.append({
                "facility_name": facility["name"],
                "facility_type": facility["type"],
                "distance_meters": round(dist, 1)
            })
    return nearby
