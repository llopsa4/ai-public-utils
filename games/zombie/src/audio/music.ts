// The music track (DESIGN §6 *Music*), made in code: low pads and a bass under a slow, dissonant motif in
// D minor, on an eight-bar loop of four chords. `drive` (0..1, from `audio/mood.ts`) intensifies it: the tempo
// rises, a low drum comes in, then high tremolo strings, then a ticking pulse; the pads open up. The top half
// of this file is pure (the score, the tempo and the voice levels, all tested); `Music` plays it on WebAudio,
// scheduling each eighth-note step a little ahead of the clock so it keeps time between frames.

export type Voice = 'pad' | 'bass' | 'motif' | 'drum' | 'high' | 'tick';
export const VOICES: readonly Voice[] = ['pad', 'bass', 'motif', 'drum', 'high', 'tick'];

/** One note: `len` is in steps (eighth notes), `vel` 0..1. Drum and tick notes have no pitch. */
export interface Note {
  voice: Voice;
  midi: number[];
  len: number;
  vel: number;
}

export const STEPS_PER_BAR = 8;
const STEPS_PER_CHORD = 2 * STEPS_PER_BAR;

/** The four chords (two bars each): Dm, Bb, Gm, then a tense A with a flat fifth. */
const CHORDS: readonly { bass: number; pad: number[]; tail: number }[] = [
  { bass: 38, pad: [57, 62, 65], tail: 69 }, // Dm: A3 D4 F4; the motif ends on A4
  { bass: 34, pad: [58, 62, 65], tail: 70 }, // Bb: Bb3 D4 F4; ends on Bb4
  { bass: 43, pad: [55, 58, 62], tail: 67 }, // Gm: G3 Bb3 D4; ends on G4
  { bass: 33, pad: [57, 61, 63], tail: 68 }, // A(b5): A3 C#4 Eb4; ends on G#4, against the chord
];
export const LOOP_STEPS = CHORDS.length * STEPS_PER_CHORD;

/** The motif over each chord: step within the two bars, pitch (null = the chord's tail note), length. */
const MOTIF: readonly [number, number | null, number][] = [
  [0, 74, 3], // D5
  [4, 75, 2], // Eb5, a semitone above: the sinister rub
  [6, 74, 2], // D5
  [8, null, 6], // down to the chord's tail note
];

/** Tempo in beats a minute: slow and heavy at rest, about twice as fast at full drive. */
export function tempo(drive: number): number {
  return 54 + 50 * clamp01(drive);
}

