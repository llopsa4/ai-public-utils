// Base 1 rules (DESIGN §12, §17): the cleared house from Mission 1 as a home. Fixable windows and
// door, barricades for the yard, a stove, and hunger. A mission-style state (same units, orders, AI
// and combat from mission.ts) plus resources, traps, roamers and the herd (warning 5:00, herd 7:00).
// Pure TypeScript, fixed 10 Hz tick, JSON-serialisable state.
import base from '../data/base1.json';
import enemies from '../data/enemies.json';
import m01 from '../data/missions/m01.json';
import { type BarButton, barButtons, unlockGun } from './abilities';
import { REPATH, nearTarget, newAi, route } from './ai';
import { face } from './combat';
import { BUSH, COVER, FLOOR, getTile, isBlocked, setTile } from './grid';
import { type MissionSpec, type MissionState, type Order, type Survivor, createMission, stepMission } from './mission';
import { type Pt, findPath, nearestFree } from './path';
import { TICK_HZ } from './time';
import { type Trap, stepTrapWork, stepTraps, trapAt } from './traps';
import { ADJACENT, dist } from './vision';

export { TICK_HZ };
export { orderAttack, orderMove, orderHold, setStance } from './mission';

const secs = (s: number): number => Math.round(s * TICK_HZ);

/** A placed barricade segment: a cover tile that blocks walking but not sight; zombies chew it down. */
export interface Barricade {
  x: number;
  y: number;
  hp: number;
}

/** A window or door in the house wall. Broken it is a floor gap; fixed it is a cover tile with `hp`. */
export interface Opening extends Barricade {
  id: string;
  kind: 'door' | 'window';
  fixed: boolean;
}

/** Per survivor: ticks until starving, a meal in hand, whether the warning was said, ticks to the next starve hit. */
export interface Hunger {
  left: number;
  meal: boolean;
  warned: boolean;
  starveIn: number;
}

export interface Said {
  tick: number;
  id: string;
  text: string;
}

/** Story moments the scene reacts to (dialogue, arrow). Oldest first; the scene reads the new ones. */
export interface BaseEvent {
  tick: number;
  kind: 'herdWarning' | 'herdArrives' | 'win';
}

/** The herd's progress: the warning was given, how many have entered from the north. */
export interface HerdState {
  warned: boolean;
  spawned: number;
}

export interface BaseState extends MissionState {
  food: number;
  scrap: number;
  barricades: Barricade[];
  openings: Opening[];
  stove: { x: number; y: number };
  traps: Trap[];
  hunger: Record<string, Hunger>;
  said: Said[]; // barks, oldest first; the scene shows the new ones
  calm: boolean; // no roamers and no herd (tests of the other rules)
  roamersSpawned: number;
  herd: HerdState;
  events: BaseEvent[];
}

export type PlaceResult = 'ok' | 'blocked' | 'occupied' | 'scrap';
export type WorkResult = 'ok' | 'invalid' | 'scrap' | 'food' | 'meal';
export type HungerLevel = 'ok' | 'low' | 'critical' | 'starving';

export const HUNGER_TICKS = secs(base.hunger.seconds);
export const FIX_TICKS = secs(base.fix.time);
export const COOK_TICKS = secs(base.cook.time);

/** The m01 map with the back door walled up, the window gaps opened and the stove set. */
function baseMap(spec: MissionSpec): string[] {
  const rows = spec.map.map((r) => r.split(''));
  for (const [x, y] of base.sealed) rows[y!]![x!] = '#';
  for (const o of base.openings) rows[o.y]![o.x] = '.';
  rows[base.stove.y]![base.stove.x] = 'c';
  return rows.map((r) => r.join(''));
}

/**
 * The house and yard. `from` is what the survivors carry over from Mission 1; `calm` leaves out roamers and the herd;
 * `cassGun` gives the Fighter her pistol back (already unlocked in the save).
 */
