import { NextResponse } from 'next/server';

/** POST /api/simulation/speed?multiplier=N — mock: acknowledges speed change. */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const multiplier = Math.max(0.5, Math.min(10, Number(searchParams.get('multiplier')) || 1));
  return NextResponse.json({ ok: true, multiplier });
}
