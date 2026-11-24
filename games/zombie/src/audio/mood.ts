import type { BaseState } from '../sim/base';
import type { MissionState } from '../sim/mission';

// The adaptive ambience's rules (DESIGN §6 *Audio*): which of the three layers should be heard now, and how
// fast each one fades in or out. Pure: no WebAudio here (`audio/ambience.ts` makes the sound) and nothing here
// changes the sim.
//
//   bed   a calm woods bed (wind, a low drone): always, a little lower while the others are up
//   pulse a heartbeat-like thud while a zombie chases or an alarm is up (louder with more chasers)
//   herd  a heavy layer from the herd's warning until Base 1 is won or lost

export interface Mood {
  bed: number; // 0..1
  pulse: number;
  herd: number;
}

export type LayerId = keyof Mood;
export const LAYERS: readonly LayerId[] = ['bed', 'pulse', 'herd'];

export const SILENT: Mood = { bed: 0, pulse: 0, herd: 0 };
export const CALM: Mood = { bed: 1, pulse: 0, herd: 0 };

/** Seconds a layer takes to cover about two thirds of the way to its target: quick up for a chase, slow down so a lost sight does not cut it. */
export const FADE: Record<LayerId, { up: number; down: number }> = {
  bed: { up: 2.5, down: 1.5 },
  pulse: { up: 0.35, down: 2.5 },
  herd: { up: 3, down: 4 },
};

/** The pulse level for this many chasers: one is clearly heard, four or more are at full. */
const PULSE_ONE = 0.65;
const PULSE_PER_EXTRA = 0.12;
/** How far the bed drops under a pulse or the herd layer (a fraction of its level). */
const BED_DUCK = 0.3;

type Watched = Pick<MissionState, 'status' | 'enemies' | 'rings'> & { herd?: Pick<BaseState['herd'], 'warned'> };

/** How many living enemies are after a survivor: a zombie chasing, or a guard that has seen one. */
export function chasers(s: Pick<MissionState, 'enemies'>): number {
  let n = 0;
  for (const e of s.enemies) if (e.hp > 0 && (e.ai.mode === 'chase' || e.ai.mode === 'alert')) n++;
  return n;
}

/** The layers wanted for this state. A finished scene (won or lost) lets everything but a faint bed fall away. */
export function moodOf(s: Watched): Mood {
  if (s.status !== 'playing') return { bed: s.status === 'failed' ? 0.25 : 0.7, pulse: 0, herd: 0 };
  const n = chasers(s);
  const alarm = s.rings.some((r) => r.kind === 'alarm');
  const pulse = n > 0 ? Math.min(1, PULSE_ONE + PULSE_PER_EXTRA * (n - 1)) : alarm ? PULSE_ONE : 0;
  const herd = s.herd?.warned ? 1 : 0;
  const bed = 1 - BED_DUCK * Math.max(pulse, herd);
  return { bed, pulse, herd };
}

/** One step of every layer towards its target over `dt` seconds (an exponential approach with the layer's own rate). */
export function approach(cur: Mood, target: Mood, dt: number): Mood {
  const out: Mood = { ...cur };
  for (const k of LAYERS) {
    const tc = target[k] >= cur[k] ? FADE[k].up : FADE[k].down;
    out[k] = cur[k] + (target[k] - cur[k]) * (1 - Math.exp(-Math.max(0, dt) / tc));
    if (Math.abs(out[k] - target[k]) < 0.002) out[k] = target[k];
  }
  return out;
}

/** The heartbeat's gap in seconds: faster as the pulse level rises (1.0 s at the lowest, 0.55 s at full). */
export function beatGap(level: number): number {
  return 1 - 0.45 * Math.max(0, Math.min(1, level));
}
