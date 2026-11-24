import { type Options, options } from '../sim/options';
import type { SoundId } from './events';
import { LEVEL, RECIPES } from './sfx';
import { Throttle } from './space';

// The WebAudio engine (DESIGN §6 *Audio*): one context for the whole game, started on the first click or key
// press (a browser rule), with a master bus and two buses under it, effects and ambience (Z40 plays on the
// ambience one). The volumes and the mute come from the options and are re-read every time something plays and
// by `sync`. All sound is made in code (`audio/sfx.ts`); this file only places, levels and starts it.

const NOISE_SECONDS = 3;
const RAMP = 0.03; // seconds a volume change takes, so a slider drag does not click

export interface PlayOpts {
  gain?: number; // 0..1 level of this play (after the distance fade)
  pan?: number; // -1 .. 1
  variant?: number; // 0..1, picks pitch and detail
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private ambienceBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private readonly throttle = new Throttle();

  /** Waits for the first click or key press, then starts the context. Safe to call more than once. */
  arm(): void {
    if (typeof window === 'undefined') return;
    const go = (): void => {
      for (const e of ['pointerdown', 'keydown', 'touchend'] as const) window.removeEventListener(e, go, true);
      this.unlock();
    };
    for (const e of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(e, go, true);
  }

  /** Creates the context (it must happen inside a user gesture) and resumes it if the browser suspended it. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        return;
      }
      const c = this.ctx;
      this.master = c.createGain();
      this.effects = c.createGain();
      this.ambienceBus = c.createGain();
      this.effects.connect(this.master);
      this.ambienceBus.connect(this.master);
      this.master.connect(c.destination);
      this.noise = makeNoise(c);
      this.sync();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
  }

  /** True once the browser has let the sound start. */
  get ready(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  /** The ambience bus (Z40) and the context, or null before the first gesture. */
  get ambience(): { ctx: AudioContext; bus: GainNode; noise: AudioBuffer } | null {
    return this.ctx && this.ambienceBus && this.noise ? { ctx: this.ctx, bus: this.ambienceBus, noise: this.noise } : null;
  }

  /** Applies the options' volumes and mute to the buses. Called by `play` and by the options page after a change. */
  sync(o: Pick<Options, 'master' | 'effects' | 'ambience' | 'mute'> = options()): void {
    if (!this.ctx || !this.master || !this.effects || !this.ambienceBus) return;
    const t = this.ctx.currentTime;
    for (const [node, v] of [[this.master, o.mute ? 0 : o.master], [this.effects, o.effects], [this.ambienceBus, o.ambience]] as const) {
      node.gain.cancelScheduledValues(t);
      node.gain.setTargetAtTime(v, t, RAMP);
    }
  }

  /** Plays one effect now. Quietly does nothing before the first gesture, while muted or when it would be inaudible. */
  play(id: SoundId, opts: PlayOpts = {}): void {
    const c = this.ctx;
    if (!c || !this.effects || !this.noise || c.state !== 'running') return;
    const o = options();
    const level = (opts.gain ?? 1) * o.effects * o.master;
    if (o.mute || !this.throttle.allow(id, performance.now(), level)) return;
    this.sync(o);
    const out = c.createGain();
    out.gain.value = (opts.gain ?? 1) * LEVEL[id];
    let tail: AudioNode = out;
    if (typeof c.createStereoPanner === 'function') {
      const p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan ?? 0));
      out.connect(p);
      tail = p;
    }
    tail.connect(this.effects);
    RECIPES[id]({ ctx: c, out, noise: this.noise, t: c.currentTime + 0.005, variant: opts.variant ?? 0.5 });
    // The nodes of a finished sound are collected once the sources have stopped; the chain is dropped after a moment.
    window.setTimeout(() => (tail as AudioNode).disconnect(), 3000);
  }

  /** A menu click (not placed in the world). */
  ui(): void {
    this.play('ui', { gain: 0.8 });
  }
}

function makeNoise(c: AudioContext): AudioBuffer {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * NOISE_SECONDS), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** The game's one engine. `main.ts` arms it; scenes play through it. */
export const audio = new AudioEngine();
