// Vision (DESIGN §7, §14): cones, grid line of sight and concealment. Pure maths on the grid.
import { type Grid, BUSH, COVER, TREE, WALL, getTile } from './grid';

/** How a survivor moves; run and walk count as standing. */
export type Mode = 'run' | 'walk' | 'crouch' | 'crawl';

export interface Viewer {
  x: number;
  y: number;
  facing: [number, number];
  range: number; // tiles
  angle: number; // full cone width, degrees
}

/** Distance at which concealment stops working (enemies look past hidden survivors unless adjacent). */
export const ADJACENT = 1.5;

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

export function isLow(mode: Mode): boolean {
  return mode === 'crouch' || mode === 'crawl';
}

/** A survivor's current mode: running only while it has a route; otherwise its stance. */
export function moveMode(u: { stance: 'walk' | 'crouch' | 'crawl'; running: boolean; path: readonly unknown[] }): Mode {
  return u.running && u.path.length > 0 ? 'run' : u.stance;
}

/** Inside the cone's range and angle (no line-of-sight check). */
export function inCone(v: Viewer, tx: number, ty: number): boolean {
  const dx = tx - v.x;
  const dy = ty - v.y;
  const d = Math.hypot(dx, dy);
  if (d > v.range + 1e-9) return false;
  if (d < 1e-9) return true;
  const f = Math.hypot(v.facing[0], v.facing[1]);
  if (f < 1e-9) return false;
  const cos = (dx * v.facing[0] + dy * v.facing[1]) / (d * f);
  return cos >= Math.cos((v.angle / 2) * (Math.PI / 180)) - 1e-9;
}

/**
 * Grid line of sight between two points. Walls and trees block it; with `lowBlocks`, cover tiles do
 * too (they hide a crouched or crawling target). The tiles of both ends never block.
 */
export function lineOfSight(g: Grid, ax: number, ay: number, bx: number, by: number, lowBlocks = false): boolean {
  const sx = Math.round(ax);
  const sy = Math.round(ay);
  const ex = Math.round(bx);
  const ey = Math.round(by);
  const steps = Math.ceil(dist(ax, ay, bx, by) * 4);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = Math.round(ax + (bx - ax) * t);
    const y = Math.round(ay + (by - ay) * t);
    if ((x === sx && y === sy) || (x === ex && y === ey)) continue;
    const k = getTile(g, x, y);
    if (k === WALL || k === TREE || (lowBlocks && k === COVER)) return false;
  }
  return true;
}

/** Cone plus line of sight to a plain point (an enemy, a body); nothing hides. */
export function seesPoint(g: Grid, v: Viewer, tx: number, ty: number): boolean {
  return inCone(v, tx, ty) && lineOfSight(g, v.x, v.y, tx, ty);
}

/**
 * Whether a viewer sees a survivor, and in which half of the cone. A crouched or crawling survivor
 * in a bush, or behind low cover, is hidden unless adjacent. With `farStandingOnly` (human guards),
 * the far half sees only standing survivors.
 */
export function seeSurvivor(
  g: Grid,
  v: Viewer,
  t: { x: number; y: number; mode: Mode },
  farStandingOnly = false,
): 'none' | 'near' | 'far' {
  if (!inCone(v, t.x, t.y)) return 'none';
  const d = dist(v.x, v.y, t.x, t.y);
  const low = isLow(t.mode);
  const adjacent = d <= ADJACENT;
  if (!lineOfSight(g, v.x, v.y, t.x, t.y, low && !adjacent)) return 'none';
  if (low && !adjacent && getTile(g, Math.round(t.x), Math.round(t.y)) === BUSH) return 'none';
  const near = d <= v.range / 2;
  if (!near && farStandingOnly && low) return 'none';
  return near ? 'near' : 'far';
}
