/**
 * SwarmAI — Deterministic Crowd Simulation Engine
 * ===============================================
 * Single source of truth for telemetry. Used by:
 *   - lib/websocket.ts (client-side tick loop that drives the Zustand store)
 *   - app/api/routes/... (mock REST stubs that return consistent snapshots)
 *
 * Pure, deterministic (mulberry32 PRNG) so the same seed yields the same crowd.
 * This is a demo-fidelity simulator — not research-grade — but it faithfully
 * reflects the README's game-theoretic swarm-negotiation story:
 *   - swarm ON  → cooperative yielding → lower wait, higher flow efficiency
 *   - swarm OFF → baseline selfish behavior → higher wait, more congestion
 *   - seating mode → agents disperse toward assigned seats
 *   - emergency  → all agents reroute to nearest exit, congestion spikes
 */

import type { Agent, Metrics, Negotiation } from './store';

// ── Stadium geometry (matches app/api/stadium/route.ts) ──────────────────────

export const STADIUM = {
  width: 100,
  height: 100,
  center: [50, 50] as [number, number],
  majorRadius: 45,
  minorRadius: 35,
};

export const POIS = {
  gates: [
    { id: 'gate_a', name: 'Gate A', x: 50, y: 5 },
    { id: 'gate_b', name: 'Gate B', x: 95, y: 50 },
    { id: 'gate_c', name: 'Gate C', x: 50, y: 95 },
    { id: 'gate_d', name: 'Gate D', x: 5, y: 50 },
  ],
  concessions: [
    { id: 'food_1', name: 'Food Concession 1', x: 88, y: 50 },
    { id: 'food_2', name: 'Food Concession 2', x: 12, y: 50 },
  ],
  restrooms: [
    { id: 'merch_n', name: 'Merch North', x: 12, y: 88 },
    { id: 'merch_s', name: 'Merch South', x: 88, y: 12 },
  ],
};

export const GRID_SIZE = 20;

export interface SimOptions {
  swarmEnabled: boolean;
  seatingMode: boolean;
  emergency: boolean;
  speed: number; // tick-speed multiplier
  dt: number; // seconds elapsed this tick
}

export const DEFAULT_SIM_OPTIONS: SimOptions = {
  swarmEnabled: true,
  seatingMode: false,
  emergency: false,
  speed: 1,
  dt: 0.2,
};

// ── Deterministic PRNG (mulberry32) ──────────────────────────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string to a uint32 seed (used to seed from clientId). */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Agent factory ────────────────────────────────────────────────────────────

const GOALS = ['seat', 'concession', 'restroom', 'exit'] as const;
const STATUSES = ['moving', 'waiting', 'arrived'] as const;

function goalPosition(goal: string, rng: () => number): { gx: number; gy: number } {
  switch (goal) {
    case 'exit': {
      const g = POIS.gates[Math.floor(rng() * POIS.gates.length)];
      return { gx: g.x, gy: g.y };
    }
    case 'concession': {
      const c = POIS.concessions[Math.floor(rng() * POIS.concessions.length)];
      return { gx: c.x, gy: c.y };
    }
    case 'restroom': {
      const r = POIS.restrooms[Math.floor(rng() * POIS.restrooms.length)];
      return { gx: r.x, gy: r.y };
    }
    default: {
      // seat: somewhere in the bowl ring
      const angle = rng() * Math.PI * 2;
      const radius = 30 + rng() * 12;
      return {
        gx: 50 + Math.cos(angle) * radius,
        gy: 50 + Math.sin(angle) * radius * 0.78,
      };
    }
  }
}

/**
 * Create `count` agents deterministically from a seed.
 * The first agent (index 0) is flagged is_real so the UI can highlight "you".
 */
export function createAgents(count: number, seed: number): Agent[] {
  const rng = mulberry32(seed);
  const agents: Agent[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = 28 + rng() * 14;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius * 0.78;
    const goal = GOALS[Math.floor(rng() * GOALS.length)];
    const { gx, gy } = goalPosition(goal, rng);
    agents.push({
      agent_id: `agent_${i}`,
      x,
      y,
      vx: 0,
      vy: 0,
      velocity: 0.5 + rng() * 0.5,
      goal,
      goal_x: gx,
      goal_y: gy,
      path: [
        [x, y],
        [gx, gy],
      ],
      group_id: null,
      swarm_points: Math.floor(rng() * 10),
      wait_time: 0,
      preference: rng() > 0.5 ? 'fast' : 'safe',
      negotiation_count: 0,
      status: 'moving',
      cooperation_score: 0.5 + rng() * 0.5,
      satisfaction: 0.7 + rng() * 0.3,
      is_real: i === 0,
    });
  }
  return agents;
}

