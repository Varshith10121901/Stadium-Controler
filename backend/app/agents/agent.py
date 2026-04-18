"""
SwarmAI Agent — Individual Swarm Node
=====================================
Each agent represents one attendee's device in the decentralized swarm.
Agents have:
  - Position & velocity in stadium grid
  - Goal (seat, concession, restroom, exit)
  - Preference profile (speed vs comfort vs social)
  - Group (Pod) ID for keep-together routing
  - Simple reinforcement learning: adjusts behavior based on reward signals
  - Game-theory utility function for negotiation with neighbors

Privacy-first: agents use anonymized IDs, no personal data stored.
"""

import random
import math
import uuid
from typing import Optional

from ..utils.stadium import (
    GATES, CONCESSIONS, RESTROOMS, SECTIONS,
    get_nearest_zone, distance, STADIUM_CENTER,
    STADIUM_MAJOR_RADIUS, STADIUM_MINOR_RADIUS, is_inside_stadium
)


# ── Agent Configuration ──────────────────────────────────────────────────────
MAX_SPEED = 1.5          # Grid units per tick
NEGOTIATION_RADIUS = 8.0  # How far agents look for negotiation partners
COMFORT_RADIUS = 3.0      # Preferred personal space
LEARNING_RATE = 0.1       # RL learning rate for behavior adjustment


