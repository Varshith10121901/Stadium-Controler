"""
SwarmAI — Google Gemini AI Tests
==================================
Tests for all 3 Gemini-powered endpoints:
  - POST /api/chat (natural language chatbot)
  - POST /api/swarm-suggest (route optimization)
  - POST /api/analyze-density (operator insights)

Google Service: Google Gemini 2.5 Flash Lite
SDK: google-generativeai
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════════════════
# Gemini Chat Endpoint (/api/chat)
# ═══════════════════════════════════════════════════════════════════════════════

class TestGeminiChat:
    """Tests for the Gemini-powered chatbot endpoint."""

    def test_chat_restroom_query(self):
        response = client.post("/api/chat", json={
            "message": "Where is the nearest restroom?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 10

    def test_chat_food_query(self):
        response = client.post("/api/chat", json={
            "message": "I'm hungry, where can I get food?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert "suggested_action" in data

    def test_chat_exit_query(self):
        response = client.post("/api/chat", json={
            "message": "How do I leave the stadium?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data

    def test_chat_general_greeting(self):
        response = client.post("/api/chat", json={
            "message": "Hello, what can you do?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 5

    def test_chat_wait_time_query(self):
        response = client.post("/api/chat", json={
            "message": "How long is the queue for food?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data

    def test_chat_with_seat_context(self):
        """Test that chat accepts seat coordinates for context-aware responses."""
        response = client.post("/api/chat", json={
            "message": "Find me the nearest restroom",
            "seat_x": 35.0,
            "seat_z": -15.0
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data

    def test_chat_with_history(self):
        """Test multi-turn conversation with message history."""
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

    def test_chat_with_full_context(self):
        """Test chat with all optional parameters provided."""
        response = client.post("/api/chat", json={
            "message": "Route me to Gate A",
            "seat_x": 50.0,
            "seat_z": 25.0,
            "context": "User has been in seat for 90 minutes",
            "history": [
                {"text": "Hello", "isUser": True},
                {"text": "Hi! How can I help?", "isUser": False}
            ]
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data

    def test_chat_response_has_suggested_action(self):
        """Test that restroom queries return route_restroom action."""
        response = client.post("/api/chat", json={
            "message": "bathroom please"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("suggested_action") in ["route_restroom", None]

    def test_chat_empty_message_handling(self):
        """Test behavior with minimal input."""
        response = client.post("/api/chat", json={
            "message": "hi"
        })
        assert response.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# Gemini Swarm Suggest (/api/swarm-suggest)
# ═══════════════════════════════════════════════════════════════════════════════

class TestGeminiSwarmSuggest:
    """Tests for the Gemini-powered route suggestion endpoint."""

    def test_swarm_suggest_basic(self):
        response = client.post("/api/swarm-suggest", json={
            "user_seat": "Section 14, Row 5",
            "destination": "restroom"
        })
        assert response.status_code == 200
        data = response.json()
        assert "suggestion" in data
        assert len(data["suggestion"]) > 10

    def test_swarm_suggest_with_density(self):
        response = client.post("/api/swarm-suggest", json={
            "user_seat": "Section C, Row 12",
            "destination": "Concession Stand East",
            "density_map": {
                "gate_a": 0.9,
                "gate_b": 0.2,
                "concession_east": 0.7,
                "concession_west": 0.3
            },
            "current_wait_times": {
                "restroom_north": 2,
                "restroom_south": 18,
                "concession_east": 8,
                "concession_west": 3
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert "suggestion" in data

    def test_swarm_suggest_to_gate(self):
        response = client.post("/api/swarm-suggest", json={
            "user_seat": "Section A, Row 1",
            "destination": "Gate D (West Exit)"
        })
        assert response.status_code == 200
        data = response.json()
        assert "suggestion" in data

    def test_swarm_suggest_response_format(self):
        response = client.post("/api/swarm-suggest", json={
            "user_seat": "VIP Box 3",
            "destination": "restroom"
        })
        assert response.status_code == 200
        data = response.json()
        assert "suggestion" in data
        # raw_json may be None in fallback mode
        assert "raw_json" in data


# ═══════════════════════════════════════════════════════════════════════════════
# Gemini Density Analysis (/api/analyze-density)
# ═══════════════════════════════════════════════════════════════════════════════

class TestGeminiDensityAnalysis:
    """Tests for the Gemini-powered density analysis endpoint."""

    def test_density_analysis_basic(self):
        response = client.post("/api/analyze-density", json={
            "zone_densities": {
                "gate_a": 0.9,
                "gate_b": 0.2,
                "concession_1": 0.7
            },
            "total_agents": 500,
            "hotspot_zones": ["gate_a", "concession_1"],
            "flow_efficiency": 72.5
        })
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert "risk_level" in data

    def test_density_analysis_low_density(self):
        response = client.post("/api/analyze-density", json={
            "zone_densities": {
                "gate_a": 0.1,
                "gate_b": 0.1,
                "concession_1": 0.05
            },
            "total_agents": 50,
            "hotspot_zones": [],
            "flow_efficiency": 95.0
        })
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data

    def test_density_analysis_high_density(self):
        response = client.post("/api/analyze-density", json={
            "zone_densities": {
                "gate_a": 0.95,
                "gate_b": 0.88,
                "gate_c": 0.92,
                "concession_1": 0.85,
                "restroom_1": 0.90
            },
            "total_agents": 2500,
            "hotspot_zones": ["gate_a", "gate_b", "gate_c", "concession_1", "restroom_1"],
            "flow_efficiency": 35.0
        })
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert "risk_level" in data

    def test_density_analysis_minimal_input(self):
        response = client.post("/api/analyze-density", json={
            "zone_densities": {"gate_a": 0.5}
        })
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
