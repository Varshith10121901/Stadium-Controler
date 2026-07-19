import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    tick: Math.floor(Date.now() / 1000) % 1000,
    total_agents: 500,
    active_agents: 482,
    avg_wait_time: 2.3,
    avg_wait_time_no_swarm: 4.8,
    wait_time_reduction_pct: 52.1,
    flow_efficiency: 0.894,
    congestion_score: 0.18,
    negotiations_total: 1420,
    negotiations_success: 1380,
    negotiation_success_rate: 0.972,
    reroutes_triggered: 14,
    hotspot_zones: ["Gate B", "North Merch Store"]
  });
}
