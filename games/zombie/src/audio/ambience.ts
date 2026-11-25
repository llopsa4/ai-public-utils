import { audio } from './engine';
import { type Mood, SILENT, approach, drive } from './mood';
import { Music } from './music';

// The adaptive music and ambience's sound (DESIGN §6 *Audio*, *Music*), made in code like the effects, on the
// engine's ambience bus. The rules for how loud each layer is are `audio/mood.ts`. The bed holds the music
// (`audio/music.ts`, intensified by the tension and the herd) and a quiet wind; the herd layer and the rain
// run all the time and are only turned up or down.

/** Each layer's top level (before the bus and the options' volumes). */
export const MAX: Record<'bed' | 'herd', number> = { bed: 0.8, herd: 0.8 };
const RAMP = 0.12; // seconds a level change takes to settle, so a frame-by-frame fade does not step
const MAX_DT = 0.25; // a longer gap between frames (a pause) counts as this much for the fades

/** The rain layer's top level (Base 1 only, DESIGN §20): it follows the rain level, not the mood, and stays on when the weather option hides the drops. */
export const RAIN_MAX = 0.5;

export interface Layers {
  bed: GainNode;
  herd: GainNode;
  rain: GainNode;
  music: Music;
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

/** Builds the layers into `bus` (all silent at first). */
export function buildLayers(ctx: BaseAudioContext, bus: AudioNode, noise: AudioBuffer): Layers {
  const layer = (): GainNode => {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(bus);
    return g;
  };
  const bed = layer();
  const herd = layer();
  const rain = layer();

  // Rain: a hiss of filtered noise with a lower patter under it, both swelling and thinning a little.
  const hiss = loop(ctx, noise);
  const hissHigh = ctx.createBiquadFilter();
  hissHigh.type = 'highpass';
  hissHigh.frequency.value = 1800;
  const hissBand = ctx.createBiquadFilter();
  hissBand.type = 'bandpass';
  hissBand.frequency.value = 5200;
  hissBand.Q.value = 0.4;
  const hissGain = ctx.createGain();
  hissGain.gain.value = 0.125; // −12 dB (Z66): the hiss sits well under the effects
  wobble(ctx, hissGain.gain, 0.09, 0.03);
  hiss.connect(hissHigh).connect(hissBand).connect(hissGain).connect(rain);
  hiss.start(0, 0.4);
  const patter = loop(ctx, noise);
  const patterBand = ctx.createBiquadFilter();
  patterBand.type = 'bandpass';
  patterBand.frequency.value = 1400;
  patterBand.Q.value = 0.7;
  const patterGain = ctx.createGain();
  patterGain.gain.value = 0.35;
  wobble(ctx, patterGain.gain, 0.13, 0.15);
  patter.connect(patterBand).connect(patterGain).connect(rain);
  patter.start(0, 1.1);

  // Bed: the music (added at the end) over a quiet wind that swells and thins on two slow cycles.
  const wind = loop(ctx, noise);
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.6;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.06; // quieter again under the music (Z75)
  wobble(ctx, windFilter.frequency, 0.045, 160);
  wobble(ctx, windGain.gain, 0.07, 0.05);
  wind.connect(windFilter).connect(windGain).connect(bed);
  wind.start();

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

  return { bed, herd, rain, music: new Music(ctx, bed, noise) };
}

/** The ambience: `update` once a frame with the wanted layers (`moodOf`) and it fades towards them, music included; `rain` (0..1) is the rain layer's level, already smooth. */
export class Ambience {
  private layers: Layers | null = null;
  private cur: Mood = SILENT;
  private last = 0;

  update(want: Mood, rain = 0): void {
    const a = audio.ambience;
    if (!a || a.ctx.state !== 'running') return;
    this.layers ??= buildLayers(a.ctx, a.bus, a.noise);
    const now = performance.now();
    const dt = this.last ? Math.min(MAX_DT, (now - this.last) / 1000) : 0;
    this.last = now;
    this.cur = approach(this.cur, want, dt);
    const t = a.ctx.currentTime;
    for (const k of ['bed', 'herd'] as const) this.layers[k].gain.setTargetAtTime(this.cur[k] * MAX[k], t, RAMP);
    this.layers.rain.gain.setTargetAtTime(Math.max(0, Math.min(1, rain)) * RAIN_MAX, t, RAMP * 4);
    this.layers.music.update(drive(this.cur));
  }

  /** Where the layers are now (for the checks). */
  get level(): Mood {
    return this.cur;
  }
}

/** The game's one ambience. Scenes drive it through `Feel.frame` and the title menu. */
export const ambience = new Ambience();
