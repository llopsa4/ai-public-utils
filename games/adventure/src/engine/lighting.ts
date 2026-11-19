/**
 * Pure colour maths for the visual effects: room colour grades (as a 4x5 colour matrix for the
 * camera) and the warm light characters pick up near kiln mouths, hearths and lanterns.
 */
import type { Grade, Point } from './types';

export const NEUTRAL_GRADE: Grade = { saturation: 1, brightness: 1, contrast: 1, warmth: 0 };
/** The kiln's cold: washed out, slightly dim, blue-shifted. */
export const COLD_GRADE: Grade = { saturation: 0.55, brightness: 0.92, contrast: 1.02, warmth: -0.6 };

type Matrix = number[]; // 20 values, row-major: r, g, b, a rows of [r g b a offset]; offsets in 0..1

const IDENTITY: Matrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** a after b: applying the result equals applying b, then a. */
function compose(a: Matrix, b: Matrix): Matrix {
  const out = new Array<number>(20);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let v = col === 4 ? a[row * 5 + 4] : 0;
      for (let k = 0; k < 4; k++) v += a[row * 5 + k] * b[k * 5 + col];
      out[row * 5 + col] = v;
    }
  }
  return out;
}

const LR = 0.2126, LG = 0.7152, LB = 0.0722;

/** Colour matrix for a grade: warmth, then brightness, then saturation, then contrast. */
export function gradeMatrix(g: Grade): Matrix {
  const w = g.warmth * 0.08;
  const warmth: Matrix = [1 + w, 0, 0, 0, 0, 0, 1 + w * 0.25, 0, 0, 0, 0, 0, 1 - w, 0, 0, 0, 0, 0, 1, 0];
  const b = g.brightness;
  const bright: Matrix = [b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];
  const s = g.saturation, is = 1 - s;
  const sat: Matrix = [
    is * LR + s, is * LG, is * LB, 0, 0,
    is * LR, is * LG + s, is * LB, 0, 0,
    is * LR, is * LG, is * LB + s, 0, 0,
    0, 0, 0, 1, 0,
  ];
  const c = g.contrast, o = 0.5 * (1 - c);
  const contrast: Matrix = [c, 0, 0, 0, o, 0, c, 0, 0, o, 0, 0, c, 0, o, 0, 0, 0, 1, 0];
  return [contrast, sat, bright, warmth].reduce((m, step) => compose(m, step), IDENTITY);
}

export function lerpGrade(a: Grade, b: Grade, t: number): Grade {
  const k = Math.min(1, Math.max(0, t));
  const mix = (x: number, y: number) => x + (y - x) * k;
  return { saturation: mix(a.saturation, b.saturation), brightness: mix(a.brightness, b.brightness), contrast: mix(a.contrast, b.contrast), warmth: mix(a.warmth, b.warmth) };
}

export interface LightSource { x: number; y: number; r: number; color: number; warm?: boolean }

/**
 * Extra light (0..1 per channel) at a point from nearby sources. Each source reaches three times
 * its glow radius and fades with the square of distance; warm sources fade out with `cold` (0..1).
 */
export function localLight(p: Point, sources: LightSource[], cold: number): [number, number, number] {
  const out: [number, number, number] = [0, 0, 0];
  for (const s of sources) {
    const reach = s.r * 3;
    const d = Math.hypot(p.x - s.x, p.y - s.y);
    if (d >= reach) continue;
    const k = (1 - d / reach) ** 2 * 0.35 * (s.warm ? 1 - cold : 1);
    out[0] += (((s.color >> 16) & 255) / 255) * k;
    out[1] += (((s.color >> 8) & 255) / 255) * k;
    out[2] += ((s.color & 255) / 255) * k;
  }
  return out.map(v => Math.min(0.45, v)) as [number, number, number];
}

/** Screen-blends extra light onto a 0xRRGGBB tint (never darker, never past white). */
export function addLight(tint: number, light: [number, number, number]): number {
  const ch = (shift: number, add: number) => {
    const base = ((tint >> shift) & 255) / 255;
    return Math.round((1 - (1 - base) * (1 - add)) * 255);
  };
  return (ch(16, light[0]) << 16) | (ch(8, light[1]) << 8) | ch(0, light[2]);
}

/** Mixes two 0xRRGGBB colours. */
export function mixColor(a: number, b: number, t: number): number {
  const k = Math.min(1, Math.max(0, t));
  const ch = (shift: number) => Math.round(((a >> shift) & 255) + ((((b >> shift) & 255) - ((a >> shift) & 255)) * k));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
