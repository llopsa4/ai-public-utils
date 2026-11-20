// Original music made with Web Audio, no sound files (DESIGN-hunting.md `## Music`): a calm ambient bed (a soft
// flute-like melody, a low heartbeat drum, light wind) and a war track (a driving drum, a tense low drone) that
// plays only while wolves are on the map. Browsers allow sound only after a click, so the context starts on the
// first pointer or key press. The pure rules are in `theory.ts`.
import { makeRng, type RngState } from '../sim/rng';
import {
  AMBIENT_BEAT, WAR_BEAT, cycleSeconds, nextMode, nextNote, noteFreq, patternHits,
  type ModeState, type MusicMode, type Pattern,
} from './theory';

const KEY = 'survival.music';
/** Seconds a track keeps playing after its fade-out starts. */
const FADE = 3;
const LOOKAHEAD = 0.4;

interface Prefs {
  on: boolean;
  volume: number;
}

interface Track {
  bus: GainNode;
  /** Context time of the next drum cycle. */
  nextDrum: number;
}

function loadPrefs(): Prefs {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as Partial<Prefs> | null;
    return { on: raw?.on !== false, volume: typeof raw?.volume === 'number' ? Math.min(1, Math.max(0, raw.volume)) : 0.6 };
  } catch {
    return { on: true, volume: 0.6 };
  }
}

export class Music {
  private prefs: Prefs = loadPrefs();
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private noise!: AudioBuffer;
  private tracks!: Record<MusicMode, Track>;
  private mode: ModeState = { mode: 'ambient', calmSince: null };
  private changedAt = -100;
  private rng: RngState = makeRng(7);
  private degree = 2;
  private nextFlute = 0;

  /** Starts the sound on the first click or key press (a browser rule); the menu click counts. */
  arm(): void {
    const go = (): void => {
      window.removeEventListener('pointerdown', go, true);
      window.removeEventListener('keydown', go, true);
      this.start();
    };
    window.addEventListener('pointerdown', go, true);
    window.addEventListener('keydown', go, true);
  }

  private start(): void {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    try {
      const ctx = new Ctx();
      this.ctx = ctx;
      void ctx.resume();
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
      const make = (): Track => {
        const bus = ctx.createGain();
        bus.gain.value = 0;
        bus.connect(this.master);
        return { bus, nextDrum: 0 };
      };
      this.tracks = { ambient: make(), war: make() };
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      let seed = 1;
      for (let i = 0; i < d.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        d[i] = seed / 2147483648 - 1;
      }
      this.buildWind(this.tracks.ambient.bus);
      this.buildDrone(this.tracks.war.bus);
      this.applyGains();
      window.setInterval(() => this.schedule(), 100);
    } catch {
      this.ctx = null; // no sound, no harm
    }
  }

  // ---- state ----

  /** Called every frame by the game: war music while wolves are out, back to ambient after the hold. */
  update(wolves: boolean, tick: number): void {
    const next = nextMode(this.mode, wolves, tick);
    const changed = next.mode !== this.mode.mode;
    this.mode = next;
    if (changed) {
      this.changedAt = this.ctx?.currentTime ?? 0;
      this.applyGains();
    }
  }

  /** A new run or the menu: ambient again. */
  reset(): void {
    const changed = this.mode.mode !== 'ambient';
    this.mode = { mode: 'ambient', calmSince: null };
    if (changed) {
      this.changedAt = this.ctx?.currentTime ?? 0;
      this.applyGains();
    }
  }

  status(): { mode: MusicMode; on: boolean; volume: number; started: boolean; running: boolean } {
    return { mode: this.mode.mode, ...this.prefs, started: !!this.ctx, running: this.ctx?.state === 'running' };
  }

  get on(): boolean {
    return this.prefs.on;
  }

  get volume(): number {
    return this.prefs.volume;
  }

  setOn(on: boolean): void {
    this.prefs.on = on;
    this.save();
    this.applyGains();
  }

  /** Volume in tenths, 0 to 1. */
  setVolume(v: number): void {
    this.prefs.volume = Math.min(1, Math.max(0, Math.round(v * 10) / 10));
    this.save();
    this.applyGains();
  }

