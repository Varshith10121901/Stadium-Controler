import { NextResponse } from 'next/server';

/** POST /api/simulation/add-agents?count=N — mock: acknowledges agent injection. */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const count = Math.max(1, Number(searchParams.get('count')) || 50);
  return NextResponse.json({ ok: true, added: count });
}
