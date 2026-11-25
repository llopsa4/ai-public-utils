import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type BaseState, addZombie, createBase, stepBase } from '../src/sim/base';
import { BUSH, COVER, FLOOR, type Grid, TREE, WALL, inBounds, isBlocked, makeGrid, setTile } from '../src/sim/grid';
import { type Pt, findPath } from '../src/sim/path';

/** Survivors that cannot die or starve, so the run measures the zombies' planning, not the fight. */
function tough(s: BaseState): void {
  for (const u of s.survivors) {
    u.hp = u.maxHp = 100_000;
    s.hunger[u.id]!.left = 100_000_000;
  }
}

/** Fixes every opening (the house is sealed) and puts the survivors inside, the zombies' "sealed-out" case. */
function sealed(zombies: number): BaseState {
  const s = createBase({ calm: true });
  tough(s);
  for (const o of s.openings) {
    o.fixed = true;
    o.hp = 100_000;
    s.grid.tiles[o.y * s.grid.size + o.x] = COVER;
  }
  const [a, b] = s.survivors;
  [a!.x, a!.y] = [28, 28];
  [b!.x, b!.y] = [30, 29];
  // Open floor outside the house, spread over the map, in a fixed order (no randomness).
  const spots: [number, number][] = [];
  for (let y = 1; y < s.grid.size - 1 && spots.length < 400; y += 2) {
    for (let x = 1; x < s.grid.size - 1; x += 2) {
      if (!isBlocked(s.grid, x, y) && Math.hypot(x - 29, y - 28) > 7) spots.push([x, y]);
    }
  }
  const step = Math.floor(spots.length / zombies);
  for (let i = 0; i < zombies; i++) {
    const [x, y] = spots[i * step]!;
    addZombie(s, x, y, [0, 1], `h${i + 1}`);
  }
  return s;
}

/** Wall-clock milliseconds for `ticks` steps of a sealed-out base with `zombies` herd zombies. */
function bench(zombies: number, ticks: number): number {
  const s = sealed(zombies);
  const t0 = performance.now();
  for (let i = 0; i < ticks; i++) stepBase(s);
  return performance.now() - t0;
}

/** Measured on 2026-11-24 before Z42 (list-scan A*, Map/Set bookkeeping): median 766 ms for 20 zombies x 200 ticks. */
const BASELINE_MS = 766;

test('perf: the 20-zombie sealed-out benchmark is at least 5x faster than the Z42 baseline', () => {
  bench(20, 20); // warm up the JIT
  const runs = [bench(20, 200), bench(20, 200), bench(20, 200)].sort((x, y) => x - y);
  const ms = runs[1]!; // the median of three
  console.log(`perf: 20 zombies x 200 ticks = ${ms.toFixed(1)} ms (${(ms / 200).toFixed(2)} ms per tick), baseline ${BASELINE_MS} ms`);
  assert.ok(ms <= BASELINE_MS / 5, `${ms.toFixed(1)} ms is over the budget of ${(BASELINE_MS / 5).toFixed(0)} ms`);
});

// ---- The plain A* the game used before Z42, kept as the reference for routes and for speed ----

function legacyFindPath(g: Grid, from: Pt, to: Pt, extraBlocked?: ReadonlySet<number>): Pt[] | null {
  const n = g.size;
  const dirs: Pt[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const h = (ax: number, ay: number, bx: number, by: number): number => {
    const dx = Math.abs(ax - bx);
    const dy = Math.abs(ay - by);
    return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
  };
  const blocked = (x: number, y: number): boolean => isBlocked(g, x, y) || (extraBlocked?.has(y * n + x) ?? false);
  if (!inBounds(g, from[0], from[1]) || !inBounds(g, to[0], to[1]) || blocked(to[0], to[1])) return null;
  if (from[0] === to[0] && from[1] === to[1]) return [];
  const cost = new Map<number, number>();
  const parent = new Map<number, number>();
  const closed = new Set<number>();
  const open: { k: number; f: number }[] = [];
  const startK = from[1] * n + from[0];
  cost.set(startK, 0);
  open.push({ k: startK, f: h(from[0], from[1], to[0], to[1]) });
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
    for (const [dx, dy] of dirs) {
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
        open.push({ k: nk, f: ng + h(nx, ny, to[0], to[1]) });
      }
    }
  }
  return null;
}

