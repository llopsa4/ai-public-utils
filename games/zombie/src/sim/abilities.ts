// Survivor abilities (PLAN slice spec): takedown, carry, lure throw and crates. Pure rules on the mission
// state; the scene only sends the orders. Value imports from `mission` are avoided (it imports this file).
import chars from '../data/characters.json';
import { REPATH, enemySees, route } from './ai';
import { TICK_HZ } from './time';
import { damage, face } from './combat';
import { emitNoise } from './noise';
import { ADJACENT, dist } from './vision';
import type { MissionState, Order, Survivor } from './mission';

function living(s: MissionState, id: string): Survivor | undefined {
  return s.survivors.find((u) => u.id === id && u.hp > 0);
}

function end(u: Survivor): void {
  u.order = null;
  u.path = [];
}

/** Walk toward a point, recomputing the route now and then (targets move). */
function approach(s: MissionState, u: Survivor, tx: number, ty: number): void {
  u.running = false;
  if (u.path.length === 0 || s.tick % REPATH === 0) u.path = route(s.grid, u, [tx, ty]);
}

export const canTakedown = (u: Survivor): boolean => 'takedown' in chars[u.kind];
export const canCarry = (u: Survivor): boolean => 'carrySpeed' in chars[u.kind];
export const canLure = (u: Survivor): boolean => 'lure' in chars[u.kind];

// ---- Takedown (F, click an enemy): walk up, then 1 s of silent kill if the enemy does not see him. ----

export function orderTakedown(s: MissionState, id: string, target: string): boolean {
  const u = living(s, id);
  if (!u || !canTakedown(u) || !s.enemies.some((e) => e.id === target && e.hp > 0)) return false;
  u.order = { type: 'takedown', target, left: -1 };
  u.running = false;
  u.path = [];
  return true;
}

export function stepTakedown(s: MissionState, u: Survivor, o: Extract<Order, { type: 'takedown' }>): void {
  const t = s.enemies.find((e) => e.id === o.target);
  if (!t || t.hp <= 0) return end(u);
  if (dist(u.x, u.y, t.x, t.y) > ADJACENT) {
    o.left = -1; // the target moved off: the 1 s starts again
    return approach(s, u, t.x, t.y);
  }
  u.path = [];
  face(u, t.x, t.y);
  if (enemySees(s, t, u)) return end(u); // seen at any moment: the takedown fails
  if (o.left < 0) o.left = Math.round(chars.fighter.takedown.time * TICK_HZ);
  if (--o.left <= 0) {
    damage(s, t, t.hp); // silent: no noise
    end(u);
  }
}

// ---- Carry (G): pick up the nearest adjacent body, or drop the one carried. ----

export function toggleCarry(s: MissionState, id: string): boolean {
  const u = living(s, id);
  if (!u || !canCarry(u)) return false;
  if (u.carrying) {
    const b = s.bodies.find((b) => b.id === u.carrying);
    if (b) {
      b.carriedBy = null;
      b.x = Math.round(u.x);
      b.y = Math.round(u.y);
    }
    u.carrying = null;
    return true;
  }
  let best: MissionState['bodies'][number] | null = null;
  let bd = Infinity;
  for (const b of s.bodies) {
    const d = dist(u.x, u.y, b.x, b.y);
    if (b.carriedBy === null && b.side !== 'survivor' && d <= ADJACENT && d < bd) {
      bd = d;
      best = b;
    }
  }
  if (!best) return false;
  best.carriedBy = u.id;
  u.carrying = best.id;
  return true;
}

/** A carried body moves with its carrier. */
export function carryFollow(s: MissionState, u: Survivor): void {
  if (!u.carrying) return;
  const b = s.bodies.find((b) => b.id === u.carrying);
  if (b) {
    b.x = u.x;
    b.y = u.y;
  }
}

// ---- Lure (L, click): a noise ring at the target; zombies in range walk to it. ----

export function useLure(s: MissionState, id: string, at: readonly [number, number]): boolean {
  const u = living(s, id);
  if (!u) return false;
  const c = chars[u.kind];
  if (!('lure' in c) || u.lureCd > 0 || dist(u.x, u.y, at[0], at[1]) > c.lure.range) return false;
  emitNoise(s, at[0], at[1], c.lure.radius, 'lure', u.id);
  u.lureCd = Math.round(c.lure.cooldown * TICK_HZ);
  face(u, at[0], at[1]);
  return true;
}

// ---- Crates (right-click a crate): walk up, then open it; the loot is added to the mission loot. ----

export function orderOpen(s: MissionState, id: string, crate: string): boolean {
  const u = living(s, id);
  if (!u || !s.crates.some((c) => c.id === crate && !c.opened)) return false;
  u.order = { type: 'open', crate, left: -1 };
  u.running = false;
  u.path = [];
  return true;
}

export function stepOpen(s: MissionState, u: Survivor, o: Extract<Order, { type: 'open' }>): void {
  const c = s.crates.find((c) => c.id === o.crate);
  if (!c || c.opened) return end(u);
  if (dist(u.x, u.y, c.x, c.y) > ADJACENT) return approach(s, u, c.x, c.y);
  u.path = [];
  face(u, c.x, c.y);
  if (o.left < 0) o.left = Math.round(s.crateTime * TICK_HZ);
  if (--o.left <= 0) {
    c.opened = true;
    s.loot.food += c.food;
    s.loot.scrap += c.scrap;
    end(u);
  }
}