export function createBase(from?: { food?: number; scrap?: number; ammo?: number; calm?: boolean; cassGun?: boolean }): BaseState {
  const spec = m01 as unknown as MissionSpec;
  const mission = createMission({
    seed: base.seed,
    map: baseMap(spec),
    survivors: spec.survivors,
    enemies: [],
    ammo: from?.ammo ?? base.start.ammo,
  });
  const hunger: Record<string, Hunger> = {};
  for (const u of mission.survivors) hunger[u.id] = { left: HUNGER_TICKS, meal: false, warned: false, starveIn: secs(base.hunger.starveEvery) };
  const s: BaseState = {
    ...mission,
    food: from?.food ?? base.start.food,
    scrap: from?.scrap ?? base.start.scrap,
    barricades: [],
    openings: base.openings.map((o) => ({ ...o, kind: o.kind as Opening['kind'], fixed: false, hp: base.fix.hp })),
    stove: { ...base.stove },
    traps: [],
    hunger,
    said: [],
    calm: from?.calm ?? false,
    roamersSpawned: 0,
    herd: { warned: false, spawned: 0 },
    events: [],
  };
  if (from?.cassGun) unlockGun(s, 'fighter');
  if (!s.calm) for (let i = 0; i < base.roamers.start; i++) spawnRoamer(s);
  return s;
}

// ---- Herd checkpoint (DESIGN §12, §18) ----

/** A deep copy through JSON, exactly what the save stores, so a restored run is the same as one loaded after a reload. */
export function cloneBase(s: BaseState): BaseState {
  return JSON.parse(JSON.stringify(s)) as BaseState;
}

/** The checkpoint at the herd warning: a copy of the whole state, or null before the warning or once the run is over. */
export function checkpointOf(s: BaseState): BaseState | null {
  return s.herd.warned && s.status === 'playing' ? cloneBase(s) : null;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * A saved checkpoint back into a state, or null when it is missing or does not fit this build's Base 1
 * (damage, an edited slot, changed data). A bad checkpoint is only ignored: the save itself stays usable.
 */
export function restoreBase(raw: unknown): BaseState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const t = createBase({ calm: true }) as unknown as Record<string, unknown>;
  for (const k of Object.keys(t)) {
    if (typeof r[k] !== typeof t[k] || Array.isArray(r[k]) !== Array.isArray(t[k]) || (r[k] === null) !== (t[k] === null)) return null;
  }
  const s = r as unknown as BaseState;
  const tt = t as unknown as BaseState;
  if (s.status !== 'playing' || !s.herd.warned || !Number.isInteger(s.tick) || s.tick < 0 || !finite(s.rng.s)) return null;
  if (s.grid.size !== tt.grid.size || !Array.isArray(s.grid.tiles) || s.grid.tiles.length !== s.grid.size ** 2) return null;
  if (!s.grid.tiles.every((k) => Number.isInteger(k) && k >= FLOOR && k <= BUSH)) return null;
  if (s.survivors.length !== tt.survivors.length) return null;
  const sameIds = s.survivors.every((u, i) => u?.id === tt.survivors[i]!.id && finite(u.x) && finite(u.y) && finite(u.hp) && u.hp > 0 && typeof s.hunger[u.id] === 'object' && s.hunger[u.id] !== null);
  const units = s.enemies.every((e) => typeof e?.id === 'string' && finite(e.x) && finite(e.y) && finite(e.hp) && Array.isArray(e.path) && typeof e.ai === 'object' && e.ai !== null);
  const openings = s.openings.length === tt.openings.length && s.openings.every((o, i) => o?.id === tt.openings[i]!.id && typeof o.fixed === 'boolean' && finite(o.hp));
  if (!sameIds || !units || !openings) return null;
  return cloneBase(s);
}

// ---- Roamers and the herd (DESIGN §12) ----

const HERD_START = secs(base.herd.arriveAt);
const HERD_GAP = (base.herd.over * TICK_HZ) / base.herd.count; // ticks between herd arrivals
const isRoamer = (e: { id: string }): boolean => e.id.startsWith('r');
const isHerd = (e: { id: string }): boolean => e.id.startsWith('h');
const liveZombie = (e: BaseState['enemies'][number]): boolean => e.kind === 'zombie' && e.hp > 0;

/** The next roamer enters at one of the corner spawns, in turn. */
function spawnRoamer(s: BaseState): void {
  const [x, y] = base.roamers.spawns[s.roamersSpawned % base.roamers.spawns.length]!;
  s.roamersSpawned++;
  addZombie(s, x!, y!, [0, 1], `r${s.roamersSpawned}`);
}

