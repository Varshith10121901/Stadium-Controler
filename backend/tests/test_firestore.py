# backend/tests/test_firestore.py
"""
SwarmAI — Firestore & Gemini Integration Tests
Tests for Firebase Firestore metrics endpoint and Gemini structured JSON outputs.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app

client = TestClient(app)


# ── Firestore Route Tests ─────────────────────────────────────────────────────

def test_save_swarm_metrics_offline():
    """When Firebase is offline (db=None), endpoint should return skipped status."""
    with patch("app.routes.firestore.db", None):
        response = client.post("/api/save-swarm-metrics", json={
            "total_agents": 1250,
            "avg_wait_seconds": 45.5,
            "global_congestion": 67.3,
            "active_nodes": 890,
            "negotiation_count": 342,
            "heatmap": {"zone_a": 0.8, "zone_b": 0.4}
        })
    assert response.status_code == 200
    assert response.json()["status"] == "skipped"


def test_save_swarm_metrics_with_mock_db():
    """When Firebase is available, endpoint should write to Firestore and return success."""
    mock_db = MagicMock()
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "test_doc_123"
    mock_db.collection.return_value.document.return_value = mock_doc_ref

    with patch("app.routes.firestore.db", mock_db):
        response = client.post("/api/save-swarm-metrics", json={
            "total_agents": 1000,
            "avg_wait_seconds": 30.0,
            "global_congestion": 45.0,
            "active_nodes": 750,
            "negotiation_count": 200,
            "heatmap": {}
        })

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["doc_id"] == "test_doc_123"
    mock_db.collection.assert_called_with("swarm_metrics")


def test_save_swarm_metrics_partial_data():
    """Endpoint should handle partial/missing metric fields without crashing."""
    with patch("app.routes.firestore.db", None):
        response = client.post("/api/save-swarm-metrics", json={
            "total_agents": 500
            # other fields missing — should use defaults
        })
    assert response.status_code == 200


# ── Gemini Structured Output Tests ───────────────────────────────────────────

def test_swarm_suggest_fallback_returns_required_fields():
    """Without API key, swarm-suggest must return a valid suggestion string."""
    with patch("app.routes.gemini.GOOGLE_API_KEY", ""):
        response = client.post("/api/swarm-suggest", json={
            "user_seat": "Section 12, Row G, Seat 45",
            "destination": "East Food Court",
            "density_map": {"north": 0.7, "east": 1.8, "south": 4.2},
            "current_wait_times": {"food_east": 3, "food_west": 12}
        })
    assert response.status_code == 200
    data = response.json()
    assert "suggestion" in data
    assert len(data["suggestion"]) > 10


def test_density_analysis_fallback():
    """Without API key, analyze-density should return safe fallback message."""
    with patch("app.routes.gemini.GOOGLE_API_KEY", ""):
        response = client.post("/api/analyze-density", json={
            "zone_densities": {"north": 0.8, "south": 5.5, "east": 2.1},
            "total_agents": 1500,
            "hotspot_zones": ["south"],
            "flow_efficiency": 72.5
        })
    assert response.status_code == 200
    data = response.json()
    assert "analysis" in data
    assert "risk_level" in data


def test_gemini_chat_with_congestion_context():
    """Chat endpoint should provide routing action for food queries."""
    with patch("app.routes.gemini.GOOGLE_API_KEY", ""):
        response = client.post("/api/chat", json={
            "message": "Where can I get food?",
            "seat_x": 12.5,
            "seat_z": -8.3,
            "context": "high congestion detected in south corridor"
        })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert data.get("suggested_action") == "route_food"


def test_gemini_chat_emergency_exit():
    """Chat endpoint should detect emergency/exit queries and provide route_exit action."""
    with patch("app.routes.gemini.GOOGLE_API_KEY", ""):
        response = client.post("/api/chat", json={
            "message": "I need to exit the stadium immediately",
            "seat_x": 0.0,
            "seat_z": 0.0
        })
    assert response.status_code == 200
    data = response.json()
    assert data.get("suggested_action") == "route_exit"


def test_density_analysis_risk_level_critical():
    """Without API key, risk_level should default to 'unknown' in fallback."""
    with patch("app.routes.gemini.GOOGLE_API_KEY", ""):
        response = client.post("/api/analyze-density", json={
            "zone_densities": {"gate_a": 7.2},   # LoS F — crush risk
            "total_agents": 2000,
            "hotspot_zones": ["gate_a"],
            "flow_efficiency": 15.0
        })
    assert response.status_code == 200
    # In fallback mode risk is unknown, in live mode Gemini would say 'critical'
    assert response.json()["risk_level"] in ["unknown", "critical", "high"]
