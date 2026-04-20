# SwarmAI — Decentralized Attendee-Powered AI Swarm

> **Built with [Google Antigravity](https://antigravity.withgoogle.com) | Powered by [Google Gemini AI](https://aistudio.google.com)**

> **Turn 80,000 phones into a self-organizing AI swarm that eliminates stadium chaos.**

SwarmAI is a decentralized multi-agent system where every attendee's device becomes an intelligent node. The SwarmAI Assistant is powered by **Google Gemini 2.5 Flash Lite**, processing every attendee message with context-enriched prompting and full stadium topology awareness.

---

## 🚀 Google Services Deep Integration

SwarmAI features a **closed-loop real-time AI swarm system** powered by multiple Google services:

| Google Service | Implementation Details |
|---|---|
| **Google Gemini 2.5 Flash Lite** | 3 intelligent routes with rich Fruin Crowd Science prompts, structured JSON output (`los_grade`, `reasoning`, `avoid_zones`, `safety_note`), multi-turn context |
| **Firebase Firestore** | Backend swarm engine **actively pushes live telemetry every 8 simulation ticks** to the `swarm_metrics` collection. Frontend dashboard listens in real-time using `onSnapshot`. Payload includes: `total_agents`, `global_congestion`, `avg_wait_seconds`, `flow_efficiency`, `active_nodes`, `negotiation_count`, `los_grade`, `heatmap` |
| **google-generativeai + Firebase Admin SDK** | Context-aware prompting + secure, fault-tolerant backend writes with automatic graceful fallbacks when running locally |
| **Google Cloud Run** | Frontend (Next.js) and Backend (FastAPI) deployed as managed, auto-scaling containers with native Application Default Credentials |
| **WCAG 2.1 AA / Google Standards** | `aria-live="polite"` on all live regions, semantic HTML, focus-visible rings |

**Closed-Loop Flow**:
```
Simulation Engine → Gemini Analysis → Firestore Write (every 8 ticks) → Real-time Operator Dashboard
```

```mermaid
graph LR
    User[📱 Attendee Phone] --> Gemini[🤖 Gemini 2.5 Flash]
    Gemini --> Engine[⚙️ SwarmEngine]
    Engine --> Firestore[(🔥 Google Firestore)]
    Firestore --> Dash[📊 Operator Dashboard]
    Firestore --> FPV[🎮 Physical Traversal FPV]
```

**Closed-Loop Real-Time Pipeline:** The SwarmEngine actively pushes live telemetry (total agents, congestion, heatmap, LoS grades) to Firebase Firestore every 8 simulation ticks. The operator dashboard consumes this data instantly via `onSnapshot` listeners, while Gemini provides intelligent structured suggestions using 1980 Fruin Crowd Science. All running on Google Cloud Run.

---

## Live Deployment (Google Cloud Run)

**Production-grade infrastructure active on Google Cloud:**

| Service | URL | Status |
|---|---|---|
| **Backend API** | [swarmai-backend-820901016043.us-central1.run.app](https://swarmai-backend-820901016043.us-central1.run.app) | ✅ Live |
| **Frontend UI** | [swarmai-frontend-820901016043.us-central1.run.app](https://swarmai-frontend-820901016043.us-central1.run.app) | ✅ Live |
| **Database** | Google Firebase Firestore (us-central) — `swarm_metrics` collection | ✅ Syncing |

---

## 🧠 Approach

1.  **Peer-to-Peer AI:** Attendees ask Gemini for routes. The backend uses A* pathfinding with crowd-density-aware costs, applying Fruin's 1980 Level-of-Service crowd science to calculate buffer zones, gate staggering, and emergency evacuation paths.
2.  **Distributed Compute:** The `SwarmEngine` background task runs an autonomous loop syncing every agent position on a 100×100 grid, pushing metrics to Firebase Firestore for cloud-scale analytics.
3.  **Immersive 3D UX & FPV Targeting:** Real-time 60fps React Three Fiber dashboard. Includes an individual FPV perspective where the camera physically snaps and targets the exact location of the selected amenity (Food, Restroom, Exit) before physical traversal begins.
4.  **Standalone Client Resilience:** The Next.js frontend employs intelligent silent fallbacks and fallback routing vectors bypassing the pitch. It runs in 100% standalone mode even if the backend API is disconnected.
5.  **WCAG 2.1 AA Accessibility:** ARIA roles, `aria-live="polite"` on dynamic elements, focus-visible rings, semantic HTML, keyboard navigation, and screen reader support across all interactive components.

## 🛠 Tech Stack

**Frontend:**
- Next.js (App Router), React 18, Tailwind CSS
- React Three Fiber (`@react-three/fiber`, `three.js`) + GLTF mapping
- Firebase Web SDK (`firebase/firestore` — real-time `onSnapshot` listener)
- Zustand (Global connection state)

**Backend:**
- FastAPI (Python) + Uvicorn
- Google Generative AI SDK (`gemini-2.5-flash-lite`) — 3 specialized endpoints with Fruin Science prompts
- Firebase Admin SDK (`firebase-admin`) — autonomous metrics push
- Async WebSocket Server (bidirectional state sync)

## 🧪 Testing

```bash
cd backend
pytest tests/ -v
```

**50+ tests** covering:
- `test_main.py` — Health, stadium, agents, simulation, metrics, seats, dashboard, routing
- `test_gemini.py` — All 3 Gemini AI endpoints (chat, swarm-suggest, density-analysis)
- `test_websocket.py` — Bidirectional WebSocket communication
- `test_pathfinding.py` — A* algorithm logic
- `test_firebase_gemini.py` — Firebase Firestore route edge cases + Gemini multi-turn context
- `test_firestore.py` — Firestore mock DB writes, LoS grading, structured JSON output validation

---

### Local Quickstart

```bash
# 1. Start Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py

# 2. Start Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` for the 3D stadium view, or `http://localhost:3000/dashboard` for the operator dashboard with live Firebase metrics.

> **Note:** Firebase Firestore writes are automatically skipped when running locally without Google Cloud credentials. All other features (AI chat, A* routing, swarm simulation, physical traversal) work fully offline.