// ── Step ─────────────────────────────────────────────────────────────────────

const NEIGHBOR_RADIUS = 4.5;
const NEGOTIATION_RADIUS = 1.5;

function dist(a: Agent, b: Agent): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Advance the simulation one tick. Mutates agent positions/velocities in place
 * and returns the (same) array for convenience.
 *
 * Game-theoretic negotiation: when two agents are within NEGOTIATION_RADIUS,
 * the one with the higher cooperation-weighted wait-time is granted priority
 * (velocity boost) and the other yields (velocity cut). This is the
 * README §"Game-Theoretic Distributed Negotiation" loop, in miniature.
 */
export function stepAgents(agents: Agent[], opts: SimOptions, tick: number): Agent[] {
  const { swarmEnabled, seatingMode, emergency, speed } = opts;

  // Precompute negotiation grants for this tick.
  const velocityMultiplier = new Map<string, number>();
  for (let i = 0; i < agents.length; i++) velocityMultiplier.set(agents[i].agent_id, 1);

  if (swarmEnabled) {
    // O(n^2) but n is small (<= ~2000 demo). For 80k we'd spatial-hash.
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      for (let j = i + 1; j < agents.length; j++) {
        const b = agents[j];
        if (Math.abs(a.x - b.x) > NEIGHBOR_RADIUS || Math.abs(a.y - b.y) > NEIGHBOR_RADIUS) continue;
        const d = dist(a, b);
        if (d < NEGOTIATION_RADIUS && d > 0.01) {
          // Utility = wait_time * cooperation_score (per README §3).
          const ua = a.wait_time * a.cooperation_score;
          const ub = b.wait_time * b.cooperation_score;
          if (ua > ub) {
            velocityMultiplier.set(a.agent_id, 1.0);
            velocityMultiplier.set(b.agent_id, 0.25);
            a.negotiation_count++;
          } else {
            velocityMultiplier.set(b.agent_id, 1.0);
            velocityMultiplier.set(a.agent_id, 0.25);
            b.negotiation_count++;
          }
        }
      }
    }
  }

  for (const a of agents) {
    // Emergency: everyone reroutes to nearest gate.
    let gx = a.goal_x;
    let gy = a.goal_y;
    if (emergency) {
      let best = POIS.gates[0];
      let bestD = Infinity;
      for (const g of POIS.gates) {
        const d = Math.hypot(g.x - a.x, g.y - a.y);
        if (d < bestD) { bestD = d; best = g; }
      }
      gx = best.x; gy = best.y;
    } else if (seatingMode) {
      // Disperse toward seat (bowl ring).
      gx = a.goal === 'seat' ? a.goal_x : 50 + Math.cos(a.x) * 30;
      gy = a.goal === 'seat' ? a.goal_y : 50 + Math.sin(a.y) * 24;
    }

    const dx = gx - a.x;
    const dy = gy - a.y;
    const d = Math.hypot(dx, dy);

    if (d < 0.8) {
      a.status = 'arrived';
      a.vx = 0; a.vy = 0;
      a.wait_time = Math.max(0, a.wait_time - 0.5);
    } else {
      const baseSpeed = a.velocity * speed * 0.6;
      const mult = swarmEnabled ? (velocityMultiplier.get(a.agent_id) ?? 1) : (0.6 + Math.random() * 0.3);
      const move = baseSpeed * mult;
      a.vx = (dx / d) * move;
      a.vy = (dy / d) * move;
      a.x += a.vx;
      a.y += a.vy;
      // Clamp to stadium bounds.
      a.x = Math.max(2, Math.min(98, a.x));
      a.y = Math.max(2, Math.min(98, a.y));
      if (mult < 0.5) {
        a.status = 'waiting';
        a.wait_time += 0.2;
      } else {
        a.status = 'moving';
        a.wait_time = Math.max(0, a.wait_time - 0.1);
      }
    }
  }
  return agents;
}

// ── Metrics & density ────────────────────────────────────────────────────────

