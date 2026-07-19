import { NextResponse } from 'next/server';
import { getLockedSeats } from '@/lib/seatsStore';

/**
 * GET /api/seats/locked
 *
 * Returns a dictionary map of all locked/reserved seats on the stadium grandstand.
 */
export async function GET() {
  return NextResponse.json(getLockedSeats());
}