/** A small seeded generator, so the random grids are the same on every run. */
function lcg(seed: number): () => number {
  let v = seed >>> 0;
  return () => {
    v = (Math.imul(v, 1664525) + 1013904223) >>> 0;
    return v / 2 ** 32;
  };
}

function randomGrid(rand: () => number, size: number, density: number): Grid {
  const g = makeGrid(size);
  for (let i = 0; i < g.tiles.length; i++) {
    const r = rand();
    g.tiles[i] = r < density ? TREE : r < density * 1.2 ? WALL : r < density * 1.3 ? COVER : r < density * 1.5 ? BUSH : FLOOR;
  }
  return g;
}

test('perf: the new A* returns exactly the routes the old one did, on random grids', () => {
  const rand = lcg(42);
  let found = 0;
  let refused = 0;
  for (let round = 0; round < 60; round++) {
    const size = 12 + Math.floor(rand() * 14);
    const g = randomGrid(rand, size, 0.1 + rand() * 0.25);
    for (let q = 0; q < 40; q++) {
      const from: Pt = [Math.floor(rand() * size), Math.floor(rand() * size)];
      const to: Pt = [Math.floor(rand() * size), Math.floor(rand() * size)];
      const extra = q % 5 === 0 ? new Set([Math.floor(rand() * size * size), Math.floor(rand() * size * size)]) : undefined;
      const want = legacyFindPath(g, from, to, extra);
      assert.deepEqual(findPath(g, from, to, extra), want, `round ${round}, query ${q}: ${from} -> ${to}`);
      if (want) found++;
      else refused++;
    }
    // The map changes between calls: the area cache must follow.
    const k = Math.floor(rand() * size * size);
    g.tiles[k] = g.tiles[k] === FLOOR ? TREE : FLOOR;
    const a: Pt = [Math.floor(rand() * size), Math.floor(rand() * size)];
    const b: Pt = [Math.floor(rand() * size), Math.floor(rand() * size)];
    assert.deepEqual(findPath(g, a, b), legacyFindPath(g, a, b), `round ${round}, after a tile change`);
  }
  assert.ok(found > 200 && refused > 200, `both outcomes are exercised (found ${found}, refused ${refused})`);
});

test('perf: a goal in another open area is refused, also after a wall is built or broken', () => {
  const g = makeGrid(9);
  for (let y = 0; y < 9; y++) setTile(g, 4, y, COVER);
  assert.equal(findPath(g, [1, 4], [7, 4]), null);
  setTile(g, 4, 4, FLOOR); // a barricade chewed through
  assert.ok(findPath(g, [1, 4], [7, 4]));
  setTile(g, 4, 4, COVER); // built again
  assert.equal(findPath(g, [1, 4], [7, 4]), null);
  // A start that stands on a blocked tile (a zombie on a fresh barricade) still finds its way out.
  assert.ok(findPath(g, [4, 4], [7, 4]));
});

test('perf: reachable routes are also faster than the old search (at least 2x)', () => {
  const rand = lcg(7);
  const g = randomGrid(rand, 32, 0.18);
  const queries: [Pt, Pt][] = [];
  while (queries.length < 120) {
    const from: Pt = [Math.floor(rand() * 32), Math.floor(rand() * 32)];
    const to: Pt = [Math.floor(rand() * 32), Math.floor(rand() * 32)];
    if (legacyFindPath(g, from, to)) queries.push([from, to]);
  }
  const time = (fn: (g: Grid, a: Pt, b: Pt) => Pt[] | null): number => {
    for (const [a, b] of queries) fn(g, a, b); // warm up
    const t0 = performance.now();
    for (let rep = 0; rep < 3; rep++) for (const [a, b] of queries) fn(g, a, b);
    return performance.now() - t0;
  };
  const before = time(legacyFindPath);
  const after = time(findPath);
  console.log(`perf: 360 reachable routes on 32x32: old ${before.toFixed(1)} ms, new ${after.toFixed(1)} ms (${(before / after).toFixed(1)}x)`);
  assert.ok(after * 2 <= before, `only ${(before / after).toFixed(1)}x faster`);
});
