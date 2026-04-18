/**
 * SwarmAI — WebSocket Client
 * ===========================
 * Manages the WebSocket connection to the FastAPI backend.
 * Handles reconnection, message routing, and state synchronization.
 * Supports multi-tab mode: each tab gets a unique client ID.
 */

import { useSwarmStore } from './store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 20;
const RECONNECT_DELAY = 3000;

/**
 * Generate a unique client ID for this browser tab.
 * Persisted in sessionStorage so refreshing keeps the same ID.
 */
function getClientId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('swarmai_client_id');
  if (!id) {
    id = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('swarmai_client_id', id);
  }
  return id;
}

/**
 * Connect to the SwarmAI WebSocket server.
 * Automatically handles reconnection on disconnect.
 */
export function connectWebSocket(): void {
  if (typeof window === 'undefined') return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const clientId = getClientId();
  const store = useSwarmStore.getState();
  store.setClientId(clientId);

  try {
    ws = new WebSocket(`${WS_URL}/ws/${clientId}`);
  } catch (err) {
    console.error('[WS] Connection failed:', err);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log(`[WS] Connected as ${clientId}`);
    store.setConnected(true);
    reconnectAttempts = 0;
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleMessage(message);
    } catch (err) {
      console.error('[WS] Parse error:', err);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected');
    store.setConnected(false);
    ws = null;
    scheduleReconnect();
  };

  ws.onerror = (err) => {
    console.error('[WS] Error:', err);
  };
}

function scheduleReconnect(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log('[WS] Max reconnect attempts reached');
    return;
  }
  const delay = RECONNECT_DELAY * Math.min(reconnectAttempts + 1, 5);
  reconnectAttempts++;
  console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
  reconnectTimer = setTimeout(connectWebSocket, delay);
}

function handleMessage(message: any): void {
  const store = useSwarmStore.getState();
  const { type, data } = message;

  switch (type) {
    case 'welcome':
      console.log(`[WS] Welcome! Connections: ${data.connections}`);
      store.setSimulationRunning(data.simulation_running);
      break;

    case 'state_update':
      store.handleStateUpdate(data);
      break;

    case 'negotiation':
      store.addNegotiation({
        tick: data.tick || store.tick,
        timestamp: message.timestamp || new Date().toISOString(),
        agent_a: data.agent_a || '',
        agent_b: data.agent_b || '',
        accepted: data.accepted || false,
        net_utility: data.net_utility || 0,
        message: data.message || '',
      });
      break;

    case 'agent_registered':
      store.setMyAgent(data);
      break;

    case 'path_updated':
      store.setMyAgent(data);
      break;

    case 'suggestions':
      store.setSuggestions(data.suggestions || []);
      break;

    case 'subscribed':
      console.log(`[WS] Subscribed to ${data.channel}`);
      break;

    case 'pong':
      break;

    default:
      console.log(`[WS] Unknown message type: ${type}`);
  }
}

export function sendMessage(type: string, data: any = {}): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  } else {
    console.warn('[WS] Not connected, cannot send:', type);
  }
}

export function registerAsAgent(x: number, y: number, goal: string): void {
  sendMessage('register_agent', { x, y, goal });
}

export function subscribeDebug(): void {
  sendMessage('subscribe', { channel: 'debug' });
}

export function setAgentGoal(goal: string): void {
  sendMessage('set_goal', { goal });
}

export function requestSuggestions(): void {
  sendMessage('get_suggestions', {});
}

export function disconnectWebSocket(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
  if (ws) {
    ws.close();
    ws = null;
  }
}

// ── REST API Helpers ─────────────────────────────────────────────────────────

export async function fetchStadium() {
  const res = await fetch(`${API_URL}/api/stadium`);
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${API_URL}/api/metrics`);
  return res.json();
}

export async function fetchMetricsHistory(limit = 100) {
  const res = await fetch(`${API_URL}/api/metrics/history?limit=${limit}`);
  return res.json();
}

export async function startSimulation(numAgents: number = 100) {
  const res = await fetch(`${API_URL}/api/simulation/start?num_agents=${numAgents}`, { method: 'POST' });
  return res.json();
}

export async function stopSimulation() {
  const res = await fetch(`${API_URL}/api/simulation/stop`, { method: 'POST' });
  return res.json();
}

export async function addAgents(count: number) {
  const res = await fetch(`${API_URL}/api/simulation/add-agents?count=${count}`, { method: 'POST' });
  return res.json();
}

export async function toggleSwarm() {
  const res = await fetch(`${API_URL}/api/simulation/toggle-swarm`, { method: 'POST' });
  return res.json();
}

export async function triggerEmergency() {
  const res = await fetch(`${API_URL}/api/dashboard/emergency-reroute`, { method: 'POST' });
  return res.json();
}

export async function bulkStart(numAgents: number = 1000) {
  const res = await fetch(`${API_URL}/api/dashboard/bulk-start?num_agents=${numAgents}`, { method: 'POST' });
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch(`${API_URL}/api/dashboard/reset`, { method: 'POST' });
  return res.json();
}

export async function arrangeSeatingMode(active: boolean) {
  const res = await fetch(`${API_URL}/api/dashboard/seating-mode?active=${active}`, { method: 'POST' });
  return res.json();
}

export async function fetchComparison() {
  const res = await fetch(`${API_URL}/api/dashboard/comparison`);
  return res.json();
}

export async function fetchNegotiations(limit = 50) {
  const res = await fetch(`${API_URL}/api/negotiations?limit=${limit}`);
  return res.json();
}

export async function exportMetricsCSV() {
  const res = await fetch(`${API_URL}/api/metrics/export`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'swarmai_metrics.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function setSimSpeed(multiplier: number) {
  const res = await fetch(`${API_URL}/api/simulation/speed?multiplier=${multiplier}`, { method: 'POST' });
  return res.json();
}
