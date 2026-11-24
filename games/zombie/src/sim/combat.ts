// Combat (DESIGN §7, §8): weapons, damage, death into a body and a blood decal.
import chars from '../data/characters.json';
import { TICK_HZ } from './time';
import { emitNoise } from './noise';
import { dist, lineOfSight } from './vision';
import type { ActKind, MissionState, Survivor, Unit } from './mission';

export interface Weapon {
  range: number; // tiles
  damage: number;
  noise: number; // ring radius in tiles, 0 = silent
  cooldown: number; // seconds between uses
  ammo?: boolean; // each use spends 1 of the shared ammo (DESIGN §5)
  act?: ActKind; // the animation cue a use sets on the attacker
}

/** The cue each weapon id plays (art spec: knife stab, pistol shot, club swing). */
const WEAPON_ACT: Record<string, ActKind> = { knife: 'stab', pistol: 'shot', club: 'club' };

export function weapon(id: string): Weapon {
  const w = (chars.weapons as Record<string, Weapon>)[id];
  if (!w) throw new Error(`unknown weapon ${id}`);
  return { ...w, act: WEAPON_ACT[id] };
}

/** Whether the weapon can be used now: weapons that spend ammo need some left. */
export const hasAmmo = (s: MissionState, w: Weapon): boolean => !w.ammo || s.ammo > 0;

/** The weapon a survivor attacks with: the chosen one, or the first that needs no ammo once the ammo is out. */
export function activeWeapon(s: MissionState, u: Survivor): string {
  if (hasAmmo(s, weapon(u.weapon))) return u.weapon;
  return u.weapons.find((id) => hasAmmo(s, weapon(id))) ?? u.weapon;
}

/** In range with a clear line of sight. */
export function inReach(s: MissionState, a: Unit, t: Unit, w: Weapon): boolean {
  return dist(a.x, a.y, t.x, t.y) <= w.range + 1e-9 && lineOfSight(s.grid, a.x, a.y, t.x, t.y);
}

/** Damage that may kill: a dead unit stops, and leaves a body and a blood decal for the scene. */
export function damage(s: MissionState, u: Unit, amount: number, by?: string): void {
  if (u.hp <= 0) return;
  u.hp = Math.max(0, u.hp - amount);
  if (u.hp > 0) return;
  u.killedBy = by;
  u.path = [];
  const x = Math.round(u.x);
  const y = Math.round(u.y);
  s.bodies.push({ id: u.id, side: u.side, kind: u.kind, x, y, found: false, carriedBy: null });
  s.decals.push({ x, y });
}

/** Uses a weapon if it is ready and the target is in reach. Does not turn the attacker. */
export function fire(s: MissionState, a: Unit, w: Weapon, t: Unit): boolean {
  if (a.hp <= 0 || t.hp <= 0 || a.cooldown > 0 || !hasAmmo(s, w) || !inReach(s, a, t, w)) return false;
  if (w.ammo) s.ammo--;
  damage(s, t, w.damage, a.kind);
  emitNoise(s, a.x, a.y, w.noise, 'shot', a.id);
  a.cooldown = Math.round(w.cooldown * TICK_HZ);
  if (w.act) a.act = { kind: w.act, tick: s.tick };
  return true;
}

export function face(a: Unit, tx: number, ty: number): void {
  const dx = tx - a.x;
  const dy = ty - a.y;
  const d = Math.hypot(dx, dy);
  if (d > 1e-9) a.facing = [dx / d, dy / d];
}
