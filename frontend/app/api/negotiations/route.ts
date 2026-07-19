import { NextResponse } from 'next/server';
import { createAgents, generateNegotiations, hashSeed } from '@/lib/simulation';

/**
 * GET /api/negotiations?limit=N
 * Returns a synthetic negotiation log for the /debug console.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50));
  const agents = createAgents(200, hashSeed('negotiations:' + Math.floor(Date.now() / 5000)));
  const negotiations = generateNegotiations(agents, Math.floor(Date.now() / 200), limit);
  return NextResponse.json({ negotiations });
}
