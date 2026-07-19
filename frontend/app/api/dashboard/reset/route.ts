import { NextResponse } from 'next/server';

/** POST /api/dashboard/reset — mock: acknowledges dashboard reset. */
export async function POST() {
  return NextResponse.json({ ok: true, tick: 0, message: 'Simulation reset' });
}
