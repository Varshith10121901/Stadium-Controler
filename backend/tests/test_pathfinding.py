"""
SwarmAI — Pathfinding & Swarm Engine Tests
=============================================
Unit tests for A* pathfinding algorithm and swarm agent logic.
"""

import pytest
from app.agents.pathfinding import Grid, astar_path
from app.agents.agent import SwarmAgent


# ═══════════════════════════════════════════════════════════════════════════════
# A* Pathfinding
# ═══════════════════════════════════════════════════════════════════════════════

class TestPathfinding:
    """Tests for the A* pathfinding algorithm."""

    def test_grid_creation(self):
        grid = Grid(100, 100)
        assert grid.width == 100
        assert grid.height == 100

    def test_grid_walkable_by_default(self):
        grid = Grid(50, 50)
        assert grid.is_walkable(25, 25) is True

    def test_grid_bounds_check(self):
        grid = Grid(100, 100)
        assert grid.is_walkable(-1, -1) is False
        assert grid.is_walkable(100, 100) is False
        assert grid.is_walkable(0, 0) is True
        assert grid.is_walkable(99, 99) is True

    def test_astar_finds_path(self):
        grid = Grid(100, 100)
        path = astar_path(grid, (10, 10), (20, 20))
        assert path is not None
        assert len(path) > 0
        assert path[0] == (10, 10)
        assert path[-1] == (20, 20)

    def test_astar_same_start_end(self):
        grid = Grid(100, 100)
        path = astar_path(grid, (50, 50), (50, 50))
        assert path is not None

    def test_astar_adjacent_cells(self):
        grid = Grid(100, 100)
        path = astar_path(grid, (10, 10), (11, 11))
        assert path is not None
        assert len(path) <= 3

    def test_astar_long_path(self):
        grid = Grid(100, 100)
        path = astar_path(grid, (5, 5), (95, 95))
        assert path is not None
        assert len(path) > 10


# ═══════════════════════════════════════════════════════════════════════════════
# Swarm Agent
# ═══════════════════════════════════════════════════════════════════════════════

class TestSwarmAgent:
    """Tests for the SwarmAgent class."""

    def test_agent_creation(self):
        agent = SwarmAgent(agent_id="test_1", x=50.0, y=50.0, goal="seat")
        assert agent.agent_id == "test_1"
        assert agent.x == 50.0
        assert agent.y == 50.0
        assert agent.goal == "seat"

    def test_agent_to_dict(self):
        agent = SwarmAgent(agent_id="test_2", x=30.0, y=40.0, goal="concession")
        data = agent.to_dict()
        assert isinstance(data, dict)
        assert data["agent_id"] == "test_2"
        assert data["x"] == 30.0
        assert data["y"] == 40.0
        assert data["goal"] == "concession"

    def test_agent_different_goals(self):
        for goal in ["seat", "concession", "restroom", "exit"]:
            agent = SwarmAgent(agent_id=f"goal_{goal}", x=50.0, y=50.0, goal=goal)
            assert agent.goal == goal
