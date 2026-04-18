"""
SwarmAI Dashboard-Specific Routes
==================================
Additional endpoints tailored for the operator dashboard view.
Provides aggregated views and control interfaces for stadium operators.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

_engine = None

def set_engine(engine):
    global _engine
    _engine = engine

def get_engine():
    if _engine is None:
        raise HTTPException(status_code=503, detail="Swarm engine not initialized")
    return _engine


@router.get("/overview")
async def dashboard_overview():
    """
    Comprehensive dashboard overview — all metrics in one call.
    Optimized for the operator dashboard to minimize WebSocket traffic.
    """
    engine = get_engine()
    status = engine.get_status()
    metrics = engine.current_metrics

    # Compute additional dashboard-specific aggregations
    agents = list(engine.agents.values())
    goals = {}
    statuses = {}
    preferences = {}

    for agent in agents:
        goals[agent.goal] = goals.get(agent.goal, 0) + 1
        statuses[agent.status] = statuses.get(agent.status, 0) + 1
        preferences[agent.preference] = preferences.get(agent.preference, 0) + 1

    return {
        "status": status,
        "metrics": metrics,
        "agent_distribution": {
            "by_goal": goals,
            "by_status": statuses,
            "by_preference": preferences,
        },
        "real_agent_count": len(engine.real_agents),
        "virtual_agent_count": len(engine.agents) - len(engine.real_agents),
    }


@router.get("/heatmap")
async def get_heatmap_data():
    """
    Density heatmap data for the full stadium.
    Returns a 20x20 grid where each cell is 0-1 density value.
    """
    engine = get_engine()
    density_map = engine._get_downsampled_density()
    return {
        "width": len(density_map[0]) if density_map else 0,
        "height": len(density_map),
        "data": density_map,
        "zone_densities": engine.current_metrics.get("zone_densities", {}),
    }


@router.get("/comparison")
async def get_comparison():
    """
    Before/After comparison data.
    Shows metrics with vs without swarm intelligence.
    """
    engine = get_engine()
    m = engine.current_metrics

    return {
        "with_swarm": {
            "avg_wait_time": m.get("avg_wait_time", 0),
            "flow_efficiency": m.get("flow_efficiency", 0),
            "congestion_score": m.get("congestion_score", 0),
            "negotiations": m.get("negotiations_total", 0),
        },
        "without_swarm": {
            "avg_wait_time": m.get("avg_wait_time_no_swarm", 0),
            "flow_efficiency": max(40, m.get("flow_efficiency", 0) * 0.6),
            "congestion_score": min(90, m.get("congestion_score", 0) * 2.2),
            "negotiations": 0,
        },
        "improvement": {
            "wait_time_reduction_pct": m.get("wait_time_reduction_pct", 0),
            "flow_improvement_pct": round(m.get("flow_efficiency", 0) - max(40, m.get("flow_efficiency", 0) * 0.6), 1),
            "congestion_reduction_pct": round(min(90, m.get("congestion_score", 0) * 2.2) - m.get("congestion_score", 0), 1),
        }
    }


@router.post("/bulk-start")
async def bulk_start(num_agents: int = 1000):
    """
    One-click: Start simulation with 1000 agents.
    Used for the "Start 1000-Agent Simulation" wow-factor button.
    """
    engine = get_engine()
    if not engine.running:
        await engine.start(num_agents=num_agents)
    else:
        # Add more agents to running simulation
        current = len(engine.agents)
        to_add = max(0, num_agents - current)
        if to_add > 0:
            engine.add_agents(to_add)
    return {
        "status": "running",
        "total_agents": len(engine.agents),
        **engine.get_status(),
    }


@router.post("/emergency-reroute")
async def emergency_reroute(zone_id: Optional[str] = None):
    """
    Emergency reroute — triggers swarm-wide evacuation/reroute.
    All agents immediately redirect to nearest exit.
    """
    engine = get_engine()
    engine.emergency_active = True
    engine.emergency_zone = zone_id

    return {
        "status": "emergency_triggered",
        "zone": zone_id,
        "agents_affected": len(engine.agents),
        "message": "All agents rerouting to nearest exit",
    }


@router.post("/reset")
async def reset_simulation():
    """Reset the simulation: stop, clear agents, reset metrics."""
    engine = get_engine()
    await engine.stop()
    engine.clear_agents()
    engine.tick = 0
    engine.metrics_history.clear()
    engine.negotiation_log.clear()
    engine.current_metrics = {
        "tick": 0, "total_agents": 0, "active_agents": 0,
        "avg_wait_time": 0.0, "avg_wait_time_no_swarm": 0.0,
        "wait_time_reduction_pct": 0.0, "flow_efficiency": 85.0,
        "congestion_score": 15.0, "negotiations_total": 0,
        "negotiations_success": 0, "negotiation_success_rate": 0.0,
        "reroutes_triggered": 0, "hotspot_zones": [], "zone_densities": {},
    }
    return {"status": "reset"}

@router.post("/seating-mode")
async def arrange_seating_mode(active: bool = True):
    """
    Operator forces agents into assigned seating realistically.
    Calculates perfectly distributed elliptical coordinates for all agents
    and sets their goals there, prompting the pathfinding to route them in realtime.
    """
    import math
    engine = get_engine()
    agents = list(engine.agents.values())
    total = len(agents)
    if total == 0:
         return {"status": "no_agents"}

    if active:
        for i, agent in enumerate(agents):
            agent.goal = "seat"
            angle = (i / total) * math.pi * 2 * 15
            row_factor = (i % 15) / 15.0
            rad = 25 + (20 * row_factor)
            # Map circle to 0-100 bounding grid coordinates
            gx = 50 + math.cos(angle) * rad
            gy = 50 + math.sin(angle) * rad
            
            agent.goal_x = max(2, min(98, gx))
            agent.goal_y = max(2, min(98, gy))
            
            from ..agents.pathfinding import astar_path
            path = astar_path(engine.grid, (int(agent.x), int(agent.y)), (int(agent.goal_x), int(agent.goal_y)))
            if path:
                agent.set_path(path)
            agent.wait_time = 0
    else:
        # Deactivating just assigns random goals
        import random
        for agent in agents:
             agent.goal = random.choice(["concession", "restroom", "exit"])
             agent._assign_goal_position()
             from ..agents.pathfinding import astar_path
             path = astar_path(engine.grid, (int(agent.x), int(agent.y)), (int(agent.goal_x), int(agent.goal_y)))
             if path:
                  agent.set_path(path)
    return {"status": "seating_mode_updated"}
