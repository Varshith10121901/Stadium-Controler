# SwarmAI Bernabéu Edition — Decentralized Attendee-Powered AI Swarm

> **Built with [Google Antigravity](https://antigravity.withgoogle.com) | Powered by [Google Gemini AI](https://aistudio.google.com)**  
> **Turn 80,000 phones into a self-organizing AI swarm that eliminates stadium chaos.**

SwarmAI Bernabéu Edition is a decentralized multi-agent system where every attendee’s device becomes an intelligent node. The SwarmAI Assistant, powered by **Google Gemini 2.5 Flash Lite**, processes natural language queries with full stadium topology awareness and 1980 Fruin Crowd Science.

---

## 🚀 Google Services Deep Integration

SwarmAI features a **true closed-loop real-time AI swarm system** using multiple Google services working together:

| Google Service                        | Implementation Details |
|---------------------------------------|------------------------|
| **Google Gemini 2.5 Flash Lite**      | 3 intelligent endpoints (`chat`, `swarm-suggest`, `density-analysis`) with rich Fruin Crowd Science (LoS A–F) prompts, structured JSON outputs (`los_grade`, `reasoning`, `avoid_zones`, `safety_note`, `estimated_time`), and multi-turn context |
| **Firebase Firestore**                | Backend `SwarmEngine` **actively pushes live telemetry every 8 simulation ticks** (`total_agents`, `global_congestion`, `avg_wait_seconds`, `active_nodes`, `heatmap`, `los_grade`). Frontend uses real-time `onSnapshot` listeners for instant dashboard updates |
| **google-generativeai + Firebase Admin SDK** | Context-aware prompting + secure, fault-tolerant backend writes with graceful fallbacks |
| **Google Cloud Run**                  | Both FastAPI backend and Next.js frontend deployed as auto-scaling managed containers using Application Default Credentials |

**Closed-Loop Flow**:  
Simulation Engine → Gemini Analysis → Firestore Write (every 8 ticks) → Real-time Operator Dashboard

```mermaid
graph LR
    User[📱 Attendee Phones] --> Gemini[🤖 Gemini 2.5 Flash]
    Gemini --> Engine[⚙️ SwarmEngine]
    Engine --> Firestore[(🔥 Firebase Firestore)]
    Firestore --> Dashboard[📊 Operator Dashboard]
    Firestore --> FPV[🎮 FPV Physical Traversal]
```

**Real-Time Pipeline:** The SwarmEngine continuously calculates Fruin Level-of-Service grades and crowd metrics, pushes them to Firestore every 8 ticks, and the operator dashboard reflects changes instantly via `onSnapshot`. All powered by Google Cloud Run.

---

## 🚀 Live Deployment (Google Cloud Run)

**Fully production-grade deployment on Google Cloud:**

| Service | URL | Status |
|---|---|---|
| **Backend API** | [swarmai-backend-820901016043.us-central1.run.app](https://swarmai-backend-820901016043.us-central1.run.app) | ✅ Live |
| **Frontend UI** | [swarmai-frontend-820901016043.us-central1.run.app](https://swarmai-frontend-820901016043.us-central1.run.app) | ✅ Live |
| **Database** | Google Firebase Firestore (us-central1) — `swarm_metrics` collection | ✅ Active |

---

## 🧠 Approach

1.  **Peer-to-Peer AI Routing:** Attendees query Gemini for smart routes. Backend uses density-aware A* pathfinding guided by Fruin’s 1980 Crowd Science (LoS grading, buffer zones, gate staggering, emergency evacuation).
2.  **Distributed Swarm Intelligence:** Autonomous `SwarmEngine` runs on a 100×100 grid, negotiates between agents, and syncs live metrics to Firebase.
3.  **Immersive 3D Experience:** 60fps React Three Fiber view with FPV camera targeting (camera physically snaps toward selected amenity before traversal).
4.  **Resilience:** Full offline fallback with pitch-safe concourse routing and silent WebSocket degradation.
5.  **Accessibility:** WCAG 2.1 AA compliant with `aria-live="polite"` on all dynamic elements, keyboard navigation, and focus management.

---

## 🛠 Tech Stack

**Frontend:** Next.js 15 (App Router), React Three Fiber, Tailwind CSS, Firebase Web SDK (`onSnapshot`), Zustand  
**Backend:** FastAPI + Uvicorn, Google Generative AI SDK, Firebase Admin SDK, Async WebSockets  
**Infrastructure:** Google Cloud Run, Firebase Firestore

---

## 🧪 Testing

```bash
cd backend
pytest tests/ -v
```

**50+ passing tests covering:**
- Core simulation, A* pathfinding with density costs
- All 3 Gemini endpoints with structured output validation
- Firebase Firestore writes, mocks, and graceful fallbacks
- WebSocket communication and edge cases

---

## 🚀 Local Quickstart

```bash
# Backend
cd backend
python -m venv venv
# (Activate venv)
pip install -r requirements.txt
python run.py

# Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` for the immersive 3D view or `/dashboard` for the real-time operator dashboard.

> **Note:** When running locally without Google Cloud credentials, Firestore writes are gracefully skipped. All AI routing, simulation, and 3D features work fully offline.

---

Built with **Google Antigravity** for the **Google Antigravity Hackathon 2026**
