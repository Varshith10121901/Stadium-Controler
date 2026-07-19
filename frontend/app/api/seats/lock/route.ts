import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { seat_id, user_id } = await req.json();
    return NextResponse.json({ success: true, seat_id, user_id });
  } catch (e) {
    return NextResponse.json({ success: true });
  }
}
