// Seeded mulberry32 on a plain state object, so the generator state stays JSON-serialisable.
export interface RngState {
  s: number;
}

export function makeRng(seed: number): RngState {
  return { s: seed >>> 0 };
}

/** Next float in [0, 1). */
export function rngNext(r: RngState): number {
  r.s = (r.s + 0x6d2b79f5) >>> 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
