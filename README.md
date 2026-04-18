# 🐝 SwarmAI — Decentralized Attendee-Powered AI Swarm

> **Turn 80,000 phones into a self-organizing AI swarm that eliminates stadium chaos.**

SwarmAI is a decentralized multi-agent system where every attendee's device becomes an intelligent node. Instead of relying on expensive centralized cameras and operator dashboards, fans' phones team up like a living nervous system to self-manage the entire stadium experience.

## 🎯 Problem Statement

Large-scale sporting venues (80,000+ capacity) face:
- **Crowd bottlenecks** — gates, corridors, and concourses jam during entry/exit and halftime
- **Long wait times** — concessions and restrooms have unpredictable queues
- **Zero real-time coordination** — fans are passive data points, not active participants
- **Group separation** — families and friends lose each other in massive crowds

## 💡 The SwarmAI Solution

| Challenge | How SwarmAI Solves It |
|---|---|
| **Crowd Movement** | Agents run A* pathfinding + game-theory negotiations. They shift positions in real-time to prevent bottlenecks before they form. |
| **Wait Times** | Crowd-sourced + predictive queue forecasts. Agents suggest staggered times ("Leave at 42nd minute — queue < 2 min"). |
| **Real-Time Coordination** | Decentralized = no single point of failure. Agents self-organize like ant colonies for halftime waves, emergency exits, friend meetups. |
| **Enjoyable Experience** | Gamification: earn Swarm Points by following optimal paths → redeem for priority food, merch, AR filters. |

## 🏗️ Architecture

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
│  100-2000 virtual agents for simulation              │
│  Game-theory negotiation engine                      │
│  Metrics + CSV export for pitch deck                 │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Manual Start (Recommended for Development)

**Terminal 1 — Backend:**
```bash
cd swarmai/backend
pip install -r requirements.txt
python run.py
```

**Terminal 2 — Frontend:**
```bash
cd swarmai/frontend
npm install
npm run dev
```

**Open in browser:**
- 🏟️ **Stadium View**: http://localhost:3000
- 📊 **Operator Dashboard**: http://localhost:3000/dashboard
- 📱 **Mobile Demo**: http://localhost:3000/mobile-demo
- 🔧 **Debug Console**: http://localhost:3000/debug

### Docker Start
```bash
cd swarmai
docker-compose up --build
```

## 📊 Demo Flow (for Judges)

1. **Open http://localhost:3000** → Click "ENTER BERNABÉU" → See 3,000 animated agents in 3D
2. **Open /dashboard** in another tab → Watch live heatmap + metrics update
3. **Click "1000 Agents"** → Watch congestion spike, then swarm intelligence optimizes flow
4. **Toggle "Swarm OFF"** → See metrics degrade without AI coordination
5. **Click "Emergency Reroute"** → All agents instantly redirect to exits
6. **Open /debug** → See live negotiation messages between agents
7. **Export CSV** → Download metrics for your pitch deck

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python + FastAPI + WebSockets |
| Simulation | Custom multi-agent engine + A* pathfinding |
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| 3D Visualization | Three.js + React Three Fiber |
| State Management | Zustand |
| Charts | Recharts |
| Database | SQLite (demo) / PostgreSQL (production) |

## 📈 Key Metrics (Simulated)

- **Wait Time Reduction**: 35-50%
- **Flow Efficiency Improvement**: 31%
- **Negotiation Success Rate**: ~75%
- **Emergency Reroute**: < 2 seconds for all agents

## 🔒 Privacy First

- All agent communication uses **anonymized vectors** — no personal data
- On-device processing — phone sensors stay on the phone
- Opt-in only — compliant with India's DPDP Act
- No cameras required — works phone-only

---

Built for the **Google Antigravity Hackathon 2026** 🚀
