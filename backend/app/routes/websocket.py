"""
SwarmAI WebSocket Routes
========================
Real-time bidirectional communication between backend and frontend.
Supports multiple concurrent connections (multi-tab mode).
Each connected tab can register as a "real" agent in the swarm.
"""

import json
import asyncio
from datetime import datetime
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# ── Connection Manager ────────────────────────────────────────────────────────

class ConnectionManager:
    """
    Manages all WebSocket connections.
    Supports three channels:
      - state: Real-time agent positions and metrics (main data channel)
      - negotiations: Debug panel negotiation messages
      - chat: Per-agent AI suggestions
    """

    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}  # client_id -> WebSocket
        self.state_subscribers: Set[str] = set()       # Clients subscribing to state updates
        self.debug_subscribers: Set[str] = set()       # Clients subscribing to debug/negotiation
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self.active_connections[client_id] = websocket
            self.state_subscribers.add(client_id)
        print(f"[WS] Client connected: {client_id} (total: {len(self.active_connections)})")

    async def disconnect(self, client_id: str):
        """Remove a disconnected client."""
        async with self._lock:
            self.active_connections.pop(client_id, None)
            self.state_subscribers.discard(client_id)
            self.debug_subscribers.discard(client_id)
        print(f"[WS] Client disconnected: {client_id} (total: {len(self.active_connections)})")

    async def broadcast_state(self, message: dict):
        """Broadcast state update to all subscribed clients."""
        data = json.dumps(message)
        disconnected = []
        async with self._lock:
            subscribers = list(self.state_subscribers)
        
        for client_id in subscribers:
            ws = self.active_connections.get(client_id)
            if ws:
                try:
                    await ws.send_text(data)
                except Exception:
                    disconnected.append(client_id)

        for cid in disconnected:
            await self.disconnect(cid)

    async def broadcast_negotiation(self, message: dict):
        """Broadcast negotiation message to debug subscribers."""
        data = json.dumps({"type": "negotiation", "data": message, "timestamp": datetime.utcnow().isoformat()})
        disconnected = []
        async with self._lock:
            subscribers = list(self.debug_subscribers)
        
        for client_id in subscribers:
            ws = self.active_connections.get(client_id)
            if ws:
                try:
                    await ws.send_text(data)
                except Exception:
                    disconnected.append(client_id)

        for cid in disconnected:
            await self.disconnect(cid)

    async def send_to_client(self, client_id: str, message: dict):
        """Send a message to a specific client."""
        ws = self.active_connections.get(client_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                await self.disconnect(client_id)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Global connection manager instance
manager = ConnectionManager()

# Engine reference (set from main.py)
_engine = None

def set_engine(engine):
    global _engine
    _engine = engine
    # Wire up broadcast callbacks
    engine.set_broadcast_callback(manager.broadcast_state)
    engine.set_negotiation_broadcast(manager.broadcast_negotiation)


# ── WebSocket Endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    Main WebSocket endpoint.
    
    Client messages (JSON):
      {"type": "subscribe", "channel": "state|debug|chat"}
      {"type": "register_agent", "data": {"x": 50, "y": 50, "goal": "seat"}}
      {"type": "update_position", "data": {"x": 55, "y": 48}}
      {"type": "set_goal", "data": {"goal": "concession"}}
      {"type": "get_suggestions", "data": {}}
    
    Server messages (JSON):
      {"type": "state_update", "data": {...}}
      {"type": "negotiation", "data": {...}}
      {"type": "suggestions", "data": {...}}
      {"type": "welcome", "data": {"client_id": "...", "connections": N}}
    """
    await manager.connect(websocket, client_id)

    # Send welcome message
    await manager.send_to_client(client_id, {
        "type": "welcome",
        "data": {
            "client_id": client_id,
            "connections": manager.connection_count,
            "simulation_running": _engine.running if _engine else False,
        },
        "timestamp": datetime.utcnow().isoformat(),
    })

    try:
        while True:
            # Receive messages from client
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = message.get("type", "")
            msg_data = message.get("data", {})

            # ── Handle client messages ────────────────────────────────────────

            if msg_type == "subscribe":
                channel = msg_data.get("channel", "state") if isinstance(msg_data, dict) else msg_data
                if channel == "debug":
                    manager.debug_subscribers.add(client_id)
                    await manager.send_to_client(client_id, {
                        "type": "subscribed", "data": {"channel": "debug"}
                    })

            elif msg_type == "register_agent":
                if _engine:
                    x = msg_data.get("x", 50.0)
                    y = msg_data.get("y", 50.0)
                    goal = msg_data.get("goal", "seat")
                    agent = _engine.add_real_agent(client_id, x, y, goal)
                    await manager.send_to_client(client_id, {
                        "type": "agent_registered",
                        "data": agent.to_dict(),
                    })

            elif msg_type == "update_position":
                if _engine and client_id in _engine.agents:
                    agent = _engine.agents[client_id]
                    agent.x = msg_data.get("x", agent.x)
                    agent.y = msg_data.get("y", agent.y)

            elif msg_type == "set_goal":
                if _engine and client_id in _engine.agents:
                    agent = _engine.agents[client_id]
                    agent.goal = msg_data.get("goal", agent.goal)
                    agent._assign_goal_position()
                    from .api import get_engine
                    from ..agents.pathfinding import astar_path
                    path = astar_path(
                        _engine.grid,
                        (int(agent.x), int(agent.y)),
                        (int(agent.goal_x), int(agent.goal_y))
                    )
                    agent.set_path(path)
                    await manager.send_to_client(client_id, {
                        "type": "path_updated",
                        "data": agent.to_dict(),
                    })

            elif msg_type == "get_suggestions":
                if _engine and client_id in _engine.agents:
                    from ..utils.metrics import generate_chat_suggestions
                    agent = _engine.agents[client_id]
                    zone_densities = _engine.current_metrics.get("zone_densities", {})
                    nearby = sum(1 for a in _engine.agents.values()
                                 if abs(a.x - agent.x) < 8 and abs(a.y - agent.y) < 8)
                    suggestions = generate_chat_suggestions(agent.to_dict(), zone_densities, nearby)
                    await manager.send_to_client(client_id, {
                        "type": "suggestions",
                        "data": {"suggestions": suggestions},
                    })

            elif msg_type == "ping":
                await manager.send_to_client(client_id, {
                    "type": "pong",
                    "data": {"tick": _engine.tick if _engine else 0},
                })

    except WebSocketDisconnect:
        await manager.disconnect(client_id)
        if _engine:
            _engine.remove_agent(client_id)
    except Exception as e:
        print(f"[WS] Error for {client_id}: {e}")
        await manager.disconnect(client_id)
        if _engine:
            _engine.remove_agent(client_id)
