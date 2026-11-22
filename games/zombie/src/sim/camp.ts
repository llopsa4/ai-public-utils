// Camp rules (DESIGN §2, §10, §12): the woods clearing, the survivors, barricades and the roaming
// zombies. The camp is a mission-style state (same units, orders, AI and combat from mission.ts)
// plus resources and barricades. Pure TypeScript, fixed 10 Hz tick, JSON-serialisable state.
import camp from '../data/camp.json';
import enemies from '../data/enemies.json';
import view from '../data/view.json';
import { REPATH } from './ai';
import { COVER, FLOOR, type Grid, TREE, getTile, isBlocked, makeGrid, setTile } from './grid';
import { type MissionSpec, type MissionState, type SurvivorKind, createMission, stepMission } from './mission';
import { type Pt, findPath } from './path';
import { makeRng, rngInt, rngNext, type RngState } from './rng';
import { TICK_HZ } from './time';

export { TICK_HZ };
export { orderAttack, orderMove, orderWatch } from './mission';

/** A placed barricade segment: a cover tile that blocks walking but not sight; zombies chew it down. */
export interface Barricade {
  x: number;
  y: number;
  hp: number;
}

export interface CampState extends MissionState {
  food: number;
  scrap: number;
  barricades: Barricade[];
}

export type PlaceResult = 'ok' | 'blocked' | 'occupied' | 'scrap';

/** Map rows for `createMission`: `.` floor, `T` tree, `c` cover. */
function rowsOf(g: Grid): string[] {
  const rows: string[] = [];
  for (let y = 0; y < g.size; y++) {
    let r = '';
    for (let x = 0; x < g.size; x++) {
      const k = getTile(g, x, y);
      r += k === TREE ? 'T' : k === COVER ? 'c' : '.';
    }
    rows.push(r);
  }
  return rows;
}

/**
 * One zombie per map side (N, E, S, W, repeating): a tile the survivors can walk to, as near that
 * edge as possible. The outer woods are mostly sealed pockets, so unreachable edge tiles are skipped;
 * among the nearest `pick` reachable ones the seeded RNG chooses.
 */
function spawnPoints(g: Grid, from: Pt, rng: RngState): Pt[] {
  const n = g.size;
  const edges: ((x: number, y: number) => number)[] = [(_x, y) => y, (x) => n - 1 - x, (_x, y) => n - 1 - y, (x) => x];
  const taken = new Set<string>();
  const out: Pt[] = [];
  for (let i = 0; i < camp.zombies.count; i++) {
    const edge = edges[i % edges.length]!;
    const cands: Pt[] = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (isBlocked(g, x, y) || taken.has(`${x},${y}`)) continue;
        if (Math.hypot(x - from[0], y - from[1]) >= camp.zombies.minDistance) cands.push([x, y]);
      }
    }
    cands.sort((a, b) => edge(...a) - edge(...b) || a[1] - b[1] || a[0] - b[0]);
    const pool: Pt[] = [];
    for (const c of cands) {
      if (findPath(g, from, c)) pool.push(c);
      if (pool.length >= camp.zombies.pick) break;
    }
    if (pool.length === 0) continue;
    const c = pool[rngInt(rng, 0, pool.length - 1)]!;
    taken.add(`${c[0]},${c[1]}`);
    out.push(c);
  }
  return out;
}

/**
 * The clearing: tent and fire are solid; trees fill the woods outside the clearing radius. `from` is
 * the campaign's saved camp (resources and fences); zombies always start fresh.
 */
export function createCamp(from?: { food: number; scrap: number; barricades: readonly Barricade[] }): CampState {
  const n = view.campSize;
  const grid = makeGrid(n);
  const rng = makeRng(camp.seed);
  const mid = n / 2;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - mid, y - mid);
      const edge = Math.min(x, y, n - 1 - x, n - 1 - y) < 2;
      // Always draw the random number so the layout does not shift when the radius is tuned.
      const r = rngNext(rng);
      if (edge || (d > camp.clearingRadius && r < camp.treeChance)) setTile(grid, x, y, TREE);
    }
  }
  for (let dy = 0; dy < camp.tent.h; dy++) for (let dx = 0; dx < camp.tent.w; dx++) setTile(grid, camp.tent.x + dx, camp.tent.y + dy, COVER);
  setTile(grid, camp.fire.x, camp.fire.y, COVER);
  const barricades: Barricade[] = [];
  for (const b of from?.barricades ?? []) {
    if (getTile(grid, b.x, b.y) !== FLOOR) continue; // a saved fence on a tree or the tent is dropped
    setTile(grid, b.x, b.y, COVER);
    barricades.push({ x: b.x, y: b.y, hp: Math.min(b.hp, camp.barricade.hp) });
  }

  const first = camp.survivors[0]!;
  const start: Pt = [first.x, first.y];
  const spec: MissionSpec = {
    seed: camp.seed + 1,
    map: rowsOf(grid),
    survivors: camp.survivors.map((s) => ({ id: s.id, kind: s.kind as SurvivorKind, x: s.x, y: s.y })),
    enemies: spawnPoints(grid, start, makeRng(camp.seed + 2)).map(([x, y], i) => ({
      id: `zombie${i + 1}`,
      kind: 'zombie' as const,
      x,
      y,
      facing: [start[0] - x, start[1] - y] as [number, number],
    })),
    extract: { x: -1, y: -1, w: 0, h: 0 }, // no extraction in the camp
  };
  return { ...createMission(spec), food: from?.food ?? camp.start.food, scrap: from?.scrap ?? camp.start.scrap, barricades };
}

