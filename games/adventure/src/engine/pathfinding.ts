import { closestPointOnSegment, distance, distanceToPolygonEdge, pointInPolygon, segmentsCross } from './geometry';
import type { Point, Polygon } from './types';

const EDGE_TOLERANCE = 0.75;
const SAMPLE_STEP = 3;

/**
 * Walkable area: an outer polygon minus obstacle holes. Points on the boundary count as walkable.
 * Paths use a visibility graph over polygon vertices with A*, which gives the shortest route
 * for polygonal areas and needs no grid, so it is independent of art resolution.
 */
export class WalkArea {
  private readonly edges: [Point, Point][] = [];
  private readonly nodes: Point[] = [];

  constructor(readonly outer: Polygon, readonly holes: Polygon[] = []) {
    for (const poly of [outer, ...holes]) {
      for (let i = 0; i < poly.length; i++) this.edges.push([poly[i], poly[(i + 1) % poly.length]]);
      this.nodes.push(...poly);
    }
  }

  contains(p: Point): boolean {
    const inOuter = pointInPolygon(p, this.outer) || distanceToPolygonEdge(p, this.outer) <= EDGE_TOLERANCE;
    if (!inOuter) return false;
    return this.holes.every(h => !pointInPolygon(p, h) || distanceToPolygonEdge(p, h) <= EDGE_TOLERANCE);
  }

  /** Nearest walkable point to p (p itself when already walkable). */
  clamp(p: Point): Point {
    if (this.contains(p)) return { x: p.x, y: p.y };
    let best: Point | null = null, bestDistance = Infinity;
    for (const [a, b] of this.edges) {
      const c = closestPointOnSegment(p, a, b);
      const d = distance(p, c);
      if (d < bestDistance && this.contains(c)) { best = c; bestDistance = d; }
    }
    return best ?? { x: this.outer[0].x, y: this.outer[0].y };
  }

  lineOfSight(a: Point, b: Point): boolean {
    if (!this.contains(a) || !this.contains(b)) return false;
    for (const [c, d] of this.edges) if (segmentsCross(a, b, c, d)) return false;
    const steps = Math.ceil(distance(a, b) / SAMPLE_STEP);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!this.contains({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
    }
    return true;
  }

  /** Waypoints from start to the (clamped) target, excluding the start. Empty when already there. */
  findPath(start: Point, target: Point): Point[] {
    const from = this.clamp(start);
    const to = this.clamp(target);
    if (distance(from, to) < 0.5) return [];
    if (this.lineOfSight(from, to)) return [to];

    const points = [from, to, ...this.nodes.filter(n => this.contains(n))];
    const count = points.length;
    const g = new Array<number>(count).fill(Infinity);
    const came = new Array<number>(count).fill(-1);
    const open = new Set<number>([0]);
    const closed = new Set<number>();
    g[0] = 0;
    const h = (i: number) => distance(points[i], to);

    while (open.size > 0) {
      let current = -1, bestF = Infinity;
      for (const i of open) { const f = g[i] + h(i); if (f < bestF) { bestF = f; current = i; } }
      if (current === 1) break;
      open.delete(current);
      closed.add(current);
      for (let next = 0; next < count; next++) {
        if (next === current || closed.has(next)) continue;
        if (!this.lineOfSight(points[current], points[next])) continue;
        const tentative = g[current] + distance(points[current], points[next]);
        if (tentative < g[next]) { g[next] = tentative; came[next] = current; open.add(next); }
      }
    }

    if (came[1] === -1) return [];
    const path: Point[] = [];
    for (let i = 1; i !== 0; i = came[i]) path.unshift(points[i]);
    return path;
  }
}
