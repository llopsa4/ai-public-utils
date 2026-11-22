// Combat (DESIGN §7, §8): weapons, damage, death into a body and a blood decal.
import chars from '../data/characters.json';
import { TICK_HZ } from './time';
import { emitNoise } from './noise';
import { dist, lineOfSight } from './vision';
import type { MissionState, Unit } from './mission';

export interface Weapon {
  range: number; // tiles
  damage: number;
  noise: number; // ring radius in tiles, 0 = silent
  cooldown: number; // seconds between uses
}

export function weapon(id: string): Weapon {
  const w = (chars.weapons as Record<string, Weapon>)[id];
  if (!w) throw new Error(`unknown weapon ${id}`);
  return w;
}

/** In range with a clear line of sight. */
export function inReach(s: MissionState, a: Unit, t: Unit, w: Weapon): boolean {
  return dist(a.x, a.y, t.x, t.y) <= w.range + 1e-9 && lineOfSight(s.grid, a.x, a.y, t.x, t.y);
}

/** Damage that may kill: a dead unit stops, and leaves a body and a blood decal for the scene. */
export function damage(s: MissionState, u: Unit, amount: number): void {
  if (u.hp <= 0) return;
  u.hp = Math.max(0, u.hp - amount);
  if (u.hp > 0) return;
  u.path = [];
  const x = Math.round(u.x);
  const y = Math.round(u.y);
  s.bodies.push({ id: u.id, side: u.side, kind: u.kind, x, y, found: false, carriedBy: null });
  s.decals.push({ x, y });
}

/** Uses a weapon if it is ready and the target is in reach. Does not turn the attacker. */
export function fire(s: MissionState, a: Unit, w: Weapon, t: Unit): boolean {
  if (a.hp <= 0 || t.hp <= 0 || a.cooldown > 0 || !inReach(s, a, t, w)) return false;
  damage(s, t, w.damage);
  emitNoise(s, a.x, a.y, w.noise, 'shot', a.id);
  a.cooldown = Math.round(w.cooldown * TICK_HZ);
  return true;
}

export function face(a: Unit, tx: number, ty: number): void {
  const dx = tx - a.x;
  const dy = ty - a.y;
  const d = Math.hypot(dx, dy);
  if (d > 1e-9) a.facing = [dx / d, dy / d];
}
