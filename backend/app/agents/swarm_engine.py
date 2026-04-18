"""
SwarmAI Swarm Engine — The Core Brain
======================================
Orchestrates the decentralized multi-agent simulation.
Every 2 seconds (configurable), agents:
  1. Sense nearby agents (within negotiation radius)
  2. Exchange anonymized position vectors
  3. Negotiate using game-theory utility functions
  4. Run A* pathfinding with crowd-density-aware costs
  5. Update positions and metrics

This engine runs as an asyncio background task inside FastAPI.
Supports 50–2000 virtual agents + real browser-connected agents.
"""

import asyncio
import random
import math
import time
from typing import Optional
from datetime import datetime

from .agent import SwarmAgent, NEGOTIATION_RADIUS
from .pathfinding import Grid, astar_path
from ..utils.stadium import (
    ALL_ZONES, CONCESSIONS, RESTROOMS, GATES,
    get_nearest_zone, distance as stadium_distance
)
from ..utils.metrics import (
    calculate_flow_efficiency, calculate_congestion_score,
    identify_hotspots, calculate_wait_time_baseline,
    calculate_wait_time_swarm
)


class SwarmEngine:
    """
    The decentralized swarm simulation engine.
    Manages all agents, runs negotiation rounds, computes paths, and tracks metrics.
    """

    def __init__(self):
        # ── Agents ────────────────────────────────────────────────────────────
        self.agents: dict[str, SwarmAgent] = {}  # agent_id -> SwarmAgent
        self.real_agents: set[str] = set()  # IDs of browser-connected agents

        # ── Pathfinding Grid ──────────────────────────────────────────────────
        self.grid = Grid(100, 100)

        # ── Simulation State ─────────────────────────────────────────────────
        self.tick = 0
        self.running = False
        self.swarm_enabled = True  # Toggle for before/after comparison
        self.speed_multiplier = 1.0
        self.emergency_active = False
        self.emergency_zone: Optional[str] = None
        self.start_time = time.time()

        # ── Metrics History ──────────────────────────────────────────────────
        self.metrics_history: list[dict] = []
        self.negotiation_log: list[dict] = []  # Last N negotiation messages
        self.max_log_size = 200

        # ── Current Metrics ──────────────────────────────────────────────────
        self.current_metrics = {
            "tick": 0,
            "total_agents": 0,
            "active_agents": 0,
            "avg_wait_time": 0.0,
            "avg_wait_time_no_swarm": 0.0,
            "wait_time_reduction_pct": 0.0,
            "flow_efficiency": 85.0,
            "congestion_score": 15.0,
            "negotiations_total": 0,
            "negotiations_success": 0,
            "negotiation_success_rate": 0.0,
            "reroutes_triggered": 0,
            "hotspot_zones": [],
            "zone_densities": {},
        }

        # ── WebSocket broadcast callback ─────────────────────────────────────
        self._broadcast_callback = None
        self._negotiation_broadcast = None

    def set_broadcast_callback(self, callback):
        """Set the function to broadcast state updates via WebSocket."""
        self._broadcast_callback = callback

    def set_negotiation_broadcast(self, callback):
        """Set the function to broadcast negotiation messages."""
        self._negotiation_broadcast = callback

    # ── Agent Management ──────────────────────────────────────────────────────

    def add_agents(self, count: int, goal: Optional[str] = None, group_id: Optional[str] = None):
        """Spawn N virtual agents at random gates."""
        for _ in range(count):
            agent = SwarmAgent.create_random(goal=goal, group_id=group_id)
            # Compute initial path
            path = astar_path(self.grid, (int(agent.x), int(agent.y)),
                              (int(agent.goal_x), int(agent.goal_y)))
            agent.set_path(path)
            self.agents[agent.agent_id] = agent

    def add_real_agent(self, agent_id: str, x: float, y: float, goal: str = "seat") -> SwarmAgent:
        """Register a real browser-connected agent."""
        agent = SwarmAgent(
            agent_id=agent_id, x=x, y=y, goal=goal, is_real=True
        )
        path = astar_path(self.grid, (int(x), int(y)), (int(agent.goal_x), int(agent.goal_y)))
        agent.set_path(path)
        self.agents[agent_id] = agent
        self.real_agents.add(agent_id)
        return agent

    def remove_agent(self, agent_id: str):
        """Remove an agent from the simulation."""
        self.agents.pop(agent_id, None)
        self.real_agents.discard(agent_id)

    def clear_agents(self):
        """Remove all virtual agents (keep real ones)."""
        virtual_ids = [aid for aid in self.agents if aid not in self.real_agents]
        for aid in virtual_ids:
            del self.agents[aid]

    # ── Simulation Control ────────────────────────────────────────────────────

    async def start(self, num_agents: int = 100):
        """Start the simulation loop."""
        if self.running:
            return

        self.running = True
        self.start_time = time.time()
        self.tick = 0

        # Spawn initial agents
        if len(self.agents) < num_agents:
            self.add_agents(num_agents - len(self.agents))

        # Run simulation loop
        asyncio.create_task(self._simulation_loop())

    async def stop(self):
        """Stop the simulation loop."""
        self.running = False

    async def _simulation_loop(self):
        """
        Main simulation loop.
        Runs every 2 seconds (adjustable with speed_multiplier).
        Each tick:
          1. Update density grid from agent positions
          2. Run decentralized negotiations between nearby agents
          3. Recompute paths for agents that negotiated or need rerouting
          4. Move all agents along their paths
          5. Compute global metrics
          6. Broadcast state to all WebSocket clients
        """
        while self.running:
            tick_start = time.time()
            self.tick += 1

            try:
                # ── Step 1: Update density grid ───────────────────────────────
                agent_dicts = [a.to_dict() for a in self.agents.values()]
                self.grid.update_density_from_agents(agent_dicts)

                # ── Step 2: Decentralized negotiations ────────────────────────
                if self.swarm_enabled:
                    await self._run_negotiations()

                # ── Step 3: Recalculate paths periodically ────────────────────
                if self.tick % 5 == 0:  # Every 5 ticks, refresh paths
                    self._recompute_paths()

                # ── Step 4: Move all agents ───────────────────────────────────
                self._update_agents()

                # ── Step 5: Handle emergency rerouting ────────────────────────
                if self.emergency_active:
                    self._apply_emergency_reroute()

                # ── Step 6: Respawn arrived agents with new goals ─────────────
                self._respawn_arrived_agents()

                # ── Step 7: Compute metrics ───────────────────────────────────
                self._compute_metrics()

                # ── Step 8: Broadcast to WebSocket clients ────────────────────
                if self._broadcast_callback:
                    await self._broadcast_callback({
                        "type": "state_update",
                        "data": {
                            "tick": self.tick,
                            "agents": [a.to_dict() for a in self.agents.values()],
                            "metrics": self.current_metrics,
                            "density_map": self._get_downsampled_density(),
                        }
                    })

            except Exception as e:
                print(f"[SwarmEngine] Tick {self.tick} error: {e}")

            # ── Maintain tick rate ────────────────────────────────────────────
            elapsed = time.time() - tick_start
            sleep_time = max(0.05, (2.0 / self.speed_multiplier) - elapsed)
            await asyncio.sleep(sleep_time)

    async def _run_negotiations(self):
        """
        Decentralized negotiation round.
        Each agent finds nearby agents and attempts to negotiate.
        Agents exchange anonymized position vectors — no personal data.
        """
        agent_list = list(self.agents.values())
        if len(agent_list) < 2:
            return

        negotiations_this_tick = 0
        successes_this_tick = 0

        # Randomly sample pairs to negotiate (limit to prevent O(n²) explosion)
        max_negotiations = min(len(agent_list) * 2, 100)
        random.shuffle(agent_list)

        negotiated = set()  # Track which agents already negotiated this tick

        for i in range(0, min(len(agent_list) - 1, max_negotiations), 2):
            agent_a = agent_list[i]
            if agent_a.agent_id in negotiated:
                continue

            # Find nearest non-negotiated neighbor within radius
            agent_b = None
            min_dist = NEGOTIATION_RADIUS

            for j in range(i + 1, len(agent_list)):
                candidate = agent_list[j]
                if candidate.agent_id in negotiated:
                    continue
                d = stadium_distance(agent_a.x, agent_a.y, candidate.x, candidate.y)
                if d < min_dist:
                    min_dist = d
                    agent_b = candidate

            if agent_b is None:
                continue

            # ── Compute local crowd density ───────────────────────────────────
            local_density = self._get_local_density(agent_a.x, agent_a.y)

            # ── Run negotiation ───────────────────────────────────────────────
            result = agent_a.negotiate(agent_b, local_density)
            negotiations_this_tick += 1
            if result["accepted"]:
                successes_this_tick += 1

            # Log negotiation for debug panel
            self.negotiation_log.append({
                "tick": self.tick,
                "timestamp": datetime.utcnow().isoformat(),
                **result,
            })
            if len(self.negotiation_log) > self.max_log_size:
                self.negotiation_log = self.negotiation_log[-self.max_log_size:]

            # Broadcast negotiation message
            if self._negotiation_broadcast and result["accepted"]:
                await self._negotiation_broadcast(result)

            negotiated.add(agent_a.agent_id)
            negotiated.add(agent_b.agent_id)

        # Update running totals
        self.current_metrics["negotiations_total"] += negotiations_this_tick
        self.current_metrics["negotiations_success"] += successes_this_tick

    def _recompute_paths(self):
        """Recompute A* paths for agents that need updated routes."""
        for agent in self.agents.values():
            if agent.status == "arrived":
                continue
            # Recompute only if agent has traveled far from original path
            # or if crowd density changed significantly
            if agent.path and agent.path_index < len(agent.path):
                # Check if current path cost has increased (congestion appeared)
                path_cost = 0
                for px, py in agent.path[agent.path_index:min(agent.path_index + 5, len(agent.path))]:
                    path_cost += self.grid.get_cost(int(px), int(py))
                if path_cost > 15:  # Path through congested area
                    # Recompute path to avoid congestion
                    new_path = astar_path(
                        self.grid,
                        (int(agent.x), int(agent.y)),
                        (int(agent.goal_x), int(agent.goal_y))
                    )
                    if new_path:
                        agent.set_path(new_path)
                        agent.swarm_points += 1  # Reward for accepting reroute
                        self.current_metrics["reroutes_triggered"] += 1

    def _update_agents(self):
        """Move all agents one tick along their paths."""
        for agent in self.agents.values():
            if agent.status != "arrived":
                agent.update(dt=self.speed_multiplier)
                # Track waiting if stuck near others
                if math.sqrt(agent.vx**2 + agent.vy**2) < 0.1 and agent.status == "moving":
                    agent.wait_time += 1
                    agent.status = "waiting"
                else:
                    agent.status = "moving"

    def _respawn_arrived_agents(self):
        """Give arrived agents new random goals to keep simulation interesting."""
        for agent in self.agents.values():
            if agent.status == "arrived" and not agent.is_real:
                # 30% chance each tick to get a new goal
                if random.random() < 0.3:
                    new_goal = random.choices(
                        ["seat", "concession", "restroom", "exit"],
                        weights=[0.3, 0.35, 0.25, 0.1]
                    )[0]
                    agent.goal = new_goal
                    agent._assign_goal_position()
                    path = astar_path(
                        self.grid,
                        (int(agent.x), int(agent.y)),
                        (int(agent.goal_x), int(agent.goal_y))
                    )
                    agent.set_path(path)
                    agent.wait_time = 0

    def _apply_emergency_reroute(self):
        """
        Emergency mode: reroute ALL agents away from the emergency zone.
        Used for evacuations, security incidents, etc.
        """
        if not self.emergency_zone:
            # Default: reroute everyone to nearest exit
            for agent in self.agents.values():
                agent.goal = "exit"
                agent._assign_goal_position()
                path = astar_path(
                    self.grid,
                    (int(agent.x), int(agent.y)),
                    (int(agent.goal_x), int(agent.goal_y))
                )
                agent.set_path(path)
        self.emergency_active = False  # One-shot

    def _compute_metrics(self):
        """Calculate all metrics for the current tick."""
        agent_dicts = [a.to_dict() for a in self.agents.values()]
        num_agents = len(agent_dicts)
        active = sum(1 for a in agent_dicts if a["status"] != "arrived")

        # Zone densities
        zone_densities = self._compute_zone_densities()

        # Wait times
        avg_wait = sum(a["wait_time"] for a in agent_dicts) / max(num_agents, 1)
        avg_wait_no_swarm = calculate_wait_time_baseline(active, len(CONCESSIONS) + len(RESTROOMS))
        avg_wait_swarm = calculate_wait_time_swarm(active, len(CONCESSIONS) + len(RESTROOMS))

        # Use actual wait time if swarm enabled, baseline if not
        effective_wait = avg_wait_swarm if self.swarm_enabled else avg_wait_no_swarm

        # Flow efficiency
        flow_eff = calculate_flow_efficiency(agent_dicts, ALL_ZONES)

        # Congestion
        congestion = calculate_congestion_score(zone_densities)
        hotspots = identify_hotspots(zone_densities)

        # Negotiation rate
        total_neg = self.current_metrics["negotiations_total"]
        success_neg = self.current_metrics["negotiations_success"]
        neg_rate = (success_neg / max(total_neg, 1)) * 100

        # Wait time reduction
        reduction = 0.0
        if avg_wait_no_swarm > 0:
            reduction = ((avg_wait_no_swarm - effective_wait) / avg_wait_no_swarm) * 100

        self.current_metrics.update({
            "tick": self.tick,
            "timestamp": datetime.utcnow().isoformat(),
            "total_agents": num_agents,
            "active_agents": active,
            "avg_wait_time": round(effective_wait, 1),
            "avg_wait_time_no_swarm": round(avg_wait_no_swarm, 1),
            "wait_time_reduction_pct": round(max(reduction, 0), 1),
            "flow_efficiency": round(flow_eff, 1),
            "congestion_score": round(congestion, 1),
            "negotiation_success_rate": round(neg_rate, 1),
            "hotspot_zones": hotspots,
            "zone_densities": zone_densities,
        })

        # Append to history
        self.metrics_history.append(dict(self.current_metrics))
        if len(self.metrics_history) > 500:
            self.metrics_history = self.metrics_history[-500:]

    def _compute_zone_densities(self) -> dict[str, float]:
        """Compute occupancy/capacity ratio for each zone."""
        zone_counts: dict[str, int] = {}
        zone_caps: dict[str, int] = {}

        for zone in ALL_ZONES:
            zone_counts[zone["id"]] = 0
            zone_caps[zone["id"]] = zone["capacity"]

        for agent in self.agents.values():
            nearest = get_nearest_zone(agent.x, agent.y)
            if nearest:
                zid = nearest["id"]
                if zid in zone_counts:
                    zone_counts[zid] += 1

        densities = {}
        for zid, count in zone_counts.items():
            cap = max(zone_caps.get(zid, 100), 1)
            densities[zid] = round(min(count / cap, 1.0), 3)

        return densities

    def _get_local_density(self, x: float, y: float, radius: float = 5.0) -> float:
        """Get crowd density around a point (0-1)."""
        count = 0
        for agent in self.agents.values():
            if stadium_distance(agent.x, agent.y, x, y) < radius:
                count += 1
        # Normalize: 20+ agents in radius = density 1.0
        return min(count / 20.0, 1.0)

    def _get_downsampled_density(self) -> list[list[float]]:
        """
        Return a 20x20 downsampled density map for efficient WebSocket transmission.
        Each cell represents a 5x5 area of the full grid.
        """
        full_map = self.grid.get_density_map()
        ds = 5  # Downsample factor
        result = []
        for y in range(0, 100, ds):
            row = []
            for x in range(0, 100, ds):
                total = 0
                count = 0
                for dy in range(ds):
                    for dx in range(ds):
                        if y + dy < 100 and x + dx < 100:
                            total += full_map[y + dy][x + dx]
                            count += 1
                row.append(round(total / max(count, 1), 3))
            result.append(row)
        return result

    def get_status(self) -> dict:
        """Return simulation status."""
        return {
            "running": self.running,
            "tick": self.tick,
            "num_agents": len(self.agents),
            "num_real": len(self.real_agents),
            "uptime_seconds": round(time.time() - self.start_time, 1),
            "swarm_enabled": self.swarm_enabled,
            "emergency_active": self.emergency_active,
            "speed_multiplier": self.speed_multiplier,
        }

    def get_metrics_for_export(self) -> list[dict]:
        """Return full metrics history for CSV export."""
        return self.metrics_history
