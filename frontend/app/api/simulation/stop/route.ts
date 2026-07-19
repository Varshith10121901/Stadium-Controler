import { NextResponse } from 'next/server';

/** POST /api/simulation/stop — mock: acknowledges simulation stop. */
export async function POST() {
  return NextResponse.json({ ok: true, message: 'Simulation stopped' });
}
