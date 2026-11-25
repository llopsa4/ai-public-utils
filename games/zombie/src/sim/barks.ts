import story from '../data/story.json';
import type { Opening } from './base';
import { SURVIVOR_NAME, type MissionState, type Survivor } from './mission';
import { TICK_HZ } from './time';
import type { Trap } from './traps';

// Barks (DESIGN §22): one-liners a survivor says out loud, never pausing the game. Pure rules like
// `render/fx.ts`: `barkEvents` compares the state with the last look and returns the bark to show (or null).
// At most one bark every 20 s, each line at most once per scene (a scene makes its own watch). The lines
// live in `data/story.json` (`barks`); `scenes/feelFx.ts` draws the bark above the speaker.

export type Trigger = 'lowHp' | 'firstKill' | 'zombieClose' | 'outOfAmmo' | 'openingFixed' | 'trapKill' | 'herdBreach' | 'idle';

export const BARK_GAP = 20 * TICK_HZ; // ticks between two barks
export const LOW_HP = 0.35; // hit points below this share of the maximum are "low"
export const CLOSE = 4; // tiles: a zombie this near a survivor is "close"
export const FAR = 7; // tiles: every zombie must be further than this before "close" can fire again
export const BREACH = 1.2; // tiles: a herd zombie this near a broken opening has breached the house
export const IDLE_TICKS = 20 * TICK_HZ; // standing at the fire or stove this long
export const AT_HEARTH = 2.5; // tiles from the fire or stove that count as "at" it

/** What a bark is: who says it (a survivor id), the trigger, the text and the speaker's tile. */
export interface Bark {
  id: string;
  trigger: Trigger;
  text: string;
  x: number;
  y: number;
}

type Lines = Record<string, Partial<Record<Trigger, readonly string[]>>>;
const VOICE: Record<Survivor['kind'], string> = SURVIVOR_NAME;

/** The state `barkEvents` reads: a mission, intro or Base state (Base adds openings and traps). */
export type BarkState = MissionState & { openings?: Opening[]; traps?: Trap[] };

/** What `barkEvents` saw last time. The first look only seeds it, so nothing is said about what already was. */
export interface BarkWatch {
  seeded: boolean;
  last: number; // tick of the latest bark
  used: Set<string>; // `${voice}.${trigger}.${index}` of lines already said
  low: Set<string>; // survivors under the low-HP line
  zombies: Set<string>; // living enemies at the last look
  killed: boolean; // a first kill has been seen
  ammo: number | null;
  fixed: Set<string>; // openings seen fixed
  armed: Set<string>; // spike pits seen armed
  close: boolean; // a zombie is already close: no new "close" bark until they all fall back
  breached: boolean;
  idle: Map<string, number>; // survivor id → tick it began standing idle at the hearth
}

export const newBarkWatch = (): BarkWatch => ({
  seeded: false,
  last: -Infinity,
  used: new Set(),
  low: new Set(),
  zombies: new Set(),
  killed: false,
  ammo: null,
  fixed: new Set(),
  armed: new Set(),
  close: false,
  breached: false,
  idle: new Map(),
});

const alive = (s: MissionState): Survivor[] => s.survivors.filter((u) => u.hp > 0);
const near = (list: readonly Survivor[], x: number, y: number): Survivor | undefined =>
  [...list].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
/** The survivor who acted last (a kill or the last bullet), else the nearest to the spot. */
function actor(s: MissionState, x: number, y: number): Survivor | undefined {
  const acting = alive(s).filter((u) => u.act && u.act.kind !== 'bite');
  return [...acting].sort((a, b) => b.act!.tick - a.act!.tick)[0] ?? near(alive(s), x, y);
}

/** The next unsaid line of this voice for the trigger, or null. Marks it used. */
function take(w: BarkWatch, lines: Lines, u: Survivor, trigger: Trigger): string | null {
  const voice = VOICE[u.kind];
  const list = lines[voice]?.[trigger] ?? [];
  const i = list.findIndex((_, k) => !w.used.has(`${voice}.${trigger}.${k}`));
  if (i < 0) return null;
  w.used.add(`${voice}.${trigger}.${i}`);
  return list[i]!;
}

/**
 * The bark to show now, or null. `hearth` is the fire or stove tile (idle barks); `lines` defaults to the story's.
 * A moment that comes while the 20 s limit is running is lost; the watch is updated either way.
 */
