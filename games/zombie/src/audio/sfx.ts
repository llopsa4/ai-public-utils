import type { SoundId } from './events';

// The sound effects (DESIGN §6 *Audio*), made in code with WebAudio: no sound files. Each recipe starts a short
// burst of filtered noise and/or oscillators at `v.t` into `v.out` (already placed and levelled by the engine).
// `v.variant` (0..1) shifts the pitch a little so repeated sounds do not sound alike.

export interface Voice {
  ctx: BaseAudioContext;
  out: AudioNode;
  noise: AudioBuffer;
  t: number; // context time to start
  variant: number;
}

interface BurstOpts {
  dur: number;
  freq: number;
  freqTo?: number; // the filter sweeps to this over the burst
  type?: BiquadFilterType;
  q?: number;
  gain?: number;
  at?: number; // seconds after `v.t`
  attack?: number;
}

interface ToneOpts {
  dur: number;
  freq: number;
  freqTo?: number;
  type?: OscillatorType;
  gain?: number;
  at?: number;
  attack?: number;
  vibrato?: { hz: number; depth: number }; // frequency wobble, in Hz of depth
}

/** A gain node with a fast attack and an exponential fall to silence, connected to `out`. */
function envelope(v: Voice, at: number, attack: number, dur: number, peak: number): GainNode {
  const g = v.ctx.createGain();
  const t0 = v.t + at;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(v.out);
  return g;
}

/** Filtered noise with a decaying level: wind, breaths, thumps, crunches, clacks. */
function burst(v: Voice, o: BurstOpts): void {
  const { ctx } = v;
  const t0 = v.t + (o.at ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = v.noise;
  const f = ctx.createBiquadFilter();
  f.type = o.type ?? 'lowpass';
  f.Q.value = o.q ?? 1;
  f.frequency.setValueAtTime(o.freq, t0);
  if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t0 + o.dur);
  const g = envelope(v, o.at ?? 0, o.attack ?? 0.002, o.dur, o.gain ?? 1);
  src.connect(f).connect(g);
  src.start(t0, v.variant * (v.noise.duration - o.dur - 0.1));
  src.stop(t0 + o.dur + 0.05);
}

/** An oscillator with a decaying level: thuds, clanks, groans. */
function tone(v: Voice, o: ToneOpts): void {
  const { ctx } = v;
  const t0 = v.t + (o.at ?? 0);
  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.freqTo) osc.frequency.exponentialRampToValueAtTime(o.freqTo, t0 + o.dur);
  const g = envelope(v, o.at ?? 0, o.attack ?? 0.003, o.dur, o.gain ?? 1);
  osc.connect(g);
  if (o.vibrato) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = o.vibrato.hz;
    depth.gain.value = o.vibrato.depth;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + o.dur + 0.05);
  }
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

/** Pitch factor 0.88 .. 1.12 from the variant. */
const pitch = (v: Voice): number => 0.88 + v.variant * 0.24;

type Recipe = (v: Voice) => void;

/**
 * How much each recipe is scaled so the effects sit together (measured by rendering each one offline: the peak
 * of the raw recipes ran from 0.03 for a crawl's scuff to 1.7 for a shot). A shot lands near 0.9, a footstep
 * well under it.
 */
export const LEVEL: Record<SoundId, number> = {
  shot: 0.5,
  knife: 1.2,
  club: 0.8,
  throw: 1,
  bite: 1.2,
  chew: 1.3,
  step: 2.8,
  stepSoft: 4,
  stepRun: 1.3,
  stepZombie: 3.5,
  can: 0.75,
  spike: 0.75,
  crate: 0.8,
  groan: 1,
  ui: 0.8,
  blip: 0.75,
};

