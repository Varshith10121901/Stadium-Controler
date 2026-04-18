"""
SwarmAI A* Pathfinding Engine
=============================
Grid-based A* pathfinding adapted for stadium navigation.
Supports dynamic obstacle avoidance (crowd density as cost).
The grid represents the stadium as a 100x100 space with walkable/blocked cells.
"""

import heapq
import math
from typing import Optional


class Grid:
    """
    Represents the stadium as a discrete grid for pathfinding.
    Each cell has a base cost (1.0 for open, inf for walls).
    Crowd density dynamically increases cell costs to route around congestion.
    """

    def __init__(self, width: int = 100, height: int = 100):
        self.width = width
        self.height = height
        # Base cost grid: 1.0 = walkable, float('inf') = blocked
        self.base_cost = [[1.0] * width for _ in range(height)]
        # Dynamic cost overlay (crowd density penalty)
        self.density_cost = [[0.0] * width for _ in range(height)]
        self._init_stadium_shape()

    def _init_stadium_shape(self):
        """
        Mark cells outside the stadium oval as blocked.
        Stadium is an ellipse centered at (50,50) with rx=48, ry=38.
        """
        cx, cy = 50.0, 50.0
        rx, ry = 48.0, 38.0
        for y in range(self.height):
            for x in range(self.width):
                # Check if point is inside the stadium ellipse
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1.0:
                    self.base_cost[y][x] = float('inf')

    def set_density(self, x: int, y: int, density: float):
        """
        Set crowd density at a cell. Density 0-1 maps to additional cost 0-10.
        Higher density = higher path cost = agents route around congested areas.
        """
        if 0 <= x < self.width and 0 <= y < self.height:
            # Exponential cost: small crowds are cheap, packed areas are very expensive
            self.density_cost[y][x] = density ** 2 * 10.0

    def update_density_from_agents(self, agents: list):
        """
        Recompute the density cost grid from current agent positions.
        Uses a simple kernel: each agent increases cost in a 3x3 area.
        """
        # Reset density costs
        for y in range(self.height):
            for x in range(self.width):
                self.density_cost[y][x] = 0.0

        # Accumulate agent presence
        density_grid = [[0] * self.width for _ in range(self.height)]
        for agent in agents:
            ax, ay = int(agent.get("x", 0)), int(agent.get("y", 0))
            # 5x5 influence kernel for each agent
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    nx, ny = ax + dx, ay + dy
                    if 0 <= nx < self.width and 0 <= ny < self.height:
                        # Closer to agent center = more influence
                        dist = abs(dx) + abs(dy)
                        density_grid[ny][nx] += max(0, 3 - dist)

        # Normalize and set costs
        max_density = max(max(row) for row in density_grid) if agents else 1
        max_density = max(max_density, 1)
        for y in range(self.height):
            for x in range(self.width):
                normalized = density_grid[y][x] / max_density
                self.density_cost[y][x] = normalized ** 2 * 10.0

    def get_cost(self, x: int, y: int) -> float:
        """Total movement cost at position (x, y)."""
        if not (0 <= x < self.width and 0 <= y < self.height):
            return float('inf')
        base = self.base_cost[y][x]
        if base == float('inf'):
            return float('inf')
        return base + self.density_cost[y][x]

    def get_neighbors(self, x: int, y: int) -> list[tuple[int, int]]:
        """
        Get walkable neighbors (8-directional movement).
        Diagonal movement allowed for natural-looking paths.
        """
        neighbors = []
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1),
                        (-1, -1), (-1, 1), (1, -1), (1, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.width and 0 <= ny < self.height:
                if self.base_cost[ny][nx] < float('inf'):
                    neighbors.append((nx, ny))
        return neighbors

    def get_density_map(self) -> list[list[float]]:
        """Return the density cost grid as a 2D array (for heatmap visualization)."""
        max_cost = 10.0
        return [[min(self.density_cost[y][x] / max_cost, 1.0)
                 for x in range(self.width)]
                for y in range(self.height)]


def heuristic(a: tuple[int, int], b: tuple[int, int]) -> float:
    """
    A* heuristic: Euclidean distance (admissible for 8-dir movement).
    More accurate than Manhattan distance for diagonal movement.
    """
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def astar_path(
    grid: Grid,
    start: tuple[int, int],
    goal: tuple[int, int],
    max_iterations: int = 5000
) -> list[tuple[int, int]]:
    """
    A* pathfinding on the stadium grid.
    
    Args:
        grid: The Grid with costs (including crowd density)
        start: (x, y) start position
        goal: (x, y) goal position
        max_iterations: Safety limit to prevent infinite loops
    
    Returns:
        List of (x, y) waypoints from start to goal.
        Empty list if no path found.
    
    The path automatically avoids:
    - Stadium walls (cells outside the ellipse)
    - High-density areas (crowd congestion)
    """
    # Clamp to grid bounds
    sx = max(0, min(int(start[0]), grid.width - 1))
    sy = max(0, min(int(start[1]), grid.height - 1))
    gx = max(0, min(int(goal[0]), grid.width - 1))
    gy = max(0, min(int(goal[1]), grid.height - 1))

    start_node = (sx, sy)
    goal_node = (gx, gy)

    if start_node == goal_node:
        return [start_node]

    # If start or goal is blocked, find nearest walkable cell
    if grid.get_cost(sx, sy) == float('inf'):
        start_node = _find_nearest_walkable(grid, sx, sy)
        if start_node is None:
            return []

    if grid.get_cost(gx, gy) == float('inf'):
        goal_node = _find_nearest_walkable(grid, gx, gy)
        if goal_node is None:
            return []

    # ── A* Algorithm ──────────────────────────────────────────────────────────
    open_set = []  # Priority queue: (f_score, counter, node)
    counter = 0
    heapq.heappush(open_set, (0, counter, start_node))

    came_from: dict[tuple, tuple] = {}
    g_score: dict[tuple, float] = {start_node: 0}
    f_score: dict[tuple, float] = {start_node: heuristic(start_node, goal_node)}

    closed_set = set()
    iterations = 0

    while open_set and iterations < max_iterations:
        iterations += 1
        _, _, current = heapq.heappop(open_set)

        if current == goal_node:
            # Reconstruct path
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            path.reverse()
            # Simplify path (remove collinear points)
            return _simplify_path(path)

        if current in closed_set:
            continue
        closed_set.add(current)

        for neighbor in grid.get_neighbors(current[0], current[1]):
            if neighbor in closed_set:
                continue

            # Movement cost: base + density + diagonal penalty
            dx = abs(neighbor[0] - current[0])
            dy = abs(neighbor[1] - current[1])
            move_cost = 1.414 if (dx + dy == 2) else 1.0  # √2 for diagonal
            tentative_g = g_score[current] + move_cost * grid.get_cost(neighbor[0], neighbor[1])

            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f = tentative_g + heuristic(neighbor, goal_node)
                f_score[neighbor] = f
                counter += 1
                heapq.heappush(open_set, (f, counter, neighbor))

    # No path found — return direct line as fallback
    return _direct_path(start_node, goal_node)


def _find_nearest_walkable(grid: Grid, x: int, y: int, radius: int = 10) -> Optional[tuple[int, int]]:
    """Find the nearest walkable cell to (x, y) within a search radius."""
    for r in range(1, radius + 1):
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < grid.width and 0 <= ny < grid.height:
                    if grid.base_cost[ny][nx] < float('inf'):
                        return (nx, ny)
    return None


def _simplify_path(path: list[tuple[int, int]]) -> list[tuple[int, int]]:
    """
    Remove intermediate points on straight line segments.
    Keeps only turning points for efficient transmission and rendering.
    """
    if len(path) <= 2:
        return path

    simplified = [path[0]]
    for i in range(1, len(path) - 1):
        prev = path[i - 1]
        curr = path[i]
        next_pt = path[i + 1]
        # Check if direction changes
        dx1 = curr[0] - prev[0]
        dy1 = curr[1] - prev[1]
        dx2 = next_pt[0] - curr[0]
        dy2 = next_pt[1] - curr[1]
        if dx1 != dx2 or dy1 != dy2:
            simplified.append(curr)
    simplified.append(path[-1])

    return simplified


def _direct_path(start: tuple[int, int], goal: tuple[int, int]) -> list[tuple[int, int]]:
    """Fallback: simple straight line path (Bresenham-like)."""
    path = []
    x0, y0 = start
    x1, y1 = goal
    dx = abs(x1 - x0)
    dy = abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    steps = 0
    max_steps = 200

    while steps < max_steps:
        path.append((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x0 += sx
        if e2 < dx:
            err += dx
            y0 += sy
        steps += 1

    return path
