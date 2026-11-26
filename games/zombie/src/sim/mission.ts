// Mission rules (DESIGN §3, §8, §13, §14): state, survivor orders, the 10 Hz tick, extract and fail.
// Pure TypeScript, JSON-serialisable state. Abilities (takedown, carry, lure, crates) are in abilities.ts.
import chars from '../data/characters.json';
import enemiesData from '../data/enemies.json';
import { carryFollow, stepFinish, stepOpen, stepTakedown } from './abilities';
import { type BondState, newBond, stepBond } from './bond';
import { type Difficulty, tuning } from './difficulty';
import { type AiState, REPATH, newAi, route, stepEnemy, walkPath } from './ai';
import { activeWeapon, face, fire, hasAmmo, inReach, pickUpArrows, weapon } from './combat';
import { BUSH, COVER, FLOOR, type Grid, type Kind, TREE, WALL, makeGrid, setTile } from './grid';
import { type NoiseHolder, ageRings, emitNoise } from './noise';
import { type Pt, nearestFree } from './path';
import { type RngState, makeRng } from './rng';
import { type Speaker, type SpeakerSpec, newSpeaker, stepSpeaker } from './speaker';
import { TICK_HZ } from './time';
import { moveNoiseOf } from './traits';
import { type Viewer, dist, moveMode, seesPoint } from './vision';

export type Stance = 'walk' | 'crouch' | 'crawl';
export type SurvivorKind = 'fighter' | 'scout' | 'hunter' | 'archer' | 'tinkerer';
/** The name the player sees for each survivor (DESIGN §5). Ids stay `fighter` / `scout` / `hunter` / `archer` / `tinkerer`. */
export const SURVIVOR_NAME: Record<SurvivorKind, string> = { fighter: 'Cass', scout: 'Eli', hunter: 'Ray', archer: 'June', tinkerer: 'Theo' };
export type EnemyKind = 'zombie' | 'human';

export type Order =
  | { type: 'move' }
  | { type: 'hold'; facing: [number, number] }
  | { type: 'attack'; target: string }
  | { type: 'takedown'; target: string; left: number } // left: ticks, -1 until adjacent
  | { type: 'open'; crate: string; left: number }
  | { type: 'finish'; target: string; left: number } // a squatter's body before it rises (DESIGN §26); left: as takedown, by hand only
  | { type: 'work'; job: 'fix' | 'cook' | 'trap' | 'rearm'; target: string; left: number }; // Base 1 (sim/base.ts); left: ticks, -1 until adjacent

/** What a unit is doing as a one-shot animation (art spec: stab, shot, club, hatchet, shovel, bow shot, throw, takedown, bite). */
export type ActKind = 'stab' | 'shot' | 'club' | 'hatchet' | 'shovel' | 'bow_shot' | 'throw' | 'takedown' | 'bite';

/** Set at the start of an action; the renderer plays the one-shot from `tick` (the sim never clears it). */
export interface Act {
  kind: ActKind;
  tick: number;
  at?: [number, number]; // a bow shot: the point the arrow flies to (the scene draws its flight)
}

/** An arrow lying where it hit, until a survivor walks over its tile and it goes back to `owner` (DESIGN §5 *Bow*). */
export interface LooseArrow {
  x: number;
  y: number;
  owner: string; // the survivor id who shot it
  tick: number; // when it was shot: the scene shows it once its flight has landed
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
  arrows?: number; // arrows in the quiver, for a survivor with a bow (Ray, June; DESIGN §5); absent otherwise
}

export interface Enemy extends UnitBase {
  side: EnemyKind;
  kind: EnemyKind;
  ai: AiState;
  patrol: Pt[];
  post: { x: number; y: number; facing: [number, number] };
  turned?: boolean; // a zombie risen from a squatter's body (DESIGN §26): looks only, the A19 sheet
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
  riseAt?: number; // the tick it rises as a zombie (a squatter killed by a zombie, DESIGN §26); absent: it never rises
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
  looseArrows: LooseArrow[]; // shot arrows lying on the map (DESIGN §5 *Bow*)
  crates: Crate[];
  crateTime: number; // seconds to open a crate
  loot: { food: number; scrap: number; ammo: number }; // from opened crates
  ammo: number; // shared by every survivor (DESIGN §5)
  win: 'extract' | 'clear' | 'squatters';
  extract: Zone; // empty (w = 0) when there is none
  roof: Zone | null; // hides everything inside until a survivor enters (DESIGN §16)
  roofOpen: boolean; // a survivor has entered: the roof is gone for good
  bond: BondState | null; // the Cass + Eli move (DESIGN §23); null where the scene has none (the Intro)
  theoOnAir?: boolean; // Theo has spoken on the speaker (Mission 2, DESIGN §25): the enemy highlight works before he joins
  mission?: string; // which mission this is (`m01` when absent, `m02`): the debrief and the Bios read it
  speaker?: Speaker; // Theo's speaker beats (Mission 2, DESIGN §26; sim/speaker.ts); absent elsewhere
  difficulty: Difficulty; // the level this scene started on (DESIGN §21); zombie sight reads it
}