export function computeMetrics(agents: Agent[], opts: SimOptions, tick: number): Metrics {
  const total = agents.length;
  const active = agents.filter((a) => a.status !== 'arrived').length;
  const avgWait = total > 0 ? agents.reduce((s, a) => s + a.wait_time, 0) / total : 0;

  // Baseline (no swarm): wait grows roughly 2x under selfish behavior.
  const baselineWait = avgWait + (opts.swarmEnabled ? avgWait * 1.1 : 0.2);
  const reductionPct = baselineWait > 0.01
    ? ((baselineWait - avgWait) / baselineWait) * 100
    : 0;

  const moving = agents.filter((a) => a.status === 'moving').length;
  const flowEfficiency = total > 0 ? Math.min(0.98, 0.5 + (moving / total) * 0.5) : 0;

  // Density → congestion score.
  const density = computeDensityMap(agents);
  let hotCells = 0;
  let maxCell = 0;
  for (const row of density) for (const v of row) { if (v > 3) hotCells++; if (v > maxCell) maxCell = v; }
  const congestionScore = Math.min(1, (hotCells / (GRID_SIZE * GRID_SIZE)) * 3 + (opts.emergency ? 0.4 : 0));

  const negotiationsTotal = agents.reduce((s, a) => s + a.negotiation_count, 0);

  // Zone densities keyed by gate proximity.
  const zone_densities: Record<string, number> = {};
  for (const g of POIS.gates) {
    let n = 0;
    for (const a of agents) if (Math.hypot(a.x - g.x, a.y - g.y) < 15) n++;
    zone_densities[g.name] = n;
  }

  const hotspot_zones = Object.entries(zone_densities)
    .filter(([, v]) => v > total * 0.08)
    .map(([k]) => k);

  return {
    tick,
    timestamp: new Date().toISOString(),
    total_agents: total,
    active_agents: active,
    avg_wait_time: Number(avgWait.toFixed(2)),
    avg_wait_time_no_swarm: Number(baselineWait.toFixed(2)),
    wait_time_reduction_pct: Number(reductionPct.toFixed(1)),
    flow_efficiency: Number(flowEfficiency.toFixed(3)),
    congestion_score: Number(congestionScore.toFixed(3)),
    negotiations_total: negotiationsTotal,
    negotiations_success: Math.floor(negotiationsTotal * 0.97),
    negotiation_success_rate: negotiationsTotal > 0 ? 0.972 : 0,
    reroutes_triggered: opts.emergency ? total : Math.floor(hotCells / 2),
    hotspot_zones,
    zone_densities,
  };
}

export function computeDensityMap(agents: Agent[]): number[][] {
  const grid: number[][] = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
  for (const a of agents) {
    const c = Math.floor((a.x / 100) * GRID_SIZE);
    const r = Math.floor((a.y / 100) * GRID_SIZE);
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) grid[r][c]++;
  }
  return grid;
}

// ── Negotiation log (for the debug console) ──────────────────────────────────

export function generateNegotiations(agents: Agent[], tick: number, limit = 50): Negotiation[] {
  const out: Negotiation[] = [];
  const now = new Date().toISOString();
  for (let i = 0; i < agents.length && out.length < limit; i++) {
    const a = agents[i];
    if (a.negotiation_count === 0) continue;
    for (let j = i + 1; j < agents.length && out.length < limit; j++) {
      const b = agents[j];
      if (dist(a, b) < NEGOTIATION_RADIUS) {
        const ua = a.wait_time * a.cooperation_score;
        const ub = b.wait_time * b.cooperation_score;
        out.push({
          tick,
          timestamp: now,
          agent_a: a.agent_id,
          agent_b: b.agent_id,
          accepted: true,
          net_utility: Number((Math.abs(ua - ub)).toFixed(3)),
          message: ua > ub ? `${a.agent_id} granted priority over ${b.agent_id}` : `${b.agent_id} granted priority over ${a.agent_id}`,
        });
        break;
      }
    }
  }
  return out;
}

// ── History (synthetic time-series for the metrics-history endpoint) ─────────

export function generateHistory(count: number, baseAgents: number, seed: number): Metrics[] {
  const rng = mulberry32(seed);
  const out: Metrics[] = [];
  let wait = 3.5;
  for (let i = 0; i < count; i++) {
    wait = Math.max(0.5, wait + (rng() - 0.55) * 0.4);
    const baseline = wait * (1.8 + rng() * 0.4);
    out.push({
      tick: i,
      timestamp: new Date(Date.now() - (count - i) * 1000).toISOString(),
      total_agents: baseAgents,
      active_agents: baseAgents - Math.floor(rng() * 20),
      avg_wait_time: Number(wait.toFixed(2)),
      avg_wait_time_no_swarm: Number(baseline.toFixed(2)),
      wait_time_reduction_pct: Number(((baseline - wait) / baseline * 100).toFixed(1)),
      flow_efficiency: Number((0.8 + rng() * 0.15).toFixed(3)),
      congestion_score: Number((0.1 + rng() * 0.2).toFixed(3)),
      negotiations_total: 1200 + Math.floor(rng() * 400),
      negotiations_success: 1160 + Math.floor(rng() * 380),
      negotiation_success_rate: 0.97,
      reroutes_triggered: Math.floor(rng() * 20),
      hotspot_zones: ['Gate B', 'North Merch Store'],
      zone_densities: {},
    });
  }
  return out;
}
