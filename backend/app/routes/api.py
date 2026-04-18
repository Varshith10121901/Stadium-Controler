"""
SwarmAI REST API Routes
=======================
Endpoints for stadium data, agent management, metrics, and simulation control.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from typing import Optional
from ..utils.stadium import get_stadium_layout, get_zone_by_id, ALL_ZONES
from ..utils.metrics import generate_chat_suggestions, export_metrics_csv

router = APIRouter(prefix="/api", tags=["api"])

# The swarm engine instance is injected via app.state in main.py
_engine = None

def set_engine(engine):
    global _engine
    _engine = engine

def get_engine():
    if _engine is None:
        raise HTTPException(status_code=503, detail="Swarm engine not initialized")
    return _engine


# ── Stadium Endpoints ─────────────────────────────────────────────────────────

@router.get("/stadium")
async def get_stadium():
    """Return the complete stadium layout for frontend rendering."""
    return get_stadium_layout()


@router.get("/stadium/zones")
async def get_zones(zone_type: Optional[str] = None):
    """List all zones, optionally filtered by type."""
    if zone_type:
        return [z for z in ALL_ZONES if z["zone_type"] == zone_type]
    return ALL_ZONES


@router.get("/stadium/zones/{zone_id}")
async def get_zone(zone_id: str):
    """Get details for a specific zone."""
    zone = get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")
    return zone


# ── Agent Endpoints ───────────────────────────────────────────────────────────

@router.get("/agents")
async def list_agents():
    """List all agents in the simulation."""
    engine = get_engine()
    agents = [a.to_dict() for a in engine.agents.values()]
    return {"count": len(agents), "agents": agents}


@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get a specific agent's state."""
    engine = get_engine()
    agent = engine.agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    return agent.to_dict()


@router.post("/agents/register")
async def register_agent(agent_id: str, x: float = 50.0, y: float = 50.0, goal: str = "seat"):
    """Register a real browser-connected agent (multi-tab mode)."""
    engine = get_engine()
    agent = engine.add_real_agent(agent_id, x, y, goal)
    return agent.to_dict()


@router.delete("/agents/{agent_id}")
async def remove_agent(agent_id: str):
    """Remove an agent from the simulation."""
    engine = get_engine()
    engine.remove_agent(agent_id)
    return {"status": "removed", "agent_id": agent_id}


# ── Chat / Suggestions ───────────────────────────────────────────────────────

@router.get("/agents/{agent_id}/suggestions")
async def get_suggestions(agent_id: str):
    """Get AI-powered suggestions for a specific agent."""
    engine = get_engine()
    agent = engine.agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    zone_densities = engine.current_metrics.get("zone_densities", {})
    nearby = sum(1 for a in engine.agents.values()
                 if abs(a.x - agent.x) < 8 and abs(a.y - agent.y) < 8)
    
    suggestions = generate_chat_suggestions(agent.to_dict(), zone_densities, nearby)
    return {"agent_id": agent_id, "suggestions": suggestions}

from pydantic import BaseModel
class SeatLockRequest(BaseModel):
    user_id: str
    seat_id: str

LOCKED_SEATS = {}  # In-memory dictionary matching seat_id -> user_id

@router.get("/seats/locked")
async def get_locked_seats():
    """Return all currently locked seats."""
    return [{"seat_id": k, "user_id": v} for k, v in LOCKED_SEATS.items()]

@router.post("/seats/lock")
async def lock_seat(req: SeatLockRequest):
    """Attempt to lock a seat for a user."""
    # If the user already has a seat, free it up
    keys_to_remove = [k for k, v in LOCKED_SEATS.items() if v == req.user_id]
    for k in keys_to_remove:
        del LOCKED_SEATS[k]

    if req.seat_id in LOCKED_SEATS and LOCKED_SEATS[req.seat_id] != req.user_id:
        raise HTTPException(status_code=409, detail="Seat is already taken by another user.")
    
    LOCKED_SEATS[req.seat_id] = req.user_id
    return {"status": "success", "seat_id": req.seat_id, "user_id": req.user_id}

