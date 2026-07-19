import { NextResponse } from 'next/server';
import { generateHistory } from '@/lib/simulation';

/**
 * GET /api/metrics/history?limit=N
 * Returns a synthetic time-series of metrics for the dashboard charts.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit')) || 100));
  const history = generateHistory(limit, 500, Math.floor(Date.now() / 60000));
  return NextResponse.json({ history });
}
