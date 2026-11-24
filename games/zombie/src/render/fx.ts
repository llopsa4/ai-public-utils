import type { Barricade, Opening } from '../sim/base';
import type { MissionState } from '../sim/mission';

// Hit feedback (DESIGN §19): pure rules for what the player is told when something happens. `observe`
// compares the sim with what it saw last frame and returns events (a white flash on a hit figure, a small
// shake, a text pop, an "under attack" alert); the helpers below place off-screen alerts on the screen edge.
// No Phaser here: `scenes/feel.ts` draws these and `scenes/Feel.ts` is the overlay.

export const FLASH_MS = 130; // the white flash on a figure that lost hit points
export const SHAKE = { shot: { ms: 70, strength: 0.002 }, hit: { ms: 130, strength: 0.004 } } as const;
export const POP_MS = 1100; // a text pop rises and fades over this long
export const POP_RISE = 30; // world px
export const ALERT_MS = 6000; // an attacked survivor or opening keeps its arrow this long after the last hit
export const HERD_FLASH_MS = 650;
export const HERD_FLASH_PEAK = 0.45;
export const MAX_ARROWS = 4;

/** What a scene does in answer to a change in the sim. Positions are tile coordinates. */
export type FxEvent =
  | { kind: 'flash'; id: string }
  | { kind: 'shake'; strength: 'shot' | 'hit'; x: number; y: number }
  | { kind: 'pop'; text: string; x: number; y: number }
  | { kind: 'alert'; key: string; label: string; x: number; y: number };

/** The part of a mission, intro or Base state `observe` reads (Base adds barricades and openings). */
export type Watched = MissionState & { barricades?: Barricade[]; openings?: Opening[] };

interface Block {
  hp: number;
  label: string;
  x: number;
  y: number;
}

/** What `observe` saw last time. A unit, crate or blocker met for the first time only seeds it: no event. */
export interface FxWatch {
  hp: Map<string, number>;
  acts: Map<string, number>; // unit id → tick of its latest action cue
  opened: Set<string>; // crates seen opened
  crates: Set<string>; // crates seen at all
  ammo: number | null;
  takedowns: Set<string>; // enemies a survivor was taking down at the last look
  blocks: Map<string, Block>; // fixed openings and barricades, by key
}

export const newWatch = (): FxWatch => ({ hp: new Map(), acts: new Map(), opened: new Set(), crates: new Set(), ammo: null, takedowns: new Set(), blocks: new Map() });

const title = (s: string): string => s[0]!.toUpperCase() + s.slice(1);

/** The loot of a crate as one pop: "+3 ammo  +2 food". Empty when the crate held nothing. */
export function lootText(c: { food: number; scrap: number; ammo: number }): string {
  return [c.ammo > 0 ? `+${c.ammo} ammo` : '', c.food > 0 ? `+${c.food} food` : '', c.scrap > 0 ? `+${c.scrap} scrap` : ''].filter(Boolean).join('  ');
}

/** Pop colour: gains green, trouble red, the rest cream. */
export function popColor(text: string): string {
  return text.startsWith('+') ? '#9bc79b' : text.startsWith('Out of') ? '#e0806a' : '#f4efe0';
}

/**
 * Compares the state with the last look (and updates the look). Hit points that dropped flash the figure; a
 * hit survivor shakes the view and raises an alert, as does a fixed opening or barricade that lost hit points
 * or was chewed through; a new shot cue shakes; an opened crate, a takedown kill and the last bullet pop text.
 */