/** Herd zombie `i` enters on the north row, spread across the width. */
function spawnHerdZombie(s: BaseState, i: number): void {
  addZombie(s, 3 + ((i * 7) % (s.grid.size - 6)), base.herd.row, [0, 1], `h${i + 1}`);
}

/** Every herd zombie has entered and none is left alive. */
export function herdCleared(s: BaseState): boolean {
  return s.herd.spawned >= base.herd.count && !s.enemies.some((e) => isHerd(e) && liveZombie(e));
}

/** Seconds until the herd arrives (0 once it has), for the HUD. */
export function herdSeconds(s: BaseState): number {
  return Math.max(0, Math.ceil((HERD_START - s.tick) / TICK_HZ));
}

/** Herd zombies still to kill: those not yet entered plus the live ones (for the objective line). */
export function herdLeft(s: BaseState): number {
  const entered = s.enemies.filter((e) => isHerd(e) && liveZombie(e)).length;
  return Math.max(0, base.herd.count - s.herd.spawned) + entered;
}

/** HUD objective: "Prepare the house" until the warning, then "Survive the herd: n left" (DESIGN §12). */
export function objectiveText(s: BaseState): string {
  if (!s.herd.warned) return base.objective.prepare;
  return base.objective.herd.replace('{n}', String(herdLeft(s)));
}

/** Warning at 5:00, a roamer every 90 s up to the cap, the herd from 7:00 over 60 s. */
function stepSchedule(s: BaseState): void {
  if (s.calm) return;
  const every = secs(base.roamers.every);
  if (s.tick > 0 && s.tick % every === 0 && s.enemies.filter((e) => isRoamer(e) && liveZombie(e)).length < base.roamers.max) spawnRoamer(s);
  if (!s.herd.warned && s.tick >= secs(base.herd.warnAt)) {
    s.herd.warned = true;
    s.events.push({ tick: s.tick, kind: 'herdWarning' });
  }
  if (s.tick < HERD_START) return;
  if (s.herd.spawned === 0) s.events.push({ tick: s.tick, kind: 'herdArrives' });
  const due = Math.min(base.herd.count, Math.floor((s.tick - HERD_START) / HERD_GAP) + 1);
  while (s.herd.spawned < due) spawnHerdZombie(s, s.herd.spawned++);
}

/**
 * Herd zombies that are not chasing or following a noise march on the nearest survivor (they sense
 * the whole camp). Unreachable (sealed in): they walk beside the blocker nearest to them and chew it.
 */
function stepHerd(s: BaseState): void {
  for (const e of s.enemies) {
    if (!isHerd(e) || e.hp <= 0 || e.ai.mode !== 'wander') continue;
    const t = s.survivors.filter((u) => u.hp > 0).sort((a, b) => dist(e.x, e.y, a.x, a.y) - dist(e.x, e.y, b.x, b.y))[0];
    if (!t) continue;
    e.ai.mode = 'investigate';
    e.ai.goal = tileOf(t);
    e.ai.target = t.id; // approachBlocker reads it
    if (s.tick % REPATH !== 0) continue;
    const p = route(s.grid, e, [t.x, t.y]);
    if (p.length > 0) e.path = p;
    else approachBlocker(s, e, chewables(s));
  }
}

/** A zombie at (x, y) facing `toward`; roamers (`r…`) and herd zombies (`h…`) pass their own id. */
export function addZombie(s: BaseState, x: number, y: number, toward: readonly [number, number] = [0, 1], id = `z${s.enemies.length + 1}`): string {
  s.enemies.push({
    id,
    side: 'zombie',
    kind: 'zombie',
    x,
    y,
    hp: enemies.zombie.hp,
    maxHp: enemies.zombie.hp,
    facing: [toward[0], toward[1]],
    path: [],
    cooldown: 0,
    act: null,
    ai: newAi('zombie'),
    patrol: [],
    post: { x, y, facing: [toward[0], toward[1]] },
  });
  return id;
}

const alive = (s: BaseState, id: string): Survivor | undefined => s.survivors.find((u) => u.id === id && u.hp > 0);
const tileOf = (u: { x: number; y: number }): Pt => [Math.round(u.x), Math.round(u.y)];
const stop = (u: Survivor): void => {
  u.order = null;
  u.path = [];
};