/** Seconds one step (an eighth note) lasts at this drive. */
export function stepSeconds(drive: number): number {
  return 60 / tempo(drive) / 2;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** 0 below `a`, 1 above `b`, a smooth curve between. */
function ramp(v: number, a: number, b: number): number {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Each voice's level at this drive: pads, bass and motif always; the drum, then the high strings, then the tick come in as it rises. */
export function voiceLevels(drive: number): Record<Voice, number> {
  const d = clamp01(drive);
  return {
    pad: 0.8 + 0.2 * d,
    bass: 0.85 + 0.15 * d,
    motif: 1 - 0.3 * ramp(d, 0.5, 1), // steps back a little under the percussion
    drum: ramp(d, 0.05, 0.45),
    high: ramp(d, 0.3, 0.75),
    tick: ramp(d, 0.55, 0.9),
  };
}

/** The pad's lowpass cutoff in Hz: dark at rest, open and harsher at full drive. */
export function padCutoff(drive: number): number {
  return 380 + 1600 * clamp01(drive);
}

/** The notes that start on this step (any integer; the score loops). `drive` adds the faster drum figure at the top. */
export function stepNotes(step: number, drive: number): Note[] {
  const i = ((step % LOOP_STEPS) + LOOP_STEPS) % LOOP_STEPS;
  const chord = CHORDS[Math.floor(i / STEPS_PER_CHORD)]!;
  const inChord = i % STEPS_PER_CHORD;
  const inBar = i % STEPS_PER_BAR;
  const out: Note[] = [];
  if (inChord === 0) {
    out.push({ voice: 'pad', midi: chord.pad, len: STEPS_PER_CHORD, vel: 1 });
    out.push({ voice: 'bass', midi: [chord.bass], len: STEPS_PER_CHORD, vel: 1 });
    out.push({ voice: 'high', midi: [chord.pad[2]! + 12, chord.pad[1]! + 24], len: STEPS_PER_CHORD, vel: 1 });
  }
  for (const [at, midi, len] of MOTIF) if (inChord === at) out.push({ voice: 'motif', midi: [midi ?? chord.tail], len, vel: at === 0 ? 1 : 0.8 });
  if (inBar === 0) out.push({ voice: 'drum', midi: [], len: 1, vel: 1 });
  else if (inBar === 4) out.push({ voice: 'drum', midi: [], len: 1, vel: 0.75 });
  else if (drive >= 0.75 && (inBar === 6 || inBar === 7)) out.push({ voice: 'drum', midi: [], len: 1, vel: 0.5 });
  out.push({ voice: 'tick', midi: [], len: 1, vel: inBar % 2 === 0 ? 1 : 0.55 });
  return out;
}

export function hz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

// ---- WebAudio ------------------------------------------------------------------------------------------

/** Each voice's own level (before `voiceLevels`), balanced by ear against the effects. */
const GAIN: Record<Voice, number> = { pad: 0.035, bass: 0.13, motif: 0.075, drum: 0.42, high: 0.022, tick: 0.05 };
const AHEAD = 0.3; // seconds of music scheduled in advance
const RAMP = 0.15; // seconds a voice level or the pad filter takes to settle

/** The music player: `update` once a frame with the drive; it sets the voice levels and schedules the coming steps into `out`. */
export class Music {
  private readonly bus: Record<Voice, GainNode>;
  private readonly padFilter: BiquadFilterNode;
  private next = 0; // context time of the next step
  private step = 0;

  constructor(
    private readonly ctx: BaseAudioContext,
    out: AudioNode,
    private readonly noise: AudioBuffer,
  ) {
    const bus = {} as Record<Voice, GainNode>;
    for (const v of VOICES) {
      bus[v] = ctx.createGain();
      bus[v].gain.value = 0;
    }
    this.bus = bus;
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = padCutoff(0);
    this.padFilter.Q.value = 0.8;
    bus.pad.connect(this.padFilter).connect(out);
    // The motif echoes once or twice, which makes the slow line feel far off in the trees.
    const echo = ctx.createDelay(1);
    echo.delayTime.value = 0.42;
    const back = ctx.createGain();
    back.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    bus.motif.connect(out);
    bus.motif.connect(echo).connect(back).connect(echo);
    echo.connect(wet).connect(out);
    for (const v of ['bass', 'drum', 'high', 'tick'] as const) bus[v].connect(out);
  }

  update(drive: number): void {
    const t = this.ctx.currentTime;
    const lv = voiceLevels(drive);
    for (const v of VOICES) this.bus[v].gain.setTargetAtTime(lv[v] * GAIN[v], t, RAMP);
    this.padFilter.frequency.setTargetAtTime(padCutoff(drive), t, RAMP * 3);
    if (this.next < t) this.next = t + 0.05; // the first step, or the clock ran on while no frames came
    while (this.next < t + AHEAD) {
      const dur = stepSeconds(drive);
      for (const n of stepNotes(this.step, drive)) if (lv[n.voice] > 0.01) this.play(n, this.next, n.len * dur);
      this.next += dur;
      this.step = (this.step + 1) % LOOP_STEPS;
    }
  }

  private play(n: Note, t: number, len: number): void {
    const c = this.ctx;
    const out = this.bus[n.voice];
    switch (n.voice) {
      case 'pad':
        for (const m of n.midi) for (const detune of [-7, 6]) this.tone('sawtooth', hz(m), detune, t, len, 1.6, 1.8, n.vel, out);
        break;
      case 'bass':
        for (const m of n.midi) {
          this.tone('sine', hz(m), 0, t, len, 0.4, 1.2, n.vel, out);
          this.tone('triangle', hz(m) * 2, 0, t, len, 0.6, 1.2, n.vel * 0.25, out);
        }
        break;
      case 'motif':
        for (const m of n.midi) this.tone('triangle', hz(m), 0, t, len * 0.9, 0.04, 0.9, n.vel, out);
        break;
      case 'high':
        for (const m of n.midi) this.strings(hz(m), t, len, n.vel, out);
        break;
      case 'drum': {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(95, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.3);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(n.vel, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.6);
        this.burst(t, 'lowpass', 500, 0.5 * n.vel, 0.12, out);
        break;
      }
      case 'tick':
        this.burst(t, 'highpass', 6500, n.vel, 0.035, out);
        break;
    }
  }

  /** A held tone with a slow attack and release (seconds). */
  private tone(type: OscillatorType, f: number, detune: number, t: number, len: number, attack: number, release: number, vel: number, out: AudioNode): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = detune;
    const a = Math.min(attack, len * 0.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + a);
    g.gain.setValueAtTime(vel, t + len);
    g.gain.linearRampToValueAtTime(0, t + len + release);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + len + release + 0.05);
  }

  /** A thin bowed string with a fast tremolo and a slight vibrato. */
  private strings(f: number, t: number, len: number, vel: number, out: AudioNode): void {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    const vib = c.createOscillator();
    const vibDepth = c.createGain();
    vib.frequency.value = 5.2;
    vibDepth.gain.value = f * 0.006;
    vib.connect(vibDepth).connect(o.frequency);
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = Math.min(4000, f * 3);
    band.Q.value = 0.9;
    const env = c.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vel, t + 0.5);
    env.gain.setValueAtTime(vel, t + len);
    env.gain.linearRampToValueAtTime(0, t + len + 0.8);
    const trem = c.createGain();
    trem.gain.value = 0.6;
    const lfo = c.createOscillator();
    const lfoDepth = c.createGain();
    lfo.frequency.value = 9;
    lfoDepth.gain.value = 0.4;
    lfo.connect(lfoDepth).connect(trem.gain);
    o.connect(band).connect(trem).connect(env).connect(out);
    const end = t + len + 0.85;
    for (const s of [o, vib, lfo]) {
      s.start(t);
      s.stop(end);
    }
  }

  /** A short burst of filtered noise (the drum's skin, the tick). */
  private burst(t: number, type: BiquadFilterType, f: number, vel: number, len: number, out: AudioNode): void {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const flt = c.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(flt).connect(g).connect(out);
    s.start(t, Math.random() * 2);
    s.stop(t + len + 0.02);
  }
}
