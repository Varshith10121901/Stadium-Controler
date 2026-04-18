"""
SwarmAI Stadium Layout Utility
==============================
Defines the stadium geometry, zones, gates, concessions, and pathfinding grid.
Modeled after a real 80,000-capacity cricket/football stadium.
Stadium is represented as a 100x100 coordinate grid for simplicity.
"""

import math
from typing import Optional


# ── Stadium Configuration ─────────────────────────────────────────────────────
STADIUM_NAME = "SwarmAI Arena"
STADIUM_CAPACITY = 80_000
STADIUM_WIDTH = 100.0   # Grid units
STADIUM_HEIGHT = 100.0

# Stadium shape: oval with major radius 48, minor radius 38, centered at (50,50)
STADIUM_CENTER = (50.0, 50.0)
STADIUM_MAJOR_RADIUS = 48.0
STADIUM_MINOR_RADIUS = 38.0


def is_inside_stadium(x: float, y: float) -> bool:
    """Check if a point is inside the oval stadium boundary."""
    cx, cy = STADIUM_CENTER
    return ((x - cx) / STADIUM_MAJOR_RADIUS) ** 2 + ((y - cy) / STADIUM_MINOR_RADIUS) ** 2 <= 1.0


# ── Gates (4 cardinal entry points) ──────────────────────────────────────────
GATES = [
    {"id": "gate_a", "name": "Gate A (EXIT)", "zone_type": "gate", "x": 50.0, "y": 2.73, "width": 10, "height": 4, "capacity": 5000},
    {"id": "gate_b", "name": "Gate B (EAST)", "zone_type": "gate", "x": 2.73, "y": 50.0, "width": 4, "height": 10, "capacity": 5000},
    {"id": "gate_c", "name": "Gate C (MEET)", "zone_type": "gate", "x": 50.0, "y": 97.27, "width": 10, "height": 4, "capacity": 5000},
    {"id": "gate_d", "name": "Gate D (WEST)", "zone_type": "gate", "x": 97.27, "y": 50.0, "width": 4, "height": 10, "capacity": 5000},
]

# ── Concession Stands (Explicit 1-to-1 sync with UI models) ───────────────────
CONCESSIONS = [
    {"id": "concession_1", "name": "Concession 1", "zone_type": "concession", "x": 93.63, "y": 50.0, "width": 4, "height": 4, "capacity": 50},
    {"id": "concession_2", "name": "Concession 2", "zone_type": "concession", "x": 6.36, "y": 50.0, "width": 4, "height": 4, "capacity": 50},
]

# ── Restrooms (Explicit 1-to-1 sync with UI models) ───────────────────────────
RESTROOMS = [
    {"id": "restroom_n", "name": "Restrooms (North)", "zone_type": "restroom", "x": 15.45, "y": 84.54, "width": 3, "height": 3, "capacity": 30},
    {"id": "restroom_e", "name": "Restrooms (East)", "zone_type": "restroom", "x": 84.54, "y": 15.45, "width": 3, "height": 3, "capacity": 30},
]

# ── Seating Sections (16 sections in 4 tiers) ────────────────────────────────
SECTIONS = []
section_names = ["A", "B", "C", "D", "E", "F", "G", "H",
                 "J", "K", "L", "M", "N", "P", "Q", "R"]
for i, name in enumerate(section_names):
    angle = (i / 16) * 2 * math.pi - math.pi / 2
    # Inner ring (closer to field)
    sx = STADIUM_CENTER[0] + (STADIUM_MAJOR_RADIUS - 20) * math.cos(angle)
    sy = STADIUM_CENTER[1] + (STADIUM_MINOR_RADIUS - 16) * math.sin(angle)
    SECTIONS.append({
        "id": f"section_{name}",
        "name": f"Section {name}",
        "zone_type": "section",
        "x": round(sx, 1),
        "y": round(sy, 1),
        "width": 8,
        "height": 6,
        "capacity": 5000,
    })

# ── Corridors / Movement Zones ───────────────────────────────────────────────
# The concourse is a ring between the seating and the outer wall
CORRIDORS = [
    {"id": "concourse_north", "name": "North Concourse", "zone_type": "corridor",
     "x": 50.0, "y": 15.0, "width": 60, "height": 6, "capacity": 2000},
    {"id": "concourse_south", "name": "South Concourse", "zone_type": "corridor",
     "x": 50.0, "y": 85.0, "width": 60, "height": 6, "capacity": 2000},
    {"id": "concourse_east", "name": "East Concourse", "zone_type": "corridor",
     "x": 85.0, "y": 50.0, "width": 6, "height": 60, "capacity": 2000},
    {"id": "concourse_west", "name": "West Concourse", "zone_type": "corridor",
     "x": 15.0, "y": 50.0, "width": 6, "height": 60, "capacity": 2000},
]

# ── All Zones Combined ───────────────────────────────────────────────────────
ALL_ZONES = GATES + CONCESSIONS + RESTROOMS + SECTIONS + CORRIDORS


def get_stadium_layout() -> dict:
    """Return the complete stadium layout as a dictionary."""
    return {
        "name": STADIUM_NAME,
        "capacity": STADIUM_CAPACITY,
        "width": STADIUM_WIDTH,
        "height": STADIUM_HEIGHT,
        "center": STADIUM_CENTER,
        "major_radius": STADIUM_MAJOR_RADIUS,
        "minor_radius": STADIUM_MINOR_RADIUS,
        "zones": ALL_ZONES,
        "gates": GATES,
        "concessions": CONCESSIONS,
        "restrooms": RESTROOMS,
        "sections": SECTIONS,
        "corridors": CORRIDORS,
    }


def get_nearest_zone(x: float, y: float, zone_type: Optional[str] = None) -> dict:
    """Find the nearest zone of a given type to position (x, y)."""
    zones = ALL_ZONES if zone_type is None else [z for z in ALL_ZONES if z["zone_type"] == zone_type]
    if not zones:
        return GATES[0]

    def dist(z):
        return math.sqrt((z["x"] - x) ** 2 + (z["y"] - y) ** 2)

    return min(zones, key=dist)


def get_zone_by_id(zone_id: str) -> Optional[dict]:
    """Lookup a zone by its ID."""
    for z in ALL_ZONES:
        if z["id"] == zone_id:
            return z
    return None


def distance(x1: float, y1: float, x2: float, y2: float) -> float:
    """Euclidean distance between two points."""
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
