import { NextResponse } from 'next/server';
import { findPath, TARGET_POIS } from '@/lib/routing';

/**
 * GET /api/routes/path?start_x=&start_y=&target_type=gate|restroom|concession&accessible=true
 *
 * Returns an aisle-restricted A* path from the seat to the requested POI.
 * `accessible=true` switches the cost profile to avoid stairs and prefer
 * ramps/elevators (wheelchair-aware routing).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start_x = parseFloat(searchParams.get('start_x') || '50');
  const start_y = parseFloat(searchParams.get('start_y') || '50');
  const target_type = (searchParams.get('target_type') || 'gate').toLowerCase();
  const accessible = searchParams.get('accessible') === 'true';

  const poi = TARGET_POIS[target_type] ?? TARGET_POIS.gate;
  const target_x = poi.x;
  const target_y = start_y > 50 ? Math.min(95, poi.y + 40) : Math.max(5, poi.y);

  const result = findPath(start_x, start_y, target_x, target_y, accessible);

  return NextResponse.json({
    path: result.path,
    target_type,
    target_label: poi.label,
    distance: result.distance,
    estimated_time: result.estimated_time,
    accessible,
    cells_traversed: result.cells_traversed,
    algorithm: 'A*-aisle',
  });
}