/**
 * Map rows: `.` floor, `,` path (floor drawn as a worn track, art/STYLE.md *Placement*), `#` wall, `T` tree, `c` cover,
 * `b` bush. Mission 2's estate (DESIGN §26) adds `q` concrete floor, `D` the bunker door (a wall until it opens), and
 * props that block like cover: `f` fence, `G` gate post, `s` solar panel, `i` inverter, `g` generator, `p` intercom.
 * The map must be square.
 */
export interface MissionSpec {
  id?: string; // `m01` when absent
  seed?: number;
  map: string[];
  survivors: { id: string; kind: SurvivorKind; x: number; y: number }[];
  enemies: { id: string; kind: EnemyKind; x: number; y: number; facing?: [number, number]; patrol?: Pt[] }[];
  crates?: { id: string; x: number; y: number; food: number; scrap: number; ammo?: number }[];
  ammo?: number; // default `startAmmo`
  difficulty?: Difficulty; // default 'normal'; `withDifficulty` also applies the level's ammo
  crateTime?: number; // seconds, default 2
  /**
   * `extract` (default): every survivor in `extract` and one crate opened. `clear`: every enemy dead and every crate
   * opened. `squatters`: every human enemy down; zombies may still walk (Mission 2, DESIGN §26).
   */
  win?: 'extract' | 'clear' | 'squatters';
  extract?: Zone;
  roof?: Zone; // the house footprint, walls included
  bond?: boolean; // the scene offers the bond move (DESIGN §23)
  fence?: Zone; // the estate fence, outer edge (Mission 2): Theo calls when a survivor first comes near it
  speaker?: SpeakerSpec; // Theo's speaker beats (Mission 2, DESIGN §26)
  /** Run shuffles (DESIGN §21): other zombie start spots and crates; `enemies` and `crates` above are layout 0. */
  layouts?: Pick<MissionSpec, 'enemies' | 'crates'>[];
}

const TILE_CHARS: Record<string, Kind> = { '.': FLOOR, ',': FLOOR, q: FLOOR, '#': WALL, D: WALL, T: TREE, c: COVER, b: BUSH, f: COVER, G: COVER, s: COVER, i: COVER, g: COVER, p: COVER };

function unit(v: [number, number]): [number, number] {
  const d = Math.hypot(v[0], v[1]);
  return d > 1e-9 ? [v[0] / d, v[1] / d] : [0, 1];
}

/** A survivor at full health with their character's weapons (also used when one arrives mid-scene, DESIGN §15). */
export function newSurvivor(id: string, kind: SurvivorKind, x: number, y: number): Survivor {
  return {
    id,
    side: 'survivor',
    kind,
    x,
    y,
    hp: chars[kind].hp,
    maxHp: chars[kind].hp,
    facing: [0, -1],
    path: [],
    cooldown: 0,
    act: null,
    stance: 'walk',
    running: false,
    order: null,
    weapon: chars[kind].primary,
    weapons: [...chars[kind].weapons],
    carrying: null,
    lureCd: 0,
    ...(chars[kind].weapons.includes('bow') ? { arrows: chars.quiver } : {}),
  };
}

/**
 * A mission spec on a difficulty (DESIGN §21): the level's ammo bonus on the starting ammo and its change to every
 * crate that holds ammo (never below 0). The spec itself is not changed.
 */
export function withDifficulty(spec: MissionSpec, d: Difficulty): MissionSpec {
  const t = tuning(d);
  return {
    ...spec,
    difficulty: d,
    ammo: (spec.ammo ?? chars.startAmmo) + t.ammoBonus,
    crates: spec.crates?.map((c) => (c.ammo ? { ...c, ammo: Math.max(0, c.ammo + t.crateAmmo) } : { ...c })),
  };
}

/** How many layouts a spec has: its own enemies and crates, plus each of `layouts`. */
export function layoutCount(spec: MissionSpec): number {
  return 1 + (spec.layouts?.length ?? 0);
}

/** The spec with layout `i` in place (0 or out of range: its own enemies and crates). The spec itself is not changed. */
export function withLayout(spec: MissionSpec, i: number): MissionSpec {
  const l = i > 0 ? spec.layouts?.[i - 1] : undefined;
  return l ? { ...spec, enemies: l.enemies, crates: l.crates } : spec;
}

