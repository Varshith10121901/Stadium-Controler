import { NextResponse } from 'next/server';
import { lockSeat } from '@/lib/seatsStore';

/**
 * POST /api/seats/lock
 * Body: { seat_id, user_id }
 *
 * Reserves a seat on the stadium grandstand. If the seat is already locked
 * by another user, returns a 409 Conflict.
 */
export async function POST(req: Request) {
  try {
    const { seat_id, user_id } = await req.json();
    if (!seat_id || !user_id) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    const success = lockSeat(seat_id, user_id);
    if (!success) {
      return NextResponse.json({ error: 'Seat already claimed' }, { status: 409 });
    }
    return NextResponse.json({ success: true, seat_id, user_id });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
