import { NextResponse } from 'next/server';

/** POST /api/dashboard/seating-mode?active=bool — mock: acknowledges seating-mode toggle. */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const active = searchParams.get('active') === 'true';
  return NextResponse.json({ ok: true, active });
}
