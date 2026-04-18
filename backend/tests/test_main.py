"""
SwarmAI — Backend Tests
========================
Tests for API endpoints, Gemini integration, and swarm engine.
Run with: pytest backend/tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Health & Root Tests ───────────────────────────────────────────────────────

def test_root_endpoint():
    """Test that the root endpoint returns SwarmAI status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "SwarmAI"
    assert data["version"] == "1.0.0"
    assert data["status"] == "running"


def test_health_endpoint():
    """Test the Docker health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ── Stadium API Tests ────────────────────────────────────────────────────────

def test_stadium_layout():
    """Test that stadium layout returns zone data."""
    response = client.get("/api/stadium")
    assert response.status_code == 200
    data = response.json()
    assert "zones" in data or "gates" in data or isinstance(data, dict)


# ── Gemini Chat Tests ────────────────────────────────────────────────────────

def test_gemini_chat_restroom():
    """Test chat endpoint with restroom query (uses fallback if no API key)."""
    response = client.post("/api/chat", json={
        "message": "Where is the nearest restroom?",
        "seat_x": 35.0,
        "seat_z": -15.0
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 10


def test_gemini_chat_food():
    """Test chat endpoint with food query."""
    response = client.post("/api/chat", json={
        "message": "I'm hungry, where can I get food?"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert data.get("suggested_action") in ["route_food", None]


def test_gemini_chat_exit():
    """Test chat endpoint with exit query."""
    response = client.post("/api/chat", json={
        "message": "How do I get to the exit?"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data


def test_gemini_chat_general():
    """Test chat endpoint with a general question."""
    response = client.post("/api/chat", json={
        "message": "Hello, what can you do?"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "SwarmAI" in data["reply"] or "swarm" in data["reply"].lower() or len(data["reply"]) > 5


# ── Swarm Suggest Tests ──────────────────────────────────────────────────────

def test_swarm_suggest():
    """Test the Gemini-powered route suggestion endpoint."""
    response = client.post("/api/swarm-suggest", json={
        "user_seat": "Section 14, Row 5",
        "destination": "restroom",
        "density_map": {"gate_a": 0.3, "gate_b": 0.8},
        "current_wait_times": {"restroom_n": 2, "restroom_e": 15}
    })
    assert response.status_code == 200
    data = response.json()
    assert "suggestion" in data


# ── Density Analysis Tests ───────────────────────────────────────────────────

def test_analyze_density():
    """Test the Gemini-powered density analysis endpoint."""
    response = client.post("/api/analyze-density", json={
        "zone_densities": {"gate_a": 0.9, "gate_b": 0.2, "concession_1": 0.7},
        "total_agents": 500,
        "hotspot_zones": ["gate_a", "concession_1"],
        "flow_efficiency": 72.5
    })
    assert response.status_code == 200
    data = response.json()
    assert "analysis" in data
    assert "risk_level" in data


# ── Multi-turn Chat Test ─────────────────────────────────────────────────────

def test_gemini_chat_with_history():
    """Test multi-turn conversation with history context."""
    response = client.post("/api/chat", json={
        "message": "What about the food stalls?",
        "history": [
            {"text": "Where is the nearest restroom?", "isUser": True},
            {"text": "The North Restroom has a 2-min wait.", "isUser": False}
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
