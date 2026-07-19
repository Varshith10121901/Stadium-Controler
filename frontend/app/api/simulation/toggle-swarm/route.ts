import { NextResponse } from 'next/server';

/** POST /api/simulation/toggle-swarm — mock: flips game-theoretic negotiation. */
export async function POST() {
  return NextResponse.json({ ok: true, message: 'Swarm negotiation toggled' });
}