@router.get("/routes/path")
async def get_route_path(start_x: float, start_y: float, target_type: str):
    """Compute exact routing path from a starting coordinate to a nearest Zone type."""
    from ..utils.stadium import get_nearest_zone
    from ..agents.pathfinding import astar_path
    
    nearest = get_nearest_zone(start_x, start_y, target_type)
    if not nearest:
        raise HTTPException(status_code=404, detail=f"No zone of type {target_type} found.")
    
    engine = get_engine()
    path = astar_path(engine.grid, (int(start_x), int(start_y)), (int(nearest["x"]), int(nearest["y"])))
    if not path:
        return {"path": []}
    
    # Send path formatted appropriately
    return {"path": [[p[0], p[1]] for p in path], "target": nearest}

# ── Simulation Control ───────────────────────────────────────────────────────

@router.post("/simulation/start")
async def start_simulation(num_agents: int = 100):
    """Start the swarm simulation with N agents."""
    engine = get_engine()
    if engine.running:
        return {"status": "already_running", **engine.get_status()}
    await engine.start(num_agents=num_agents)
    return {"status": "started", **engine.get_status()}


@router.post("/simulation/stop")
async def stop_simulation():
    """Stop the simulation."""
    engine = get_engine()
    await engine.stop()
    return {"status": "stopped"}


@router.get("/simulation/status")
async def simulation_status():
    """Get current simulation status."""
    engine = get_engine()
    return engine.get_status()


@router.post("/simulation/add-agents")
async def add_agents(count: int = 50, goal: Optional[str] = None):
    """Add more agents to the running simulation."""
    engine = get_engine()
    engine.add_agents(count, goal=goal)
    return {"status": "added", "count": count, "total": len(engine.agents)}


@router.post("/simulation/toggle-swarm")
async def toggle_swarm():
    """Toggle swarm intelligence on/off (for before/after comparison)."""
    engine = get_engine()
    engine.swarm_enabled = not engine.swarm_enabled
    return {"swarm_enabled": engine.swarm_enabled}


@router.post("/simulation/emergency")
async def trigger_emergency(zone_id: Optional[str] = None):
    """Trigger emergency reroute — all agents head to exits."""
    engine = get_engine()
    engine.emergency_active = True
    engine.emergency_zone = zone_id
    return {"status": "emergency_triggered", "zone": zone_id}


@router.post("/simulation/speed")
async def set_speed(multiplier: float = 1.0):
    """Set simulation speed multiplier (0.1 - 10.0)."""
    engine = get_engine()
    engine.speed_multiplier = max(0.1, min(10.0, multiplier))
    return {"speed_multiplier": engine.speed_multiplier}


# ── Metrics ───────────────────────────────────────────────────────────────────

@router.get("/metrics")
async def get_metrics():
    """Get current metrics snapshot."""
    engine = get_engine()
    return engine.current_metrics


@router.get("/metrics/history")
async def get_metrics_history(limit: int = 100):
    """Get metrics time-series for charts."""
    engine = get_engine()
    history = engine.metrics_history[-limit:]
    
    return {
        "timestamps": [m.get("timestamp", "") for m in history],
        "wait_times": [m.get("avg_wait_time", 0) for m in history],
        "wait_times_no_swarm": [m.get("avg_wait_time_no_swarm", 0) for m in history],
        "flow_efficiencies": [m.get("flow_efficiency", 0) for m in history],
        "congestion_scores": [m.get("congestion_score", 0) for m in history],
        "agent_counts": [m.get("total_agents", 0) for m in history],
    }


@router.get("/metrics/export")
async def export_metrics():
    """Export metrics as CSV for pitch deck."""
    engine = get_engine()
    csv_content = export_metrics_csv(engine.metrics_history)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=swarmai_metrics.csv"}
    )


# ── Negotiation Log ──────────────────────────────────────────────────────────

@router.get("/negotiations")
async def get_negotiations(limit: int = 50):
    """Get recent negotiation messages for debug panel."""
    engine = get_engine()
    return {"negotiations": engine.negotiation_log[-limit:]}
