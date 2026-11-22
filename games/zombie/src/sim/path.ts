import { type Grid, inBounds, isBlocked } from './grid';

export type Pt = [number, number];

const DIRS: Pt[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Octile distance: the exact cost of the cheapest 8-way route on an open grid. */
function heuristic(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

/**
 * A* on the tile grid, 8 directions, no cutting corners past a blocked tile. Returns the tiles to
 * walk, excluding the start and including the goal, or null when the goal is blocked or unreachable.
 * `extraBlocked` holds tile keys (y * size + x) that count as blocked, such as barricades.
 */
export function findPath(g: Grid, from: Pt, to: Pt, extraBlocked?: ReadonlySet<number>): Pt[] | null {
  const n = g.size;
  const blocked = (x: number, y: number): boolean => isBlocked(g, x, y) || (extraBlocked?.has(y * n + x) ?? false);
  if (!inBounds(g, from[0], from[1]) || !inBounds(g, to[0], to[1]) || blocked(to[0], to[1])) return null;
  if (from[0] === to[0] && from[1] === to[1]) return [];

  const cost = new Map<number, number>();
  const parent = new Map<number, number>();
  const closed = new Set<number>();
  const open: { k: number; f: number }[] = [];
  const startK = from[1] * n + from[0];
  cost.set(startK, 0);
  open.push({ k: startK, f: heuristic(from[0], from[1], to[0], to[1]) });

  while (open.length > 0) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (open[i]!.f < open[best]!.f) best = i;
    const cur = open.splice(best, 1)[0]!;
    if (closed.has(cur.k)) continue;
    closed.add(cur.k);
    const cx = cur.k % n;
    const cy = Math.floor(cur.k / n);
    if (cx === to[0] && cy === to[1]) {
      const path: Pt[] = [];
      let k = cur.k;
      while (k !== startK) {
        path.push([k % n, Math.floor(k / n)]);
        k = parent.get(k)!;
      }
      return path.reverse();
    }
    const g0 = cost.get(cur.k)!;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inBounds(g, nx, ny) || blocked(nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (blocked(cx + dx, cy) || blocked(cx, cy + dy))) continue;
      const nk = ny * n + nx;
      if (closed.has(nk)) continue;
      const ng = g0 + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1);
      if (ng < (cost.get(nk) ?? Infinity)) {
        cost.set(nk, ng);
        parent.set(nk, cur.k);
        open.push({ k: nk, f: ng + heuristic(nx, ny, to[0], to[1]) });
      }
    }
  }
  return null;
}

/** The nearest unblocked, unclaimed tile to `target` (ring search by Chebyshev distance), or null. */
export function nearestFree(g: Grid, target: Pt, taken: ReadonlySet<number>): Pt | null {
  const n = g.size;
  for (let r = 0; r <= n; r++) {
    let best: Pt | null = null;
    let bestD = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = target[0] + dx;
        const y = target[1] + dy;
        if (!inBounds(g, x, y) || isBlocked(g, x, y) || taken.has(y * n + x)) continue;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = [x, y];
        }
      }
    }
    if (best) return best;
  }
  return null;
}
