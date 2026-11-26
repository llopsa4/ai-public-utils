// Survivor abilities (PLAN slice spec): takedown, carry, lure throw and crates. Pure rules on the mission
// state; the scene only sends the orders. Value imports from `mission` are avoided (it imports this file).
import chars from '../data/characters.json';
import { REPATH, enemySees, route } from './ai';
import { TICK_HZ } from './time';
import { bondAvailable } from './bond';
import { activeWeapon, damage, discharge, face, hasAmmo, weapon } from './combat';
import { highlightAvailable } from './highlight';
import { emitNoise } from './noise';
import { ADJACENT, dist, lineOfSight } from './vision';
import type { Body, MissionState, Order, Survivor } from './mission';

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
  if (o.left < 0) {
    o.left = Math.round(chars.fighter.takedown.time * TICK_HZ);
    u.act = { kind: 'takedown', tick: s.tick }; // the 1 s kill animation starts now
  }
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
  u.act = { kind: 'throw', tick: s.tick };
  face(u, at[0], at[1]);
  return true;
}

// ---- Crates (left-click a crate): walk up, then open it; the loot is added to the mission loot. ----

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
    s.loot.ammo += c.ammo;
    s.ammo += c.ammo; // usable at once by every survivor
    end(u);
  }
}

// ---- Finish (N, click a body; DESIGN §26): a squatter's body that would rise stays a body. Ray and June spend one
// arrow from range; everyone else, and an archer out of arrows, holds 2 s next to it, crouched. ----

/** The scene has squatters, so its action bars offer Finish. */
export const finishAvailable = (s: MissionState): boolean => s.enemies.some((e) => e.side === 'human');

/** The only valid target: a body that is still going to rise. */
export const finishTarget = (s: MissionState, id: string): Body | undefined => s.bodies.find((b) => b.id === id && b.riseAt !== undefined);

export const finishesByArrow = (u: Survivor): boolean => u.weapons.includes('bow') && (u.arrows ?? 0) > 0;

/** Who of the selected survivors does it: the nearest with an arrow to spend, else the nearest. */
export function finisherFor(s: MissionState, who: readonly Survivor[], body: string): Survivor | undefined {
  const b = finishTarget(s, body);
  if (!b) return undefined;
  const far = (u: Survivor): number => dist(u.x, u.y, b.x, b.y);
  return who.filter((u) => u.hp > 0).sort((p, q) => Number(finishesByArrow(q)) - Number(finishesByArrow(p)) || far(p) - far(q))[0];
}

export function orderFinish(s: MissionState, id: string, body: string): boolean {
  const u = living(s, id);
  if (!u || !finishTarget(s, body)) return false;
  u.order = { type: 'finish', target: body, left: -1 };
  u.running = false;
  u.path = [];
  return true;
}

export function stepFinish(s: MissionState, u: Survivor, o: Extract<Order, { type: 'finish' }>): void {
  const b = finishTarget(s, o.target);
  if (!b) return end(u); // already finished, or it rose first
  if (finishesByArrow(u)) {
    o.left = -1;
    const bow = weapon('bow');
    if (dist(u.x, u.y, b.x, b.y) > bow.range || !lineOfSight(s.grid, u.x, u.y, b.x, b.y)) return approach(s, u, b.x, b.y);
    u.path = [];
    face(u, b.x, b.y);
    if (u.cooldown > 0) return;
    discharge(s, u, bow, b.x, b.y);
  } else {
    if (dist(u.x, u.y, b.x, b.y) > ADJACENT) {
      o.left = -1; // the body moved off (carried): the 2 s start again
      return approach(s, u, b.x, b.y);
    }
    u.path = [];
    face(u, b.x, b.y);
    if (o.left < 0) o.left = Math.round(chars.finishTime * TICK_HZ);
    if (--o.left > 0) return;
  }
  delete b.riseAt;
  end(u);
}

// ---- Weapons (action bar buttons, keys 1 to 3): choose the weapon a left-click attack uses. ----

export const WEAPON_LABEL: Record<string, string> = { knife: 'Knife', pistol: 'Gun', club: 'Club', hatchet: 'Hatchet', warclub: 'War club', shovel: 'Shovel', bow: 'Bow' };

