// Mission rules (DESIGN §3, §8, §13, §14): state, survivor orders, the 10 Hz tick, extract and fail.
// Pure TypeScript, JSON-serialisable state. Abilities (takedown, carry, lure, crates) are in abilities.ts.
import chars from '../data/characters.json';
import enemiesData from '../data/enemies.json';
import { carryFollow, stepOpen, stepTakedown } from './abilities';
import { type AiState, REPATH, newAi, route, stepEnemy, walkPath } from './ai';
import { activeWeapon, face, fire, hasAmmo, inReach, weapon } from './combat';
import { BUSH, COVER, FLOOR, type Grid, type Kind, TREE, WALL, makeGrid, setTile } from './grid';
import { type NoiseHolder, ageRings, emitNoise } from './noise';
import { type Pt, nearestFree } from './path';
import { type RngState, makeRng } from './rng';
import { type Viewer, dist, moveMode, seesPoint } from './vision';

export type Stance = 'walk' | 'crouch' | 'crawl';
export type SurvivorKind = 'fighter' | 'scout';
export type EnemyKind = 'zombie' | 'human';

export type Order =
  | { type: 'move' }
  | { type: 'hold'; facing: [number, number] }
  | { type: 'attack'; target: string }
  | { type: 'takedown'; target: string; left: number } // left: ticks, -1 until adjacent
  | { type: 'open'; crate: string; left: number }
  | { type: 'work'; job: 'fix' | 'cook' | 'trap' | 'rearm'; target: string; left: number }; // Base 1 (sim/base.ts); left: ticks, -1 until adjacent

/** What a unit is doing as a one-shot animation (art spec: stab, shot, club, throw, takedown, bite). */
export type ActKind = 'stab' | 'shot' | 'club' | 'throw' | 'takedown' | 'bite';

/** Set at the start of an action; the renderer plays the one-shot from `tick` (the sim never clears it). */
export interface Act {
  kind: ActKind;
  tick: number;
}

interface UnitBase {
  id: string;
  x: number; // tile coordinates, fractional while walking
  y: number;
  hp: number;
  maxHp: number;
  facing: [number, number]; // unit vector
  path: Pt[];
  cooldown: number; // ticks until the weapon is ready
  act: Act | null; // the latest action cue, for the renderer
  killedBy?: string; // what took the last hit point: the attacker's kind ('zombie', 'human') or 'hunger'; unset while alive
}

export interface Survivor extends UnitBase {
  side: 'survivor';
  kind: SurvivorKind;
  stance: Stance;
  running: boolean;
  order: Order | null;
  weapon: string; // the chosen weapon (action bar); falls back to melee when the ammo is out
  weapons: string[]; // the weapons this survivor can use; starts as the character's list, Cass gains the pistol at Base 1 (DESIGN §5)
  carrying: string | null; // body id
  lureCd: number; // ticks until the lure is ready
  speedMul?: number; // walking speed factor (Base 1 hunger slows a starving survivor); default 1
  freeFire?: boolean; // Hold may fire the gun (DESIGN §13); off by default, so Hold is melee-only
}

export interface Enemy extends UnitBase {
  side: EnemyKind;
  kind: EnemyKind;
  ai: AiState;
  patrol: Pt[];
  post: { x: number; y: number; facing: [number, number] };
}

export type Unit = Survivor | Enemy;

export interface Body {
  id: string;
  side: Unit['side'];
  kind: string;
  x: number;
  y: number;
  found: boolean; // a human guard has seen it
  carriedBy: string | null;
}

export interface Crate {
  id: string;
  x: number;
  y: number;
  food: number;
  scrap: number;
  ammo: number;
  opened: boolean;
}

export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MissionState extends NoiseHolder {
  tick: number;
  rng: RngState;
  grid: Grid;
  status: 'playing' | 'success' | 'failed';
  survivors: Survivor[];
  enemies: Enemy[];
  bodies: Body[];
  decals: { x: number; y: number }[];
  crates: Crate[];
  crateTime: number; // seconds to open a crate
  loot: { food: number; scrap: number; ammo: number }; // from opened crates
  ammo: number; // shared by every survivor (DESIGN §5)
  win: 'extract' | 'clear';
  extract: Zone; // empty (w = 0) when there is none
  roof: Zone | null; // hides everything inside until a survivor enters (DESIGN §16)
  roofOpen: boolean; // a survivor has entered: the roof is gone for good
}

/** Map rows: `.` floor, `#` wall, `T` tree, `c` cover, `b` bush. The map must be square. */
export interface MissionSpec {
  seed?: number;
  map: string[];
  survivors: { id: string; kind: SurvivorKind; x: number; y: number }[];
  enemies: { id: string; kind: EnemyKind; x: number; y: number; facing?: [number, number]; patrol?: Pt[] }[];
  crates?: { id: string; x: number; y: number; food: number; scrap: number; ammo?: number }[];
  ammo?: number; // default `startAmmo`
  crateTime?: number; // seconds, default 2
  /** `extract` (default): every survivor in `extract` and one crate opened. `clear`: every enemy dead and every crate opened. */
  win?: 'extract' | 'clear';
  extract?: Zone;
  roof?: Zone; // the house footprint, walls included
}

