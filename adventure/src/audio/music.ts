/**
 * A small generative score, synthesized like the rest of the sound: a slow pad chord per bar and
 * sparse plucked notes from the mood's scale. Moods crossfade on room changes.
 */
export type MusicMood = 'warm' | 'tension' | 'cold' | 'wind' | 'combat' | 'nervous' | 'none';

interface MoodDef {
  /** Semitone offsets from the root for the scale the plucks pick from. */
  scale: number[];
  /** Pad chords (semitone offsets from the root), one per bar, cycled. */
  chords: number[][];
  root: number; // Hz
  barSeconds: number;
  /** Chance of a pluck on each beat (4 beats per bar). */
  pluck: number;
  padLevel: number;
  /** Pad filter cutoff (Hz): darker for tense or cold rooms. */
  cutoff: number;
  /**
   * A rhythmic layer (combat and nervous moods): the bar split into `steps`, a fixed motif of
   * scale notes (semitones above the root, null = rest) played as short stabs, and drum patterns.
   */
  groove?: {
    steps: number;
    motif: (number | null)[];
    kick?: number[];
    snare?: number[];
    /** A closed hi-hat every n steps. */
    hat?: number;
    /** A soft clock tick on every step (nervous). */
    tick?: boolean;
    /** A held low root under everything. */
    drone?: boolean;
    stabLevel: number;
  };
}

const MOODS: Record<Exclude<MusicMood, 'none'>, MoodDef> = {
  // Home and hearth: D major pentatonic, gentle movement.
  warm: { scale: [0, 2, 4, 7, 9, 12, 14], chords: [[0, 7, 16], [-3, 4, 12], [-7, 0, 9], [-5, 2, 11]], root: 146.83, barSeconds: 4.8, pluck: 0.32, padLevel: 0.05, cutoff: 1400 },
  // The gallery: D minor with a flat sixth, a held low fifth, few notes.
  tension: { scale: [0, 2, 3, 7, 8, 12], chords: [[0, 7, 15], [-4, 3, 12], [0, 7, 14], [-2, 5, 14]], root: 146.83, barSeconds: 6, pluck: 0.16, padLevel: 0.055, cutoff: 900 },
  // After the shutdown: bare fifths, almost silence.
  cold: { scale: [0, 7, 12, 14], chords: [[0, 7], [-5, 7]], root: 130.81, barSeconds: 8, pluck: 0.09, padLevel: 0.035, cutoff: 600 },
  // A fight: the warm theme's own notes (D major pentatonic, the same chords) at a run, with drums.
  combat: {
    scale: [0, 2, 4, 7, 9, 12, 14], chords: [[0, 7, 16], [-3, 4, 12], [-7, 0, 9], [-5, 2, 11]], root: 146.83, barSeconds: 1.9, pluck: 0, padLevel: 0, cutoff: 1800,
    groove: {
      steps: 16, stabLevel: 0.045, hat: 2,
      motif: [12, 14, 16, 19, 16, 14, 12, 9, 12, 14, 16, 21, 19, 16, 14, 12],
      kick: [0, 4, 8, 10, 12], snare: [4, 12],
    },
  },
  // After the fight, until the chapter ends: the combat track's motif and drums, a little slower
  // (about 116 bpm against 126) and thinner, over a ticking clock and a low drone. The fight could
  // start again at any moment.
  nervous: {
    scale: [0, 2, 4, 7, 9, 12, 14], chords: [[0, 7, 16], [-3, 4, 12], [-7, 0, 9], [-5, 2, 11]], root: 146.83, barSeconds: 2.07, pluck: 0, padLevel: 0, cutoff: 900,
    groove: {
      steps: 16, stabLevel: 0.036, hat: 4, tick: true, drone: true,
      motif: [12, null, 16, 19, null, 14, 12, null, 12, null, 16, 21, null, 16, 14, null],
      kick: [0, 6, 8, 14], snare: [12],
    },
  },
  // The ashways: open, high and airy, A minor pentatonic.
  wind: { scale: [0, 3, 5, 7, 10, 12, 15], chords: [[0, 7, 15, 19], [-2, 5, 12, 17]], root: 220, barSeconds: 7, pluck: 0.14, padLevel: 0.03, cutoff: 2200 },
};

const semis = (root: number, n: number) => root * 2 ** (n / 12);
const FADE = 2.2;

export class Music {
  private mood: MusicMood = 'none';
  private bus: GainNode | null = null;
  private timer = 0;
  private bar = 0;

  constructor(private readonly ctx: AudioContext, private readonly out: AudioNode) {}

