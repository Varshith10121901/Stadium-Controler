import { NextResponse } from 'next/server';

/** POST /api/dashboard/bulk-start?num_agents=N — mock: acknowledges bulk deploy. */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const numAgents = Math.max(1, Number(searchParams.get('num_agents')) || 1000);
  return NextResponse.json({
    ok: true,
    num_agents: numAgents,
    message: `Bulk-started ${numAgents} agents`,
  });
}