const TILE_CHARS: Record<string, Kind> = { '.': FLOOR, '#': WALL, T: TREE, c: COVER, b: BUSH };

function unit(v: [number, number]): [number, number] {
  const d = Math.hypot(v[0], v[1]);
  return d > 1e-9 ? [v[0] / d, v[1] / d] : [0, 1];
}

export function createMission(spec: MissionSpec): MissionState {
  const n = spec.map.length;
  const grid = makeGrid(n);
  spec.map.forEach((row, y) => {
    if (row.length !== n) throw new Error(`map row ${y} is ${row.length} wide, expected ${n}`);
    for (let x = 0; x < n; x++) {
      const k = TILE_CHARS[row[x]!];
      if (k === undefined) throw new Error(`unknown map char '${row[x]}' at ${x},${y}`);
      setTile(grid, x, y, k);
    }
  });
  const survivors: Survivor[] = spec.survivors.map((s) => ({
    id: s.id,
    side: 'survivor',
    kind: s.kind,
    x: s.x,
    y: s.y,
    hp: chars[s.kind].hp,
    maxHp: chars[s.kind].hp,
    facing: [0, -1],
    path: [],
    cooldown: 0,
    act: null,
    stance: 'walk',
    running: false,
    order: null,
    weapon: chars[s.kind].primary,
    weapons: [...chars[s.kind].weapons],
    carrying: null,
    lureCd: 0,
  }));
  const enemies: Enemy[] = spec.enemies.map((e) => {
    const facing = unit(e.facing ?? [0, 1]);
    return {
      id: e.id,
      side: e.kind,
      kind: e.kind,
      x: e.x,
      y: e.y,
      hp: enemiesData[e.kind].hp,
      maxHp: enemiesData[e.kind].hp,
      facing,
      path: [],
      cooldown: 0,
      act: null,
      ai: newAi(e.kind),
      patrol: e.patrol ?? [],
      post: { x: e.x, y: e.y, facing: [...facing] },
    };
  });
  return {
    tick: 0,
    rng: makeRng(spec.seed ?? 1),
    grid,
    status: 'playing',
    survivors,
    enemies,
    bodies: [],
    decals: [],
    crates: (spec.crates ?? []).map((c) => ({ ammo: 0, ...c, opened: false })),
    crateTime: spec.crateTime ?? 2,
    loot: { food: 0, scrap: 0, ammo: 0 },
    ammo: spec.ammo ?? chars.startAmmo,
    win: spec.win ?? 'extract',
    extract: { ...(spec.extract ?? { x: -1, y: -1, w: 0, h: 0 }) },
    roof: spec.roof ? { ...spec.roof } : null,
    roofOpen: !spec.roof,
    noises: [],
    rings: [],
  };
}

export function survivorViewer(u: Survivor): Viewer {
  const v = chars[u.kind].vision;
  return { x: u.x, y: u.y, facing: u.facing, range: v.range, angle: v.angle };
}

function living(s: MissionState, id: string): Survivor | undefined {
  return s.survivors.find((u) => u.id === id && u.hp > 0);
}

// ---- Orders. Any order replaces the current one, so it ends a hold (DESIGN §13). ----

/** Left-click move (a double-click runs). Each survivor gets its own free tile near the target. */
export function orderMove(s: MissionState, ids: readonly string[], target: Pt, run = false): string[] {
  const taken = new Set<number>();
  const moved: string[] = [];
  for (const id of ids) {
    const u = living(s, id);
    if (!u) continue;
    const dest = nearestFree(s.grid, target, taken);
    if (!dest) continue;
    taken.add(dest[1] * s.grid.size + dest[0]);
    u.order = { type: 'move' };
    u.running = run;
    u.path = route(s.grid, u, dest);
    moved.push(id);
  }
  return moved;
}

/** V then click: hold position facing `toward`. */
export function orderHold(s: MissionState, id: string, toward: readonly [number, number]): boolean {
  const u = living(s, id);
  if (!u) return false;
  const dx = toward[0] - u.x;
  const dy = toward[1] - u.y;
  if (Math.hypot(dx, dy) < 1e-9) return false;
  u.order = { type: 'hold', facing: unit([dx, dy]) };
  u.facing = [...u.order.facing];
  u.path = [];
  u.running = false;
  return true;
}

/** Left-click an enemy: close in and attack with the primary weapon (the chosen weapon). */
export function orderAttack(s: MissionState, ids: readonly string[], target: string): string[] {
  const t = s.enemies.find((e) => e.id === target && e.hp > 0);
  if (!t) return [];
  const out: string[] = [];
  for (const id of ids) {
    const u = living(s, id);
    if (!u) continue;
    u.order = { type: 'attack', target };
    u.running = false;
    u.path = [];
    out.push(id);
  }
  return out;
}

/** Stance change (C). Not an order: a holding survivor keeps holding. */
export function setStance(s: MissionState, id: string, stance: Stance): void {
  const u = living(s, id);
  if (u) u.stance = stance;
}

