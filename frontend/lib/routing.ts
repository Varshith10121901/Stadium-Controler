/**
 * SwarmAI — Aisle-Restricted A* Pathfinding (TypeScript port)
 * ============================================================
 * Faithful port of the README §"Aisle-Restricted A* Pathfinding" pipeline.
 *
 * The stadium is a 100×100 grid. Each cell carries a base traversal cost:
 *   - Seats / pitch interior: HIGH cost (50.0) — paths avoid crossing them
 *   - Radial stairways / aisles: LOW cost (1.0) — preferred
 *   - Concourse ring (outer band): LOW cost (1.0)
 *   - Ramp / elevator cells: LOW cost in both modes; ESPECIALLY low in accessible
 *
 * The accessible flag reweights stairs as HIGH cost (wheelchair users can't use
 * them) and boosts ramps/elevators/wide-aisle cells — exactly as plan §7.1
 * describes. This is a small delta on the cost function.
 */

export const GRID = 100;

export type CellType = 'seat' | 'pitch' | 'aisle' | 'concourse' | 'stair' | 'ramp' | 'elevator';

export interface CellCosts {
  seat: number;
  pitch: number;
  aisle: number;
  concourse: number;
  stair: number;
  ramp: number;
  elevator: number;
}

export const DEFAULT_COSTS: CellCosts = {
  seat: 50.0,
  pitch: 50.0,
  aisle: 1.0,
  concourse: 1.0,
  stair: 1.0, // stairs are fine for non-accessible routing
  ramp: 1.0,
  elevator: 1.0,
};

/** Accessible cost profile: stairs become prohibitively expensive. */
export const ACCESSIBLE_COSTS: CellCosts = {
  ...DEFAULT_COSTS,
  stair: 9999.0, // wheelchairs can't use stairs
  ramp: 0.5, // prefer ramps
  elevator: 0.3, // prefer elevators most
  aisle: 1.0,
};

/**
 * Build a cell-type grid for the stadium. Deterministic & geometry-driven.
 *
 * Layout (matches the 3D scene + README):
 *   - Pitch: ellipse at center (radii 20×14)
 *   - Bowl ring (seats): between inner ring (~25) and outer ring (~44)
 *   - Radial stairways: 16 sectors — the sector boundaries are aisles/stairs
 *   - Concourse: outer band beyond ~46
 *   - Ramps / elevators: at 4 cardinal points (near gates)
 */
export function buildCellGrid(): CellType[][] {
  const grid: CellType[][] = [];
  const cx = 50, cy = 50;
  const pitchRx = 20, pitchRy = 14;
  const bowlInner = 25, bowlOuter = 44;
  const sectors = 16;
  const sectorAngle = (Math.PI * 2) / sectors;
  const stairHalfWidth = 0.06; // radians — matches 0.08 aisle gap minus margin

  for (let y = 0; y < GRID; y++) {
    const row: CellType[] = [];
    for (let x = 0; x < GRID; x++) {
      const dx = x - cx;
      const dy = (y - cy) / 0.78; // un-squash the elliptical bowl
      const r = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // Distance from the nearest sector boundary (radial stairway).
      let distToBoundary = Infinity;
      for (let s = 0; s < sectors; s++) {
        const boundary = s * sectorAngle;
        let d = Math.abs(((angle - boundary + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (d < distToBoundary) distToBoundary = d;
      }

      // Pitch interior
      if (Math.hypot(dx, (y - cy)) < pitchRx && Math.abs(dy) < pitchRy) {
        row.push('pitch');
        continue;
      }
      // Concourse ring (outer)
      if (r > bowlOuter) {
        row.push('concourse');
        continue;
      }
      // Bowl ring (seats), except radial stairways
      if (r > bowlInner) {
        if (distToBoundary < stairHalfWidth) {
          row.push('stair');
        } else {
          row.push('seat');
        }
        continue;
      }
      // Inner ring apron — aisle.
      row.push('aisle');
    }
    grid.push(row);
  }

  // Place 4 elevator cells at the cardinal gate entries (r ~ 45).
  const elevators: [number, number][] = [
    [50, 6], [50, 94], [6, 50], [94, 50],
  ];
  for (const [ex, ey] of elevators) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = ex + dx, ny = ey + dy;
        if (nx >= 0 && nx < GRID && ny >= 0 && ny < GRID) {
          grid[ny][nx] = 'elevator';
        }
      }
    }
  }
  // Place ramps just inside the elevators, leading inward.
  const ramps: [number, number][] = [
    [50, 12], [50, 88], [12, 50], [88, 50],
  ];
  for (const [rx, ry] of ramps) grid[ry][rx] = 'ramp';

  return grid;
}

// ── A* over the grid ─────────────────────────────────────────────────────────

interface Node {
  x: number;
  y: number;
  g: number;
  f: number;
  parent: Node | null;
}

const NEIGHBORS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

function key(x: number, y: number): number {
  return y * GRID + x;
}