  play(mood: MusicMood): void {
    if (mood === this.mood) return;
    this.mood = mood;
    const ctx = this.ctx;
    // Fade the old bus out and let it be collected.
    const old = this.bus;
    if (old) {
      old.gain.setTargetAtTime(0.0001, ctx.currentTime, FADE / 4);
      window.setTimeout(() => old.disconnect(), FADE * 2000);
    }
    window.clearInterval(this.timer);
    this.bus = null;
    if (mood === 'none') return;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + FADE);
    bus.connect(this.out);
    this.bus = bus;
    const def = MOODS[mood];
    this.bar = 0;
    this.playBar(def, bus);
    this.timer = window.setInterval(() => this.playBar(def, bus), def.barSeconds * 1000);
  }

  stop(): void {
    this.play('none');
  }

  private playBar(def: MoodDef, bus: GainNode): void {
    if (bus !== this.bus) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.05;
    if (def.groove) this.playGroove(def, bus, t, this.bar);
    const chord = def.chords[this.bar++ % def.chords.length];
    // The fight and nervous moods have no soft background chords: only their rhythmic layer.
    if (def.padLevel > 0) for (const n of chord) this.pad(bus, semis(def.root, n), t, def.barSeconds, def.padLevel, def.cutoff);
    const beat = def.barSeconds / 4;
    for (let b = 0; b < 4; b++) {
      if (Math.random() >= def.pluck) continue;
      const n = def.scale[Math.floor(Math.random() * def.scale.length)] + 12;
      this.pluckNote(bus, semis(def.root, n), t + b * beat + Math.random() * 0.08);
    }
  }

  /** One bar of the rhythmic layer: stabs on the motif, drums, ticks and the drone. */
  private playGroove(def: MoodDef, bus: GainNode, t: number, bar: number): void {
    const g = def.groove!;
    const step = def.barSeconds / g.steps;
    // Every other bar the motif answers itself a step higher in the scale, so it does not loop flat.
    const lift = bar % 2 ? 2 : 0;
    g.motif.forEach((n, i) => {
      if (n === null) return;
      const accent = i % 4 === 0 ? 1 : 0.7;
      this.stab(bus, semis(def.root, n + lift), t + i * step, step * 1.6, g.stabLevel * accent);
    });
    for (const i of g.kick ?? []) this.kick(bus, t + i * step);
    for (const i of g.snare ?? []) this.hit(bus, t + i * step, 'bandpass', 1900, 0.06, 0.12);
    if (g.hat) for (let i = 0; i < g.steps; i += g.hat) this.hit(bus, t + i * step, 'highpass', 7000, i % 4 === 0 ? 0.03 : 0.018, 0.03);
    if (g.tick) for (let i = 0; i < g.steps; i++) this.tick(bus, t + i * step, i % 4 === 0);
    if (g.drone) this.pad(bus, semis(def.root, -12), t, def.barSeconds, 0.04, 300);
  }

  /** A short, bright plucked stab (sawtooth through a closing lowpass). */
  private stab(bus: GainNode, freq: number, t: number, length: number, level: number): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.Q.value = 2;
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.exponentialRampToValueAtTime(500, t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(filter).connect(gain).connect(bus);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }

  private kick(bus: GainNode, t: number): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(gain).connect(bus);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  private noiseBuffer: AudioBuffer | null = null;
  private hit(bus: GainNode, t: number, type: BiquadFilterType, freq: number, level: number, decay: number): void {
    const ctx = this.ctx;
    if (!this.noiseBuffer) {
      this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type; filter.frequency.value = freq; filter.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(filter).connect(gain).connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + decay + 0.05);
  }

  private tick(bus: GainNode, t: number, strong: boolean): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = strong ? 1900 : 1500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(strong ? 0.012 : 0.007, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(gain).connect(bus);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /** A soft, slowly swelling chord tone: two slightly detuned triangles through a lowpass. */
  private pad(bus: GainNode, freq: number, t: number, length: number, level: number, cutoff: number): void {
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = cutoff; filter.Q.value = 0.4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + length * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length * 1.15);
    filter.connect(gain).connect(bus);
    for (const detune of [-6, 6]) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + length * 1.2);
    }
  }

  /** A short plucked note, like a struck pipe: sine plus a quiet octave, fast decay. */
  private pluckNote(bus: GainNode, freq: number, t: number): void {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    gain.connect(bus);
    for (const [mult, level] of [[1, 1], [2, 0.25]] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(gain);
      osc.start(t);
      osc.stop(t + 1.7);
    }
  }
}