/** C cycles walk → crouch → crawl → walk. */
export function nextStance(st: Stance): Stance {
  return st === 'walk' ? 'crouch' : st === 'crouch' ? 'crawl' : 'walk';
}

// ---- Tick ----

/**
 * Hold: the nearest enemy inside the cone is struck with the melee weapon when adjacent. The ranged
 * weapon is used only when the survivor's Free fire is on (and there is ammo), DESIGN §13.
 */
function hold(s: MissionState, u: Survivor, facing: [number, number]): void {
  u.path = [];
  u.facing = [...facing];
  if (u.cooldown > 0) return;
  const v = survivorViewer(u);
  let best: Enemy | null = null;
  let bd = Infinity;
  for (const e of s.enemies) {
    if (e.hp <= 0 || !seesPoint(s.grid, v, e.x, e.y)) continue;
    const d = dist(u.x, u.y, e.x, e.y);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  if (!best) return;
  const list = u.weapons.map(weapon);
  const melee = list.find((w) => w.range <= chars.adjacent);
  const ranged = u.freeFire ? list.find((w) => w.range > chars.adjacent && hasAmmo(s, w)) : undefined;
  if (melee && bd <= melee.range) fire(s, u, melee, best);
  else if (ranged) fire(s, u, ranged, best);
}

function attack(s: MissionState, u: Survivor, target: string): void {
  const t = s.enemies.find((e) => e.id === target);
  if (!t || t.hp <= 0) {
    u.order = null;
    u.path = [];
    return;
  }
  const w = weapon(activeWeapon(s, u));
  if (inReach(s, u, t, w)) {
    u.path = [];
    face(u, t.x, t.y);
    fire(s, u, w, t);
  } else if (u.path.length === 0 || s.tick % REPATH === 0) u.path = route(s.grid, u, [t.x, t.y]);
}

function stepSurvivor(s: MissionState, u: Survivor): void {
  if (u.cooldown > 0) u.cooldown--;
  if (u.lureCd > 0) u.lureCd--;
  const o = u.order;
  if (o?.type === 'hold') hold(s, u, o.facing);
  else if (o?.type === 'attack') attack(s, u, o.target);
  else if (o?.type === 'takedown') stepTakedown(s, u, o);
  else if (o?.type === 'open') stepOpen(s, u, o);
  const mode = moveMode(u);
  const c = chars[u.kind];
  const speed = c.speed[mode] * (u.carrying && 'carrySpeed' in c ? c.carrySpeed : 1) * (u.speedMul ?? 1);
  const moved = walkPath(s.grid, u, speed);
  if (moved > 0) emitNoise(s, u.x, u.y, chars.moveNoise[mode], 'step', u.id, s.tick % 5 === 0);
  if (u.path.length === 0) {
    u.running = false;
    if (o?.type === 'move') u.order = null;
  }
  carryFollow(s, u);
}

export function inZone(z: Zone, x: number, y: number): boolean {
  const tx = Math.round(x);
  const ty = Math.round(y);
  return tx >= z.x && ty >= z.y && tx < z.x + z.w && ty < z.y + z.h;
}

const DEATH_CAUSE: Record<string, string> = { zombie: 'was killed by a zombie', human: 'was shot by a guard', hunger: 'starved' };

/** The fail-screen line (DESIGN §19): who died and what killed them, e.g. "Fighter was killed by a zombie." */
export function failText(s: Pick<MissionState, 'survivors'>): string {
  return s.survivors
    .filter((u) => u.hp <= 0)
    .map((u) => `${u.kind[0]!.toUpperCase()}${u.kind.slice(1)} ${DEATH_CAUSE[u.killedBy ?? ''] ?? 'died'}.`)
    .join('  ');
}

function updateStatus(s: MissionState): void {
  if (s.survivors.some((u) => u.hp <= 0)) s.status = 'failed';
  else if (s.win === 'clear') {
    if (s.enemies.every((e) => e.hp <= 0) && s.crates.every((c) => c.opened)) s.status = 'success';
  } else if (
    s.survivors.every((u) => inZone(s.extract, u.x, u.y)) &&
    (s.crates.length === 0 || s.crates.some((c) => c.opened))
  )
    s.status = 'success';
}

/** True when the tile under (x, y) is inside the roof footprint (walls and doorways included). */
export function underRoof(s: MissionState, x: number, y: number): boolean {
  return s.roof !== null && inZone(s.roof, x, y);
}

/** The roof opens for good the first time a survivor stands under it. */
function updateRoof(s: MissionState): void {
  if (!s.roofOpen && s.survivors.some((u) => u.hp > 0 && underRoof(s, u.x, u.y))) s.roofOpen = true;
}

/** One 0.1 s tick. Noises made in the previous tick are heard now. Does nothing once ended. */
export function stepMission(s: MissionState): void {
  if (s.status !== 'playing') return;
  s.tick++;
  const heard = s.noises;
  s.noises = [];
  ageRings(s);
  for (const u of s.survivors) if (u.hp > 0) stepSurvivor(s, u);
  for (const e of s.enemies) stepEnemy(s, e, heard);
  updateRoof(s);
  updateStatus(s);
}
