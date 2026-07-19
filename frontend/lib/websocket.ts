/**
 * SwarmAI — Simulation Bridge (formerly WebSocket Client)
 * =======================================================
 * The original backend exposed a WebSocket server at `/ws/{clientId}` plus a
 * suite of REST endpoints for simulation control, dashboard actions, and
 * metrics history. The Python backend was removed during the migration to
 * Next.js API Routes, so this module no longer opens a real WebSocket.
 *
 * Instead it runs a deterministic in-browser simulation loop (see lib/simulation.ts)
 * that ticks the Zustand store with live agents/metrics/density — so the
 * dashboard, charts, and negotiation log all animate with zero backend.
 *
 * The REST helpers below call the mock Next.js API routes in app/api/* so the
 * dashboard's control buttons still fire real HTTP requests (which now return
 * deterministic mock responses). The same simulation engine powers both sides,
 * keeping telemetry consistent.
 *
 * Public API is unchanged from the WS-era module: connectWebSocket,
 * disconnectWebSocket, sendMessage, registerAsAgent, subscribeDebug,
 * setAgentGoal, requestSuggestions, and every fetch/start/stop/... helper
 * are preserved so call sites need no edits.
 */

import { useSwarmStore, type Agent } from './store';
import { getApiUrl } from './utils';
import {
  createAgents,
  stepAgents,
  computeMetrics,
  computeDensityMap,
  generateNegotiations,
  hashSeed,
  type SimOptions,
} from './simulation';

// ── Client identity ──────────────────────────────────────────────────────────

let clientId = 'server';
let simTimer: ReturnType<typeof setInterval> | null = null;
let agents: Agent[] = [];
let tickCount = 0;
let targetAgentCount = 100;
let emergencyUntil = 0;

/** Generate / persist a unique client ID per browser tab. */
function getClientId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('swarmai_client_id');
  if (!id) {
    id = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('swarmai_client_id', id);
  }
  return id;
}

// ── Tick interval (adaptive under load — Efficiency §6.4) ───────────────────

function pickInterval(agentCount: number): number {
  // Base 200ms. Above 2000 agents, widen the interval to keep the UI responsive.
  if (agentCount > 4000) return 500;
  if (agentCount > 2000) return 350;
  return 200;
}

function currentOptions(): SimOptions {
  const s = useSwarmStore.getState();
  return {
    swarmEnabled: s.swarmEnabled,
    seatingMode: s.seatingMode,
    emergency: Date.now() < emergencyUntil,
    speed: simSpeed,
    dt: 0.2,
  };
}

let simSpeed = 1;

/** Reseed the agent population (e.g. on bulk-start / reset / add-agents). */
function reseed(count: number) {
  targetAgentCount = Math.max(1, count);
  agents = createAgents(targetAgentCount, hashSeed(clientId + ':' + tickCount));
}

/** One simulation step → push to the store. */
function step() {
  if (agents.length !== targetAgentCount) {
    agents = createAgents(targetAgentCount, hashSeed(clientId + ':' + tickCount));
  }
  const opts = currentOptions();
  stepAgents(agents, opts, tickCount);
  const metrics = computeMetrics(agents, opts, tickCount);
  const density_map = computeDensityMap(agents);
  useSwarmStore.getState().handleStateUpdate({
    agents,
    metrics,
    density_map,
    tick: tickCount,
  });
  tickCount++;

  // Adaptive interval: if the crowd scaled dramatically, re-arm the timer.
  // (Cheap no-op when the interval is already correct.)
}

function scheduleAdaptive() {
  if (simTimer) clearInterval(simTimer);
  const interval = pickInterval(targetAgentCount);
  simTimer = setInterval(() => {
    step();
    // Re-schedule if the load tier changed.
    if (pickInterval(targetAgentCount) !== interval) scheduleAdaptive();
  }, interval);
}

// ── Public: connect / disconnect ─────────────────────────────────────────────

/**
 * Start the in-browser simulation loop. Replaces the old WebSocket connect.
 * Safe to call multiple times.
 */
export function connectWebSocket(): void {
  if (typeof window === 'undefined') return;
  if (simTimer) return;
  clientId = getClientId();
  const store = useSwarmStore.getState();
  store.setClientId(clientId);
  if (agents.length === 0) reseed(targetAgentCount);
  store.setConnected(true);
  store.setSimulationRunning(true);
  scheduleAdaptive();
  console.log(`[SwarmAI] Simulation loop active as ${clientId} (${targetAgentCount} agents)`);
}

export function disconnectWebSocket(): void {
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
  }
  useSwarmStore.getState().setConnected(false);
  useSwarmStore.getState().setSimulationRunning(false);
}

// ── Public: WS-era message helpers (now no-ops or store-only) ────────────────

export function sendMessage(_type: string, _data: any = {}): void {
  // No remote WS — kept for backwards compatibility with call sites.
}

export function registerAsAgent(x: number, y: number, goal: string): void {
  // Mark the first agent as the "real" user and override its goal.
  if (agents.length === 0) reseed(targetAgentCount);
  const me = agents.find((a) => a.is_real) ?? agents[0];
  if (me) {
    me.x = x; me.y = y; me.goal = goal;
    me.goal_x = x; me.goal_y = y;
    useSwarmStore.getState().setMyAgent({ ...me });
  }
}

export function subscribeDebug(): void {
  // No-op; the /debug page reads from the store directly.
}

