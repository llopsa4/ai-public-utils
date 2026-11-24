// Vision cones and noise rings (DESIGN §7): pure tile-space geometry. The Mission scene projects the
// points with `tileToWorld` and fills them; nothing here touches Phaser.
import { type Grid, TREE, WALL, getTile } from '../sim/grid';
import { RING_TICKS } from '../sim/noise';
import type { Viewer } from '../sim/vision';

export type P = [number, number];

const STEP = 0.2; // tiles per ray step

/**
 * The cone as a polygon (apex first). Each ray stops at the first wall or tree, so the shape matches
 * the line of sight. `range` overrides the viewer's range (for the near half).
 */
export function conePolygon(g: Grid, v: Viewer, range = v.range, rays = 14): P[] {
  const base = Math.atan2(v.facing[1], v.facing[0]);
  const half = (v.angle / 2) * (Math.PI / 180);
  const pts: P[] = [[v.x, v.y]];
  const sx = Math.round(v.x);
  const sy = Math.round(v.y);
  for (let i = 0; i <= rays; i++) {
    const a = base - half + (2 * half * i) / rays;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let d = 0;
    while (d + STEP <= range + 1e-9) {
      const x = v.x + dx * (d + STEP);
      const y = v.y + dy * (d + STEP);
      const tx = Math.round(x);
      const ty = Math.round(y);
      const k = getTile(g, tx, ty);
      if ((k === WALL || k === TREE) && !(tx === sx && ty === sy)) break;
      d += STEP;
    }
    pts.push([v.x + dx * d, v.y + dy * d]);
  }
  return pts;
}

/** A zombie's sight circle (DESIGN §7): all round, clipped by walls and trees like a cone. */
export function sightPolygon(g: Grid, x: number, y: number, radius: number): P[] {
  const pts = conePolygon(g, { x, y, facing: [1, 0], range: radius, angle: 360 }, radius, 28);
  pts.shift(); // the apex is the centre; the ring of ray ends is the outline
  return pts;
}

/** A circle of `radius` tiles as a polygon. */
export function circlePoints(cx: number, cy: number, radius: number, n = 28): P[] {
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  return pts;
}

/** A noise ring grows to its full radius over its life and fades: radius and alpha for `age` ticks. */
export function ringLook(radius: number, age: number): { r: number; alpha: number } {
  const t = Math.min(1, (age + 1) / RING_TICKS);
  return { r: radius * (0.25 + 0.75 * t), alpha: 0.9 * (1 - t) + 0.1 };
}