  private save(): void {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(this.prefs));
    } catch {
      /* private mode: the choice lasts until the page closes */
    }
  }

  private applyGains(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.master.gain.setTargetAtTime(this.prefs.on ? this.prefs.volume * 0.5 : 0, t, 0.1);
    for (const m of ['ambient', 'war'] as const) this.tracks[m].bus.gain.setTargetAtTime(this.mode.mode === m ? 1 : 0, t, 0.7);
  }

  // ---- sounds ----

  private buildWind(bus: GainNode): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 520;
    band.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const depth = ctx.createGain();
    depth.gain.value = 0.035;
    lfo.connect(depth).connect(g.gain);
    src.connect(band).connect(g).connect(bus);
    src.start();
    lfo.start();
  }

  private buildDrone(bus: GainNode): void {
    const ctx = this.ctx!;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 240;
    const g = ctx.createGain();
    g.gain.value = 0.16;
    // D2, A2 and the tense A-flat between them.
    for (const [f, level] of [[73.4, 1], [110, 0.7], [103.8, 0.35]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = level;
      o.connect(og).connect(low);
      o.start();
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.2;
    const depth = ctx.createGain();
    depth.gain.value = 90;
    lfo.connect(depth).connect(low.frequency);
    lfo.start();
    low.connect(g).connect(bus);
  }

  private drum(t: number, gain: number, bus: GainNode, war: boolean): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(war ? 150 : 100, t);
    o.frequency.exponentialRampToValueAtTime(war ? 48 : 40, t + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain * (war ? 0.9 : 0.7), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + (war ? 0.3 : 0.45));
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.5);
    if (war) {
      // A short skin slap on top.
      const n = ctx.createBufferSource();
      n.buffer = this.noise;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1800;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(gain * 0.25, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      n.connect(hp).connect(ng).connect(bus);
      n.start(t, Math.random());
      n.stop(t + 0.06);
    }
  }

  private flute(t: number, freq: number, dur: number, bus: GainNode): void {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.09);
    g.gain.setValueAtTime(0.42, t + Math.max(0.1, dur - 0.25));
    g.gain.linearRampToValueAtTime(0, t + dur);
    g.connect(bus);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5;
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = 7;
    vib.connect(vibDepth);
    for (const [mult, type, level] of [[1, 'sine', 1], [2, 'triangle', 0.12]] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq * mult;
      vibDepth.connect(o.detune);
      const og = ctx.createGain();
      og.gain.value = level * 0.5;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    vib.start(t);
    vib.stop(t + dur + 0.05);
    // A breath of air round the note.
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = freq * 2;
    band.Q.value = 4;
    const ng = ctx.createGain();
    ng.gain.value = 0.06;
    n.connect(band).connect(ng).connect(g);
    n.start(t, Math.random());
    n.stop(t + dur + 0.05);
  }

  /** Looks ahead a fraction of a second and queues what falls in it, for each track that is audible or fading. */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.prefs.on || this.prefs.volume <= 0) return;
    const now = ctx.currentTime;
    const until = now + LOOKAHEAD;
    for (const m of ['ambient', 'war'] as const) {
      if (this.mode.mode !== m && now > this.changedAt + FADE) continue;
      const tr = this.tracks[m];
      const p: Pattern = m === 'war' ? WAR_BEAT : AMBIENT_BEAT;
      if (tr.nextDrum < now) tr.nextDrum = now + 0.05;
      while (tr.nextDrum < until) {
        for (const [dt, g] of patternHits(p, 0)) this.drum(tr.nextDrum + dt, g, tr.bus, m === 'war');
        tr.nextDrum += cycleSeconds(p);
      }
    }
    if (this.mode.mode === 'ambient' || now <= this.changedAt + FADE) {
      if (this.nextFlute < now) this.nextFlute = now + 0.3;
      while (this.nextFlute < until) {
        const n = nextNote(this.rng, this.degree);
        this.degree = n.degree;
        const beat = 60 / 72;
        this.flute(this.nextFlute, noteFreq(n.degree), n.beats * beat, this.tracks.ambient.bus);
        this.nextFlute += (n.beats + n.rest) * beat;
      }
    }
  }
}

export const music = new Music();
