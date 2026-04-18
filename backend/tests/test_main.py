"""
SwarmAI — Core API Tests
==========================
Tests for root, health, stadium, agents, simulation control, and metrics endpoints.
Run with: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════════════════
# Health & Root
# ═══════════════════════════════════════════════════════════════════════════════

class TestHealthEndpoints:
    """Tests for health check and root endpoints."""

    def test_root_returns_200(self):
        response = client.get("/")
        assert response.status_code == 200

    def test_root_contains_app_name(self):
        response = client.get("/")
        data = response.json()
        assert data["app"] == "SwarmAI"
        assert data["version"] == "1.0.0"

    def test_root_contains_status(self):
        response = client.get("/")
        data = response.json()
        assert "status" in data
        assert data["status"] == "running"

    def test_root_contains_simulation_info(self):
        response = client.get("/")
        data = response.json()
        assert "simulation" in data

    def test_health_endpoint(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


# ═══════════════════════════════════════════════════════════════════════════════
# Stadium Layout
# ═══════════════════════════════════════════════════════════════════════════════

class TestStadiumEndpoints:
    """Tests for stadium layout and zone data."""

    def test_get_stadium_layout(self):
        response = client.get("/api/stadium")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_get_all_zones(self):
        response = client.get("/api/stadium/zones")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_filter_zones_by_type(self):
        response = client.get("/api/stadium/zones?zone_type=gate")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for zone in data:
            assert zone["zone_type"] == "gate"

    def test_get_invalid_zone(self):
        response = client.get("/api/stadium/zones/nonexistent_zone_xyz")
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# Agents
# ═══════════════════════════════════════════════════════════════════════════════

class TestAgentEndpoints:
    """Tests for agent listing and management."""

    def test_list_agents(self):
        response = client.get("/api/agents")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "agents" in data
        assert isinstance(data["agents"], list)

    def test_agent_count_matches_list(self):
        response = client.get("/api/agents")
        data = response.json()
        assert data["count"] == len(data["agents"])

    def test_get_nonexistent_agent(self):
        response = client.get("/api/agents/nonexistent_agent_999")
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# Simulation Control
# ═══════════════════════════════════════════════════════════════════════════════

class TestSimulationEndpoints:
    """Tests for simulation control endpoints."""

    def test_simulation_status(self):
        response = client.get("/api/simulation/status")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_toggle_swarm(self):
        response = client.post("/api/simulation/toggle-swarm")
        assert response.status_code == 200
        data = response.json()
        assert "swarm_enabled" in data
        assert isinstance(data["swarm_enabled"], bool)

    def test_set_simulation_speed(self):
        response = client.post("/api/simulation/speed?multiplier=2.0")
        assert response.status_code == 200
        data = response.json()
        assert data["speed_multiplier"] == 2.0

    def test_speed_clamped_to_max(self):
        response = client.post("/api/simulation/speed?multiplier=999.0")
        assert response.status_code == 200
        data = response.json()
        assert data["speed_multiplier"] <= 10.0

    def test_trigger_emergency(self):
        response = client.post("/api/simulation/emergency")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "emergency_triggered"


# ═══════════════════════════════════════════════════════════════════════════════
# Metrics
# ═══════════════════════════════════════════════════════════════════════════════

class TestMetricsEndpoints:
    """Tests for metrics and data export endpoints."""

    def test_get_metrics(self):
        response = client.get("/api/metrics")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_metrics_history(self):
        response = client.get("/api/metrics/history?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "timestamps" in data
        assert "wait_times" in data
        assert "flow_efficiencies" in data

    def test_export_csv(self):
        response = client.get("/api/metrics/export")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")

    def test_get_negotiations(self):
        response = client.get("/api/negotiations?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "negotiations" in data
        assert isinstance(data["negotiations"], list)


# ═══════════════════════════════════════════════════════════════════════════════
# Seat Locking
# ═══════════════════════════════════════════════════════════════════════════════

class TestSeatEndpoints:
    """Tests for seat reservation system."""

    def test_get_locked_seats(self):
        response = client.get("/api/seats/locked")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_lock_a_seat(self):
        response = client.post("/api/seats/lock", json={
            "user_id": "test_user_1",
            "seat_id": "section_A_row_5_seat_12"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["seat_id"] == "section_A_row_5_seat_12"

    def test_seat_conflict(self):
        # First user locks a seat
        client.post("/api/seats/lock", json={
            "user_id": "user_A",
            "seat_id": "conflict_test_seat"
        })
        # Second user tries to lock the same seat
        response = client.post("/api/seats/lock", json={
            "user_id": "user_B",
            "seat_id": "conflict_test_seat"
        })
        assert response.status_code == 409


# ═══════════════════════════════════════════════════════════════════════════════
# Dashboard
# ═══════════════════════════════════════════════════════════════════════════════

class TestDashboardEndpoints:
    """Tests for operator dashboard endpoints."""

    def test_dashboard_overview(self):
        response = client.get("/api/dashboard/overview")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "metrics" in data
        assert "agent_distribution" in data

    def test_heatmap_data(self):
        response = client.get("/api/dashboard/heatmap")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "zone_densities" in data

    def test_comparison_data(self):
        response = client.get("/api/dashboard/comparison")
        assert response.status_code == 200
        data = response.json()
        assert "with_swarm" in data
        assert "without_swarm" in data
        assert "improvement" in data


# ═══════════════════════════════════════════════════════════════════════════════
# Routing / Pathfinding
# ═══════════════════════════════════════════════════════════════════════════════

class TestRoutingEndpoints:
    """Tests for A* pathfinding route computation."""

    def test_route_to_restroom(self):
        response = client.get("/api/routes/path?start_x=50&start_y=50&target_type=restroom")
        assert response.status_code == 200
        data = response.json()
        assert "path" in data

    def test_route_to_concession(self):
        response = client.get("/api/routes/path?start_x=30&start_y=30&target_type=concession")
        assert response.status_code == 200
        data = response.json()
        assert "path" in data

    def test_route_to_gate(self):
        response = client.get("/api/routes/path?start_x=60&start_y=60&target_type=gate")
        assert response.status_code == 200
        data = response.json()
        assert "path" in data
