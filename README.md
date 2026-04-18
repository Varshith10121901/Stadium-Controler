# SwarmAI — Decentralized Attendee-Powered AI Swarm

> **Built with [Google Antigravity](https://antigravity.withgoogle.com) | Powered by [Google Gemini AI](https://aistudio.google.com)**

> **Turn 80,000 phones into a self-organizing AI swarm that eliminates stadium chaos.**

SwarmAI is a decentralized multi-agent system where every attendee's device becomes an intelligent node. The SwarmAI Assistant is powered by **Google Gemini 2.5 Flash Lite**, processing every attendee message with context-enriched prompting and full stadium topology awareness.

## Google Services Deep Integration

SwarmAI uses **Google Gemini AI** (`google-generativeai` SDK) across **3 dedicated endpoints**:

| Google Service | Endpoint | Usage |
|---|---|---|
| **Gemini 2.5 Flash Lite** | `POST /api/chat` | Natural language chatbot with multi-turn conversation, stadium-aware system prompts, seat-context injection |
| **Gemini 2.5 Flash Lite** | `POST /api/swarm-suggest` | Real-time route optimization — receives crowd density data, user position, destination; returns JSON-structured route recommendations |
| **Gemini 2.5 Flash Lite** | `POST /api/analyze-density` | Operator intelligence — analyzes zone-level density readings, predicts bottlenecks, assesses emergency risk levels |

### Implementation Details
- **SDK**: `google-generativeai` (in `requirements.txt`)
- **Integration file**: `backend/app/routes/gemini.py` (250+ lines)
- **3 specialized system prompts**: Chat Assistant, Route Optimizer, Density Analyzer
- **Context-enriched prompting**: User's seat coordinates, crowd density, conversation history injected into each Gemini call
- **Action detection**: Gemini responses auto-trigger A* pathfinding on the 3D map
- **Multi-turn support**: Conversation history (last 6 messages) sent as context
- **Graceful fallback**: Smart responses when offline

Configuration: `export GOOGLE_API_KEY="your-key"` (get from [Google AI Studio](https://aistudio.google.com))

## Problem Statement

Large-scale sporting venues (80,000+ capacity) face:
- **Crowd bottlenecks** — gates, corridors, and concourses jam during entry/exit and halftime
- **Long wait times** — concessions and restrooms have unpredictable queues
- **Zero real-time coordination** — fans are passive data points, not active participants
- **Group separation** — families and friends lose each other in massive crowds

## The SwarmAI Solution

| Challenge | How SwarmAI Solves It |
|---|---|
| **Crowd Movement** | Agents run A* pathfinding + game-theory negotiations to prevent bottlenecks before they form |
| **Wait Times** | Crowd-sourced + predictive queue forecasts via Gemini AI analysis |
| **Real-Time Coordination** | Decentralized = no single point of failure. Agents self-organize for emergency exits, friend meetups |
| **Enjoyable Experience** | Gamification: earn Swarm Points by following optimal paths |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    ATTENDEE PHONES                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Agent A  │←→│ Agent B  │←→│ Agent C  │  ...     │
│  │(On-Device)│  │(On-Device)│  │(On-Device)│         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │                │
│       └──────────────┼──────────────┘                │
│                      │                               │
│            Bluetooth/WiFi Mesh                       │
│           Anonymized Density Vectors                 │
└──────────────────────┬──────────────────────────────┘
                       │ WebSocket
┌──────────────────────┴──────────────────────────────┐
│              VENUE ORACLE (Light Backend)            │
│  FastAPI + Swarm Engine + A* Pathfinding             │
│  Google Gemini 2.5 Flash Lite (3 AI endpoints)      │
│  100-2000 virtual agents for simulation              │
│  Game-theory negotiation engine                      │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Manual Start

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt
export GOOGLE_API_KEY="your-gemini-api-key"
python run.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**URLs:**
- **Stadium View**: http://localhost:3000
- **Operator Dashboard**: http://localhost:3000/dashboard
- **Mobile Demo**: http://localhost:3000/mobile-demo
- **Debug Console**: http://localhost:3000/debug
- **API Docs**: http://localhost:8000/docs

### Docker Start
```bash
GOOGLE_API_KEY="your-key" docker-compose up --build
```

## Demo Flow (for Judges)

1. **Open http://localhost:3000** — See 3,000 animated agents in 3D stadium
2. **Chat with SwarmAI Assistant** — Powered by Google Gemini, ask about restrooms, food, exits
3. **Open /dashboard** — Watch live heatmap + metrics update in real-time
4. **Click "1000 Agents"** — Watch congestion spike, swarm intelligence optimizes flow
5. **Toggle "Swarm OFF"** — See metrics degrade without AI coordination
6. **Click "Emergency Reroute"** — All agents instantly redirect to exits
7. **Open /debug** — See live agent-to-agent negotiation messages
8. **Export CSV** — Download metrics for your pitch deck

## Testing

Run the test suite:
```bash
cd backend
pytest tests/ -v
```

Tests cover over 35+ cases across 4 test suites:
- **`test_main.py`**: Health, root, stadium layout API, agent endpoints, simulation control, metrics, seat locking, routing, dashboard comparison points.
- **`test_gemini.py`**: Deep integration with Gemini chat (history, multi-turn), swarm-suggest (route optimization), and density analysis (operator insights).
- **`test_websocket.py`**: Bidirectional WS connections, agent registration, ping/pong, and multi-client handling.
- **`test_pathfinding.py`**: A* pathfinding algorithms, generic grid mapping operations, and SwarmAgent lifecycle logic.

## Tech Stack

| Layer | Technology |
|---|---|
| **AI Engine** | **Google Gemini 2.5 Flash Lite** (`google-generativeai` SDK) |
| Backend | Python 3.12 + FastAPI + WebSockets |
| Simulation | Custom multi-agent engine + A* pathfinding |
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| 3D Visualization | Three.js + React Three Fiber |
| State Management | Zustand |
| Charts | Recharts |
| Database | SQLite (demo) / PostgreSQL (production) |
| Testing | pytest + FastAPI TestClient |

## Accessibility (WCAG 2.1 AA)

- ARIA labels on all interactive elements and 3D canvas
- Keyboard navigation with visible focus indicators
- Skip-to-content link for screen reader users
- High-contrast mode support
- Reduced motion support via `prefers-reduced-motion`
- Scalable viewport (zoom up to 5x, no user-scalable=no)
- Screen reader utility class (`.sr-only`)

## Key Metrics (Simulated)

- **Wait Time Reduction**: 35-50%
- **Flow Efficiency Improvement**: 31%
- **Negotiation Success Rate**: ~75%
- **Emergency Reroute**: < 2 seconds for all agents

## Privacy First

- All agent communication uses **anonymized vectors** — no personal data
- On-device processing — phone sensors stay on the phone
- Opt-in only — compliant with India's DPDP Act
- No cameras required — works phone-only

---

Built with **Google Antigravity** for the **Google Antigravity Hackathon 2026** | Powered by **Google Gemini AI**
