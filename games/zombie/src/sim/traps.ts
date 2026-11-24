// Traps for Base 1 (DESIGN §12): a spike pit and a noise can. Survivors build them (T, pick a type, click
// a tile) and re-arm spent pits. Only zombies trigger them. Pure TypeScript, same 10 Hz tick as base.ts;
// base.ts calls `stepTrapWork` and `stepTraps` from its own tick.
import base from '../data/base1.json';
import { REPATH, route } from './ai';
import { damage, face } from './combat';
import { FLOOR, getTile } from './grid';
import type { BaseState } from './base';
import type { Order, Survivor } from './mission';
import { emitNoise } from './noise';
import { TICK_HZ } from './time';
import { ADJACENT, dist } from './vision';

const secs = (s: number): number => Math.round(s * TICK_HZ);
const T = base.traps;

export type TrapKind = 'spike' | 'can';

/** A built trap. A spike pit is `armed` until a zombie steps on it; a can rings, then rests for `cooldown` ticks. */
export interface Trap {
  id: string;
  kind: TrapKind;
  x: number;
  y: number;
  armed: boolean;
  cooldown: number;
}

export type TrapResult = 'ok' | 'invalid' | 'blocked' | 'scrap';
type Work = Extract<Order, { type: 'work' }>;

export const TRAP_TICKS: Record<TrapKind, number> = { spike: secs(T.spike.time), can: secs(T.can.time) };
export const REARM_TICKS = secs(T.spike.rearmTime);
export const trapCost = (kind: TrapKind): number => T[kind].cost;

export const trapAt = (s: BaseState, x: number, y: number): Trap | undefined => s.traps.find((t) => t.x === x && t.y === y);

const alive = (s: BaseState, id: string): Survivor | undefined => s.survivors.find((u) => u.id === id && u.hp > 0);
const stop = (u: Survivor): void => {
  u.order = null;
  u.path = [];
};

/** Free floor: not a tree, wall, stove, barricade, fixed opening, broken window or door gap, or another trap. */
function buildable(s: BaseState, x: number, y: number): boolean {
  return getTile(s.grid, x, y) === FLOOR && !s.openings.some((o) => o.x === x && o.y === y) && !trapAt(s, x, y);
}

const send = (u: Survivor, job: 'trap' | 'rearm', target: string): void => {
  u.order = { type: 'work', job, target, left: -1 };
  u.running = false;
  u.path = [];
};

/** T, a type, then click a tile: the survivor walks up, works 2 s, and the scrap is paid when the trap stands. */
export function orderTrap(s: BaseState, id: string, kind: TrapKind, x: number, y: number): TrapResult {
  const u = alive(s, id);
  if (!u) return 'invalid';
  if (!buildable(s, x, y)) return 'blocked';
  if (s.scrap < T[kind].cost) return 'scrap';
  send(u, 'trap', `${kind}:${x},${y}`);
  return 'ok';
}

/** Click a spent spike pit: work 1 s, then 1 scrap arms it again. */
export function orderRearm(s: BaseState, id: string, trapId: string): TrapResult {
  const u = alive(s, id);
  const t = s.traps.find((t) => t.id === trapId);
  if (!u || !t || t.kind !== 'spike' || t.armed) return 'invalid';
  if (s.scrap < T.spike.rearmCost) return 'scrap';
  send(u, 'rearm', t.id);
  return 'ok';
}

function parse(target: string): { kind: TrapKind; x: number; y: number } | null {
  const m = /^(spike|can):(\d+),(\d+)$/.exec(target);
  return m ? { kind: m[1] as TrapKind, x: Number(m[2]), y: Number(m[3]) } : null;
}

/** One tick of a trap or re-arm work order: walk next to the spot, work, then pay and finish. */
export function stepTrapWork(s: BaseState, u: Survivor, w: Work): void {
  const spec = w.job === 'trap' ? parse(w.target) : null;
  const t = w.job === 'rearm' ? s.traps.find((t) => t.id === w.target) : undefined;
  const spot = spec ?? t;
  if (!spot || (w.job === 'trap' && !buildable(s, spot.x, spot.y)) || (t && t.armed)) return stop(u);
  if (dist(u.x, u.y, spot.x, spot.y) > ADJACENT) {
    u.running = false;
    if (u.path.length === 0 || s.tick % REPATH === 0) u.path = route(s.grid, u, [spot.x, spot.y]);
    if (u.path.length === 0) stop(u); // no way there
    return;
  }
  u.path = [];
  face(u, spot.x, spot.y);
  if (w.left < 0) w.left = spec ? TRAP_TICKS[spec.kind] : REARM_TICKS;
  if (--w.left > 0) return;
  if (spec) {
    if (s.scrap < T[spec.kind].cost) return stop(u);
    s.scrap -= T[spec.kind].cost;
    s.traps.push({ id: `t${s.traps.length + 1}`, kind: spec.kind, x: spec.x, y: spec.y, armed: true, cooldown: 0 });
  } else if (t) {
    if (s.scrap < T.spike.rearmCost) return stop(u);
    s.scrap -= T.spike.rearmCost;
    t.armed = true;
  }
  stop(u);
}

/** Zombies on a trap's tile set it off; survivors never do. Run once per tick after the mission tick. */
export function stepTraps(s: BaseState): void {
  for (const t of s.traps) {
    if (t.cooldown > 0) t.cooldown--;
    const z = s.enemies.find((e) => e.side === 'zombie' && e.hp > 0 && Math.round(e.x) === t.x && Math.round(e.y) === t.y);
    if (!z) continue;
    if (t.kind === 'spike') {
      if (!t.armed) continue;
      t.armed = false;
      damage(s, z, T.spike.damage);
    } else if (t.cooldown <= 0) {
      t.cooldown = secs(T.can.cooldown);
      emitNoise(s, t.x, t.y, T.can.radius, 'can', z.id); // the zombie that rang it does not answer its own noise
    }
  }
}