// ---- Barricades (B, then click) ----

/**
 * One barricade segment on a free floor tile for `barricade.cost` scrap. Refused (nothing changes) on
 * a tree, wall, stove, another barricade, a window or door gap, a unit's tile, or without scrap.
 */
export function placeBarricade(s: BaseState, x: number, y: number): PlaceResult {
  if (getTile(s.grid, x, y) !== FLOOR || s.openings.some((o) => o.x === x && o.y === y) || trapAt(s, x, y)) return 'blocked';
  if ([...s.survivors, ...s.enemies].some((u) => u.hp > 0 && Math.round(u.x) === x && Math.round(u.y) === y)) return 'occupied';
  if (s.scrap < base.barricade.cost) return 'scrap';
  s.scrap -= base.barricade.cost;
  setTile(s.grid, x, y, COVER);
  s.barricades.push({ x, y, hp: base.barricade.hp });
  return 'ok';
}

// ---- Fix and cook: a survivor walks up, works, and the cost is paid when the work is done ----

/** X then click a broken opening: work 3 s, then 1 scrap makes it a wall zombies must chew through. */
export function orderFix(s: BaseState, id: string, openingId: string): WorkResult {
  const u = alive(s, id);
  const o = s.openings.find((o) => o.id === openingId);
  if (!u || !o || o.fixed) return 'invalid';
  if (s.scrap < base.fix.cost) return 'scrap';
  u.order = { type: 'work', job: 'fix', target: o.id, left: -1 };
  u.running = false;
  u.path = [];
  return 'ok';
}

/** Left-click the stove: work 5 s, then 1 food makes a meal the cook holds (one meal at most). */
export function orderCook(s: BaseState, id: string): WorkResult {
  const u = alive(s, id);
  if (!u) return 'invalid';
  if (s.hunger[id]?.meal) return 'meal';
  if (s.food < base.cook.food) return 'food';
  u.order = { type: 'work', job: 'cook', target: 'stove', left: -1 };
  u.running = false;
  u.path = [];
  return 'ok';
}

function finishFix(s: BaseState, u: Survivor, o: Opening, w: Extract<Order, { type: 'work' }>): void {
  if (o.fixed || s.scrap < base.fix.cost) return stop(u);
  const [ux, uy] = tileOf(u);
  const blocked = [...s.survivors, ...s.enemies].some((v) => v !== u && v.hp > 0 && Math.round(v.x) === o.x && Math.round(v.y) === o.y);
  if (blocked) {
    w.left = 1; // someone stands in the gap: wait for them to leave
    return;
  }
  if (ux === o.x && uy === o.y) {
    const off = nearestFree(s.grid, [o.x, o.y], new Set([o.y * s.grid.size + o.x]));
    if (off) [u.x, u.y] = off;
  }
  s.scrap -= base.fix.cost;
  o.fixed = true;
  o.hp = base.fix.hp;
  setTile(s.grid, o.x, o.y, COVER);
  stop(u);
}

function stepWork(s: BaseState, u: Survivor, w: Extract<Order, { type: 'work' }>): void {
  if (w.job === 'trap' || w.job === 'rearm') return stepTrapWork(s, u, w);
  const opening = w.job === 'fix' ? s.openings.find((o) => o.id === w.target) : undefined;
  if (w.job === 'fix' && (!opening || opening.fixed)) return stop(u);
  const spot = opening ?? s.stove;
  if (dist(u.x, u.y, spot.x, spot.y) > ADJACENT) {
    u.running = false;
    if (u.path.length === 0 || s.tick % REPATH === 0) u.path = route(s.grid, u, [spot.x, spot.y]);
    if (u.path.length === 0) stop(u); // no way there
    return;
  }
  u.path = [];
  face(u, spot.x, spot.y);
  if (w.left < 0) w.left = w.job === 'fix' ? FIX_TICKS : COOK_TICKS;
  if (--w.left > 0) return;
  if (opening) return finishFix(s, u, opening, w);
  const h = s.hunger[u.id]!;
  if (h.meal || s.food < base.cook.food) return stop(u);
  s.food -= base.cook.food;
  h.meal = true;
  stop(u);
}

