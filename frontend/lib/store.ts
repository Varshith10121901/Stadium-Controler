/**
 * SwarmAI — Zustand State Store
 * ==============================
 * Central state management for the frontend.
 * Manages: simulation state, agent data, metrics, UI state.
 * Uses Zustand for minimal boilerplate with React 19 compatibility.
 */

import { create } from 'zustand';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Agent {
  agent_id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  velocity: number;
  goal: string;
  goal_x: number;
  goal_y: number;
  path: number[][];
  group_id: string | null;
  swarm_points: number;
  wait_time: number;
  preference: string;
  negotiation_count: number;
  status: string;
  cooperation_score: number;
  satisfaction: number;
  is_real: boolean;
}

export interface Metrics {
  tick: number;
  timestamp?: string;
  total_agents: number;
  active_agents: number;
  avg_wait_time: number;
  avg_wait_time_no_swarm: number;
  wait_time_reduction_pct: number;
  flow_efficiency: number;
  congestion_score: number;
  negotiations_total: number;
  negotiations_success: number;
  negotiation_success_rate: number;
  reroutes_triggered: number;
  hotspot_zones: string[];
  zone_densities: Record<string, number>;
}

export interface Negotiation {
  tick: number;
  timestamp: string;
  agent_a: string;
  agent_b: string;
  accepted: boolean;
  net_utility: number;
  message: string;
}

export interface StadiumZone {
  id: string;
  name: string;
  zone_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
}

export interface StadiumLayout {
  name: string;
  capacity: number;
  width: number;
  height: number;
  center: [number, number];
  major_radius: number;
  minor_radius: number;
  zones: StadiumZone[];
  gates: StadiumZone[];
  concessions: StadiumZone[];
  restrooms: StadiumZone[];
  sections: StadiumZone[];
}

export interface ChatSuggestion {
  message: string;
  action: string;
  benefit: string;
  confidence: number;
  urgency: string;
}

// ── Store Interface ──────────────────────────────────────────────────────────

interface SwarmStore {
  connected: boolean;
  clientId: string;
  setConnected: (connected: boolean) => void;
  setClientId: (id: string) => void;

  simulationRunning: boolean;
  swarmEnabled: boolean;
  tick: number;
  setSimulationRunning: (running: boolean) => void;
  setSwarmEnabled: (enabled: boolean) => void;

  agents: Agent[];
  myAgent: Agent | null;
  selectedAgentId: string | null;
  setAgents: (agents: Agent[]) => void;
  setMyAgent: (agent: Agent | null) => void;
  setSelectedAgentId: (id: string | null) => void;

  metrics: Metrics;
  metricsHistory: Metrics[];
  setMetrics: (metrics: Metrics) => void;
  addMetricsHistory: (metrics: Metrics) => void;

  densityMap: number[][];
  setDensityMap: (map: number[][]) => void;

  negotiations: Negotiation[];
  addNegotiation: (neg: Negotiation) => void;

  stadium: StadiumLayout | null;
  setStadium: (layout: StadiumLayout) => void;

  suggestions: ChatSuggestion[];
  setSuggestions: (suggestions: ChatSuggestion[]) => void;

  selectedGoal: string;
  showHeatmap: boolean;
  showPaths: boolean;
  activeTab: string;
  seatingMode: boolean;
  setSelectedGoal: (goal: string) => void;
  setShowHeatmap: (show: boolean) => void;
  setShowPaths: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  setSeatingMode: (mode: boolean) => void;

  podId: string | null;
  podMembers: string[];
  setPodId: (id: string | null) => void;
  setPodMembers: (members: string[]) => void;

  handleStateUpdate: (data: any) => void;
}

// ── Default metrics ──────────────────────────────────────────────────────────
const defaultMetrics: Metrics = {
  tick: 0,
  total_agents: 0,
  active_agents: 0,
  avg_wait_time: 0,
  avg_wait_time_no_swarm: 0,
  wait_time_reduction_pct: 0,
  flow_efficiency: 85,
  congestion_score: 15,
  negotiations_total: 0,
  negotiations_success: 0,
  negotiation_success_rate: 0,
  reroutes_triggered: 0,
  hotspot_zones: [],
  zone_densities: {},
};

// ── Store ────────────────────────────────────────────────────────────────────

export const useSwarmStore = create<SwarmStore>((set, get) => ({
  connected: false,
  clientId: '',
  setConnected: (connected) => set({ connected }),
  setClientId: (clientId) => set({ clientId }),

  simulationRunning: false,
  swarmEnabled: true,
  tick: 0,
  setSimulationRunning: (running) => set({ simulationRunning: running }),
  setSwarmEnabled: (enabled) => set({ swarmEnabled: enabled }),

  agents: [],
  myAgent: null,
  selectedAgentId: null,
  setAgents: (agents) => set({ agents }),
  setMyAgent: (agent) => set({ myAgent: agent }),
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),

  metrics: defaultMetrics,
  metricsHistory: [],
  setMetrics: (metrics) => set({ metrics, tick: metrics.tick }),
  addMetricsHistory: (metrics) => {
    const history = get().metricsHistory;
    const updated = [...history.slice(-199), metrics];
    set({ metricsHistory: updated });
  },

  densityMap: [],
  setDensityMap: (map) => set({ densityMap: map }),

  negotiations: [],
  addNegotiation: (neg) => {
    const list = get().negotiations;
    set({ negotiations: [...list.slice(-99), neg] });
  },

  stadium: null,
  setStadium: (layout) => set({ stadium: layout }),

  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),

  selectedGoal: 'seat',
  showHeatmap: true,
  showPaths: true,
  activeTab: 'map',
  seatingMode: false,
  setSelectedGoal: (goal) => set({ selectedGoal: goal }),
  setShowHeatmap: (show) => set({ showHeatmap: show }),
  setShowPaths: (show) => set({ showPaths: show }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSeatingMode: (mode) => set({ seatingMode: mode }),

  podId: null,
  podMembers: [],
  setPodId: (id) => set({ podId: id }),
  setPodMembers: (members) => set({ podMembers: members }),

  handleStateUpdate: (data) => {
    const { agents, metrics, density_map, tick } = data;
    const state = get();

    set({
      agents: agents || state.agents,
      metrics: metrics || state.metrics,
      densityMap: density_map || state.densityMap,
      tick: tick || state.tick,
      simulationRunning: true,
    });

    if (metrics) {
      const history = state.metricsHistory;
      set({ metricsHistory: [...history.slice(-199), metrics] });
    }

    if (agents && state.clientId) {
      const myAgent = agents.find((a: Agent) => a.agent_id === state.clientId);
      if (myAgent) {
        set({ myAgent: myAgent });
      }
    }
  },
}));
