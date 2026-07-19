import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start_x = parseFloat(searchParams.get('start_x') || '50');
  const start_y = parseFloat(searchParams.get('start_y') || '50');
  const target_type = searchParams.get('target_type') || 'gate';

  let target_x = 50;
  let target_y = start_y > 50 ? 95 : 5;

  if (target_type === 'restroom' || target_type === 'merchandise') {
    target_x = 12;
    target_y = 88;
  } else if (target_type === 'concession') {
    target_x = 88;
    target_y = 50;
  }

  const concourseY = start_y > 50 ? 92 : 8;
  const path = [
    [start_x, start_y],
    [start_x, concourseY],
    [target_x, target_y]
  ];

  return NextResponse.json({
    path,
    target_type,
    distance: Math.hypot(target_x - start_x, target_y - start_y),
    estimated_time: "1.8 mins"
  });
}
