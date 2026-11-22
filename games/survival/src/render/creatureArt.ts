// Which picture a wolf, game animal, horse, rider, carcass, ally or effect shows (art/SPEC.md sections 3 and 4,
// art/STYLE.md section 6): the animation for its state and movement, the wolf looks (pack leader, guardian), the
// carcass stage, the corral spots and the one-facing frame names. Pure: no Phaser, so the tests can check it.
import { entry } from './manifest';
import type { AnimPick } from './personArt';

const pad = (n: number): string => String(n).padStart(2, '0');

/** How a creature moved over the last sim ticks the view saw: moving at all, and tiles per tick. */
export interface Motion {
  moving: boolean;
  speed: number;
}

/** A creature at or above this many tiles per tick runs; below it walks (a wolf slowed by a storm or a fire pit). */
export const RUN_FROM = 0.12;

export type WolfKind = 'wolf' | 'pack_leader' | 'guardian';

/** How the one wolf model is drawn for each kind: the pack leader 1.4x and darker, the guardian pale with a glow. */
export function wolfLook(kind: string): { scale: number; tint: number; alpha: number; glow: boolean } {
  if (kind === 'pack_leader') return { scale: 1.4, tint: 0x8c8682, alpha: 1, glow: false };
  if (kind === 'guardian') return { scale: 1, tint: 0xd6ecff, alpha: 0.9, glow: true };
  return { scale: 1, tint: 0xffffff, alpha: 1, glow: false };
}

/**
 * A wolf's (or guardian's) animation: run when moving fast or fleeing, walk when slowed, attack while standing with
 * its bite cooling down (it just bit, or bites again soon), else idle.
 */
export function wolfAnim(w: { fleeing?: boolean; cooldown: number }, m: Motion): AnimPick {
  if (m.moving) return { anim: w.fleeing || m.speed >= RUN_FROM ? 'run' : 'walk', rate: 1 };
  if (!w.fleeing && w.cooldown > 0) return { anim: 'attack', rate: 1 };
  return { anim: 'idle', rate: 1 };
}

/** Calm and still: grazing two thirds of the time, standing the rest, in 5 s spells offset per animal. */
export function restAnim(id: number, ms: number): AnimPick {
  return { anim: Math.floor(ms / 5000 + id * 0.37) % 3 === 0 ? 'idle' : 'graze', rate: 1 };
}

/** A deer's or bison's animation: run while fleeing, walk while wandering, else graze or stand. */
export function gameAnim(a: { id: number; fleeing: number }, m: Motion, ms: number): AnimPick {
  if (m.moving) return { anim: a.fleeing > 0 ? 'run' : 'walk', rate: 1 };
  return restAnim(a.id, ms);
}

/**
 * A mounted lancer's animation from the person's pick (`personArt.ts` `animFor`): walking or fleeing is a gallop,
 * any attack a lance thrust, anything else idle.
 */
export function riderAnim(pick: AnimPick): AnimPick {
  if (pick.anim === 'walk' || pick.anim === 'carry_walk') return { anim: 'gallop', rate: 1 };
  if (pick.anim === 'shoot' || pick.anim === 'thrust' || pick.anim === 'strike') return { anim: 'thrust', rate: 1 };
  return { anim: 'idle', rate: 1 };
}

/** The carcass stage: whole until a load is taken, half while meat is left, bones when only hides (or nothing) are left. */
export function carcassStage(meat: number, max: number): 'stage1' | 'stage2' | 'stage3' {
  if (meat <= 1e-9) return 'stage3';
  return meat >= max - 1e-9 ? 'stage1' : 'stage2';
}

/** The carcass key of an animal kind. */
export const carcassKey = (kind: string): string => `carcass_${kind}`;

/** A carcass frame (pattern B: one still per stage). */
export const carcassFrame = (kind: string, stage: string): string => `${carcassKey(kind)}/${stage}/00`;

/** The frame of a one-facing animation (pattern B) `ms` after it started: a loop wraps, a one-shot holds its last frame. */
export function onceFrame(key: string, anim: string, ms: number, phase = 0): string {
  const a = entry(key).anims?.[anim];
  if (!a) return `${key}/${anim}/00`;
  const n = Math.floor((Math.max(0, ms) * a.fps) / 1000 + phase);
  return `${key}/${anim}/${pad(a.loop ? n % a.frames : Math.min(n, a.frames - 1))}`;
}

/** How long a one-shot (pattern B) runs in ms, to its last frame's end. */
export function onceLength(key: string, anim: string): number {
  const a = entry(key).anims?.[anim];
  return a ? (a.frames * 1000) / a.fps : 0;
}

/** True when a creature that vanished was last seen on the map's border: a fleeing wolf that ran off (`combat.ts`). */
export function offMap(x: number, y: number, size: number): boolean {
  return x <= 0 || y <= 0 || x >= size - 1 || y >= size - 1;
}

/**
 * Where corral horses stand, as tile offsets from a 2x2 footprint's centre: six spots inside the rail fence, each with a
 * facing so the herd does not all look one way.
 */
export const CORRAL_SPOTS: { dx: number; dy: number; facing: 's' | 'sw' | 'w' | 'nw' | 'n' | 'ne' | 'e' | 'se' }[] = [
  { dx: -0.45, dy: -0.2, facing: 'se' },
  { dx: 0.3, dy: -0.5, facing: 'sw' },
  { dx: 0.5, dy: 0.25, facing: 'w' },
  { dx: -0.2, dy: 0.45, facing: 'ne' },
  { dx: 0.05, dy: -0.05, facing: 'e' },
  { dx: -0.55, dy: 0.5, facing: 'n' },
];

/**
 * The horses shown in the corrals: the free horses (the herd minus those ridden) fill the finished corrals in id order,
 * up to `cap` each (and never more than the six spots). Returns one entry per horse.
 */
export function corralHorses(
  corrals: { id: number; cx: number; cy: number }[],
  free: number,
  cap: number,
): { corral: number; slot: number; x: number; y: number; facing: (typeof CORRAL_SPOTS)[number]['facing'] }[] {
  const out: ReturnType<typeof corralHorses> = [];
  let left = Math.max(0, Math.floor(free));
  for (const c of [...corrals].sort((a, b) => a.id - b.id)) {
    const n = Math.min(left, cap, CORRAL_SPOTS.length);
    for (let i = 0; i < n; i++) {
      const s = CORRAL_SPOTS[i];
      out.push({ corral: c.id, slot: i, x: c.cx + s.dx, y: c.cy + s.dy, facing: s.facing });
    }
    left -= n;
    if (left <= 0) break;
  }
  return out;
}

/** The seven bison of a stampede, abreast across the lane (tile positions), side by side along the run's perpendicular. */
export function herdSpots(f: { x: number; y: number; dx: number; dy: number }, halfWidth: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = -3; i <= 3; i++) {
    const t = (i / 3) * halfWidth;
    out.push({ x: f.x + t * f.dy, y: f.y - t * f.dx });
  }
  return out;
}

/** A tile-space direction as a screen-space one (isometric 64 x 32), for picking a facing. */
export function screenDir(dx: number, dy: number): { x: number; y: number } {
  return { x: (dx - dy) * 32, y: (dx + dy) * 16 };
}
