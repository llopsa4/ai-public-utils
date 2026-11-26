// Which frame of which anim a figure shows (art spec, art/STYLE.md Atlas contract). Pure: no Phaser, so
// tests can run it. The Phaser side is render/units.ts. Time is the sim's: `tick + frac` at 10 Hz, so a
// paused scene freezes every figure.
import animsData from '../data/anims.json';
import manifest from '../../art/manifest.json';
import { TICK_HZ } from '../sim/time';

export type Facing = 'se' | 'sw' | 'ne' | 'nw';
export type Drawn = 'se' | 'ne';

interface AnimDef {
  fps: number;
  loop: boolean;
  fastFps?: number;
}
const ANIMS = animsData.anims as Record<string, AnimDef>;

/** Frame counts per anim for one figure key, from the manifest (`fighter`, `scout`, `zombie_fresh_a`, ...). */
export type Counts = Readonly<Record<string, number>>;
export const FIGURES = manifest.figures.keys as unknown as Record<string, { atlas: string; legacyKey: string; status: string; anims: Counts }>;

/** The resolution of an atlas group (manifest `atlases.<group>.scale`): 1 draws cells as they are, 2 draws 128 px cells at half size. */
export function atlasScale(group: string, atlases: Record<string, { scale?: number }> = manifest.atlases): number {
  return atlases[group]?.scale ?? 1;
}

/** Every zombie figure key, `zombie_<decay>_<body>` (decay fresh/decayed/rotting, body a/b/c), in manifest order. */
export const ZOMBIE_VARIANTS: readonly string[] = Object.keys(FIGURES).filter((k) => k.startsWith('zombie_'));

/**
 * The screen facing of a tile-space direction. Tile +x runs down-right on screen and +y down-left, so the
 * screen vector is (fx - fy, fx + fy). A tie (pure left, right, up or down on screen) keeps `prev`.
 */
export function screenFacing(f: readonly [number, number], prev: Facing = 'se'): Facing {
  const sx = f[0] - f[1];
  const sy = f[0] + f[1];
  const east = Math.abs(sx) < 1e-6 ? prev === 'se' || prev === 'ne' : sx > 0;
  const south = Math.abs(sy) < 1e-6 ? prev === 'se' || prev === 'sw' : sy > 0;
  return `${south ? 's' : 'n'}${east ? 'e' : 'w'}` as Facing;
}

/** Only SE and NE are drawn; SW and NW are those mirrored (`flip`). */
export function drawnFacing(f: Facing): { facing: Drawn; flip: boolean } {
  return { facing: f === 'se' || f === 'sw' ? 'se' : 'ne', flip: f === 'sw' || f === 'nw' };
}

/** Frame name in the atlas: `<key>_<anim>_<facing>_<n>`. */
export function frameName(key: string, anim: string, facing: Drawn, n: number): string {
  return `${key}_${anim}_${facing}_${n}`;
}

function fpsOf(a: AnimDef, fast: boolean): number {
  return fast && a.fastFps ? a.fastFps : a.fps;
}

/** The frame `seconds` into an anim of `count` frames: loops wrap, one-shots hold their last frame. */
export function animFrame(anim: string, count: number, seconds: number, fast = false): number {
  const a = ANIMS[anim];
  if (!a || count <= 1) return 0;
  const i = Math.floor(Math.max(0, seconds) * fpsOf(a, fast) + 1e-9);
  return a.loop ? i % count : Math.min(i, count - 1);
}

/** True once a one-shot has played all its frames (a looping anim never finishes). */
export function animDone(anim: string, count: number, seconds: number): boolean {
  const a = ANIMS[anim];
  return !!a && !a.loop && seconds * fpsOf(a, false) >= count - 1e-9;
}

/** What a figure needs from a sim unit (a structural subset of `Survivor | Enemy`). */
export interface Subject {
  side: string;
  hp: number;
  path: readonly unknown[];
  act: { kind: string; tick: number } | null;
  stance?: 'walk' | 'crouch' | 'crawl';
  running?: boolean;
  order?: { type: string; left?: number } | null;
  carrying?: string | null;
  ai?: { mode: string; near?: boolean };
}

