/**
 * SwarmAI — Utility Functions
 * ============================
 * Shared helpers for formatting, colors, and calculations.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely (shadcn-ui pattern) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with commas (e.g., 1,234,567) */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(Math.round(n));
}

/** Format seconds to human readable (e.g., "2m 30s") */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

/** Format percentage with color indicator */
export function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Map a density value (0-1) to a heatmap color.
 * Green (low) → Yellow → Orange → Red (high)
 */
export function densityToColor(density: number, alpha: number = 0.6): string {
  const d = Math.max(0, Math.min(1, density));
  let r: number, g: number, b: number;

  if (d < 0.25) {
    const t = d / 0.25;
    r = Math.round(t * 255);
    g = 255;
    b = Math.round((1 - t) * 136);
  } else if (d < 0.5) {
    const t = (d - 0.25) / 0.25;
    r = 255;
    g = Math.round(255 - t * 85);
    b = 0;
  } else if (d < 0.75) {
    const t = (d - 0.5) / 0.25;
    r = 255;
    g = Math.round(170 - t * 100);
    b = 0;
  } else {
    const t = (d - 0.75) / 0.25;
    r = 255;
    g = Math.round(70 - t * 70);
    b = Math.round(t * 50);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Map a status to a color class.
 */
export function statusColor(status: string): string {
  switch (status) {
    case 'moving': return 'text-neon-green';
    case 'waiting': return 'text-fire-400';
    case 'arrived': return 'text-swarm-400';
    default: return 'text-gray-400';
  }
}

/**
 * Map a goal to an emoji.
 */
export function goalEmoji(goal: string): string {
  switch (goal) {
    case 'seat': return '💺';
    case 'concession': return '🍕';
    case 'restroom': return '🚻';
    case 'exit': return '🚪';
    default: return '📍';
  }
}

/**
 * Map urgency to color class.
 */
export function urgencyColor(urgency: string): string {
  switch (urgency) {
    case 'critical': return 'border-red-500 bg-red-500/10';
    case 'high': return 'border-fire-500 bg-fire-500/10';
    case 'normal': return 'border-swarm-500 bg-swarm-500/10';
    case 'low': return 'border-gray-600 bg-gray-600/10';
    default: return 'border-gray-600 bg-gray-600/10';
  }
}

/**
 * Interpolate between two values for smooth animation.
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Stadium coordinate to canvas pixel.
 */
export function stadiumToCanvas(
  x: number, y: number,
  canvasWidth: number, canvasHeight: number,
  padding: number = 20
): [number, number] {
  const px = padding + (x / 100) * (canvasWidth - 2 * padding);
  const py = padding + (y / 100) * (canvasHeight - 2 * padding);
  return [px, py];
}

/**
 * Canvas pixel to stadium coordinate.
 */
export function canvasToStadium(
  px: number, py: number,
  canvasWidth: number, canvasHeight: number,
  padding: number = 20
): [number, number] {
  const x = ((px - padding) / (canvasWidth - 2 * padding)) * 100;
  const y = ((py - padding) / (canvasHeight - 2 * padding)) * 100;
  return [Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y))];
}
