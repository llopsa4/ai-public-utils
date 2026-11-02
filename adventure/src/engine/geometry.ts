import type { Condition, GameState, Point, Polygon } from './types';

const EPS = 1e-6;

export function pointInPolygon(p: Point, poly: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function closestPointOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function distanceToPolygonEdge(p: Point, poly: Polygon): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    best = Math.min(best, distance(p, closestPointOnSegment(p, poly[i], poly[(i + 1) % poly.length])));
  }
  return best;
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** True when the segments cross at a single interior point of both (touching does not count). */
export function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  return ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS));
}

export function polygonBounds(poly: Polygon) {
  const xs = poly.map(p => p.x), ys = poly.map(p => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

export function conditionsHold(state: GameState, conditions: Condition[] | undefined): boolean {
  if (!conditions) return true;
  return conditions.every(c =>
    (c.flag === undefined || state.flags[c.flag] === true) &&
    (c.notFlag === undefined || state.flags[c.notFlag] !== true) &&
    (c.has === undefined || state.inventory.includes(c.has)) &&
    (c.lacks === undefined || !state.inventory.includes(c.lacks)) &&
    (c.atLeast === undefined || c.atLeast.flags.filter(f => state.flags[f] === true).length >= c.atLeast.count));
}
