import { COVER, type Grid, TREE, WALL, inBounds, isBlocked } from './grid';

export type Pt = [number, number];

// Same order as the original direction list, so equal-cost routes come out the same.
const DX = [1, -1, 0, 0, 1, 1, -1, -1];
const DY = [0, 0, 1, -1, 1, -1, 1, -1];

/** Octile distance: the exact cost of the cheapest 8-way route on an open grid. */
function heuristic(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

// ---- Scratch buffers (one set, reused by every search; the sim is single-threaded) ----

interface Scratch {
  n: number;
  /** Cost so far; valid only where `seen[k] === gen`. */
  cost: Float64Array;
  parent: Int32Array;
  seen: Int32Array;
  /** `closed[k] === gen` once the tile has been expanded. */
  closed: Int32Array;
  /** Binary min-heap on (f, seq): the earliest pushed of the lowest f comes out first. */
  heapK: Int32Array;
  heapF: Float64Array;
  heapSeq: Int32Array;
  gen: number;
}

let scratch: Scratch | null = null;

function scratchFor(n: number): Scratch {
  if (scratch && scratch.n === n) return scratch;
  const cap = 8 * n * n + 8; // at most one push per relaxed edge
  scratch = {
    n,
    cost: new Float64Array(n * n),
    parent: new Int32Array(n * n),
    seen: new Int32Array(n * n),
    closed: new Int32Array(n * n),
    heapK: new Int32Array(cap),
    heapF: new Float64Array(cap),
    heapSeq: new Int32Array(cap),
    gen: 0,
  };
  return scratch;
}

const isSolid = (t: number | undefined): boolean => t === WALL || t === TREE || t === COVER || t === undefined;

// ---- Connected areas (the "unreachable" cache) ----

interface Areas {
  /** The tiles the labels were made from; a differing array means the grid changed. */
  tiles: number[];
  /** 0 on a blocked tile, otherwise the id (1, 2, ...) of the open area the tile belongs to. */
  label: Int32Array;
}

const areaCache = new WeakMap<Grid, Areas>();

/**
 * Open areas of the grid. A diagonal step may not cut a blocked corner, so it never joins two areas
 * that the four straight directions leave apart: flood fill on the four straight neighbours is enough.
 * Rebuilt only when a tile has changed since the last call.
 */
function areasOf(g: Grid): Areas {
  const n = g.size;
  const tiles = g.tiles;
  const hit = areaCache.get(g);
  if (hit && hit.tiles.length === tiles.length) {
    let same = true;
    for (let i = 0; i < tiles.length; i++) {
      if (hit.tiles[i] !== tiles[i]) {
        same = false;
        break;
      }
    }
    if (same) return hit;
  }
  const label = new Int32Array(n * n);
  const stack = new Int32Array(n * n);
  let next = 0;
  for (let start = 0; start < n * n; start++) {
    if (label[start] !== 0 || isSolid(tiles[start])) continue;
    next++;
    let top = 0;
    stack[top++] = start;
    label[start] = next;
    while (top > 0) {
      const k = stack[--top]!;
      const x = k % n;
      const y = (k - x) / n;
      if (x > 0 && label[k - 1] === 0 && !isSolid(tiles[k - 1])) (label[k - 1] = next), (stack[top++] = k - 1);
      if (x < n - 1 && label[k + 1] === 0 && !isSolid(tiles[k + 1])) (label[k + 1] = next), (stack[top++] = k + 1);
      if (y > 0 && label[k - n] === 0 && !isSolid(tiles[k - n])) (label[k - n] = next), (stack[top++] = k - n);
      if (y < n - 1 && label[k + n] === 0 && !isSolid(tiles[k + n])) (label[k + n] = next), (stack[top++] = k + n);
    }
  }
  const made: Areas = { tiles: tiles.slice(), label };
  areaCache.set(g, made);
  return made;
}

/**
 * A* on the tile grid, 8 directions, no cutting corners past a blocked tile. Returns the tiles to
 * walk, excluding the start and including the goal, or null when the goal is blocked or unreachable.
 * `extraBlocked` holds tile keys (y * size + x) that count as blocked, such as barricades.
 *
 * A goal in a different open area from a (not blocked) start is refused at once from a cached area
 * map instead of searching the whole reachable region. Ties on f go to the earliest pushed tile, so
 * the routes are the ones the plain list-scan version gave.
 */
export function findPath(g: Grid, from: Pt, to: Pt, extraBlocked?: ReadonlySet<number>): Pt[] | null {
  const n = g.size;
  const tiles = g.tiles;
  const extra = extraBlocked && extraBlocked.size > 0 ? extraBlocked : undefined;
  const blockedAt = (k: number): boolean => isSolid(tiles[k]) || (extra !== undefined && extra.has(k));
  if (!inBounds(g, from[0], from[1]) || !inBounds(g, to[0], to[1])) return null;
  const startK = from[1] * n + from[0];
  const goalK = to[1] * n + to[0];
  if (blockedAt(goalK)) return null;
  if (startK === goalK) return [];
  if (!extra && !isSolid(tiles[startK])) {
    const { label } = areasOf(g);
    if (label[startK] !== label[goalK]) return null;
  }

  const sc = scratchFor(n);
  const gen = ++sc.gen;
  const { cost, parent, seen, closed, heapK, heapF, heapSeq } = sc;
  const [gx, gy] = to;
  let size = 0;
  let seq = 0;
  const push = (k: number, f: number): void => {
    let i = size++;
    const s = seq++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapF[p]! < f || (heapF[p] === f && heapSeq[p]! < s)) break;
      heapK[i] = heapK[p]!;
      heapF[i] = heapF[p]!;
      heapSeq[i] = heapSeq[p]!;
      i = p;
    }
    heapK[i] = k;
    heapF[i] = f;
    heapSeq[i] = s;
  };
  /** Removes the root; the caller has already read it. */
  const pop = (): void => {
    size--;
    if (size === 0) return;
    const k = heapK[size]!;
    const f = heapF[size]!;
    const s = heapSeq[size]!;
    let i = 0;
    for (;;) {
      let c = 2 * i + 1;
      if (c >= size) break;
      if (c + 1 < size && (heapF[c + 1]! < heapF[c]! || (heapF[c + 1] === heapF[c] && heapSeq[c + 1]! < heapSeq[c]!))) c++;
      if (f < heapF[c]! || (f === heapF[c] && s < heapSeq[c]!)) break;
      heapK[i] = heapK[c]!;
      heapF[i] = heapF[c]!;
      heapSeq[i] = heapSeq[c]!;
      i = c;
    }
    heapK[i] = k;
    heapF[i] = f;
    heapSeq[i] = s;
  };

  seen[startK] = gen;
  cost[startK] = 0;
  push(startK, heuristic(from[0], from[1], gx, gy));

  while (size > 0) {
    const ck = heapK[0]!;
    pop();
    if (closed[ck] === gen) continue;
    closed[ck] = gen;
    const cx = ck % n;
    const cy = (ck - cx) / n;
    if (ck === goalK) {
      const path: Pt[] = [];
      let k = ck;
      while (k !== startK) {
        const x = k % n;
        path.push([x, (k - x) / n]);
        k = parent[k]!;
      }
      return path.reverse();
    }
    const g0 = cost[ck]!;
    for (let d = 0; d < 8; d++) {
      const dx = DX[d]!;
      const dy = DY[d]!;
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      const nk = ny * n + nx;
      if (blockedAt(nk)) continue;
      if (dx !== 0 && dy !== 0 && (blockedAt(cy * n + nx) || blockedAt(ny * n + cx))) continue;
      if (closed[nk] === gen) continue;
      const ng = g0 + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1);
      if (seen[nk] !== gen || ng < cost[nk]!) {
        seen[nk] = gen;
        cost[nk] = ng;
        parent[nk] = ck;
        push(nk, ng + heuristic(nx, ny, gx, gy));
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
