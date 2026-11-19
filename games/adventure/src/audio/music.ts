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

const MOODS: Record<Exclude<MusicMood, 'none' | 'title' | 'reveal' | 'combat'>, MoodDef> = {
  // Home and hearth: D major pentatonic, gentle movement.
  warm: { scale: [0, 2, 4, 7, 9, 12, 14], chords: [[0, 7, 16], [-3, 4, 12], [-7, 0, 9], [-5, 2, 11]], root: 146.83, barSeconds: 4.8, pluck: 0.32, padLevel: 0.05, cutoff: 1400 },
  // The gallery: D minor with a flat sixth, a held low fifth, few notes.
  tension: { scale: [0, 2, 3, 7, 8, 12], chords: [[0, 7, 15], [-4, 3, 12], [0, 7, 14], [-2, 5, 14]], root: 146.83, barSeconds: 6, pluck: 0.16, padLevel: 0.055, cutoff: 900 },
  // After the shutdown: bare fifths, almost silence.
  cold: { scale: [0, 7, 12, 14], chords: [[0, 7], [-5, 7]], root: 130.81, barSeconds: 8, pluck: 0.09, padLevel: 0.035, cutoff: 600 },
  // A fight: the warm theme's own notes (D major pentatonic, the same chords) at a run, with drums.
  // After the fight, until the chapter ends: a nervous motif and drums (about 116 bpm), thin, over a
  // ticking clock and a low drone. The fight could start again at any moment.
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

/**
 * The battle theme (fights): an original piece in the manner of a classic JRPG battle theme, built
 * from the game's own material. D minor over warm's root; section A rides the title theme's
 * Dm–B♭–F–C, its melody grown from the title's high-strings phrase (A–B♭–A–G); section B climbs
 * Gm–B♭–C to an A major that throws it back to the top. 152 bpm: driving eighth-note bass with
 * octave jumps, a sixteenth string ostinato (the title's), snare on two and four, the title's taiko
 * and braams on section changes, warm's plucks as a quiet counter-line. A two-bar call to arms
 * opens it once; then the 16 bars loop.
 */
export const BATTLE = {
  bpm: 152,
  root: 146.83,
  /** Chords (semitones from D3), one per bar: section A then section B. */
  chords: [
    [0, 7, 15], [-4, 3, 10], [3, 10, 15], [-2, 5, 14], [0, 7, 15], [-4, 3, 10], [3, 10, 15], [-2, 5, 14],
    [5, 10, 14], [5, 10, 14], [-4, 3, 10], [-4, 3, 10], [-2, 5, 14], [-2, 5, 14], [7, 11, 14], [7, 11, 14],
  ],
  /** The lead melody per bar: [semitones from D3, start eighth, length in eighths]. */
  melody: [
    [[31, 0, 3], [32, 3, 1], [31, 4, 2], [29, 6, 1], [27, 7, 1]],
    [[27, 0, 3], [26, 3, 1], [24, 4, 4]],
    [[24, 0, 2], [27, 2, 2], [31, 4, 3], [34, 7, 1]],
    [[36, 0, 4], [34, 4, 2], [31, 6, 2]],
    [[31, 0, 3], [32, 3, 1], [31, 4, 2], [29, 6, 1], [27, 7, 1]],
    [[27, 0, 2], [29, 2, 2], [31, 4, 2], [32, 6, 2]],
    [[34, 0, 3], [32, 3, 1], [31, 4, 4]],
    [[29, 0, 4], [31, 4, 4]],
    [[29, 0, 2], [31, 2, 2], [32, 4, 4]],
    [[34, 0, 2], [32, 2, 2], [31, 4, 2], [29, 6, 2]],
    [[32, 0, 4], [34, 4, 4]],
    [[36, 0, 3], [34, 3, 1], [32, 4, 4]],
    [[34, 0, 2], [36, 2, 2], [38, 4, 4]],
    [[36, 0, 8]],
    [[31, 0, 2], [35, 2, 2], [38, 4, 4]],
    [[38, 0, 4], [35, 4, 2], [31, 6, 2]],
  ] as readonly (readonly [number, number, number])[][],
} as const;
const BATTLE_BAR = (60 / BATTLE.bpm) * 4;
/** The opening call to arms (played once), in bars. */
const BATTLE_INTRO = 2;

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
      // Into a fight the room's music cuts out at once: the battle theme is the only music.
      old.gain.setTargetAtTime(0.0001, ctx.currentTime, mood === 'combat' ? 0.04 : FADE / 4);
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
    if (mood === 'combat') {
      // A little room around it (the title's hall, drier), the call to arms, then the loop.
      const hall = ctx.createConvolver();
      hall.buffer = this.hallImpulse();
      const wet = ctx.createGain();
      wet.gain.value = 0.16;
      bus.connect(hall).connect(wet).connect(this.out);
      this.extras = [hall, wet];
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setValueAtTime(0.0001, ctx.currentTime);
      bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.25);
      this.bar = -BATTLE_INTRO;
      this.battleBar(bus);
      this.timer = window.setInterval(() => this.battleBar(bus), BATTLE_BAR * 1000);
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

  /** One bar of the battle theme (BATTLE): the call to arms first, then the 16-bar loop. */
  battleBar(bus: GainNode, at = this.ctx.currentTime + 0.05): void {
    if (bus !== this.bus) return;
    const t = at, bar = this.bar++, root = BATTLE.root;
    const eighth = BATTLE_BAR / 8, sixteenth = BATTLE_BAR / 16;
    if (bar < 0) {
      // The call to arms: a rising unison run, then a hit with a drum roll into the loop.
      if (bar === -2) {
        [0, 2, 3, 5, 7, 8, 10, 12].forEach((n, i) => {
          this.lead(bus, semis(root, n + 12), t + i * eighth, eighth * 0.9, 0.05);
          this.ostinato(bus, semis(root, n - 12), t + i * eighth, eighth * 0.9, 0.07, 900);
        });
        for (const i of [0, 4]) this.taiko(bus, t + i * eighth, 0.35);
      } else {
        this.taiko(bus, t, 0.6);
        this.braam(bus, semis(root, -12), t, BATTLE_BAR);
        this.lead(bus, semis(root, 31), t, eighth * 5, 0.06);
        for (let i = 8; i < 16; i++) this.hit(bus, t + i * sixteenth, 'bandpass', 1900, 0.03 + (i - 8) * 0.008, 0.08);
      }
      return;
    }
    const n = bar % 16, chord = BATTLE.chords[n], low = chord[0] - 12, sectionB = n >= 8;
    // The bass: eighths on the root with octave jumps.
    [0, 0, 12, 0, 0, 12, 0, 12].forEach((o, i) => this.ostinato(bus, semis(root, low - 12 + o), t + i * eighth, eighth * 0.85, 0.075 * (i % 2 ? 0.75 : 1), 1100));
    // The title's string ostinato, up an octave, quieter: the drive under everything.
    for (let i = 0; i < 16; i++) this.ostinato(bus, semis(root, chord[i % 3]), t + i * sixteenth, sixteenth * 0.8, 0.022, 1800);
    // Drums: kick on one and three (and a push in section B), snare on two and four, eighth hats.
    for (const i of sectionB ? [0, 3, 4, 6] : [0, 4]) this.kick(bus, t + i * eighth);
    for (const i of [2, 6]) this.hit(bus, t + i * eighth, 'bandpass', 1900, 0.07, 0.12);
    for (let i = 0; i < 8; i++) this.hit(bus, t + i * eighth, 'highpass', 7000, i % 2 ? 0.016 : 0.026, 0.03);
    // A snare fill into each section's start.
    if (n === 7 || n === 15) for (let i = 12; i < 16; i++) this.hit(bus, t + i * sixteenth, 'bandpass', 2100, 0.05 + (i - 12) * 0.012, 0.08);
    // Section changes: the title's taiko and braam.
    if (n === 0 || n === 8) { this.taiko(bus, t, 0.45); this.braam(bus, semis(root, low), t, BATTLE_BAR * 1.5); }
    // Section B: brass stabs on the chord, on the offbeats.
    if (sectionB) for (const i of [1, 3, 5]) for (const c of chord) this.stab(bus, semis(root, c), t + i * eighth, eighth * 0.8, 0.018);
    // The melody.
    for (const [note, start, len] of BATTLE.melody[n]) this.lead(bus, semis(root, note), t + start * eighth, len * eighth * 0.95, 0.055);
    // Warm's plucks, quietly answering in section A.
    if (!sectionB) for (const i of [1, 5]) this.pluckNote(bus, semis(root, chord[(i + n) % 3] + 24), t + i * eighth);
    // The chord underneath, warm's pad, dark.
    for (const c of chord) this.pad(bus, semis(root, c), t, BATTLE_BAR, 0.03, 900);
  }

  /** The battle theme's lead: a soaring string section (three detuned saws, doubled an octave below),
   * bowed in quickly, with vibrato blooming on the longer notes and a slight swell. */
  private lead(bus: GainNode, freq: number, t: number, length: number, level: number): void {
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 3000; filter.Q.value = 0.4;
    const gain = ctx.createGain();
    const long = length > 0.35;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level * 0.85, t + 0.04);
    gain.gain.linearRampToValueAtTime(level * (long ? 1.1 : 0.9), t + Math.max(0.06, length * 0.8));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length + 0.18);
    filter.connect(gain).connect(bus);
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5.5;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, t);
    if (long) depth.gain.linearRampToValueAtTime(10, t + Math.min(0.35, length * 0.6));
    vibrato.connect(depth);
    const voices: [number, number, number][] = [[freq, -10, 1], [freq, 0, 1], [freq, 10, 1], [freq / 2, -6, 0.55], [freq / 2, 6, 0.55]];
    for (const [f, detune, mix] of voices) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = detune;
      depth.connect(osc.detune);
      const g = ctx.createGain();
      g.gain.value = mix * 0.45;
      osc.connect(g).connect(filter);
      osc.start(t);
      osc.stop(t + length + 0.22);
    }
    vibrato.start(t);
    vibrato.stop(t + length + 0.22);
  }

  /** The Ashlands reveal's score, scheduled from `t0` (REVEAL_TIMING). */
  private revealScore(bus: GainNode, t0: number): void {
    const root = TITLE.root, step = TITLE_BAR / 16;
    // The build: four bars of Dm–B♭–F–C, louder and brighter each bar.
    for (let bar = 0; bar < 4; bar++) {
      const t = t0 + bar * TITLE_BAR, chord = TITLE.chords[bar], low = chord[0] - 12;
      for (const n of chord) this.pad(bus, semis(root, n), t, TITLE_BAR, 0.035, 800);
      const level = 0.045 + bar * 0.012, cutoff = 500 + bar * 330;
      // The last sixteenth before the hit is silent: a breath held.
      const last = bar === 3 ? 15 : 16;
      for (let i = 0; i < last; i++) this.ostinato(bus, semis(root, i % 4 === 2 ? low + 12 : low), t + i * step, step * 0.92, level * (i % 4 === 0 ? 1 : 0.62), cutoff);
      if (bar <= 1) for (let i = 0; i < 16; i += 2) this.tick(bus, t + i * step, i % 8 === 0);
      if (bar >= 1) for (const i of [0, 8]) this.taiko(bus, t + i * step, 0.16 + bar * 0.04);
      if (bar >= 2) this.braam(bus, semis(root, low), t, TITLE_BAR);
      if (bar === 3) for (const i of [11, 12, 13, 14]) this.taiko(bus, t + i * step, 0.16 + (i - 11) * 0.06);
    }
    // The riser: two bars of noise sweeping up, and the strings climbing a fifth into the hit.
    const hit = t0 + REVEAL_TIMING.hit;
    this.riser(bus, hit - TITLE_BAR * 2, TITLE_BAR * 2 - step);
    this.strings(bus, semis(root, 19), hit - TITLE_BAR * 2, TITLE_BAR, 0.025);
    this.strings(bus, semis(root, 22), hit - TITLE_BAR, TITLE_BAR - step, 0.035);
    // The hit, as "The Rift" appears: layered low taikos, a braam doubled at the octave and the fifth,
    // a crash ringing out in the hall, and the strings on a full D chord; about twice the old hit.
    for (const [dt, level] of [[0, 0.9], [0.012, 0.7], [0.03, 0.55]] as const) this.taiko(bus, hit + dt, level);
    this.braam(bus, semis(root, -12), hit, TITLE_BAR * 1.8);
    this.braam(bus, semis(root, -24), hit, TITLE_BAR * 1.8);
    this.braam(bus, semis(root, -5), hit, TITLE_BAR * 1.5);
    this.hit(bus, hit, 'highpass', 3500, 0.35, 2.8);
    this.hit(bus, hit, 'bandpass', 900, 0.3, 1.6);
    for (const n of [12, 19, 24, 28]) this.strings(bus, semis(root, n), hit, TITLE_BAR * 2, 0.045);
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

  /** A rising swell: noise through a bandpass sweeping up, growing louder until it stops dead. */
  private riser(bus: GainNode, t: number, length: number): void {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.Q.value = 2.5;
    filter.frequency.setValueAtTime(280, t);
    filter.frequency.exponentialRampToValueAtTime(5200, t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + length);
    gain.gain.setValueAtTime(0.0001, t + length + 0.01);
    src.connect(filter).connect(gain).connect(bus);
    src.start(t);
    src.stop(t + length + 0.05);
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
  /** One second of white noise, made once (hits, the riser). */
  private noise(): AudioBuffer {
    if (!this.noiseBuffer) {
      this.noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const d = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuffer;
  }
  private hit(bus: GainNode, t: number, type: BiquadFilterType, freq: number, level: number, decay: number): void {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
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
