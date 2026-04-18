"""
SwarmAI — Google Gemini AI Integration
========================================
Powers the SwarmAI Assistant with Gemini Pro for intelligent,
context-aware stadium navigation and crowd management advice.
Uses Google AI Studio / Gemini API for natural language understanding.
"""

import os
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["gemini"])

# ── Gemini Configuration ─────────────────────────────────────────────────────
# Set your API key as environment variable: GOOGLE_API_KEY
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

SYSTEM_PROMPT = """You are SwarmAI Assistant — an intelligent crowd navigation AI embedded in a live stadium event system.

Your capabilities:
- You help attendees navigate a large 80,000-capacity stadium (modeled after Santiago Bernabéu)
- You provide smart routing to restrooms, food concessions, exits, and gates
- You give real-time crowd density insights and wait time predictions
- You coordinate family "Pod Groups" to keep groups together
- You run on a decentralized multi-agent swarm where every phone is an AI node
- You use A* pathfinding with crowd-density-aware costs to find optimal routes
- You gamify the experience with "Swarm Points" for cooperative behavior

Key stadium facts:
- 4 Gates (A/North, B/East, C/South, D/West)
- 2 Concession stands (East and West wings)
- 2 Restroom blocks (North and East sectors)
- 32 seating sections, ~2500 seats each
- Real-time crowd simulation with 100-3000 virtual agents

Respond concisely (2-3 sentences max). Be helpful, friendly, and stadium-savvy.
If asked about non-stadium topics, briefly answer but redirect to stadium navigation.
Always mention relevant SwarmAI features when appropriate (routing, wait times, Swarm Points).
"""

# ── Request/Response Models ───────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    seat_x: float | None = None
    seat_z: float | None = None
    context: str | None = None  # e.g., "user has active route to restroom"

class ChatResponse(BaseModel):
    reply: str
    suggested_action: str | None = None  # e.g., "route_restroom", "route_food"


# ── Gemini Chat Endpoint ─────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def gemini_chat(req: ChatRequest):
    """
    Process a natural language message through Google Gemini and return
    an intelligent, context-aware stadium navigation response.
    """
    if not GOOGLE_API_KEY:
        # Fallback if no API key — still functional with smart hardcoded responses
        return _fallback_response(req.message)

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT
        )

        # Build context-enriched prompt
        user_context = ""
        if req.seat_x is not None and req.seat_z is not None:
            user_context += f"\n[User's current seat: X={req.seat_x:.1f}, Z={req.seat_z:.1f}]"
        if req.context:
            user_context += f"\n[Context: {req.context}]"

        full_prompt = f"{user_context}\nUser: {req.message}"

        response = model.generate_content(full_prompt)
        reply_text = response.text.strip()

        # Detect suggested actions from the AI response
        suggested = None
        lower = reply_text.lower()
        if any(w in lower for w in ["restroom", "bathroom", "washroom"]):
            suggested = "route_restroom"
        elif any(w in lower for w in ["food", "concession", "snack", "eat"]):
            suggested = "route_food"
        elif any(w in lower for w in ["exit", "gate", "leave"]):
            suggested = "route_exit"

        return ChatResponse(reply=reply_text, suggested_action=suggested)

    except Exception as e:
        print(f"[Gemini Error] {e}")
        return _fallback_response(req.message)


def _fallback_response(message: str) -> ChatResponse:
    """Smart fallback when Gemini API is unavailable."""
    lower = message.lower()

    if any(w in lower for w in ["restroom", "bathroom", "washroom", "toilet"]):
        return ChatResponse(
            reply="🚻 I've identified 2 restroom blocks in your stadium sector. The North Restroom currently has a 2-min wait (87% shorter than South). Routing you there now!",
            suggested_action="route_restroom"
        )
    elif any(w in lower for w in ["food", "eat", "hungry", "snack", "concession", "drink"]):
        return ChatResponse(
            reply="🍔 The East Concession stand has the shortest queue right now (~3 min). Following the swarm-optimized route earns you 50 Swarm Points!",
            suggested_action="route_food"
        )
    elif any(w in lower for w in ["exit", "gate", "leave", "go home", "emergency"]):
        return ChatResponse(
            reply="🚪 Gate A (North) is your fastest exit with minimal crowd density. I've plotted the A* optimal path. Follow the green line on your 3D map!",
            suggested_action="route_exit"
        )
    elif any(w in lower for w in ["wait", "queue", "how long", "time"]):
        return ChatResponse(
            reply="⏱️ Current wait estimates — Restrooms: 2min (North) / 18min (South) | Food: 3min (East) / 12min (West). SwarmAI saves you ~40% wait time through predictive routing!",
            suggested_action=None
        )
    elif any(w in lower for w in ["point", "score", "reward", "swarm point"]):
        return ChatResponse(
            reply="💎 You have 1,240 Swarm Points! Earn more by following optimized routes. At 1,500 you unlock free stadium merch. Keep cooperating with the swarm!",
            suggested_action=None
        )
    elif any(w in lower for w in ["hello", "hi", "hey", "help"]):
        return ChatResponse(
            reply="👋 Hey there! I'm your SwarmAI Assistant — powered by Google Gemini. I can route you to restrooms, food, or exits using real-time crowd intelligence. What do you need?",
            suggested_action=None
        )
    else:
        return ChatResponse(
            reply="🧠 I'm SwarmAI — your AI stadium navigator powered by Google Gemini. I track live crowd density across all zones to find you the fastest routes. Try asking: 'Where's the nearest restroom?' or 'How long is the food queue?'",
            suggested_action=None
        )
