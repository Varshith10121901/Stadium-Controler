# 🐝 SwarmAI Bernabeu Edition — Decentralized Attendee-Powered AI Swarm

> **Built with [Google Antigravity](https://antigravity.withgoogle.com) | Deployed on [Google Cloud Run](https://cloud.google.com/run) | Powered by [Google Gemini AI](https://aistudio.google.com)**  
> **Turn 80,000 attendee devices into an active, self-organizing P2P AI Swarm that eliminates stadium bottleneck congestion.**

---

## 📖 Chosen Vertical: Smart Stadium Operations
Estadio Santiago Bernabeu accommodates over 80,000 fans. Standard navigation apps do not understand internal stadium seating tiers, aisles, or localized concession queues. **SwarmAI Bernabeu Edition** addresses this by converting every fan's smartphone into an active node in a peer-to-peer AI swarm network. Using Fruin's 1980 Crowd Science, real-time telemetry, and Google Gemini, SwarmAI calculates optimal paths along aisles and concourses, saving up to 42% in queue wait times.

---

## 🏛️ System Architecture

```mermaid
graph TB
    %% Styling
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef server fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef database fill:#022c22,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef ai fill:#2e1065,stroke:#a855f7,stroke-width:2px,color:#fff;

    subgraph "Frontend Layer (Next.js 15 + R3F)"
        Client["📱 Attendee PWA / Client UI"]:::client
        FPV["🎮 First-Person View (FPV) Tracker"]:::client
        Dashboard["📊 Operator Control Panel"]:::client
        Store["📦 Zustand State Store"]:::client
    end

    subgraph "Backend API Layer (FastAPI on Cloud Run)"
        API["📡 REST Endpoints /api/routes"]:::server
        WS["⚡ WS Connection Manager"]:::server
        Engine["⚙️ SwarmEngine Simulation"]:::server
        Pathfinder["🧭 A*-Aisle Routing Engine"]:::server
    end

    subgraph "Google AI & Database Services"
        Gemini["🧠 Gemini 2.5 Flash Lite"]:::ai
        Firestore["🔥 Firebase Firestore RTDB"]:::database
    end

    %% Flow connections
    Client -->|1. Request Route| API
    API -->|2. Request Context| Gemini
    Gemini -->|3. Suggest Destination| API
    API -->|4. Solve Path| Pathfinder
    Pathfinder -->|5. Follow Aisles| Client
    Client -->|6. Sync Position| WS
    WS -->|7. Step Agents| Engine
    Engine -->|8. Push Live Telemetry| Firestore
    Firestore -->|9. onSnapshot Update| Dashboard
    Client -->|10. Trigger Traversal| FPV
```

---

## 🤝 P2P Swarm Negotiation Loop
When two crowd agents encounter a bottleneck, they negotiate pass priority using game-theory utility scores:

```mermaid
sequenceDiagram
    autonumber
    participant AgentA as 👤 Agent A (High Wait)
    participant AgentB as 👤 Agent B (Low Wait)
    participant Engine as ⚙️ SwarmEngine
    participant DB as 🔥 Firestore

    AgentA->>Engine: Send telemetry (X, Y, wait_time)
    AgentB->>Engine: Send telemetry (X, Y, wait_time)
    Note over Engine: Bottleneck detected: distance < 1.5 units
    Engine->>AgentA: Calculate Cooperation Utility (U_a)
    Engine->>AgentB: Calculate Cooperation Utility (U_b)
    
    rect rgb(20, 20, 30)
        Note over Engine: U_a = wait_time_a * cooperation_score<br/>U_b = wait_time_b * cooperation_score
        alt U_a > U_b
            Engine->>AgentA: Grant Pass Priority (Velocity = 1.0)
            Engine->>AgentB: Yield / Slow Down (Velocity = 0.2)
            Engine->>DB: Log Successful Negotiation
        else U_b >= U_a
            Engine->>AgentB: Grant Pass Priority (Velocity = 1.0)
            Engine->>AgentA: Yield / Slow Down (Velocity = 0.2)
            Engine->>DB: Log Successful Negotiation
        end
    end
```

---

## 🧭 A*-Aisle Routing Pipeline
To ensure attendee paths are safe and never cross seats or restricted zones:

```mermaid
graph TD
    %% Styling
    classDef start_node fill:#1e1b4b,stroke:#818cf8,stroke-width:1px,color:#fff;
    classDef process_node fill:#0f172a,stroke:#3b82f6,stroke-width:1px,color:#fff;
    classDef decision_node fill:#312e81,stroke:#6366f1,stroke-width:1px,color:#fff;
    classDef output_node fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff;

    Start[Selected Seat Coordinate X, Z]:::start_node --> Conv[Convert to Grid Coordinates sx, sy]:::process_node
    Conv --> Assess{Is cell on Seat Block?}:::decision_node
    
    Assess -->|Yes: Cost = 50.0| SearchAisle[Check surrounding 8-neighbors for Aisle]:::process_node
    Assess -->|No: Cost = 1.0| RunAstar[Run A* Pathfinding to target POI]:::process_node
    
    SearchAisle --> AisleFound[Connect seat directly to nearest Aisle cell]:::process_node
    AisleFound --> RunAstar
    
    RunAstar --> Trace{Traverse node path}:::decision_node
    Trace -->|Seat/Pitch Cell| CostHigh[Apply High Travel Cost Penalty 50.0]:::process_node
    Trace -->|Aisle/Concourse| CostNormal[Apply Minimal Cost 1.0]:::process_node
    
    CostHigh --> Finalize[Produce Unsimplified Coordinate Array]:::process_node
    CostNormal --> Finalize
    
    Finalize --> Output[3D Line conforms to grandstand curvature]:::output_node
```

---

## 🧠 Approach & Algorithmic Logic

### 1. Aisle-Restricted A* Pathfinding
The stadium grid is initialized as a `100x100` matrix representing physical stadium dimensions. Seats and pitch areas are assigned a high base cost (`50.0`), while aisles and outer concourse circles are assigned a low cost (`1.0`).
When routing, the A* algorithm is forced to path out of the seat block into the nearest radial stairway (aisle) and follow the concourse walkways to destinations (Gates, Food, Merch), keeping paths safe and realistic.

### 2. Game-Theoretic Distributed Negotiation
When crowd density spikes, virtual agents negotiate passing order. The `SwarmEngine` assigns velocity dynamically based on wait time and a cooperation factor. This prevents gridlocks at exit gates and mimics cooperative human behavior.

### 3. Google Services Telemetry Loop
* **Google Gemini 2.5 Flash Lite**: Deployed on Cloud Run, it interprets attendee questions and outputs structured JSON containing level-of-service (LoS) assessments, alternative routes, and safety details.
* **Firebase Firestore**: Used as a real-time message bus. Every 8 simulation ticks, the backend writes density maps and flow metrics to the `swarm_metrics` collection, which are immediately reflected on the operator dashboard via `onSnapshot` listeners.

---

## 🛠️ Installation & Quickstart

### Prerequisites
* **Python 3.12+**
* **Node.js 18+**
* **npm**

### 1. Clone & Set Up Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
*The FastAPI backend will start listening at `http://localhost:8000`.*

### 2. Clone & Set Up Frontend
```bash
cd frontend
npm install
npm run dev
```
*The Next.js Turbopack compiler will start the frontend at `http://localhost:3000`.*

---

## 📋 Assumptions Made
1. **Seating Sectors**: The stadium Grandstand consists of 16 concentric sectors separated by 8cm (0.08 rad) aisles.
2. **Offline Fallback**: If internet connectivity is lost or `GOOGLE_API_KEY` is not provided, the system gracefully falls back to deterministic rule-based routing, keeping the app operational.

---

## 🧪 Testing
We maintain 79 passing tests covering simulation updates, A* pathfinding accuracy, WebSocket messages, database state transitions, and edge cases.
```bash
cd backend
python -m pytest
```

---
*Built with **Google Antigravity** for the **Google Antigravity Hackathon 2026**.*
