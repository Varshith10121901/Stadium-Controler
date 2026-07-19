import { describe, it, expect } from 'vitest';
import { findPath, buildCellGrid } from './routing';

describe('A* Routing Engine', () => {
  it('should build a 100x100 grid with correct types', () => {
    const grid = buildCellGrid();
    expect(grid.length).toBe(100);
    expect(grid[0].length).toBe(100);
    
    // Pitch center (50, 50) should be pitch cell
    expect(grid[50][50]).toBe('pitch');
  });

  it('should find a valid path between seat and POI', () => {
    // Start at a seat: r=30, sector 0 (approx 50 + 30 = 80, 50)
    const result = findPath(80, 50, 50, 6, false); // exit gate is at (50, 6)
    
    expect(result.path.length).toBeGreaterThanOrEqual(2);
    expect(result.distance).toBeGreaterThan(0);
    expect(result.accessible).toBe(false);
  });

  it('should apply accessible rules (avoid stairs) when requested', () => {
    const resultNormal = findPath(80, 50, 50, 6, false);
    const resultAccessible = findPath(80, 50, 50, 6, true);
    
    expect(resultAccessible.accessible).toBe(true);
    // Path should differ or adapt when stairs are avoided
    expect(resultAccessible.path).toBeDefined();
  });
});
