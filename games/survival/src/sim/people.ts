// People: spawning, housing, pathfinding and walking (DESIGN-slice.md `## People`). No Phaser.
import jobsData from '../data/jobs.json';
import mapConfig from '../data/map.json';
import { rngNext } from './rng';
import {
  TIPI_BEDS, type Age, type GameState, type JobKind, type Person, type Task, type Tile2,
} from './state';

export interface AgeDef {
  speed: number;
  meal: number;
  works: string[] | 'all';
  rate: number;
  draft: boolean;
}

export const ages = jobsData.ages as unknown as Record<Age, AgeDef>;

const TILE = mapConfig.tiles as Record<string, { cost: number; passable: boolean }>;

export function canWork(p: Person, kind: JobKind): boolean {
  const w = ages[p.age].works;
  return w === 'all' || w.includes(kind);
}

/** Drops the current job; a hauler's load goes with it (the material was paid for at placement). */
export function releaseJob(p: Person): void {
  if (p.job?.kind === 'haul') p.carry = { res: p.carry.res, amount: 0, hides: 0 };
  p.job = null;
}

export function idleTask(timer = 0): Task {
  return { step: 'idle', target: null, path: [], timer, goal: null };
}

export function walkable(s: GameState, x: number, y: number): boolean {
  const n = s.map.size;
  if (x < 0 || y < 0 || x >= n || y >= n) return false;
  const i = y * n + x;
  return TILE[s.map.tiles[i]].passable && !s.blocked[i];
}

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * A* on 8 neighbours: diagonals cost x1.4, no corner-cutting, at most 4000 expanded nodes.
 * Returns the tiles to walk through (without the start tile), or null when there is no path.
 * Starting on the target tile gives `[target]` so the walker still reaches its centre.
 */
export function findPath(s: GameState, from: [number, number], to: Tile2): Tile2[] | null {
  const n = s.map.size;
  const sx = Math.min(n - 1, Math.max(0, Math.round(from[0])));
  const sy = Math.min(n - 1, Math.max(0, Math.round(from[1])));
  const [tx, ty] = to;
  if (!walkable(s, tx, ty)) return null;
  if (sx === tx && sy === ty) return [[tx, ty]];

  const g = new Float64Array(n * n).fill(Infinity);
  const parent = new Int32Array(n * n).fill(-1);
  const closed = new Uint8Array(n * n);
  const heapF: number[] = [];
  const heapI: number[] = [];
  const less = (a: number, b: number) => heapF[a] < heapF[b] || (heapF[a] === heapF[b] && heapI[a] < heapI[b]);
  const swap = (a: number, b: number) => {
    [heapF[a], heapF[b]] = [heapF[b], heapF[a]];
    [heapI[a], heapI[b]] = [heapI[b], heapI[a]];
  };
  const push = (f: number, i: number) => {
    heapF.push(f);
    heapI.push(i);
    let k = heapF.length - 1;
    while (k > 0) {
      const up = (k - 1) >> 1;
      if (!less(k, up)) break;
      swap(k, up);
      k = up;
    }
  };
  const pop = (): number => {
    const top = heapI[0];
    const lf = heapF.pop()!;
    const li = heapI.pop()!;
    if (heapF.length > 0) {
      heapF[0] = lf;
      heapI[0] = li;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < heapF.length && less(l, m)) m = l;
        if (r < heapF.length && less(r, m)) m = r;
        if (m === k) break;
        swap(k, m);
        k = m;
      }
    }
    return top;
  };
  const h = (x: number, y: number) => {
    const dx = Math.abs(x - tx);
    const dy = Math.abs(y - ty);
    return dx + dy - 0.6 * Math.min(dx, dy);
  };

  const start = sy * n + sx;
  g[start] = 0;
  push(h(sx, sy), start);
  const goal = ty * n + tx;
  let expanded = 0;
  while (heapF.length > 0) {
    const cur = pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (cur === goal) break;
    if (++expanded > 4000) return null;
    const cx = cur % n;
    const cy = (cur - cx) / n;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!walkable(s, nx, ny)) continue;
      const diagonal = dx !== 0 && dy !== 0;
      if (diagonal && (!walkable(s, cx + dx, cy) || !walkable(s, cx, cy + dy))) continue;
      const ni = ny * n + nx;
      if (closed[ni]) continue;
      const cost = g[cur] + TILE[s.map.tiles[ni]].cost * (diagonal ? 1.4 : 1);
      if (cost < g[ni]) {
        g[ni] = cost;
        parent[ni] = cur;
        push(cost + h(nx, ny), ni);
      }
    }
  }
  if (!closed[goal]) return null;
  const path: Tile2[] = [];
  for (let i = goal; i !== start; i = parent[i]) path.push([i % n, Math.floor(i / n)]);
  return path.reverse();
}