// ---- Meals and hunger (DESIGN §12) ----

/** Eat the meal in hand: hunger back to full, +30 HP for the eater only. */
export function eat(s: BaseState, id: string): boolean {
  const u = alive(s, id);
  const h = s.hunger[id];
  if (!u || !h?.meal) return false;
  h.meal = false;
  h.left = HUNGER_TICKS;
  h.warned = false;
  h.starveIn = secs(base.hunger.starveEvery);
  u.hp = Math.min(u.maxHp, u.hp + base.hunger.mealHeal);
  return true;
}

/** The nearest adjacent survivor without a meal, or undefined. */
function mealless(s: BaseState, u: Survivor): Survivor | undefined {
  return s.survivors
    .filter((v) => v !== u && v.hp > 0 && !s.hunger[v.id]?.meal && dist(u.x, u.y, v.x, v.y) <= ADJACENT)
    .sort((a, b) => dist(u.x, u.y, a.x, a.y) - dist(u.x, u.y, b.x, b.y))[0];
}

/** Hand the meal to an adjacent survivor who has none. */
export function give(s: BaseState, id: string): boolean {
  const u = alive(s, id);
  if (!u || !s.hunger[id]?.meal) return false;
  const to = mealless(s, u);
  if (!to) return false;
  s.hunger[id]!.meal = false;
  s.hunger[to.id]!.meal = true;
  return true;
}

export function hungerLevel(s: BaseState, id: string): HungerLevel {
  const left = s.hunger[id]?.left ?? HUNGER_TICKS;
  return left <= 0 ? 'starving' : left <= secs(base.hunger.critical) ? 'critical' : left <= secs(base.hunger.warn) ? 'low' : 'ok';
}

/** Seconds of hunger left (0 once starving). */
export function hungerSeconds(s: BaseState, id: string): number {
  return Math.ceil((s.hunger[id]?.left ?? 0) / TICK_HZ);
}

function stepHunger(s: BaseState): void {
  const hg = base.hunger;
  for (const u of s.survivors) {
    const h = s.hunger[u.id];
    if (u.hp <= 0 || !h) continue;
    if (h.left > 0) h.left--;
    if (!h.warned && h.left <= secs(hg.warn)) {
      h.warned = true;
      s.said.push({ tick: s.tick, id: u.id, text: base.say.hungry });
    }
    if (h.left > 0) {
      u.speedMul = 1;
      continue;
    }
    u.speedMul = hg.starveSpeed;
    if (--h.starveIn <= 0) {
      u.hp = Math.max(0, u.hp - hg.starveDamage);
      if (u.hp <= 0) u.killedBy = 'hunger';
      h.starveIn = secs(hg.starveEvery);
    }
  }
}

// ---- Zombies chew what blocks them: barricades and fixed openings ----

type Chewable = Barricade;
const chewables = (s: BaseState): Chewable[] => [...s.barricades, ...s.openings.filter((o) => o.fixed)];

/**
 * A chasing zombie with no route (walled off) walks to the reachable tile beside a chewable, as near
 * the survivor as it can get. Runs on re-plan ticks only (the zombie AI clears an unreachable route).
 */
function approachBlocker(s: BaseState, e: BaseState['enemies'][number], list: readonly Chewable[]): void {
  const t = s.survivors.find((u) => u.id === e.ai.target && u.hp > 0);
  if (!t) return;
  const here = tileOf(e);
  const beside = new Map<number, Pt>();
  for (const b of list) {
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
    if (c[0] === here[0] && c[1] === here[1]) return; // already beside the nearest one
    const p = findPath(s.grid, here, c);
    if (p) {
      e.path = p;
      return;
    }
  }
}

function broken(s: BaseState, b: Chewable): void {
  const opening = s.openings.find((o) => o === b);
  if (opening) {
    opening.fixed = false;
    opening.hp = base.fix.hp; // a broken opening can be fixed again
    setTile(s.grid, opening.x, opening.y, FLOOR);
  } else {
    s.barricades.splice(s.barricades.indexOf(b), 1);
    setTile(s.grid, b.x, b.y, FLOOR);
  }
}