export function observe(w: FxWatch, s: Watched): FxEvent[] {
  const out: FxEvent[] = [];
  const units = [...s.survivors, ...s.enemies];

  for (const u of units) {
    const was = w.hp.get(u.id);
    if (was !== undefined && u.hp < was) {
      out.push({ kind: 'flash', id: u.id });
      if (u.side === 'survivor') {
        out.push({ kind: 'shake', strength: 'hit', x: u.x, y: u.y });
        out.push({ kind: 'alert', key: `u:${u.id}`, label: title(u.kind), x: u.x, y: u.y });
      } else if (u.hp <= 0 && w.takedowns.has(u.id)) out.push({ kind: 'pop', text: 'Silent kill', x: u.x, y: u.y });
    }
    w.hp.set(u.id, u.hp);
    if (u.act) {
      if (u.act.kind === 'shot' && w.acts.has(u.id) && w.acts.get(u.id) !== u.act.tick) out.push({ kind: 'shake', strength: 'shot', x: u.x, y: u.y });
      w.acts.set(u.id, u.act.tick);
    } else if (!w.acts.has(u.id)) w.acts.set(u.id, -1);
  }
  w.takedowns = new Set(s.survivors.flatMap((u) => (u.hp > 0 && u.order?.type === 'takedown' ? [u.order.target] : [])));

  for (const c of s.crates) {
    if (c.opened && w.crates.has(c.id) && !w.opened.has(c.id)) {
      const text = lootText(c);
      if (text) out.push({ kind: 'pop', text, x: c.x, y: c.y });
    }
    w.crates.add(c.id);
    if (c.opened) w.opened.add(c.id);
  }

  if (w.ammo !== null && w.ammo > 0 && s.ammo <= 0) {
    const shooter = s.survivors.filter((u) => u.act?.kind === 'shot').sort((a, b) => b.act!.tick - a.act!.tick)[0] ?? s.survivors[0];
    if (shooter) out.push({ kind: 'pop', text: 'Out of ammo', x: shooter.x, y: shooter.y });
  }
  w.ammo = s.ammo;

  const now = new Map<string, Block>();
  for (const o of s.openings ?? []) if (o.fixed) now.set(`o:${o.id}`, { hp: o.hp, label: title(o.kind), x: o.x, y: o.y });
  for (const b of s.barricades ?? []) now.set(`b:${b.x},${b.y}`, { hp: b.hp, label: 'Barricade', x: b.x, y: b.y });
  for (const [key, was] of w.blocks) {
    const cur = now.get(key);
    if (!cur || cur.hp < was.hp) out.push({ kind: 'alert', key, label: was.label, x: was.x, y: was.y }); // chewed, or chewed through
  }
  w.blocks = now;
  return out;
}

// ---- Alerts: arrows on the screen edge for what is attacked out of sight ----

export interface Alert {
  key: string;
  label: string;
  x: number; // tile
  y: number;
  at: number; // ms on the scene clock, refreshed by every hit
}

/** The alert list with this alert added, or its time refreshed when the key is already there. */
export function touchAlert(list: readonly Alert[], a: Alert): Alert[] {
  return [...list.filter((x) => x.key !== a.key), a];
}

/** Alerts not yet expired, newest first. */
export function liveAlerts(list: readonly Alert[], now: number): Alert[] {
  return list.filter((a) => now - a.at < ALERT_MS).sort((a, b) => b.at - a.at);
}

/** Opacity of an alert: full for most of its life, then a fade. */
export function alertAlpha(age: number): number {
  const k = age / ALERT_MS;
  return k < 0.7 ? 1 : Math.max(0, 1 - (k - 0.7) / 0.3);
}

/** The alert the jump key goes to: the newest on the first press, the next older on each press after. */
export function pickJump(list: readonly Alert[], now: number, index: number): Alert | null {
  const live = liveAlerts(list, now);
  return live.length ? live[index % live.length]! : null;
}

/** Where a world point is on the screen (the camera looks at `centre` at `zoom`). */
export function worldToScreen(wx: number, wy: number, centre: readonly [number, number], zoom: number, w: number, h: number): [number, number] {
  return [(wx - centre[0]) * zoom + w / 2, (wy - centre[1]) * zoom + h / 2];
}

/** Space the HUD takes at each screen edge: arrows stay inside what is left. */
export interface Insets {
  l: number;
  t: number;
  r: number;
  b: number;
}

/**
 * Where an off-screen alert's arrow sits: on the border of the free screen area, on the line from the area's
 * centre to the point, pointing at it (`angle` in radians). Null when the point is inside the free area.
 */
export function edgeArrow(sx: number, sy: number, w: number, h: number, ins: Insets): { x: number; y: number; angle: number } | null {
  const [x0, y0, x1, y1] = [ins.l, ins.t, w - ins.r, h - ins.b];
  if (sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1) return null;
  const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
  const [dx, dy] = [sx - cx, sy - cy];
  const k = Math.min(dx !== 0 ? (x1 - x0) / 2 / Math.abs(dx) : Infinity, dy !== 0 ? (y1 - y0) / 2 / Math.abs(dy) : Infinity);
  return { x: cx + dx * k, y: cy + dy * k, angle: Math.atan2(dy, dx) };
}

/** Opacity of a full-screen flash `age` ms after it began (linear fade from `peak`). */
export function flashAlpha(age: number, ms: number, peak: number): number {
  return age < 0 || age >= ms ? 0 : peak * (1 - age / ms);
}
