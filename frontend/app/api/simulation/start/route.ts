import { NextResponse } from 'next/server';

/**
 * POST /api/simulation/start?num_agents=N
 * Mock: acknowledges a simulation start with the requested agent count.
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const numAgents = Math.max(1, Number(searchParams.get('num_agents')) || 100);
  return NextResponse.json({
    ok: true,
    num_agents: numAgents,
    tick: Math.floor(Date.now() / 200) % 100000,
    message: `Simulation started with ${numAgents} agents`,
  });
}
