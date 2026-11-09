/**
 * A small generative score, synthesized like the rest of the sound: a slow pad chord per bar and
 * sparse plucked notes from the mood's scale. Moods crossfade on room changes.
 */
export type MusicMood = 'warm' | 'tension' | 'cold' | 'wind' | 'combat' | 'nervous' | 'title' | 'reveal' | 'none';

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

const MOODS: Record<Exclude<MusicMood, 'none' | 'title' | 'reveal'>, MoodDef> = {
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

/**
 * The title theme (the title screen and the chapter map): the warm music made dramatic, in the
 * manner of a Hans Zimmer cue. D minor over warm's own root, Dm–B♭–F–C (each cycle left hanging on
 * C), 84 bpm, driven by a low sixteenth-note ostinato. An endless 16-bar arc of four stages, one
 * chord cycle each: (1) the ostinato alone with a ticking clock; (2) taiko-like drums enter; (3) the
 * peak: low brass swells ("braams") and a slow high-strings theme; (4) a release to the ostinato.
 * It plays in a synthesized hall (reverb on this piece only).
 */
export const TITLE = {
  bpm: 84,
  bars: 16,
  root: 146.83,
  /** Dm, B♭, F, C as semitones above (or below) the root, one chord per bar. */
  chords: [[0, 7, 15], [-4, 3, 10], [3, 10, 15], [-2, 5, 14]],
  /** The high-strings theme, one held note per bar over the chords: A5, B♭5, A5, G5. */
  theme: [31, 32, 31, 29],
} as const;
const TITLE_BAR = (60 / TITLE.bpm) * 4;
/**
 * The Ashlands reveal (after Silas's intro): a one-off cue from the title theme's voices. Four bars
 * build (the ostinato rising, the clock, drums, braams), a hit on the fifth bar's downbeat ("The
 * Rift" appears), then the minor key resolves into D major and the warm music takes over. Times in
 * seconds from the start, for the scene to place the title on the music (src/game/reveal.ts).
 */
export const REVEAL_TIMING = {
  bar: TITLE_BAR,
  hit: TITLE_BAR * 4,
  subtitle: TITLE_BAR * 4 + 3,
  fadeOut: TITLE_BAR * 7,
  /** The warm music takes over; the chapter map follows. */
  end: TITLE_BAR * 8,
} as const;

/** Which stage of the arc a bar is in: 1 build, 2 drums, 3 peak, 4 release. */
export const titleStage = (bar: number): 1 | 2 | 3 | 4 => (Math.floor((bar % TITLE.bars) / 4) + 1) as 1 | 2 | 3 | 4;

export class Music {
  private mood: MusicMood = 'none';
  private bus: GainNode | null = null;
  /** Nodes hanging off the current bus (the title's reverb), let go with it. */
  private extras: AudioNode[] = [];

  /** The bus now playing (for rendering a piece offline). */
  get current(): GainNode | null { return this.bus; }
  private timer = 0;
  private bar = 0;

  constructor(private readonly ctx: AudioContext, private readonly out: AudioNode) {}

  play(mood: MusicMood): void {
    if (mood === this.mood) return;
    this.mood = mood;
    const ctx = this.ctx;
    // Fade the old bus out and let it be collected.
    const old = this.bus, oldExtras = this.extras;
    this.extras = [];
    if (old) {
      old.gain.setTargetAtTime(0.0001, ctx.currentTime, FADE / 4);
      window.setTimeout(() => { old.disconnect(); for (const n of oldExtras) n.disconnect(); }, FADE * 2000 + 3000);
    }
    window.clearInterval(this.timer);
    this.bus = null;
    if (mood === 'none') return;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + FADE);
    bus.connect(this.out);
    this.bus = bus;
    this.bar = 0;
    if (mood === 'title' || mood === 'reveal') {
      // The hall: a reverb send beside the dry signal.
      const hall = ctx.createConvolver();
      hall.buffer = this.hallImpulse();
      const wet = ctx.createGain();
      wet.gain.value = 0.35;
      bus.connect(hall).connect(wet).connect(this.out);
      this.extras = [hall, wet];
      if (mood === 'reveal') {
        // Played whole at once (it does not loop), with no fade in: it starts from near silence anyway.
        bus.gain.cancelScheduledValues(ctx.currentTime);
        bus.gain.setValueAtTime(1, ctx.currentTime);
        this.revealScore(bus, ctx.currentTime + 0.1);
        this.timer = window.setTimeout(() => { if (this.mood === 'reveal') this.play('warm'); }, REVEAL_TIMING.end * 1000);
        return;
      }
      this.titleBar(bus);
      this.timer = window.setInterval(() => this.titleBar(bus), TITLE_BAR * 1000);
      return;
    }
    const def = MOODS[mood];
    this.bar = 0;
    this.playBar(def, bus);
    this.timer = window.setInterval(() => this.playBar(def, bus), def.barSeconds * 1000);
  }

  stop(): void {
    this.play('none');
  }

  /** The Ashlands reveal's score, scheduled from `t0` (REVEAL_TIMING). */
  private revealScore(bus: GainNode, t0: number): void {
    const root = TITLE.root, step = TITLE_BAR / 16;
    // The build: four bars of Dm–B♭–F–C, louder and brighter each bar.
    for (let bar = 0; bar < 4; bar++) {
      const t = t0 + bar * TITLE_BAR, chord = TITLE.chords[bar], low = chord[0] - 12;
      for (const n of chord) this.pad(bus, semis(root, n), t, TITLE_BAR, 0.035, 800);
      const level = 0.045 + bar * 0.012, cutoff = 500 + bar * 330;
      for (let i = 0; i < 16; i++) this.ostinato(bus, semis(root, i % 4 === 2 ? low + 12 : low), t + i * step, step * 0.92, level * (i % 4 === 0 ? 1 : 0.62), cutoff);
      if (bar <= 1) for (let i = 0; i < 16; i += 2) this.tick(bus, t + i * step, i % 8 === 0);
      if (bar >= 1) for (const i of [0, 8]) this.taiko(bus, t + i * step, 0.16 + bar * 0.04);
      if (bar >= 2) this.braam(bus, semis(root, low), t, TITLE_BAR);
      if (bar === 3) for (const i of [12, 13, 14, 15]) this.taiko(bus, t + i * step, 0.14 + (i - 12) * 0.04);
    }
    // The hit: taiko and a braam on D, with the strings on a high D.
    const hit = t0 + REVEAL_TIMING.hit;
    this.taiko(bus, hit, 0.55);
    this.braam(bus, semis(root, -12), hit, TITLE_BAR * 1.5);
    this.strings(bus, semis(root, 24), hit, TITLE_BAR * 2, 0.05);
    // The release: D major at last (warm's own chord), the strings settling on F♯ then A, and one
    // last soft pulse of the ostinato dying away.
    for (let bar = 4; bar < 8; bar++) {
      const t = t0 + bar * TITLE_BAR, fade = 1 - (bar - 4) * 0.22;
      for (const n of [0, 7, 16]) this.pad(bus, semis(root, n), t, TITLE_BAR, 0.05 * fade, 1300);
      if (bar === 4) for (let i = 0; i < 16; i++) this.ostinato(bus, semis(root, i % 4 === 2 ? 0 : -12), t + i * step, step * 0.92, 0.03 * (1 - i / 16), 700);
    }
    this.strings(bus, semis(root, 28), t0 + TITLE_BAR * 5.5, TITLE_BAR * 1.5, 0.035);
    this.strings(bus, semis(root, 31), t0 + TITLE_BAR * 6.5, TITLE_BAR * 1.5, 0.03);
  }

  /** A low hit (taiko and braam on D, through the hall) that opens the title theme on the first click. */
  openingHit(): void {
    const ctx = this.ctx, t = ctx.currentTime + 0.03;
    const bus = ctx.createGain();
    bus.gain.value = 1;
    const hall = ctx.createConvolver();
    hall.buffer = this.hallImpulse();
    const wet = ctx.createGain();
    wet.gain.value = 0.45;
    bus.connect(this.out);
    bus.connect(hall).connect(wet).connect(this.out);
    this.taiko(bus, t, 0.5);
    this.braam(bus, 73.42, t, 2.4);
    window.setTimeout(() => { bus.disconnect(); hall.disconnect(); wet.disconnect(); }, 9000);
  }

  private hall: AudioBuffer | null = null;
  /** A hall's echo, made once: 2.8 s of decaying stereo noise. */
  private hallImpulse(): AudioBuffer {
    if (this.hall) return this.hall;
    const ctx = this.ctx, length = Math.floor(ctx.sampleRate * 2.8);
    const buf = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
    return (this.hall = buf);
  }

  /** One bar of the title theme, its layers chosen by the stage of the 16-bar arc (at `at`: rendering offline). */
  titleBar(bus: GainNode, at = this.ctx.currentTime + 0.05): void {
    if (bus !== this.bus) return;
    const t = at;
    const bar = this.bar++, stage = titleStage(bar), inArc = bar % TITLE.bars;
    const chord = TITLE.chords[bar % 4], root = TITLE.root;
    const step = TITLE_BAR / 16;
    // Warm's own pad, darker and quiet: what ties the two pieces together.
    for (const n of chord) this.pad(bus, semis(root, n), t, TITLE_BAR, 0.04, 900);
    // The ostinato: low sixteenths on the chord's root (root, root, octave, root), the filter
    // opening as the arc builds and closing in the release.
    const low = chord[0] - 12;
    const cutoff = [520, 800, 1400, 650][stage - 1];
    const level = [0.05, 0.062, 0.078, 0.046][stage - 1];
    for (let i = 0; i < 16; i++) {
      const n = i % 4 === 2 ? low + 12 : low;
      this.ostinato(bus, semis(root, n), t + i * step, step * 0.92, level * (i % 4 === 0 ? 1 : 0.62), cutoff);
    }
    // The clock: only while it builds.
    if (stage <= 2) for (let i = 0; i < 16; i += 2) this.tick(bus, t + i * step, i % 8 === 0);
    // Taiko on beats 1 and 3; a roll into the next stage at the end of stages 2 and 3.
    if (stage === 2 || stage === 3) {
      for (const i of [0, 8]) this.taiko(bus, t + i * step, 0.22);
      if (inArc === 7 || inArc === 11) for (const i of [12, 13, 14, 15]) this.taiko(bus, t + i * step, 0.12 + (i - 12) * 0.03);
    }
    // The peak: a braam on every chord, and the high-strings theme held over it (fading in the
    // release's first bar).
    if (stage === 3) this.braam(bus, semis(root, chord[0] - 12), t, TITLE_BAR);
    if (stage === 3 || inArc === 12) this.strings(bus, semis(root, TITLE.theme[bar % 4]), t, TITLE_BAR, stage === 3 ? 0.045 : 0.02);
  }

  /** A low bowed sixteenth: a sawtooth through a resonant lowpass, short and tight. */
  private ostinato(bus: GainNode, freq: number, t: number, length: number, level: number, cutoff: number): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.Q.value = 3;
    filter.frequency.setValueAtTime(cutoff * 1.5, t);
    filter.frequency.exponentialRampToValueAtTime(cutoff, t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(filter).connect(gain).connect(bus);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }

  /** A taiko-like drum: a deep falling sine with a low thump of noise. */
  private taiko(bus: GainNode, t: number, level: number): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(82, t);
    osc.frequency.exponentialRampToValueAtTime(34, t + 0.45);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    osc.connect(gain).connect(bus);
    osc.start(t);
    osc.stop(t + 0.75);
    this.hit(bus, t, 'lowpass', 320, level * 0.5, 0.12);
  }

  /** A braam: low detuned sawtooths (root and fifth) swelling through an opening lowpass, bent up into the note. */
  private braam(bus: GainNode, freq: number, t: number, length: number): void {
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.exponentialRampToValueAtTime(1300, t + length * 0.45);
    filter.frequency.exponentialRampToValueAtTime(260, t + length * 1.05);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.13, t + length * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length * 1.1);
    filter.connect(gain).connect(bus);
    for (const [ratio, detune] of [[1, -9], [1, 9], [1.5, 0], [0.5, 0]] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * ratio * 0.96, t);
      osc.frequency.exponentialRampToValueAtTime(freq * ratio, t + 0.35);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + length * 1.15);
    }
  }

  /** A held high string note: two detuned sawtooths, a slow bow, a gentle vibrato. */
  private strings(bus: GainNode, freq: number, t: number, length: number, level: number): void {
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 2800; filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + length * 0.55);
    gain.gain.setValueAtTime(level, t + length * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length * 1.25);
    filter.connect(gain).connect(bus);
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5;
    const depth = ctx.createGain();
    depth.gain.value = 7; // cents
    vibrato.connect(depth);
    for (const detune of [-8, 8]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      depth.connect(osc.detune);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + length * 1.3);
    }
    vibrato.start(t);
    vibrato.stop(t + length * 1.3);
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