export function barkEvents(w: BarkWatch, s: BarkState, hearth: { x: number; y: number } | null = null, lines: Lines = story.barks as Lines): Bark | null {
  const first = !w.seeded;
  w.seeded = true;
  const cands: { trigger: Trigger; who: Survivor | undefined }[] = [];
  const live = alive(s);
  const zombies = s.enemies.filter((e) => e.side === 'zombie' && e.hp > 0);

  // Herd breach: the first herd zombie at a broken opening.
  if (!w.breached) {
    const gaps = (s.openings ?? []).filter((o) => !o.fixed);
    const z = zombies.find((e) => e.id.startsWith('h') && gaps.some((o) => Math.hypot(e.x - o.x, e.y - o.y) <= BREACH));
    if (z) {
      w.breached = true;
      cands.push({ trigger: 'herdBreach', who: near(live, z.x, z.y) });
    }
  }

  // Low hit points: a survivor falls under the line (and may say it again after recovering).
  for (const u of s.survivors) {
    const low = u.hp > 0 && u.hp / u.maxHp < LOW_HP;
    if (low && !w.low.has(u.id)) cands.push({ trigger: 'lowHp', who: u });
    if (low) w.low.add(u.id);
    else w.low.delete(u.id);
  }

  // Out of ammo: the shared count reaches zero.
  if (w.ammo !== null && w.ammo > 0 && s.ammo <= 0) cands.push({ trigger: 'outOfAmmo', who: actor(s, 0, 0) });
  w.ammo = s.ammo;

  // Kills: a living enemy of the last look is dead now. On a sprung spike pit it is a trap kill.
  const dead = s.enemies.filter((e) => w.zombies.has(e.id) && e.hp <= 0);
  const sprung = (s.traps ?? []).filter((t) => t.kind === 'spike' && !t.armed && w.armed.has(t.id));
  const byTrap = dead.find((e) => e.side === 'zombie' && sprung.some((t) => t.x === Math.round(e.x) && t.y === Math.round(e.y)));
  if (byTrap) cands.push({ trigger: 'trapKill', who: near(live, byTrap.x, byTrap.y) });
  else if (dead.length > 0 && !w.killed) cands.push({ trigger: 'firstKill', who: actor(s, dead[0]!.x, dead[0]!.y) });
  if (dead.length > 0) w.killed = true;
  w.zombies = new Set(s.enemies.filter((e) => e.hp > 0).map((e) => e.id));
  w.armed = new Set((s.traps ?? []).filter((t) => t.kind === 'spike' && t.armed).map((t) => t.id));

  // Opening fixed.
  for (const o of s.openings ?? []) {
    if (o.fixed && !w.fixed.has(o.id)) {
      w.fixed.add(o.id);
      cands.push({ trigger: 'openingFixed', who: near(live, o.x, o.y) });
    } else if (!o.fixed) w.fixed.delete(o.id);
  }

  // A zombie close by: the first to come within CLOSE, again only after every one fell back past FAR.
  const nearest = zombies.map((z) => ({ z, d: Math.min(...live.map((u) => Math.hypot(u.x - z.x, u.y - z.y)), Infinity) })).sort((a, b) => a.d - b.d)[0];
  if (nearest && nearest.d <= CLOSE) {
    if (!w.close) cands.push({ trigger: 'zombieClose', who: near(live, nearest.z.x, nearest.z.y) });
    w.close = true;
  } else if (!nearest || nearest.d > FAR) w.close = false;

  // Idle at the fire or stove: standing still within reach of it for IDLE_TICKS.
  for (const u of s.survivors) {
    const still = u.hp > 0 && !!hearth && !u.order && u.path.length === 0 && Math.hypot(u.x - hearth.x, u.y - hearth.y) <= AT_HEARTH;
    if (!still) w.idle.delete(u.id);
    else if (!w.idle.has(u.id)) w.idle.set(u.id, s.tick);
    else if (s.tick - w.idle.get(u.id)! >= IDLE_TICKS) {
      w.idle.set(u.id, s.tick);
      cands.push({ trigger: 'idle', who: u });
    }
  }

  if (first || s.status !== 'playing' || s.tick - w.last < BARK_GAP) return null;
  for (const c of cands) {
    if (!c.who || c.who.hp <= 0) continue;
    const text = take(w, lines, c.who, c.trigger);
    if (!text) continue;
    w.last = s.tick;
    return { id: c.who.id, trigger: c.trigger, text, x: c.who.x, y: c.who.y };
  }
  return null;
}