export function setAgentGoal(goal: string): void {
  const me = agents.find((a) => a.is_real);
  if (me) me.goal = goal;
}

export function requestSuggestions(): void {
  // Deterministic suggestions derived from current density.
  const s = useSwarmStore.getState();
  const hot = s.metrics.hotspot_zones ?? [];
  useSwarmStore.getState().setSuggestions([
    {
      message: hot.length > 0 ? `Congestion near ${hot[0]} — rerouting via alternate aisle` : 'All zones operating at Fruin LoS A',
      action: hot.length > 0 ? 'reroute' : 'hold',
      benefit: '~40s saved',
      confidence: 0.92,
      urgency: hot.length > 0 ? 'high' : 'normal',
    },
  ]);
}

// ── REST helpers (now call the mock Next.js API routes) ──────────────────────

export async function fetchStadium() {
  const res = await fetch(`${getApiUrl()}/api/stadium`);
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${getApiUrl()}/api/metrics`);
  return res.json();
}

export async function fetchMetricsHistory(limit = 100) {
  const res = await fetch(`${getApiUrl()}/api/metrics/history?limit=${limit}`);
  return res.json();
}

export async function startSimulation(numAgents: number = 100) {
  reseed(numAgents);
  useSwarmStore.getState().setSimulationRunning(true);
  if (!simTimer) scheduleAdaptive();
  try {
    const res = await fetch(`${getApiUrl()}/api/simulation/start?num_agents=${numAgents}`, { method: 'POST' });
    return res.json();
  } catch { return { ok: true, num_agents: numAgents }; }
}

export async function stopSimulation() {
  useSwarmStore.getState().setSimulationRunning(false);
  if (simTimer) { clearInterval(simTimer); simTimer = null; }
  try {
    const res = await fetch(`${getApiUrl()}/api/simulation/stop`, { method: 'POST' });
    return res.json();
  } catch { return { ok: true }; }
}

export async function addAgents(count: number) {
  targetAgentCount += count;
  try {
    const res = await fetch(`${getApiUrl()}/api/simulation/add-agents?count=${count}`, { method: 'POST' });
    return res.json();
  } catch { return { ok: true, count }; }
}

export async function toggleSwarm() {
  const next = !useSwarmStore.getState().swarmEnabled;
  useSwarmStore.getState().setSwarmEnabled(next);
  try {
    const res = await fetch(`${getApiUrl()}/api/simulation/toggle-swarm`, { method: 'POST' });
    return res.json();
  } catch { return { ok: true, swarmEnabled: next }; }
}

export async function triggerEmergency() {
  emergencyUntil = Date.now() + 8000; // 8s of emergency behavior
  try {
    const res = await fetch(`${getApiUrl()}/api/dashboard/emergency-reroute`, { method: 'POST' });
    return res.json();
  } catch { return { ok: true }; }
}

export async function bulkStart(numAgents: number = 1000) {
  reseed(numAgents);
  useSwarmStore.getState().setSimulationRunning(true);
  if (!simTimer) scheduleAdaptive();
  try {
    const res = await fetch(`${getApiUrl()}/api/dashboard/bulk-start?num_agents=${numAgents}`, { method: 'POST' });
    return res.json();
  } catch { return { ok: true, num_agents: numAgents }; }
}

export async function resetSimulation() {
  tickCount = 0;
  emergencyUntil = 0;
  reseed(100);
  try {
    const res = await fetch(`${getApiUrl()}/api/dashboard/reset`, { method: 'POST' });
    return res.json();
  } catch { return { ok: true }; }
}

export async function arrangeSeatingMode(active: boolean) {
  useSwarmStore.getState().setSeatingMode(active);
  try {
    const res = await fetch(`${getApiUrl()}/api/dashboard/seating-mode?active=${active}`, { method: 'POST' });
    return res.json();
  } catch { return { ok: true, active }; }
}

export async function fetchComparison() {
  try {
    const res = await fetch(`${getApiUrl()}/api/dashboard/comparison`);
    return res.json();
  } catch {
    // Fallback: derive from current metrics so the UI never breaks.
    const m = useSwarmStore.getState().metrics;
    return {
      without_swarm: {
        avg_wait_time: m.avg_wait_time_no_swarm || 4.8,
        flow_efficiency: Math.round((1 - (m.flow_efficiency || 0.85)) * 100),
        congestion_score: Math.round((m.congestion_score || 0.2) * 100),
      },
      with_swarm: {
        avg_wait_time: m.avg_wait_time || 2.3,
        flow_efficiency: Math.round((m.flow_efficiency || 0.85) * 100),
        congestion_score: Math.round((m.congestion_score || 0.2) * 50),
      },
    };
  }
}

export async function fetchNegotiations(limit = 50) {
  try {
    const res = await fetch(`${getApiUrl()}/api/negotiations?limit=${limit}`);
    return res.json();
  } catch {
    return { negotiations: generateNegotiations(agents, tickCount, limit) };
  }
}

export async function exportMetricsCSV() {
  const res = await fetch(`${getApiUrl()}/api/metrics/export`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'swarmai_metrics.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function setSimSpeed(multiplier: number) {
  simSpeed = Math.max(0.5, Math.min(10, multiplier));
  try {
    const res = await fetch(`${getApiUrl()}/api/simulation/speed?multiplier=${multiplier}`, { method: 'POST' });
    return res.json();
  } catch { return { ok: true, multiplier: simSpeed }; }
}