/** A zombie heading in to chew (investigating, like the sealed-out herd) reaches out near a barricade or fixed opening too. */
function reachBlockers(s: BaseState): void {
  const list = chewables(s).map((b): Pt => [b.x, b.y]);
  if (list.length === 0) return;
  for (const e of s.enemies) if (e.hp > 0 && e.side === 'zombie' && !e.ai.near && e.ai.mode === 'investigate') e.ai.near = nearTarget(e, list);
}

function chew(s: BaseState): void {
  const list = chewables(s);
  if (list.length === 0) return;
  const bite = enemies.zombie.bite;
  for (const e of s.enemies) {
    if (e.kind !== 'zombie' || e.hp <= 0 || (e.ai.mode !== 'chase' && !isHerd(e)) || e.path.length > 0) continue;
    if (s.tick % REPATH === 0) approachBlocker(s, e, list);
    if (e.path.length > 0 || e.cooldown > 0) continue;
    const [tx, ty] = tileOf(e);
    const b = list.find((c) => c.hp > 0 && Math.abs(c.x - tx) <= 1 && Math.abs(c.y - ty) <= 1);
    if (!b) continue;
    b.hp -= bite.damage;
    e.cooldown = Math.round(bite.cooldown * TICK_HZ);
    e.act = { kind: 'bite', tick: s.tick };
    if (b.hp <= 0) broken(s, b);
  }
}

/**
 * One 0.1 s tick: work orders, the spawn schedule, herd marching, the mission tick (orders, AI, combat),
 * hunger, traps, then chewing. Base 1 is won when the whole herd is dead (DESIGN §12; the mission rules'
 * own "success" is ignored) and failed when any survivor dies. Frozen after either.
 */
export function stepBase(s: BaseState): void {
  if (s.status !== 'playing') return;
  for (const u of s.survivors) if (u.hp > 0 && u.order?.type === 'work') stepWork(s, u, u.order);
  stepSchedule(s);
  stepHerd(s);
  stepMission(s);
  if ((s.status as MissionState['status']) === 'success') s.status = 'playing';
  stepHunger(s);
  stepTraps(s);
  chew(s);
  reachBlockers(s);
  if (s.survivors.some((u) => u.hp <= 0)) s.status = 'failed';
  else if (!s.calm && herdCleared(s)) {
    s.status = 'success';
    s.events.push({ tick: s.tick, kind: 'win' });
  }
}

// ---- Action bar (DESIGN §17) ----

/**
 * The bar for one survivor in Base 1: weapons, Hold and Crouch (Takedown, Carry and Lure are mission
 * tools and are not offered), then Eat, Give, Fix, Cook, Barricade, Spike pit and Noise can (T picks the type). `armed` is the pending click mode.
 */
export function baseButtons(s: BaseState, u: Survivor, armed: 'fix' | 'build' | 'hold' | 'spike' | 'can' | null = null): BarButton[] {
  const out = barButtons(s, u)
    .filter((b) => b.id !== 'takedown' && b.id !== 'carry' && b.id !== 'lure')
    .map((b) => (b.id === 'hold' && armed === 'hold' ? { ...b, active: true } : b));
  const meal = s.hunger[u.id]?.meal ?? false;
  const work = u.order?.type === 'work' ? u.order.job : null;
  out.push(
    { id: 'eat', label: 'Eat', key: 'E', enabled: meal, active: false },
    { id: 'give', label: 'Give', key: 'Q', enabled: meal && mealless(s, u) !== undefined, active: false },
    { id: 'fix', label: 'Fix', key: 'X', enabled: s.openings.some((o) => !o.fixed) && s.scrap >= base.fix.cost, active: armed === 'fix' || work === 'fix' },
    { id: 'cook', label: 'Cook', key: 'K', enabled: !meal && s.food >= base.cook.food, active: work === 'cook' },
    { id: 'build', label: 'Barricade', key: 'B', enabled: s.scrap >= base.barricade.cost, active: armed === 'build' },
    { id: 'spike', label: 'Spike pit', key: 'T', enabled: s.scrap >= base.traps.spike.cost, active: armed === 'spike' || work === 'trap' },
    { id: 'can', label: 'Noise can', key: 'T', enabled: s.scrap >= base.traps.can.cost, active: armed === 'can' },
  );
  return out;
}
