/**
 * A small generative score, synthesized like the rest of the sound: a slow pad chord per bar and
 * sparse plucked notes from the mood's scale. Moods crossfade on room changes.
 */
export type MusicMood = 'warm' | 'tension' | 'cold' | 'wind' | 'none';

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
}

const MOODS: Record<Exclude<MusicMood, 'none'>, MoodDef> = {
  // Home and hearth: D major pentatonic, gentle movement.
  warm: { scale: [0, 2, 4, 7, 9, 12, 14], chords: [[0, 7, 16], [-3, 4, 12], [-7, 0, 9], [-5, 2, 11]], root: 146.83, barSeconds: 4.8, pluck: 0.32, padLevel: 0.05, cutoff: 1400 },
  // The gallery: D minor with a flat sixth, a held low fifth, few notes.
  tension: { scale: [0, 2, 3, 7, 8, 12], chords: [[0, 7, 15], [-4, 3, 12], [0, 7, 14], [-2, 5, 14]], root: 146.83, barSeconds: 6, pluck: 0.16, padLevel: 0.055, cutoff: 900 },
  // After the shutdown: bare fifths, almost silence.
  cold: { scale: [0, 7, 12, 14], chords: [[0, 7], [-5, 7]], root: 130.81, barSeconds: 8, pluck: 0.09, padLevel: 0.035, cutoff: 600 },
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
    const chord = def.chords[this.bar++ % def.chords.length];
    for (const n of chord) this.pad(bus, semis(def.root, n), t, def.barSeconds, def.padLevel, def.cutoff);
    const beat = def.barSeconds / 4;
    for (let b = 0; b < 4; b++) {
      if (Math.random() >= def.pluck) continue;
      const n = def.scale[Math.floor(Math.random() * def.scale.length)] + 12;
      this.pluckNote(bus, semis(def.root, n), t + b * beat + Math.random() * 0.08);
    }
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