export const RECIPES: Record<SoundId, Recipe> = {
  // A pistol: a sharp crack that falls into a low thump, then a short room tail.
  shot: (v) => {
    burst(v, { dur: 0.22, freq: 5200, freqTo: 380, q: 0.8, gain: 0.9 });
    burst(v, { dur: 0.05, freq: 2400, type: 'highpass', gain: 0.7 });
    tone(v, { dur: 0.16, freq: 170 * pitch(v), freqTo: 42, gain: 0.9 });
    burst(v, { dur: 0.5, freq: 900, freqTo: 200, at: 0.04, gain: 0.18 });
  },
  // A knife: a thin swish and a small stab.
  knife: (v) => {
    burst(v, { dur: 0.1, freq: 3000 * pitch(v), freqTo: 6500, type: 'bandpass', q: 1.2, gain: 0.45, attack: 0.04 });
    burst(v, { dur: 0.05, freq: 700, at: 0.07, gain: 0.45 });
  },
  // A club: a whoosh then a dull knock.
  club: (v) => {
    burst(v, { dur: 0.14, freq: 500, freqTo: 1600, type: 'bandpass', q: 0.9, gain: 0.4, attack: 0.07 });
    tone(v, { dur: 0.16, freq: 130 * pitch(v), freqTo: 55, gain: 0.95, at: 0.1 });
    burst(v, { dur: 0.1, freq: 650, at: 0.1, gain: 0.55 });
  },
  // A thrown lure: a short airy whoosh.
  throw: (v) => {
    burst(v, { dur: 0.22, freq: 1200, freqTo: 3500, type: 'bandpass', q: 0.7, gain: 0.3, attack: 0.1 });
  },
  // A bite: a wet crunch of three pulses and a low grunt.
  bite: (v) => {
    for (let i = 0; i < 3; i++) burst(v, { dur: 0.07, freq: 800 * pitch(v) - i * 120, type: 'bandpass', q: 2.2, gain: 0.7, at: i * 0.07 });
    tone(v, { dur: 0.3, freq: 95 * pitch(v), freqTo: 58, type: 'sawtooth', gain: 0.35 });
  },
  // Chewing wood: slow creaking crunches.
  chew: (v) => {
    for (let i = 0; i < 2; i++) {
      burst(v, { dur: 0.1, freq: 380 * pitch(v), type: 'bandpass', q: 3, gain: 0.7, at: i * 0.16 });
      tone(v, { dur: 0.14, freq: 190 + i * 25, freqTo: 140, type: 'triangle', gain: 0.18, at: i * 0.16 });
    }
  },
  // Footsteps: a soft thump on the ground; softer when crouched or crawling, heavier running.
  step: (v) => {
    burst(v, { dur: 0.07, freq: 320 * pitch(v), type: 'bandpass', q: 0.9, gain: 0.5 });
  },
  stepSoft: (v) => {
    burst(v, { dur: 0.06, freq: 220 * pitch(v), gain: 0.28 });
  },
  stepRun: (v) => {
    burst(v, { dur: 0.09, freq: 420 * pitch(v), type: 'bandpass', q: 0.8, gain: 0.7 });
    tone(v, { dur: 0.07, freq: 90, freqTo: 55, gain: 0.25 });
  },
  // A shambling zombie: a heavy drag and a scuff.
  stepZombie: (v) => {
    burst(v, { dur: 0.16, freq: 300 * pitch(v), freqTo: 120, gain: 0.55, attack: 0.03 });
    burst(v, { dur: 0.05, freq: 1500, type: 'bandpass', q: 1, gain: 0.12, at: 0.1 });
  },
  // The noise can: tin clanks (a few inharmonic partials) and a rattle.
  can: (v) => {
    const p = pitch(v);
    for (const [f, g] of [[820, 0.5], [1370, 0.4], [2230, 0.3], [3410, 0.2]] as const) tone(v, { dur: 0.55, freq: f * p, type: 'square', gain: g * 0.22 });
    burst(v, { dur: 0.08, freq: 4000, type: 'highpass', gain: 0.5 });
    burst(v, { dur: 0.3, freq: 5000, type: 'highpass', gain: 0.15, at: 0.08 });
  },
  // The spike pit: a heavy thump, a wooden crunch and a wet squelch.
  spike: (v) => {
    tone(v, { dur: 0.22, freq: 150, freqTo: 40, gain: 1 });
    burst(v, { dur: 0.14, freq: 1400, freqTo: 300, type: 'bandpass', q: 1.4, gain: 0.7 });
    burst(v, { dur: 0.25, freq: 600, freqTo: 250, type: 'bandpass', q: 3, gain: 0.35, at: 0.08 });
  },
  // A crate lid: a creak that rises and a thud as it comes off.
  crate: (v) => {
    tone(v, { dur: 0.3, freq: 150 * pitch(v), freqTo: 260, type: 'sawtooth', gain: 0.1, attack: 0.05 });
    burst(v, { dur: 0.3, freq: 500, freqTo: 900, type: 'bandpass', q: 5, gain: 0.3, attack: 0.05 });
    tone(v, { dur: 0.14, freq: 120, freqTo: 60, gain: 0.55, at: 0.28 });
    burst(v, { dur: 0.1, freq: 700, gain: 0.35, at: 0.28 });
  },
  // A zombie's groan: a low, rough voice that glides down, with a wobble and a breathy noise.
  groan: (v) => {
    const p = pitch(v);
    const dur = 1.1 + v.variant * 0.7;
    tone(v, { dur, freq: 118 * p, freqTo: 66 * p, type: 'sawtooth', gain: 0.32, attack: 0.18, vibrato: { hz: 5 + v.variant * 3, depth: 7 } });
    tone(v, { dur: dur * 0.9, freq: 240 * p, freqTo: 120 * p, type: 'triangle', gain: 0.12, attack: 0.2, vibrato: { hz: 6, depth: 9 } });
    burst(v, { dur, freq: 700, freqTo: 380, type: 'bandpass', q: 2.5, gain: 0.22, attack: 0.2 });
  },
  // A menu click: a short, dry tick.
  ui: (v) => {
    tone(v, { dur: 0.045, freq: 1100, freqTo: 700, type: 'square', gain: 0.1 });
    burst(v, { dur: 0.02, freq: 3000, type: 'highpass', gain: 0.18 });
  },
  // A typewriter key: a clack.
  blip: (v) => {
    burst(v, { dur: 0.03, freq: 1800 * pitch(v), type: 'bandpass', q: 1.3, gain: 0.5 });
    tone(v, { dur: 0.03, freq: 240 * pitch(v), freqTo: 150, gain: 0.3 });
  },
};
