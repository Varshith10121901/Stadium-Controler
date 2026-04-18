"""
SwarmAI — WebSocket Tests
===========================
Tests for WebSocket connection handling and real-time communication.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestWebSocket:
    """Tests for WebSocket connection and messaging."""

    def test_websocket_connect_and_welcome(self):
        """Test that WebSocket connection is accepted and welcome message is sent."""
        with client.websocket_connect("/ws/test_client_001") as ws:
            data = ws.receive_json()
            assert data["type"] == "welcome"
            assert data["data"]["client_id"] == "test_client_001"
            assert "connections" in data["data"]
            assert "simulation_running" in data["data"]

    def test_websocket_ping_pong(self):
        """Test ping/pong heartbeat mechanism."""
        with client.websocket_connect("/ws/test_client_002") as ws:
            ws.receive_json()  # welcome
            ws.send_json({"type": "ping", "data": {}})
            data = ws.receive_json()
            assert data["type"] == "pong"
            assert "tick" in data["data"]

    def test_websocket_subscribe_debug(self):
        """Test subscribing to the debug/negotiation channel."""
        with client.websocket_connect("/ws/test_client_003") as ws:
            ws.receive_json()  # welcome
            ws.send_json({"type": "subscribe", "data": {"channel": "debug"}})
            data = ws.receive_json()
            assert data["type"] == "subscribed"
            assert data["data"]["channel"] == "debug"

    def test_websocket_register_agent(self):
        """Test registering a real agent through WebSocket."""
        with client.websocket_connect("/ws/test_client_004") as ws:
            ws.receive_json()  # welcome
            ws.send_json({
                "type": "register_agent",
                "data": {"x": 50.0, "y": 50.0, "goal": "seat"}
            })
            data = ws.receive_json()
            assert data["type"] == "agent_registered"
            assert "data" in data

    def test_websocket_multiple_clients(self):
        """Test that multiple WebSocket clients can connect simultaneously."""
        with client.websocket_connect("/ws/multi_client_A") as ws1:
            welcome1 = ws1.receive_json()
            assert welcome1["type"] == "welcome"

            with client.websocket_connect("/ws/multi_client_B") as ws2:
                welcome2 = ws2.receive_json()
                assert welcome2["type"] == "welcome"
                # Second client should see higher connection count
                assert welcome2["data"]["connections"] >= 2