/** Both survivors dead: the camp has fallen and the scene restarts it (DESIGN §12). */
export function campFallen(s: CampState): boolean {
  return s.survivors.every((u) => u.hp <= 0);
}

/**
 * B then click: one barricade segment on a free floor tile for `camp.barricade.cost` scrap. Refused
 * (nothing changes) on a tree, tent, fire, another barricade, a unit's tile or without scrap.
 */
export function placeBarricade(s: CampState, x: number, y: number): PlaceResult {
  if (getTile(s.grid, x, y) !== FLOOR) return 'blocked';
  const unitHere = [...s.survivors, ...s.enemies].some((u) => u.hp > 0 && Math.round(u.x) === x && Math.round(u.y) === y);
  if (unitHere) return 'occupied';
  if (s.scrap < camp.barricade.cost) return 'scrap';
  s.scrap -= camp.barricade.cost;
  setTile(s.grid, x, y, COVER);
  s.barricades.push({ x, y, hp: camp.barricade.hp });
  return 'ok';
}

/**
 * A chasing zombie with no route (walled off by barricades) walks to the reachable tile beside a
 * segment, as near the survivor as it can get. The zombie AI re-plans every REPATH ticks and clears
 * an unreachable route, so this runs on those ticks only and the zombie loses one step in five.
 */
function approachBarricade(s: CampState, e: CampState['enemies'][number]): void {
  const t = s.survivors.find((u) => u.id === e.ai.target && u.hp > 0);
  if (!t) return;
  const here: Pt = [Math.round(e.x), Math.round(e.y)];
  const beside = new Map<number, Pt>();
  for (const b of s.barricades) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = b.x + dx;
        const y = b.y + dy;
        if (!isBlocked(s.grid, x, y)) beside.set(y * s.grid.size + x, [x, y]);
      }
    }
  }
  const cands = [...beside.values()].sort((a, b) => Math.hypot(a[0] - t.x, a[1] - t.y) - Math.hypot(b[0] - t.x, b[1] - t.y));
  for (const c of cands.slice(0, 8)) {
    if (c[0] === here[0] && c[1] === here[1]) return; // already beside the nearest segment
    const p = findPath(s.grid, here, c);
    if (p) {
      e.path = p;
      return;
    }
  }
}

/** A chasing zombie with no route bites the barricade beside it. */
function chewBarricades(s: CampState): void {
  if (s.barricades.length === 0) return;
  const bite = enemies.zombie.bite;
  for (const e of s.enemies) {
    if (e.kind !== 'zombie' || e.hp <= 0 || e.ai.mode !== 'chase' || e.path.length > 0) continue;
    if (s.tick % REPATH === 0) approachBarricade(s, e);
    if (e.path.length > 0 || e.cooldown > 0) continue;
    const tx = Math.round(e.x);
    const ty = Math.round(e.y);
    const b = s.barricades.find((c) => Math.abs(c.x - tx) <= 1 && Math.abs(c.y - ty) <= 1);
    if (!b) continue;
    b.hp -= bite.damage;
    e.cooldown = Math.round(bite.cooldown * TICK_HZ);
    if (b.hp <= 0) {
      setTile(s.grid, b.x, b.y, FLOOR);
      s.barricades.splice(s.barricades.indexOf(b), 1);
    }
  }
}

/** One 0.1 s tick: the mission tick (orders, AI, combat), then barricades. Frozen once the camp has fallen. */
export function stepCamp(s: CampState): void {
  if (campFallen(s)) return;
  stepMission(s);
  s.status = 'playing'; // one dead survivor ends a mission, not a camp
  chewBarricades(s);
}

/** Number of tree tiles (for tests and tuning). */
export function treeCount(s: CampState): number {
  return s.grid.tiles.filter((k) => k === TREE).length;
}