function heuristic(x: number, y: number, gx: number, gy: number): number {
  // Octile distance for 8-connected grids.
  const dx = Math.abs(x - gx);
  const dy = Math.abs(y - gy);
  return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

function cellCost(grid: CellType[][], x: number, y: number, costs: CellCosts): number {
  switch (grid[y][x]) {
    case 'seat': return costs.seat;
    case 'pitch': return costs.pitch;
    case 'aisle': return costs.aisle;
    case 'concourse': return costs.concourse;
    case 'stair': return costs.stair;
    case 'ramp': return costs.ramp;
    case 'elevator': return costs.elevator;
    default: return costs.aisle;
  }
}

export interface PathResult {
  path: number[][];
  distance: number;
  estimated_time: string;
  accessible: boolean;
  cells_traversed: number;
}

/**
 * Run A* from (sx,sy) → (tx,ty). Returns the path as an array of [x,y] pairs
 * in 0–100 stadium coordinates.
 *
 * If the start cell is a seat, we first snap to the nearest aisle/stair
 * (per README: "A* is forced to path out of the seat block into the nearest
 * radial stairway").
 */
export function findPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  accessible = false,
): PathResult {
  const grid = buildCellGrid();
  const costs = accessible ? ACCESSIBLE_COSTS : DEFAULT_COSTS;

  // Snap start/target to grid integers within bounds.
  let startX = Math.max(0, Math.min(GRID - 1, Math.round(sx)));
  let startY = Math.max(0, Math.min(GRID - 1, Math.round(sy)));
  const goalX = Math.max(0, Math.min(GRID - 1, Math.round(tx)));
  const goalY = Math.max(0, Math.min(GRID - 1, Math.round(ty)));

  // If start is on a seat/stair, nudge to the nearest walkable cell.
  const isWalkable = (x: number, y: number) => grid[y][x] !== 'seat' && grid[y][x] !== 'pitch'
    && (accessible ? grid[y][x] !== 'stair' : true);
  if (!isWalkable(startX, startY)) {
    const snapped = nearestWalkable(grid, startX, startY, accessible);
    if (snapped) { [startX, startY] = snapped; }
  }

  // A* with a Map-based open set + closed set.
  const start: Node = { x: startX, y: startY, g: 0, f: heuristic(startX, startY, goalX, goalY), parent: null };
  const open: Node[] = [start];
  const openMap = new Map<number, Node>([[key(startX, startY), start]]);
  const closed = new Set<number>();
  const iters = { n: 0 };
  const MAX_ITERS = GRID * GRID * 4;

  while (open.length > 0 && iters.n++ < MAX_ITERS) {
    // Pop the node with the lowest f (linear scan; GRID is small).
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIdx].f) bestIdx = i;
    const current = open.splice(bestIdx, 1)[0];
    const ck = key(current.x, current.y);
    openMap.delete(ck);

    if (current.x === goalX && current.y === goalY) {
      // Reconstruct.
      const path: number[][] = [];
      let n: Node | null = current;
      while (n) { path.push([n.x, n.y]); n = n.parent; }
      path.reverse();
      // Coarse-simplify: drop collinear points to keep the polyline readable.
      const simplified = simplify(path);
      let dist = 0;
      for (let i = 1; i < simplified.length; i++) {
        dist += Math.hypot(simplified[i][0] - simplified[i - 1][0], simplified[i][1] - simplified[i - 1][1]);
      }
      return {
        path: simplified,
        distance: Number(dist.toFixed(2)),
        estimated_time: estimateTime(dist, accessible),
        accessible,
        cells_traversed: path.length,
      };
    }

    closed.add(ck);

    for (const [dx, dy] of NEIGHBORS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;

      const stepBase = cellCost(grid, nx, ny, costs);
      const stepDist = (dx !== 0 && dy !== 0) ? Math.SQRT2 : 1;
      const tentativeG = current.g + stepBase * stepDist;

      const existing = openMap.get(nk);
      if (existing && tentativeG >= existing.g) continue;

      const node: Node = {
        x: nx, y: ny, g: tentativeG,
        f: tentativeG + heuristic(nx, ny, goalX, goalY),
        parent: current,
      };
      if (existing) {
        // Replace.
        const idx = open.indexOf(existing);
        if (idx >= 0) open.splice(idx, 1);
      }
      open.push(node);
      openMap.set(nk, node);
    }
  }

  // No path found (e.g. fully blocked) → fall back to a straight line.
  return {
    path: [[sx, sy], [tx, ty]],
    distance: Number(Math.hypot(tx - sx, ty - sy).toFixed(2)),
    estimated_time: estimateTime(Math.hypot(tx - sx, ty - sy), accessible),
    accessible,
    cells_traversed: 0,
  };
}

function nearestWalkable(grid: CellType[][], x: number, y: number, accessible: boolean): [number, number] | null {
  for (let r = 1; r < 10; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const t = grid[ny][nx];
        if (t !== 'seat' && t !== 'pitch' && (!accessible || t !== 'stair')) {
          return [nx, ny];
        }
      }
    }
  }
  return null;
}

/** Drop collinear interior points to produce a readable polyline. */
function simplify(points: number[][]): number[][] {
  if (points.length <= 2) return points;
  const out: number[][] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    const cross = (x - px) * (ny - py) - (y - py) * (nx - px);
    if (Math.abs(cross) > 0.5) out.push([x, y]);
  }
  out.push(points[points.length - 1]);
  return out;
}

function estimateTime(dist: number, accessible: boolean): string {
  // ~80 m/min walking; accessible routing ~55 m/min.
  const minutes = dist / (accessible ? 55 : 80);
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  return `${minutes.toFixed(1)} mins`;
}

// ── Target POI resolution ────────────────────────────────────────────────────

export const TARGET_POIS: Record<string, { x: number; y: number; label: string }> = {
  gate: { x: 50, y: 6, label: 'Nearest Gate' },
  restroom: { x: 12, y: 88, label: 'Restroom / Merch' },
  merchandise: { x: 12, y: 88, label: 'Merchandise Store' },
  concession: { x: 88, y: 50, label: 'Food Concession' },
  food: { x: 88, y: 50, label: 'Food Concession' },
  exit: { x: 50, y: 6, label: 'Nearest Exit' },
};