class SwarmAgent:
    """
    A single node in the decentralized swarm.
    Each agent runs locally on an attendee's device (simulated here in backend).
    """

    def __init__(
        self,
        agent_id: Optional[str] = None,
        x: float = 50.0,
        y: float = 50.0,
        goal: str = "seat",
        group_id: Optional[str] = None,
        preference: str = "speed",
        is_real: bool = False,
    ):
        # ── Identity (anonymized) ─────────────────────────────────────────────
        self.agent_id = agent_id or f"agent_{uuid.uuid4().hex[:8]}"
        self.is_real = is_real  # True = real browser tab, False = simulated

        # ── Position & Movement ───────────────────────────────────────────────
        self.x = x
        self.y = y
        self.vx = 0.0  # Velocity X component
        self.vy = 0.0  # Velocity Y component
        self.speed = MAX_SPEED * (0.8 + random.random() * 0.4)  # Slight variation

        # ── Goal ──────────────────────────────────────────────────────────────
        self.goal = goal  # "seat", "concession", "restroom", "exit"
        self.goal_x = 50.0
        self.goal_y = 50.0
        self._assign_goal_position()

        # ── Path ──────────────────────────────────────────────────────────────
        self.path: list[tuple[float, float]] = []  # Waypoints from A*
        self.path_index = 0  # Current waypoint index
        self.status = "moving"  # "moving", "waiting", "arrived"

        # ── Social ────────────────────────────────────────────────────────────
        self.group_id = group_id  # Pod group for keep-together
        self.preference = preference  # "speed", "comfort", "social"

        # ── Swarm Intelligence ────────────────────────────────────────────────
        self.swarm_points = 0
        self.negotiation_count = 0
        self.cooperation_score = 0.5  # How willing to cooperate (0-1)
        self.wait_time = 0.0  # Accumulated wait time in ticks

        # ── Reinforcement Learning State ──────────────────────────────────────
        # Q-values for action selection: {action: expected_reward}
        self.q_values = {
            "go_direct": 0.5,
            "go_alternate": 0.3,
            "wait": 0.1,
            "help_group": 0.4,
        }
        self.last_action = "go_direct"
        self.last_reward = 0.0

    def _assign_goal_position(self):
        """Set the goal coordinates based on goal type."""
        if self.goal == "seat":
            # Pick a random section
            section = random.choice(SECTIONS)
            self.goal_x = section["x"] + random.uniform(-3, 3)
            self.goal_y = section["y"] + random.uniform(-2, 2)
        elif self.goal == "concession":
            # Pick nearest concession stand
            nearest = get_nearest_zone(self.x, self.y, "concession")
            self.goal_x = nearest["x"]
            self.goal_y = nearest["y"]
        elif self.goal == "restroom":
            nearest = get_nearest_zone(self.x, self.y, "restroom")
            self.goal_x = nearest["x"]
            self.goal_y = nearest["y"]
        elif self.goal == "exit":
            nearest = get_nearest_zone(self.x, self.y, "gate")
            self.goal_x = nearest["x"]
            self.goal_y = nearest["y"]

    def set_path(self, path: list[tuple[int, int]]):
        """Update the agent's path from A* computation."""
        self.path = [(float(p[0]), float(p[1])) for p in path]
        self.path_index = 0
        self.status = "moving"

    def update(self, dt: float = 1.0):
        """
        Move the agent one tick along its path.
        
        Args:
            dt: Time delta (1.0 = normal speed)
        """
        if self.status == "arrived":
            return

        if not self.path or self.path_index >= len(self.path):
            # No path or reached end
            dist_to_goal = distance(self.x, self.y, self.goal_x, self.goal_y)
            if dist_to_goal < 2.0:
                self.status = "arrived"
                self.vx = 0
                self.vy = 0
            else:
                # Move directly toward goal as fallback
                self._move_toward(self.goal_x, self.goal_y, dt)
            return

        # Follow path waypoints
        target = self.path[self.path_index]
        dist = distance(self.x, self.y, target[0], target[1])

        if dist < 1.5:
            # Reached waypoint, advance to next
            self.path_index += 1
            if self.path_index >= len(self.path):
                self.status = "arrived"
                self.vx = 0
                self.vy = 0
                return

        target = self.path[min(self.path_index, len(self.path) - 1)]
        self._move_toward(target[0], target[1], dt)

    def _move_toward(self, tx: float, ty: float, dt: float):
        """Move toward target position at agent's speed."""
        dx = tx - self.x
        dy = ty - self.y
        dist = math.sqrt(dx * dx + dy * dy)

        if dist < 0.1:
            self.vx = 0
            self.vy = 0
            return

        # Normalize and apply speed
        move_dist = min(self.speed * dt, dist)
        self.vx = (dx / dist) * move_dist
        self.vy = (dy / dist) * move_dist
        self.x += self.vx
        self.y += self.vy

        # Keep inside stadium bounds
        self.x = max(2, min(98, self.x))
        self.y = max(2, min(98, self.y))

    def calculate_utility(self, proposed_x: float, proposed_y: float, crowd_density: float) -> float:
        """
        Game-theory utility function for negotiation.
        Agents evaluate proposals based on their preference profile.
        
        Utility = w_speed * speed_benefit + w_comfort * comfort_benefit + w_social * social_benefit
        
        Higher utility = agent prefers this proposal.
        """
        # ── Speed benefit: how much closer to goal? ───────────────────────────
        current_dist = distance(self.x, self.y, self.goal_x, self.goal_y)
        proposed_dist = distance(proposed_x, proposed_y, self.goal_x, self.goal_y)
        speed_benefit = (current_dist - proposed_dist) / max(current_dist, 1.0)

        # ── Comfort benefit: avoiding crowds ──────────────────────────────────
        comfort_benefit = 1.0 - crowd_density  # Less crowded = more comfort

        # ── Social benefit: staying near group ────────────────────────────────
        social_benefit = 0.5  # Neutral when no group context

        # ── Weight by preference profile ──────────────────────────────────────
        weights = {
            "speed":   {"speed": 0.7, "comfort": 0.2, "social": 0.1},
            "comfort": {"speed": 0.2, "comfort": 0.6, "social": 0.2},
            "social":  {"speed": 0.2, "comfort": 0.2, "social": 0.6},
        }
        w = weights.get(self.preference, weights["speed"])

        utility = (
            w["speed"] * speed_benefit +
            w["comfort"] * comfort_benefit +
            w["social"] * social_benefit
        )

        return round(utility, 4)

    def negotiate(self, other: 'SwarmAgent', crowd_density: float) -> dict:
        """
        Decentralized negotiation between two agents.
        Uses anonymized position vectors — no personal data exchanged.
        
        Protocol:
        1. Agent A proposes a position swap/adjustment
        2. Agent B evaluates utility
        3. If both benefit (or one benefits without harming other), accept
        
        Returns: negotiation result dict
        """
        self.negotiation_count += 1
        other.negotiation_count += 1

        # ── Generate proposals ────────────────────────────────────────────────
        # Each agent proposes: "what if I move slightly to make room for you?"
        mid_x = (self.x + other.x) / 2
        mid_y = (self.y + other.y) / 2

        # Agent A shifts away from midpoint
        shift_ax = self.x + (self.x - mid_x) * 0.3
        shift_ay = self.y + (self.y - mid_y) * 0.3

        # Agent B shifts away from midpoint
        shift_bx = other.x + (other.x - mid_x) * 0.3
        shift_by = other.y + (other.y - mid_y) * 0.3

        # ── Evaluate utilities ────────────────────────────────────────────────
        my_utility = self.calculate_utility(shift_ax, shift_ay, crowd_density)
        their_utility = other.calculate_utility(shift_bx, shift_by, crowd_density)

        # ── Decision: accept if net utility is positive ───────────────────────
        net_utility = my_utility + their_utility
        accepted = net_utility > 0.05  # Small threshold to avoid trivial trades

        if accepted:
            # Apply the negotiated positions
            self.x = max(2, min(98, shift_ax))
            self.y = max(2, min(98, shift_ay))
            other.x = max(2, min(98, shift_bx))
            other.y = max(2, min(98, shift_by))

            # Reward cooperation
            self.swarm_points += 2
            other.swarm_points += 2
            self.cooperation_score = min(1.0, self.cooperation_score + 0.02)
            other.cooperation_score = min(1.0, other.cooperation_score + 0.02)

            # RL update: reinforce cooperative action
            self._rl_update(reward=0.3)
            other._rl_update(reward=0.3)

        result = {
            "agent_a": self.agent_id,
            "agent_b": other.agent_id,
            "accepted": accepted,
            "net_utility": round(net_utility, 4),
            "my_utility": my_utility,
            "their_utility": their_utility,
            "proposal": f"Spread apart by {round(distance(self.x, other.x, self.y, other.y), 1)} units",
            "outcome": "accepted" if accepted else "rejected",
            "message": (
                f"Agents {self.agent_id[:8]} & {other.agent_id[:8]}: "
                f"{'✅ Cooperated' if accepted else '❌ Declined'} — "
                f"net utility {net_utility:+.3f}"
            )
        }

        return result

    def _rl_update(self, reward: float):
        """
        Simple Q-learning update for the agent's behavior.
        Adjusts action preferences based on reward received.
        
        Q(s,a) ← Q(s,a) + α * (reward - Q(s,a))
        """
        action = self.last_action
        old_q = self.q_values.get(action, 0.0)
        self.q_values[action] = old_q + LEARNING_RATE * (reward - old_q)
        self.last_reward = reward

    def choose_action(self) -> str:
        """
        ε-greedy action selection from Q-values.
        With 10% probability, explore a random action.
        Otherwise, pick the highest-Q action.
        """
        if random.random() < 0.1:
            # Explore
            action = random.choice(list(self.q_values.keys()))
        else:
            # Exploit
            action = max(self.q_values, key=self.q_values.get)

        self.last_action = action
        return action

    def to_dict(self) -> dict:
        """Serialize agent state for API/WebSocket transmission."""
        return {
            "agent_id": self.agent_id,
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "vx": round(self.vx, 2),
            "vy": round(self.vy, 2),
            "velocity": round(math.sqrt(self.vx**2 + self.vy**2), 2),
            "goal": self.goal,
            "goal_x": round(self.goal_x, 2),
            "goal_y": round(self.goal_y, 2),
            "path": [[round(p[0], 1), round(p[1], 1)] for p in self.path[self.path_index:]],
            "group_id": self.group_id,
            "swarm_points": self.swarm_points,
            "wait_time": round(self.wait_time, 1),
            "preference": self.preference,
            "negotiation_count": self.negotiation_count,
            "status": self.status,
            "cooperation_score": round(self.cooperation_score, 2),
            "satisfaction": round(min(1.0, 1.0 - self.wait_time / 120.0), 2),
            "is_real": self.is_real,
            "max_speed": self.speed,
        }

    @staticmethod
    def create_random(goal: Optional[str] = None, group_id: Optional[str] = None) -> 'SwarmAgent':
        """
        Factory: create an agent at a random gate entrance with a random goal.
        Simulates an attendee entering the stadium.
        """
        # Spawn near a random gate
        gate = random.choice(GATES)
        spawn_x = gate["x"] + random.uniform(-4, 4)
        spawn_y = gate["y"] + random.uniform(-2, 2)

        # Random goal if not specified
        if goal is None:
            goal = random.choices(
                ["seat", "concession", "restroom", "exit"],
                weights=[0.5, 0.25, 0.15, 0.1]
            )[0]

        # Random preference
        preference = random.choice(["speed", "comfort", "social"])

        return SwarmAgent(
            x=spawn_x,
            y=spawn_y,
            goal=goal,
            group_id=group_id,
            preference=preference,
        )
