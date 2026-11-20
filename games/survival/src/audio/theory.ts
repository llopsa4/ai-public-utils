// The pure parts of the music (DESIGN-hunting.md `## Music`): the scale, the melody walk, the drum patterns and
// the rule for when the war music plays. No Web Audio here, so it is unit-tested; `music.ts` plays it.
import { rngNext, type RngState } from '../sim/rng';

export type MusicMode = 'ambient' | 'war';

/** War music from the first wolf until about 5 s (50 ticks) after the last one is dead or gone. */
export const WAR_HOLD_TICKS = 50;

export interface ModeState {
  mode: MusicMode;
  /** The tick when the wolves were last seen to be gone, while still holding the war music; else null. */
  calmSince: number | null;
}

export function nextMode(m: ModeState, wolves: boolean, tick: number): ModeState {
  if (wolves) return m.mode === 'war' && m.calmSince === null ? m : { mode: 'war', calmSince: null };
  if (m.mode === 'ambient') return m;
  const since = m.calmSince ?? tick;
  return tick - since >= WAR_HOLD_TICKS ? { mode: 'ambient', calmSince: null } : { mode: 'war', calmSince: since };
}

/** A minor pentatonic scale on D: five notes an octave. Degree 0 is D4; negative degrees go down. */
const SCALE = [0, 3, 5, 7, 10];
const D4 = 293.66;
export const DEGREE_MIN = -3;
export const DEGREE_MAX = 9;

export function noteFreq(degree: number): number {
  const octave = Math.floor(degree / SCALE.length);
  const step = SCALE[((degree % SCALE.length) + SCALE.length) % SCALE.length];
  return D4 * 2 ** ((step + 12 * octave) / 12);
}

export interface Note {
  degree: number;
  /** Length in beats; `rest` more beats of silence follow it. */
  beats: number;
  rest: number;
}

/** The flute's next note: a small step from the last one, pulled gently back to the middle; now and then a pause. */
export function nextNote(rng: RngState, prev: number): Note {
  const pull = prev > 5 ? -0.25 : prev < 0 ? 0.25 : 0;
  const r = rngNext(rng) + pull;
  const step = r < 0.12 ? -2 : r < 0.4 ? -1 : r < 0.55 ? 0 : r < 0.85 ? 1 : 2;
  const degree = Math.min(DEGREE_MAX, Math.max(DEGREE_MIN, prev + step));
  const beats = [1, 1.5, 2, 3][Math.floor(rngNext(rng) * 4)];
  const rest = rngNext(rng) < 0.3 ? 2 + Math.floor(rngNext(rng) * 3) : 0.25;
  return { degree, beats, rest };
}

export interface Pattern {
  bpm: number;
  /** Beats in one cycle. */
  length: number;
  /** [beat within the cycle, loudness 0-1]. */
  hits: [number, number][];
}

/** A slow low heartbeat (lub-dub). */
export const AMBIENT_BEAT: Pattern = { bpm: 54, length: 1, hits: [[0, 1], [0.42, 0.55]] };
/** A faster driving war drum with an accent on every fourth beat. */
export const WAR_BEAT: Pattern = {
  bpm: 138,
  length: 4,
  hits: [[0, 1], [0.5, 0.4], [1, 0.7], [1.5, 0.4], [2, 0.9], [2.5, 0.4], [3, 0.7], [3.25, 0.45], [3.5, 0.8]],
};

/** The hits of one cycle as [seconds from the start of the cycle `cycle`'s zero, loudness]. */
export function patternHits(p: Pattern, cycle: number): [number, number][] {
  const beat = 60 / p.bpm;
  return p.hits.map(([at, g]) => [(cycle * p.length + at) * beat, g]);
}

/** Seconds one cycle lasts. */
export const cycleSeconds = (p: Pattern): number => (p.length * 60) / p.bpm;

export const hitsPerSecond = (p: Pattern): number => p.hits.length / cycleSeconds(p);
