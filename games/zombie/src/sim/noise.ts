// Noise (DESIGN §7): rings that enemies hear. Walls do not stop noise.
// Noises made during tick t are heard during tick t + 1; rings are for drawing only.
import { dist } from './vision';

export type NoiseKind = 'step' | 'shot' | 'lure' | 'alarm' | 'can';

export interface Noise {
  x: number;
  y: number;
  radius: number;
  kind: NoiseKind;
  from: string; // id of the maker ('' for none)
}

export interface Ring extends Noise {
  age: number; // ticks
}

export interface NoiseHolder {
  noises: Noise[];
  rings: Ring[];
}

/** How long a drawn ring lasts, in ticks. */
export const RING_TICKS = 10;

export function emitNoise(h: NoiseHolder, x: number, y: number, radius: number, kind: NoiseKind, from = '', ring = true): void {
  if (radius <= 0) return;
  const n: Noise = { x, y, radius, kind, from };
  h.noises.push(n);
  if (ring) h.rings.push({ ...n, age: 0 });
}

export function ageRings(h: NoiseHolder): void {
  for (const r of h.rings) r.age++;
  h.rings = h.rings.filter((r) => r.age < RING_TICKS);
}

export function hears(n: Noise, x: number, y: number): boolean {
  return dist(n.x, n.y, x, y) <= n.radius + 1e-9;
}

/**
 * The noise a listener reacts to among those it can hear: the loudest, then the nearest.
 * `kinds` limits what it cares about; its own noises are ignored.
 */
export function pickNoise(noises: readonly Noise[], self: string, x: number, y: number, kinds: readonly string[]): Noise | null {
  let best: Noise | null = null;
  for (const n of noises) {
    if (n.from === self || !kinds.includes(n.kind) || !hears(n, x, y)) continue;
    if (!best || n.radius > best.radius || (n.radius === best.radius && dist(n.x, n.y, x, y) < dist(best.x, best.y, x, y))) best = n;
  }
  return best;
}
