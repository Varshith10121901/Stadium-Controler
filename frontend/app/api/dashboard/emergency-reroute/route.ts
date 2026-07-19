import { NextResponse } from 'next/server';

/**
 * POST /api/dashboard/emergency-reroute
 * Mock: acknowledges an emergency reroute. The client-side simulation loop
 * reacts to this for 8 seconds by sending every agent to the nearest gate.
 */
export async function POST() {
  return NextResponse.json({
    ok: true,
    emergency: true,
    duration_s: 8,
    message: 'Emergency reroute active — all agents heading to nearest exit',
  });
}
