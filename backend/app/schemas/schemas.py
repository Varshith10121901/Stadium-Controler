"""
SwarmAI Pydantic Schemas
========================
Request/Response models for the REST API and WebSocket messages.
All models are privacy-first — no personal data fields.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Agent Schemas ─────────────────────────────────────────────────────────────

class AgentPosition(BaseModel):
    """Anonymized agent position — no personal identifiers."""
    agent_id: str
    x: float = Field(..., description="X position in stadium grid (0-100)")
    y: float = Field(..., description="Y position in stadium grid (0-100)")
    zone: str = Field(default="", description="Current zone name")
    goal: str = Field(default="seat", description="Current goal: seat, concession, restroom, exit")
    group_id: Optional[str] = Field(default=None, description="Pod group ID for keep-together routing")
    velocity: float = Field(default=0.0, description="Current movement speed")
    satisfaction: float = Field(default=1.0, description="Agent satisfaction 0-1")


class AgentState(BaseModel):
    """Full agent state for debug/visualization."""
    agent_id: str
    x: float
    y: float
    goal: str
    goal_x: float
    goal_y: float
    path: list[list[float]] = []
    group_id: Optional[str] = None
    swarm_points: int = 0
    wait_time: float = 0.0
    preference: str = "speed"  # speed | comfort | social
    negotiation_count: int = 0
    status: str = "moving"  # moving | waiting | arrived


# ── Metrics Schemas ───────────────────────────────────────────────────────────

class MetricsSnapshot(BaseModel):
    """Real-time metrics for dashboard display."""
    tick: int
    timestamp: str
    total_agents: int
    active_agents: int
    avg_wait_time: float
    avg_wait_time_no_swarm: float
    wait_time_reduction_pct: float
    flow_efficiency: float
    congestion_score: float
    negotiations_total: int
    negotiations_success: int
    negotiation_success_rate: float
    reroutes_triggered: int
    hotspot_zones: list[str] = []
    zone_densities: dict[str, float] = {}


class MetricsHistory(BaseModel):
    """Time-series metrics for charts."""
    timestamps: list[str]
    wait_times: list[float]
    wait_times_no_swarm: list[float]
    flow_efficiencies: list[float]
    congestion_scores: list[float]
    agent_counts: list[int]


# ── Stadium Schemas ───────────────────────────────────────────────────────────

class StadiumZone(BaseModel):
    """A zone in the stadium (gate, concession, restroom, section)."""
    id: str
    name: str
    zone_type: str  # gate, concession, restroom, section, corridor
    x: float
    y: float
    width: float
    height: float
    capacity: int
    current_occupancy: int = 0
    wait_time: float = 0.0  # estimated wait in seconds


class StadiumLayout(BaseModel):
    """Complete stadium layout for frontend rendering."""
    name: str
    capacity: int
    width: float
    height: float
    zones: list[StadiumZone]
    gates: list[StadiumZone]
    concessions: list[StadiumZone]
    restrooms: list[StadiumZone]
    sections: list[StadiumZone]


# ── WebSocket Message Schemas ─────────────────────────────────────────────────

class WSMessage(BaseModel):
    """Generic WebSocket message wrapper."""
    type: str  # "agent_update", "metrics", "negotiation", "emergency", "chat"
    data: dict
    timestamp: str = ""

    def __init__(self, **data):
        super().__init__(**data)
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat()


class NegotiationMessage(BaseModel):
    """A negotiation exchange between two agents (anonymized for debug panel)."""
    tick: int
    agent_a: str
    agent_b: str
    proposal: str
    outcome: str  # "accepted", "rejected", "counter"
    utility_delta: float
    message: str  # Human-readable description


class ChatSuggestion(BaseModel):
    """AI agent suggestion for an attendee."""
    message: str
    action: str
    benefit: str
    confidence: float  # 0-1
    urgency: str = "normal"  # low, normal, high, critical


# ── Simulation Control ───────────────────────────────────────────────────────

class SimulationConfig(BaseModel):
    """Configuration for starting/modifying a simulation."""
    num_agents: int = Field(default=100, ge=10, le=2000)
    speed_multiplier: float = Field(default=1.0, ge=0.1, le=10.0)
    enable_swarm: bool = True
    emergency_mode: bool = False
    emergency_zone: Optional[str] = None


class SimulationStatus(BaseModel):
    """Current state of the simulation engine."""
    running: bool
    tick: int
    num_agents: int
    uptime_seconds: float
    swarm_enabled: bool
    emergency_active: bool