export interface Pick {
  anim: string;
  frame: number;
  /** A dead figure whose death anim has finished: the scene shows the body sprite instead. */
  finished: boolean;
}

/** A stable offset in seconds, so figures of one kind do not step in lockstep. */
export function phaseOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 100) / 100;
}

/**
 * The zombie figure (decay + body) for an id. Figures with final art are preferred; with none final (the stand-in
 * atlases) every figure is used, so all nine show.
 */
export function zombieVariant(id: string, figures: Record<string, { status: string }> = FIGURES): string {
  const final = ZOMBIE_VARIANTS.filter((k) => figures[k]?.status === 'final');
  const pool = final.length > 0 ? final : ZOMBIE_VARIANTS;
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) >>> 0;
  return pool[h % pool.length]!;
}

/** The anim a living unit plays from its sim state, before the one-shot `act` cue. */
function stateAnim(u: Subject, counts: Counts): { anim: string; moving: boolean; fast: boolean } {
  const moving = u.path.length > 0;
  if (u.side === 'survivor') {
    const o = u.order;
    if (o && (o.type === 'work' || o.type === 'open') && (o.left ?? -1) >= 0 && !moving) return { anim: 'work', moving: true, fast: false }; // the work loop plays while standing
    if (o?.type === 'finish' && (o.left ?? -1) >= 0 && u.stance !== 'crawl') return { anim: 'crouch', moving: false, fast: false }; // crouched over the body (DESIGN §26)
    if (u.carrying && counts.carry) return { anim: 'carry', moving, fast: false };
    if (!moving && o?.type === 'hold') return { anim: 'hold', moving: false, fast: false };
    const stance = u.stance ?? 'walk';
    if (stance === 'crawl') return { anim: 'crawl', moving, fast: false };
    if (stance === 'crouch') return { anim: 'crouch', moving, fast: false };
    if (!moving) return { anim: 'idle', moving: false, fast: false };
    return { anim: u.running ? 'run' : 'walk', moving, fast: false };
  }
  const mode = u.ai?.mode ?? 'wander';
  if (!moving) return { anim: 'idle', moving: false, fast: false };
  if (mode === 'chase' || mode === 'alert') return { anim: 'lurch', moving, fast: false };
  // Near what it goes for, a walking zombie reaches out (DESIGN §7); a figure without `reach` keeps shambling.
  return { anim: u.ai?.near && counts.reach ? 'reach' : 'shamble', moving, fast: mode === 'investigate' };
}

/**
 * The anim and frame to show. `diedTick` is the tick the unit was first seen dead. A standing still
 * figure holds frame 0 of its anim (a crouched survivor holds the crouch pose).
 */
export function pickFrame(u: Subject, counts: Counts, tick: number, frac: number, phase: number, diedTick: number): Pick {
  const now = tick + frac;
  if (u.hp <= 0) {
    const n = counts.death ?? 1;
    const t = (now - diedTick) / TICK_HZ;
    return { anim: 'death', frame: animFrame('death', n, t), finished: animDone('death', n, t) };
  }
  if (u.act) {
    // a pistol shot is `shot` for a figure with one-handed art, `pistol_shot` where the figure has the two-handed anim (Cass)
    const kind = u.act.kind === 'shot' && counts.pistol_shot ? 'pistol_shot' : u.act.kind;
    const n = counts[kind];
    const t = (now - u.act.tick) / TICK_HZ;
    if (n && t >= 0 && !animDone(kind, n, t)) return { anim: kind, frame: animFrame(kind, n, t), finished: false };
  }
  const s = stateAnim(u, counts);
  const n = counts[s.anim] ?? 1;
  const frame = s.moving ? animFrame(s.anim, n, now / TICK_HZ + phase, s.fast) : 0;
  return { anim: s.anim, frame, finished: false };
}
