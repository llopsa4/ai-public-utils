// Bond technique (DESIGN §23): a unique Cass + Eli move, once per scene, in Mission 1 and Base 1. The player
// aims a circle; up to 3 zombies nearest its centre are marked. Then the rest of the world freezes while a
// scripted set piece plays: Eli sprints past the marked zombies, they turn and chase him, and Cass follows
// and kills each one silently from behind. It always succeeds. Pure rules on the mission state; value
// imports from `mission` are avoided (it imports this file).
import chars from '../data/characters.json';
import enemies from '../data/enemies.json';
import { route, walkPath } from './ai';
import { damage, face } from './combat';
import { type Pt, nearestFree } from './path';
import { TICK_HZ } from './time';
import { ADJACENT, dist } from './vision';
import type { Enemy, MissionState, Survivor } from './mission';

export const BOND = chars.bond;

/** The set piece in progress. `t` counts its ticks; `victim` is the zombie Cass is killing, for `kill` more ticks. */
export interface BondRun {
  targets: string[];
  goal: Pt; // where Eli runs to, past the marked zombies
  t: number;
  victim: string | null;
  kill: number;
}

/** Null in a scene without the move (the Intro). `used` lasts until the next scene or a restart. */
export interface BondState {
  used: boolean;
  run: BondRun | null;
}

export const newBond = (): BondState => ({ used: false, run: null });

/** Why an aim cannot start the move, or null when it can. */
export type BondRefusal = 'none' | 'used' | 'busy' | 'dead' | 'far' | 'empty';

const GAP = 3; // tiles between Eli and the zombies closing on him
const ticks = (sec: number): number => Math.max(1, Math.round(sec * TICK_HZ));
/** Base 1 herd zombies have ids `h1`, `h2`, … (sim/base.ts); they cannot be marked. */
export const isHerdId = (id: string): boolean => id.startsWith('h');

/** Cass (the Fighter) and Eli (the Scout), alive or not; undefined when the scene lacks one. */
function pair(s: MissionState): { cass?: Survivor; eli?: Survivor } {
  return { cass: s.survivors.find((u) => u.kind === 'fighter'), eli: s.survivors.find((u) => u.kind === 'scout') };
}

/** Under a roof nobody has lifted yet: not seen, so not markable. */
function hiddenAt(s: MissionState, x: number, y: number): boolean {
  const r = s.roof;
  if (!r || s.roofOpen) return false;
  const tx = Math.round(x);
  const ty = Math.round(y);
  return tx >= r.x && ty >= r.y && tx < r.x + r.w && ty < r.y + r.h;
}

/** The live zombies the circle at `centre` marks: up to `BOND.targets`, nearest the centre first, within `BOND.radius`. */
export function bondTargets(s: MissionState, centre: readonly [number, number]): string[] {
  return s.enemies
    .filter((e) => e.kind === 'zombie' && e.hp > 0 && !isHerdId(e.id) && !hiddenAt(s, e.x, e.y))
    .map((e) => ({ id: e.id, d: dist(e.x, e.y, centre[0], centre[1]) }))
    .filter((e) => e.d <= BOND.radius)
    .sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : 1))
    .slice(0, BOND.targets)
    .map((e) => e.id);
}

/** True when the scene has the move and it is unused and not playing. */
export function bondAvailable(s: MissionState): boolean {
  return s.bond !== null && !s.bond.used && s.bond.run === null;
}

/** What the aim at `centre` would do: the marked zombies and, when it cannot start, why. */
export function bondAim(s: MissionState, centre: readonly [number, number]): { targets: string[]; refusal: BondRefusal | null } {
  const targets = bondTargets(s, centre);
  if (!s.bond) return { targets, refusal: 'none' };
  if (s.bond.run) return { targets, refusal: 'busy' };
  if (s.bond.used) return { targets, refusal: 'used' };
  const { cass, eli } = pair(s);
  if (!cass || !eli || cass.hp <= 0 || eli.hp <= 0) return { targets, refusal: 'dead' };
  if (dist(cass.x, cass.y, centre[0], centre[1]) > BOND.reach || dist(eli.x, eli.y, centre[0], centre[1]) > BOND.reach) return { targets, refusal: 'far' };
  return { targets, refusal: targets.length === 0 ? 'empty' : null };
}

/** The toast for a refused aim. */
export const BOND_REFUSAL_TEXT: Record<BondRefusal, string> = {
  none: 'No bond move here',
  used: 'The bond move is used: once per scene',
  busy: 'The bond move is under way',
  dead: 'Cass and Eli must both be alive',
  far: `Too far: the circle must be within ${BOND.reach} tiles of Cass and Eli`,
  empty: 'No zombie inside the circle',
};