/** Starts walking to a tile; false when there is no path. */
export function beginWalk(s: GameState, p: Person, target: Tile2, goal: Task['goal']): boolean {
  const path = findPath(s, [p.x, p.y], target);
  if (!path) return false;
  p.task = { step: 'walk', target, path, timer: 0, goal };
  return true;
}

/** Moves along the path by one tick of speed; "blocked" when the way is shut and no new path exists. */
export function movePerson(s: GameState, p: Person): 'moving' | 'arrived' | 'blocked' {
  const t = p.task;
  let budget = ages[p.age].speed;
  while (budget > 1e-9 && t.path.length > 0) {
    const [wx, wy] = t.path[0];
    if (!walkable(s, wx, wy)) {
      const again = t.target ? findPath(s, [p.x, p.y], t.target) : null;
      if (!again) return 'blocked';
      t.path = again;
      continue;
    }
    const dx = wx - p.x;
    const dy = wy - p.y;
    const d = Math.hypot(dx, dy);
    if (d <= budget) {
      p.x = wx;
      p.y = wy;
      budget -= d;
      t.path.shift();
    } else {
      p.x += (dx / d) * budget;
      p.y += (dy / d) * budget;
      budget = 0;
    }
  }
  return t.path.length === 0 ? 'arrived' : 'moving';
}

/** A new person with full health, a little hunger and no job. */
export function makePerson(s: GameState, family: number, age: Age, name: string, x: number, y: number): Person {
  return {
    id: s.nextPersonId++, name, family, age, x, y, health: 100, hunger: 20,
    job: null, task: idleTask(), carry: { res: 'food', amount: 0 }, society: null, drafted: false,
    stance: 'defend', attackTarget: null, post: null, home: null, cooldown: 0,
  };
}

/** Free tiles within `spawnRadius` of the fire, in scan order. */
export function spawnSpots(s: GameState): Tile2[] {
  const cx = s.map.fire[0] + 1;
  const cy = s.map.fire[1] + 1;
  const r = mapConfig.start.spawnRadius;
  const spots: Tile2[] = [];
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (Math.hypot(x - cx, y - cy) <= r && walkable(s, x, y)) spots.push([x, y]);
    }
  }
  return spots;
}

/** Removes a person (died or left) and frees their bed. */
export function removePerson(s: GameState, id: number): void {
  s.people = s.people.filter((p) => p.id !== id);
  for (const b of s.buildings) b.residents = b.residents.filter((r) => r !== id);
}

/** Creates the start people: per family 6 adults, 2 elders, 2 children, on free tiles near the fire. */
export function spawnPeople(s: GameState): void {
  const start = mapConfig.start;
  const spots = spawnSpots(s);
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(rngNext(s.rng) * (i + 1));
    [spots[i], spots[j]] = [spots[j], spots[i]];
  }
  let k = 0;
  start.families.forEach((family, f) => {
    let n = 1;
    for (const age of ['adult', 'elder', 'child'] as const) {
      for (let i = 0; i < start.perFamily[age]; i++) {
        const [x, y] = spots[k++ % spots.length];
        s.people.push(makePerson(s, f, age, `${family} ${n++}`, x, y));
      }
    }
  });
}

/**
 * Gives every unhoused person a free bed: family members first in the tipi already holding their
 * family, else an empty tipi, else any tipi with room. People who do not fit keep `home: null`.
 */
export function assignHousing(s: GameState): void {
  const byId = new Map(s.people.map((p) => [p.id, p]));
  const tipis = s.buildings.filter((b) => b.type === 'tipi' && b.done);
  for (const t of tipis) t.residents = t.residents.filter((id) => byId.get(id)?.home === t.id);
  const housed = new Set(tipis.flatMap((t) => t.residents));
  const seen: number[] = [];
  const order = s.people
    .filter((p) => !housed.has(p.id))
    .map((p) => ({ p, n: (seen[p.family] = (seen[p.family] ?? -1) + 1) }))
    .sort((a, b) => a.n - b.n || a.p.family - b.p.family);
  for (const { p } of order) {
    const free = (t: { residents: number[] }) => t.residents.length < TIPI_BEDS;
    const t =
      tipis.find((b) => free(b) && b.residents.some((id) => byId.get(id)!.family === p.family)) ??
      tipis.find((b) => free(b) && b.residents.length === 0) ??
      tipis.find(free);
    if (t) {
      t.residents.push(p.id);
      p.home = t.id;
    } else {
      p.home = null;
    }
  }
}
