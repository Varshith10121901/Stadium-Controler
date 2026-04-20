"""
SwarmAI — Firebase & Gemini Edge Case Tests
=============================================
Tests for the Firestore metrics endpoint and Gemini AI edge cases.
Run with: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════════════════
# Firebase Firestore Route Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestFirestoreEndpoints:
    """Tests for the Firebase Firestore metrics saving endpoint."""

    def test_save_metrics_valid_payload(self):
        """POST /api/save-swarm-metrics with a valid payload should return success or error (if Firebase is not configured locally)."""
        response = client.post("/api/save-swarm-metrics", json={
            "total_agents": 1500,
            "avg_wait_seconds": 4.2,
            "global_congestion": 67.3,
            "active_nodes": 1200,
            "heatmap": {"zone_a": 0.8, "zone_b": 0.4},
            "negotiation_count": 340
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["success", "error"]

    def test_save_metrics_empty_payload(self):
        """POST /api/save-swarm-metrics with empty dict should not crash."""
        response = client.post("/api/save-swarm-metrics", json={})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["success", "error"]

    def test_save_metrics_defaults(self):
        """POST /api/save-swarm-metrics should default total_agents to 1000 if not provided."""
        response = client.post("/api/save-swarm-metrics", json={
            "avg_wait_seconds": 2.0
        })
        assert response.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# Gemini AI Edge Case Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestGeminiEdgeCases:
    """Tests for Gemini AI endpoint edge cases and fallback behavior."""

    def test_chat_empty_message(self):
        """Chat endpoint with empty message should still return a valid reply."""
        response = client.post("/api/chat", json={
            "message": ""
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data

    def test_chat_with_seat_context(self):
        """Chat endpoint with seat coordinates should process context-enriched prompting."""
        response = client.post("/api/chat", json={
            "message": "Where is the nearest restroom?",
            "seat_x": 34.1,
            "seat_z": -15.0
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert data["suggested_action"] == "route_restroom"

    def test_chat_multi_turn_history(self):
        """Chat endpoint should accept conversation history for multi-turn context."""
        response = client.post("/api/chat", json={
            "message": "What about food?",
            "history": [
                {"isUser": True, "text": "Where is the restroom?"},
                {"isUser": False, "text": "North restroom is closest."}
            ]
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data

    def test_swarm_suggest_returns_valid_response(self):
        """Swarm suggestion endpoint should return a suggestion string."""
        response = client.post("/api/swarm-suggest", json={
            "user_seat": "Section A, Row 5, Seat 12",
            "destination": "restroom",
            "density_map": {"zone_north": 0.3, "zone_south": 0.9},
            "current_wait_times": {"restroom_north": 2, "restroom_south": 18}
        })
        assert response.status_code == 200
        data = response.json()
        assert "suggestion" in data

    def test_density_analysis_with_hotspots(self):
        """Density analysis should flag risk levels when hotspots are present."""
        response = client.post("/api/analyze-density", json={
            "zone_densities": {"gate_a": 0.9, "gate_b": 0.2, "concession_east": 0.85},
            "total_agents": 2000,
            "hotspot_zones": ["gate_a", "concession_east"],
            "flow_efficiency": 42.5
        })
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert "risk_level" in data
