import { NextResponse } from 'next/server';

const lockedSeats: Record<string, string> = {
  "35.00_-15.00": "user_alpha",
  "12.50_20.00": "user_beta"
};

export async function GET() {
  return NextResponse.json(lockedSeats);
}