/** Chooses one of the survivor's own weapons. A weapon that needs ammo cannot be chosen with none left. */
export function selectWeapon(s: MissionState, id: string, weaponId: string): boolean {
  const u = living(s, id);
  if (!u || !u.weapons.includes(weaponId) || !hasAmmo(s, weapon(weaponId), u)) return false;
  u.weapon = weaponId;
  return true;
}

/** Cass takes back her pistol (DESIGN §5, Base 1 arrival): she gains the Gun action and the shared ammo. Safe to repeat. */
export function unlockGun(s: MissionState, id: string): boolean {
  const u = living(s, id);
  if (!u || u.weapons.includes('pistol')) return false;
  u.weapons.push('pistol');
  return true;
}

// ---- Free fire (DESIGN §13): lets Hold use the gun. Only a survivor who has a ranged weapon can have it. ----

/** True when the survivor owns a ranged weapon (Cass only after her gun unlocks). */
export function canFreeFire(u: Survivor): boolean {
  return u.weapons.some((id) => weapon(id).range > chars.adjacent);
}

/** Sets Free fire for one survivor; refused (false) when they have no gun. */
export function setFreeFire(s: MissionState, id: string, on: boolean): boolean {
  const u = living(s, id);
  if (!u || !canFreeFire(u)) return false;
  u.freeFire = on;
  return true;
}

// ---- Action bar (DESIGN §17): the buttons for one survivor. Pure data; the scene draws and clicks them. ----

export interface BarButton {
  id: string; // `weapon:<id>`, `takedown`, `carry`, `lure`, `finish`, `hold`, `crouch`, `bond`, `highlight`
  label: string;
  key: string;
  enabled: boolean; // greyed when false
  active: boolean; // the chosen weapon, a held position, a crouched stance
}

export function barButtons(s: MissionState, u: Survivor): BarButton[] {
  const out: BarButton[] = [];
  const using = activeWeapon(s, u);
  u.weapons.forEach((id, i) => {
    const w = weapon(id);
    const label = WEAPON_LABEL[id] ?? id;
    const count = w.arrows ? ` ${u.arrows ?? 0}` : w.ammo ? ` ${s.ammo}` : '';
    out.push({ id: `weapon:${id}`, label: label + count, key: String(i + 1), enabled: hasAmmo(s, w, u), active: using === id });
  });
  if (canTakedown(u)) out.push({ id: 'takedown', label: 'Takedown', key: 'F', enabled: true, active: u.order?.type === 'takedown' });
  if (canCarry(u)) out.push({ id: 'carry', label: 'Carry', key: 'G', enabled: true, active: u.carrying !== null });
  if (canLure(u)) out.push({ id: 'lure', label: 'Lure', key: 'L', enabled: u.lureCd <= 0, active: false });
  if (finishAvailable(s)) out.push({ id: 'finish', label: 'Finish', key: 'N', enabled: true, active: u.order?.type === 'finish' });
  out.push({ id: 'hold', label: 'Hold', key: 'V', enabled: true, active: u.order?.type === 'hold' });
  if (canFreeFire(u)) out.push({ id: 'freefire', label: 'Free fire', key: 'Z', enabled: true, active: u.freeFire === true });
  out.push({ id: 'crouch', label: 'Crouch', key: 'C', enabled: true, active: u.stance !== 'walk' });
  // The bond move (DESIGN §23) on Cass's and Eli's bars where the scene has it; greyed once used, until the next scene.
  if (s.bond && (u.kind === 'fighter' || u.kind === 'scout')) {
    const both = s.survivors.filter((v) => v.hp > 0 && (v.kind === 'fighter' || v.kind === 'scout')).length >= 2;
    out.push({ id: 'bond', label: s.bond.used ? 'Bond (used)' : 'Bond', key: 'J', enabled: bondAvailable(s) && both, active: s.bond.run !== null });
  }
  // Theo's enemy highlight (DESIGN §5), on every bar while he is in the scene; the scene marks it active.
  if (highlightAvailable(s)) out.push({ id: 'highlight', label: 'Highlight', key: 'M', enabled: true, active: false });
  return out;
}
