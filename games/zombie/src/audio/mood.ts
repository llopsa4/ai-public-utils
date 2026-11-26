import type { BaseState } from '../sim/base';
import type { MissionState } from '../sim/mission';
import { TICK_HZ } from '../sim/time';

// The adaptive music's rules (DESIGN §6 *Music*): how loud each layer should be now, and how fast each one
// fades. Pure: no WebAudio here (`audio/music.ts` and `audio/ambience.ts` make the sound) and nothing here
// changes the sim.
//
//   bed      the calm music track and the quiet wind: always, lower once the scene is won or lost
//   tension  0..1: how far the music has intensified (tempo, percussion, higher voices). Up while a zombie or a
//            guard sees a survivor (more watchers, more tension) or an alarm rings; held for RELEASE seconds
//            after the last sight, then it relaxes
//   herd     the heavy layer from the herd's warning until Base 1 is won or lost; it also drives the music to
//            its top intensity

export interface Mood {
  bed: number; // 0..1
  tension: number;
  herd: number;
}

export type LayerId = keyof Mood;
export const LAYERS: readonly LayerId[] = ['bed', 'tension', 'herd'];

export const SILENT: Mood = { bed: 0, tension: 0, herd: 0 };
export const CALM: Mood = { bed: 1, tension: 0, herd: 0 };

/** Seconds a layer takes to cover about two thirds of the way to its target: quick up when seen, slow down so the music relaxes. */
export const FADE: Record<LayerId, { up: number; down: number }> = {
  bed: { up: 2.5, down: 1.5 },
  tension: { up: 0.5, down: 3 },
  herd: { up: 3, down: 4 },
};

/** Seconds the music stays intense after the last zombie or guard lost sight of every survivor. */
export const RELEASE = 8;
/** The tension for one watcher; each extra one adds a step, four or more are at full. */
const TENSION_ONE = 0.7;
const TENSION_PER_EXTRA = 0.1;
/** A ringing alarm with nobody in sight. */
const TENSION_ALARM = 0.5;

type Watched = Pick<MissionState, 'status' | 'enemies' | 'rings' | 'tick'> & { herd?: Pick<BaseState['herd'], 'warned'> };

/** Whether an enemy's last sighting was of a survivor (a zombie after a squatter's is not, DESIGN §26). */
const afterSquad = (e: MissionState['enemies'][number]): boolean => e.ai.prey !== 'human';

/** How many living enemies are after a survivor: a zombie chasing, or a guard that has seen one. */
export function chasers(s: Pick<MissionState, 'enemies'>): number {
  let n = 0;
  for (const e of s.enemies) if (e.hp > 0 && (e.ai.mode === 'chase' || e.ai.mode === 'alert') && afterSquad(e)) n++;
  return n;
}

/** Seconds since any living enemy last saw a survivor (0 while one sees one now); Infinity if none ever has. */
export function sinceSeen(s: Pick<MissionState, 'enemies' | 'tick'>): number {
  let best = Infinity;
  for (const e of s.enemies) {
    if (e.hp <= 0 || !e.ai.lastSeen || !afterSquad(e)) continue;
    best = Math.min(best, Math.max(0, s.tick - e.ai.lastSeenTick) / TICK_HZ); // the AI marks a sight with the tick it runs in
  }
  return best;
}

/** The layers wanted for this state. A finished scene (won or lost) lets everything but a faint bed fall away. */
export function moodOf(s: Watched): Mood {
  if (s.status !== 'playing') return { bed: s.status === 'failed' ? 0.25 : 0.7, tension: 0, herd: 0 };
  const since = sinceSeen(s);
  let tension = 0;
  if (since <= RELEASE) tension = Math.min(1, TENSION_ONE + TENSION_PER_EXTRA * Math.max(0, chasers(s) - 1));
  else if (s.rings.some((r) => r.kind === 'alarm')) tension = TENSION_ALARM;
  return { bed: 1, tension, herd: s.herd?.warned ? 1 : 0 };
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

/** What drives the music's intensity: the tension, or the herd at the top. */
export function drive(m: Mood): number {
  return Math.max(0, Math.min(1, Math.max(m.tension, m.herd)));
}
