import { audio } from './engine';
import { type LayerId, type Mood, SILENT, approach, beatGap } from './mood';

// The adaptive ambience's sound (DESIGN §6 *Audio*), made in code like the effects: three layers on the
// engine's ambience bus. The rules for which layer is wanted are `audio/mood.ts`; this file builds the layers
// and fades them. The bed and the herd layer run all the time and are only turned up or down; the pulse is a
// heartbeat scheduled a little ahead of the clock, so it keeps its rhythm between frames.

/** Each layer's top level (before the bus and the options' volumes), balanced by measuring each one offline. */
export const MAX: Record<LayerId, number> = { bed: 0.8, pulse: 0.55, herd: 0.8 };
const RAMP = 0.12; // seconds a level change takes to settle, so a frame-by-frame fade does not step
const AHEAD = 0.25; // seconds of heartbeat scheduled in advance
const MAX_DT = 0.25; // a longer gap between frames (a pause) counts as this much for the fades

export interface Layers {
  bed: GainNode;
  pulse: GainNode;
  herd: GainNode;
  /** Schedules the heartbeat thuds up to a little past `now` at `level`; returns nothing. */
  beat(now: number, level: number): void;
}

function loop(ctx: BaseAudioContext, noise: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  return src;
}

/** A slow oscillator whose output (±depth) is added to `param`. */
function wobble(ctx: BaseAudioContext, param: AudioParam, hz: number, depth: number): void {
  const lfo = ctx.createOscillator();
  const d = ctx.createGain();
  lfo.frequency.value = hz;
  d.gain.value = depth;
  lfo.connect(d).connect(param);
  lfo.start();
}

function osc(ctx: BaseAudioContext, type: OscillatorType, hz: number, level: number, out: AudioNode): void {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = hz;
  g.gain.value = level;
  o.connect(g).connect(out);
  o.start();
}

/** Builds the three layers into `bus` (all silent at first). Exported for the offline checks. */
export function buildLayers(ctx: BaseAudioContext, bus: AudioNode, noise: AudioBuffer): Layers {
  const layer = (): GainNode => {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(bus);
    return g;
  };
  const bed = layer();
  const pulse = layer();
  const herd = layer();

  // Bed: wind that swells and thins on two slow cycles, over a low drone of two close notes that beat slowly.
  const wind = loop(ctx, noise);
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.6;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.32;
  wobble(ctx, windFilter.frequency, 0.045, 160);
  wobble(ctx, windGain.gain, 0.07, 0.2);
  wind.connect(windFilter).connect(windGain).connect(bed);
  wind.start();
  osc(ctx, 'sine', 55, 0.14, bed);
  osc(ctx, 'sine', 55.7, 0.1, bed);
  osc(ctx, 'triangle', 82.4, 0.03, bed);

  // Herd: a heavy low saw pair and a rumble, with a faint dissonant tone that makes it uneasy.
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 150;
  lowpass.Q.value = 2;
  lowpass.connect(herd);
  osc(ctx, 'sawtooth', 36, 0.3, lowpass);
  osc(ctx, 'sawtooth', 37.4, 0.26, lowpass);
  osc(ctx, 'sawtooth', 54, 0.1, lowpass);
  osc(ctx, 'sine', 100, 0.035, herd);
  osc(ctx, 'sine', 141, 0.025, herd);
  const rumble = loop(ctx, noise);
  const rumbleFilter = ctx.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 110;
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.7;
  wobble(ctx, rumbleGain.gain, 0.11, 0.3);
  rumble.connect(rumbleFilter).connect(rumbleGain).connect(herd);
  rumble.start();

  // Pulse: a two-part heartbeat (a firm thud, then a softer one) with a faint click of noise on the first.
  let next = 0;
  const thud = (t: number, hz: number, peak: number): void => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(hz, t);
    o.frequency.exponentialRampToValueAtTime(hz * 0.55, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(pulse);
    o.start(t);
    o.stop(t + 0.25);
  };
  const click = (t: number): void => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 260;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(f).connect(g).connect(pulse);
    s.start(t, 0.3);
    s.stop(t + 0.08);
  };
  const beat = (now: number, level: number): void => {
    if (level < 0.02) {
      next = 0;
      return;
    }
    if (next < now) next = now + 0.02; // first beat, or the clock ran on while no frames came
    while (next < now + AHEAD) {
      thud(next, 62, 1);
      click(next);
      thud(next + 0.17, 54, 0.6);
      next += beatGap(level);
    }
  };

  return { bed, pulse, herd, beat };
}

/** The ambience: `update` once a frame with the wanted layers (`moodOf`) and it fades towards them. */
export class Ambience {
  private layers: Layers | null = null;
  private cur: Mood = SILENT;
  private last = 0;

  update(want: Mood): void {
    const a = audio.ambience;
    if (!a || a.ctx.state !== 'running') return;
    this.layers ??= buildLayers(a.ctx, a.bus, a.noise);
    const now = performance.now();
    const dt = this.last ? Math.min(MAX_DT, (now - this.last) / 1000) : 0;
    this.last = now;
    this.cur = approach(this.cur, want, dt);
    const t = a.ctx.currentTime;
    for (const k of ['bed', 'pulse', 'herd'] as const) this.layers[k].gain.setTargetAtTime(this.cur[k] * MAX[k], t, RAMP);
    this.layers.beat(t, this.cur.pulse);
  }

  /** Where the layers are now (for the checks). */
  get level(): Mood {
    return this.cur;
  }
}

/** The game's one ambience. Scenes drive it through `Feel.frame` and the title menu. */
export const ambience = new Ambience();
