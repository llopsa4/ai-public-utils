import { worldToScreen } from './fx';

// The atmosphere's rules (DESIGN §20): dusk over Base 1, rain from the herd warning, light fog in the Intro and
// Mission 1, warm light pools at the fire and the stove. Pure: no Phaser here (`scenes/Atmos.ts` draws it) and
// nothing here touches the sim, so cones, sight and noise are never changed.

/** What a playable scene publishes each frame (registry `atmos`). Lights are in world pixels. */
export interface AtmosModel {
  dusk: number; // 0..1
  rain: number; // 0..1, raw: the sound follows it even when the weather option hides the drops
  fog: number; // 0..1
  lights: WorldLight[];
  centre: readonly [number, number]; // the camera's world centre
  zoom: number;
}
export interface WorldLight {
  x: number;
  y: number;
  r: number; // world px: half the pool's width
  phase: number; // keeps two pools from flickering in step
}
export interface ScreenLight {
  x: number;
  y: number;
  rx: number;
  ry: number;
  flicker: number; // ~0.85..1.15
}
export interface Blob {
  x: number;
  y: number;
  rx: number;
  ry: number;
  a: number;
}

export const DUSK_COLOR = 0x0c1233;
export const DUSK_ALPHA = 0.42; // the deepest dusk: art stays readable and the cones stay visible
export const FOG_COLOR = 0xdfe3e6;
export const FOG_ALPHA = 0.09; // per blob at full fog: "kept light so cones read"
export const FOG_LEVEL = 1;
export const RAIN_COLOR = 0xc4d0dc;
export const DRIZZLE = 0.25; // rain level at the warning
export const RAIN_AT_HERD = 0.55; // rain level when the herd arrives; it reaches 1 as the herd finishes entering
export const MAX_DROPS = 260;
const SLANT = 0.25; // sideways pixels per falling pixel
export const LIGHT_COLOR = 0xffb347;
/** Lights glow a little even by day and reach full strength at the deepest dusk. */
export const LIGHT_DAY = 0.55;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const smooth = (t: number): number => t * t * (3 - 2 * t);
const frac = (v: number): number => v - Math.floor(v);

/** Dusk darkness: 0 until the warning tick, easing up to 1 at the herd's arrival, then held. */
export function duskLevel(tick: number, warnTick: number, arriveTick: number): number {
  if (tick <= warnTick) return 0;
  if (tick >= arriveTick) return 1;
  return smooth((tick - warnTick) / (arriveTick - warnTick));
}

/** Rain: none before the warning, a drizzle from it that builds to steady rain as the herd arrives, then to full as it pours in. */
export function rainLevel(tick: number, warnTick: number, arriveTick: number, spawned: number, count: number): number {
  if (tick < warnTick) return 0;
  if (tick < arriveTick) return DRIZZLE + (RAIN_AT_HERD - DRIZZLE) * ((tick - warnTick) / Math.max(1, arriveTick - warnTick));
  return RAIN_AT_HERD + (1 - RAIN_AT_HERD) * clamp01(count > 0 ? spawned / count : 1);
}

/** The fire's flicker at `ms`: a few slow and quick sines that never repeat visibly. Always in 0.8..1.2. */
export function flicker(ms: number, phase = 0): number {
  const v = 1 + 0.08 * Math.sin(ms / 90 + phase) + 0.05 * Math.sin(ms / 37 + phase * 2.3) + 0.03 * Math.sin(ms / 231 + phase * 0.7);
  return Math.max(0.8, Math.min(1.2, v));
}

/** How strong the light pools are: by day a faint glow, at the deepest dusk full. */
export function lightStrength(dusk: number): number {
  return LIGHT_DAY + (1 - LIGHT_DAY) * clamp01(dusk);
}

/** The pools in screen pixels for a screen `w` × `h` (the iso ground makes a pool twice as wide as it is tall). */
export function lightsOnScreen(m: AtmosModel, ms: number, w: number, h: number): ScreenLight[] {
  return m.lights.map((l) => {
    const [x, y] = worldToScreen(l.x, l.y, m.centre, m.zoom, w, h);
    return { x, y, rx: l.r * m.zoom, ry: l.r * m.zoom * 0.5, flicker: flicker(ms, l.phase) };
  });
}

/** Drifting fog banks for a screen `w` × `h` at `ms`; `level` (0..1) scales their opacity. Empty at level 0. */
export function fogBlobs(ms: number, w: number, h: number, level: number, count = 7): Blob[] {
  if (level <= 0) return [];
  const out: Blob[] = [];
  for (let i = 0; i < count; i++) {
    const rx = w * (0.22 + 0.1 * (i % 3));
    const ry = rx * 0.28;
    const span = w + 2 * rx;
    const speed = 7 + (i % 3) * 4; // px per second, all drifting the same way
    const x = ((frac(i * 0.618034) * span + (speed * ms) / 1000) % span) - rx;
    const y = h * (0.12 + 0.76 * frac(i * 0.754878 + 0.3)) + 14 * Math.sin(ms / 4000 + i * 1.7);
    out.push({ x, y, rx, ry, a: FOG_ALPHA * clamp01(level) * (0.7 + 0.3 * frac(i * 0.43)) });
  }
  return out;
}

/** Rain streaks as flat `x1, y1, x2, y2` runs over a screen `w` × `h` at `ms`; the count follows `level` (0..1). */
export function rainDrops(ms: number, level: number, w: number, h: number): number[] {
  const n = Math.round(MAX_DROPS * clamp01(level));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const len = 14 + 12 * frac(i * 0.381966);
    const speed = 820 + 420 * frac(i * 0.754878);
    const slant = len * SLANT;
    const span = h + len;
    const y = (frac(i * 0.618034) * span + (speed * ms) / 1000) % span - len;
    const x = frac(i * 0.56984) * (w + SLANT * h) - SLANT * y; // a drop travels along its streak, so the rain looks wind-blown
    out.push(x, y, x - slant, y + len);
  }
  return out;
}
