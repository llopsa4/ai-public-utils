// The frame a key shows when the caller names none (art/SPEC.md section 8). Pure: no Phaser, so a test can check it
// against the validator's list of frames (scripts/art/lib.mjs `expectedFrames`).
import { FACINGS, SEASONS, entry } from './manifest';

const pad = (n: number): string => String(n).padStart(2, '0');

/** The first index of a seasonal or masked key: its explicit `indices`, else 0..variants-1, else 0. */
function firstIndex(key: string): string {
  const e = entry(key);
  return e.indices?.[0] ?? '0';
}

/** The default frame name of a key: summer, the first variant, the finished state, the first animation, facing `s`. */
export function defaultFrame(key: string): string {
  const e = entry(key);
  if (e.facings === 8) {
    const anim = Object.keys(e.anims ?? {})[0] ?? 'idle';
    return `${key}/${e.layers[0]}/${anim}/${FACINGS[0]}/${pad(0)}`;
  }
  if (e.seasons) return `${key}/${SEASONS[1]}/${firstIndex(key)}`;
  if (e.states) {
    const state = e.states.includes('finished') ? 'finished' : e.states[0];
    if (e.atlas === 'ui') return `${key}/${state}`;
    return `${key}/${state}/${e.variants ? firstIndex(key) : pad(0)}`;
  }
  const anim = Object.keys(e.anims ?? {})[0];
  return anim ? `${key}/${anim}/${pad(0)}` : key;
}