/** Eli's run goal: past the farthest marked zombie along the line from him through their centre, on a tile he can reach. */
function goalFor(s: MissionState, eli: Survivor, marked: readonly Enemy[]): Pt {
  const cx = marked.reduce((a, e) => a + e.x, 0) / marked.length;
  const cy = marked.reduce((a, e) => a + e.y, 0) / marked.length;
  let [dx, dy] = [cx - eli.x, cy - eli.y];
  const d = Math.hypot(dx, dy);
  [dx, dy] = d > 1e-6 ? [dx / d, dy / d] : eli.facing;
  const far = Math.max(...marked.map((e) => (e.x - eli.x) * dx + (e.y - eli.y) * dy));
  const n = s.grid.size;
  for (const lead of [BOND.lead, 2, 0]) {
    const want: Pt = [
      Math.min(n - 2, Math.max(1, Math.round(eli.x + dx * (far + lead)))),
      Math.min(n - 2, Math.max(1, Math.round(eli.y + dy * (far + lead)))),
    ];
    const tile = nearestFree(s.grid, want, new Set());
    if (tile && route(s.grid, eli, tile).length > 0) return tile;
  }
  return [Math.round(eli.x), Math.round(eli.y)];
}

/** Click: starts the set piece on the zombies the circle at `centre` marks. False (nothing changes) when refused. */
export function startBond(s: MissionState, centre: readonly [number, number]): boolean {
  const aim = bondAim(s, centre);
  if (aim.refusal !== null) return false;
  const { cass, eli } = pair(s) as { cass: Survivor; eli: Survivor };
  const marked = aim.targets.map((id) => s.enemies.find((e) => e.id === id)!);
  for (const u of [cass, eli]) {
    if (u.carrying) {
      const b = s.bodies.find((b) => b.id === u.carrying);
      if (b) {
        b.carriedBy = null;
        b.x = Math.round(u.x);
        b.y = Math.round(u.y);
      }
      u.carrying = null;
    }
    u.order = null;
    u.path = [];
    u.stance = 'walk';
  }
  const goal = goalFor(s, eli, marked);
  eli.path = route(s.grid, eli, goal);
  eli.running = true;
  for (const e of marked) e.path = [];
  s.bond!.used = true;
  s.bond!.run = { targets: aim.targets, goal, t: 0, victim: null, kill: 0 };
  return true;
}

function finish(s: MissionState, cass: Survivor | undefined, eli: Survivor | undefined): void {
  for (const u of [cass, eli]) {
    if (!u) continue;
    u.path = [];
    u.running = false;
    u.order = null;
  }
  if (cass && eli && cass.hp > 0 && eli.hp > 0) face(eli, cass.x, cass.y); // Eli looks back at Cass
  s.bond!.run = null;
}

/**
 * One tick of the set piece; the mission tick calls it instead of the world, so everything else stays frozen.
 * No noise is made. Past `BOND.maxTime` any zombie still standing dies anyway (the move always succeeds).
 */
export function stepBond(s: MissionState): void {
  const r = s.bond?.run;
  if (!r) return;
  r.t++;
  const { cass, eli } = pair(s);
  if (!cass || !eli || cass.hp <= 0 || eli.hp <= 0) return finish(s, cass, eli);
  const live = r.targets.map((id) => s.enemies.find((e) => e.id === id)).filter((e): e is Enemy => !!e && e.hp > 0);

  // Eli sprints to his goal.
  walkPath(s.grid, eli, BOND.eliSpeed);
  eli.running = eli.path.length > 0;

  // The marked zombies turn and chase him (the one Cass is killing stands still). They close to `GAP` tiles of
  // him, so Cass's last kill leaves Eli a few tiles further on (DESIGN §23).
  for (const z of live) {
    if (z.id === r.victim) continue;
    if (dist(z.x, z.y, eli.x, eli.y) <= GAP) {
      z.path = [];
      face(z, eli.x, eli.y);
      continue;
    }
    if (z.path.length === 0 || r.t % 3 === 1) z.path = route(s.grid, z, [eli.x, eli.y]);
    walkPath(s.grid, z, enemies.zombie.speed.chase);
  }

  // Cass follows and kills each one from behind.
  if (r.victim) {
    if (--r.kill <= 0) {
      const v = s.enemies.find((e) => e.id === r.victim);
      if (v) damage(s, v, v.hp, cass.kind); // silent: no noise
      r.victim = null;
    }
  } else if (r.t >= ticks(BOND.cassDelay) && live.length > 0) {
    const next = [...live].sort((a, b) => dist(cass.x, cass.y, a.x, a.y) - dist(cass.x, cass.y, b.x, b.y))[0]!;
    if (dist(cass.x, cass.y, next.x, next.y) <= ADJACENT) {
      cass.path = [];
      cass.running = false;
      face(cass, next.x, next.y);
      next.path = [];
      cass.act = { kind: 'takedown', tick: s.tick };
      r.victim = next.id;
      r.kill = ticks(BOND.kill);
    } else {
      if (cass.path.length === 0 || r.t % 3 === 0) cass.path = route(s.grid, cass, [next.x, next.y]);
      walkPath(s.grid, cass, BOND.cassSpeed);
      cass.running = true;
    }
  }

  const left = r.targets.some((id) => (s.enemies.find((e) => e.id === id)?.hp ?? 0) > 0);
  if (!left) return finish(s, cass, eli);
  if (r.t >= ticks(BOND.maxTime)) {
    for (const z of live) damage(s, z, z.hp, cass.kind);
    finish(s, cass, eli);
  }
}

/** True while the set piece plays: orders are refused and the world is frozen. */
export const bondPlaying = (s: MissionState): boolean => s.bond?.run != null;