/** A layout for a new run or restart (DESIGN §21 run shuffles). `rand` returns [0, 1). */
export function rollLayout(spec: MissionSpec, rand: () => number = Math.random): number {
  return Math.floor(rand() * layoutCount(spec)) % layoutCount(spec);
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
  const survivors: Survivor[] = spec.survivors.map((s) => newSurvivor(s.id, s.kind, s.x, s.y));
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
    looseArrows: [],
    crates: (spec.crates ?? []).map((c) => ({ ammo: 0, ...c, opened: false })),
    crateTime: spec.crateTime ?? 2,
    loot: { food: 0, scrap: 0, ammo: 0 },
    ammo: spec.ammo ?? chars.startAmmo,
    win: spec.win ?? 'extract',
    extract: { ...(spec.extract ?? { x: -1, y: -1, w: 0, h: 0 }) },
    roof: spec.roof ? { ...spec.roof } : null,
    roofOpen: !spec.roof,
    bond: spec.bond ? newBond() : null,
    difficulty: spec.difficulty ?? 'normal',
    ...(spec.id ? { mission: spec.id } : {}),
    ...(spec.speaker && spec.fence ? { speaker: newSpeaker(spec.speaker, spec.fence) } : {}),
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
 * Hold: the nearest enemy inside the cone is shot with the bow while there are arrows (silent, DESIGN §13 *Bow on
 * Hold*), else struck with the melee weapon when adjacent. The gun is used only when the survivor's Free fire is
 * on (and there is ammo), DESIGN §13.
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
  const bow = list.find((w) => w.arrows && hasAmmo(s, w, u));
  if (bow && fire(s, u, bow, best)) return;
  const melee = list.find((w) => w.range <= chars.adjacent);
  const ranged = u.freeFire ? list.find((w) => w.range > chars.adjacent && !w.arrows && hasAmmo(s, w, u)) : undefined;
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
  else if (o?.type === 'finish') stepFinish(s, u, o);
  const mode = moveMode(u);
  const c = chars[u.kind];
  const speed = c.speed[mode] * (u.carrying && 'carrySpeed' in c ? c.carrySpeed : 1) * (u.speedMul ?? 1);
  const moved = walkPath(s.grid, u, speed);
  if (moved > 0) emitNoise(s, u.x, u.y, moveNoiseOf(u.kind, mode), 'step', u.id, s.tick % 5 === 0);
  if (moved > 0 && s.looseArrows.length) pickUpArrows(s, u);
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

/** The fail-screen line (DESIGN §19): who died and what killed them, e.g. "Cass was killed by a zombie." */
export function failText(s: Pick<MissionState, 'survivors'>): string {
  return s.survivors
    .filter((u) => u.hp <= 0)
    .map((u) => `${SURVIVOR_NAME[u.kind]} ${DEATH_CAUSE[u.killedBy ?? ''] ?? 'died'}.`)
    .join('  ');
}

/** The id of the zombie a body rises as. */
export const risenId = (bodyId: string): string => `${bodyId}-z`;

/**
 * Seconds until a body rises (rounded up; DESIGN §26 the faint countdown), or null for a body that never will.
 */
export function riseIn(s: Pick<MissionState, 'tick'>, b: Body): number | null {
  return b.riseAt === undefined ? null : Math.max(0, Math.ceil((b.riseAt - s.tick) / TICK_HZ));
}

/**
 * Bodies whose time has come rise as ordinary zombies where they lie (or at their carrier's feet, who drops them):
 * the body is gone, the blood decal stays. A risen zombie is not needed for a `squatters` win (DESIGN §26).
 */
function riseBodies(s: MissionState): void {
  if (!s.bodies.some((b) => b.riseAt !== undefined && b.riseAt <= s.tick)) return;
  s.bodies = s.bodies.filter((b) => {
    if (b.riseAt === undefined || b.riseAt > s.tick) return true;
    const carrier = b.carriedBy ? s.survivors.find((u) => u.id === b.carriedBy) : undefined;
    if (carrier) carrier.carrying = null;
    const [x, y] = carrier ? [Math.round(carrier.x), Math.round(carrier.y)] : [b.x, b.y];
    s.enemies.push({
      id: risenId(b.id),
      side: 'zombie',
      kind: 'zombie',
      x,
      y,
      hp: enemiesData.zombie.hp,
      maxHp: enemiesData.zombie.hp,
      facing: [0, 1],
      path: [],
      cooldown: 0,
      act: null,
      ai: newAi('zombie'),
      patrol: [],
      post: { x, y, facing: [0, 1] },
      turned: true,
    });
    return false;
  });
}

function updateStatus(s: MissionState): void {
  if (s.survivors.some((u) => u.hp <= 0)) s.status = 'failed';
  else if (s.win === 'clear') {
    if (s.enemies.every((e) => e.hp <= 0) && s.crates.every((c) => c.opened)) s.status = 'success';
  } else if (s.win === 'squatters') {
    if (s.enemies.every((e) => e.kind !== 'human' || e.hp <= 0)) s.status = 'success';
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
  if (s.bond?.run) return stepBond(s); // the set piece plays; the rest of the world is frozen (DESIGN §23)
  const heard = s.noises;
  s.noises = [];
  ageRings(s);
  for (const u of s.survivors) if (u.hp > 0) stepSurvivor(s, u);
  for (const e of s.enemies) stepEnemy(s, e, heard);
  riseBodies(s);
  updateRoof(s);
  if (s.speaker) stepSpeaker(s, s.speaker);
  updateStatus(s);
}
