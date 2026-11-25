// Combat (DESIGN §7, §8): weapons, damage, death into a body and a blood decal.
import chars from '../data/characters.json';
import { TICK_HZ } from './time';
import { emitNoise } from './noise';
import { dist, lineOfSight } from './vision';
import type { ActKind, MissionState, Survivor, Unit } from './mission';

export interface Weapon {
  id: string;
  range: number; // tiles
  damage: number;
  noise: number; // ring radius in tiles, 0 = silent
  cooldown: number; // seconds between uses
  ammo?: boolean; // each use spends 1 of the shared ammo (DESIGN §5)
  arrows?: boolean; // each use spends 1 of the shooter's own arrows, which then lies on the target's tile (DESIGN §5 *Bow*)
  act?: ActKind; // the animation cue a use sets on the attacker
}

/** The cue each weapon id plays (art spec: knife stab, pistol shot, club swing, hatchet swing, bow shot; the war club plays the club swing). */
const WEAPON_ACT: Record<string, ActKind> = { knife: 'stab', pistol: 'shot', club: 'club', hatchet: 'hatchet', warclub: 'club', bow: 'bow_shot' };

export function weapon(id: string): Weapon {
  const w = (chars.weapons as Record<string, Omit<Weapon, 'id'>>)[id];
  if (!w) throw new Error(`unknown weapon ${id}`);
  return { ...w, id, act: WEAPON_ACT[id] };
}

/** Whether `u` can use the weapon now: a gun needs shared ammo left, a bow needs one of `u`'s own arrows. */
export function hasAmmo(s: MissionState, w: Weapon, u?: Unit): boolean {
  if (w.arrows) return (u?.side === 'survivor' ? (u.arrows ?? 0) : 0) > 0;
  return !w.ammo || s.ammo > 0;
}

/** The weapon a survivor attacks with: the chosen one, or the first still usable once its ammo or arrows are out. */
export function activeWeapon(s: MissionState, u: Survivor): string {
  if (hasAmmo(s, weapon(u.weapon), u)) return u.weapon;
  return u.weapons.find((id) => hasAmmo(s, weapon(id), u)) ?? u.weapon;
}

/** Seconds between uses for this attacker: June's Quick draw shortens her bow (DESIGN §5). */
export function cooldownOf(a: Unit, w: Weapon): number {
  if (w.id === 'bow' && a.side === 'survivor' && a.kind === 'archer') return chars.archer.quickDraw.bowCooldown;
  return w.cooldown;
}

/** Arrows lying on the survivor's tile go back to the quiver of whoever shot them (DESIGN §5 *Bow*). */
export function pickUpArrows(s: MissionState, u: Survivor): void {
  const x = Math.round(u.x);
  const y = Math.round(u.y);
  if (!s.looseArrows.some((a) => a.x === x && a.y === y)) return;
  s.looseArrows = s.looseArrows.filter((a) => {
    if (a.x !== x || a.y !== y) return true;
    const owner = s.survivors.find((v) => v.id === a.owner);
    if (owner) owner.arrows = Math.min(chars.quiver, (owner.arrows ?? 0) + 1);
    return false;
  });
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
  if (a.hp <= 0 || t.hp <= 0 || a.cooldown > 0 || !hasAmmo(s, w, a) || !inReach(s, a, t, w)) return false;
  if (w.ammo) s.ammo--;
  if (w.arrows && a.side === 'survivor') {
    a.arrows = (a.arrows ?? 0) - 1;
    s.looseArrows.push({ x: Math.round(t.x), y: Math.round(t.y), owner: a.id, tick: s.tick }); // it lies where it hit
  }
  damage(s, t, w.damage, a.kind);
  emitNoise(s, a.x, a.y, w.noise, 'shot', a.id);
  a.cooldown = Math.round(cooldownOf(a, w) * TICK_HZ);
  if (w.act) a.act = w.arrows ? { kind: w.act, tick: s.tick, at: [t.x, t.y] } : { kind: w.act, tick: s.tick };
  return true;
}

export function face(a: Unit, tx: number, ty: number): void {
  const dx = tx - a.x;
  const dy = ty - a.y;
  const d = Math.hypot(dx, dy);
  if (d > 1e-9) a.facing = [dx / d, dy / d];
}
