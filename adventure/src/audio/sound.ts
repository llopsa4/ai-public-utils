/**
 * All game sound, synthesized with Web Audio: no audio files, nothing to license or download.
 * The context starts on the first user gesture (browsers block audio before that).
 */
export type Ambience = 'kiln' | 'cold' | 'wind' | 'none';

class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private ambienceNodes: AudioNode[] = [];
  private ambienceKind: Ambience = 'none';
  private crackleTimer = 0;
  private volume = 0.7;
  private muted = false;

  /** Creates the audio context; call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (this.ctx) { void this.ctx.resume(); return; }
    const Ctx = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.applyVolume();
    const length = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const wanted = this.ambienceKind;
    this.ambienceKind = 'none';
    this.ambience(wanted);
  }

  setVolume(volume: number, muted: boolean): void {
    this.volume = volume;
    this.muted = muted;
    this.applyVolume();
  }

  private applyVolume(): void {
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume * 0.8, this.ctx.currentTime, 0.05);
  }

  private source(): AudioBufferSourceNode | null {
    if (!this.ctx || !this.noise) return null;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    return s;
  }

  /** A filtered noise burst with an attack/decay envelope. */
  private burst(type: BiquadFilterType, freq: number, peak: number, attack: number, decay: number, q = 1, delay = 0): void {
    const ctx = this.ctx, src = this.source();
    if (!ctx || !src || !this.master) return;
    const t = ctx.currentTime + delay;
    const filter = ctx.createBiquadFilter();
    filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t, Math.random());
    src.stop(t + attack + decay + 0.05);
  }

  private tone(type: OscillatorType, from: number, to: number, peak: number, duration: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  /** Room background: kiln hum with crackles, the cold kiln's near silence, or ashways wind. */
  ambience(kind: Ambience): void {
    if (kind === this.ambienceKind) return;
    this.ambienceKind = kind;
    for (const n of this.ambienceNodes) { try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* already stopped */ } n.disconnect(); }
    this.ambienceNodes = [];
    window.clearInterval(this.crackleTimer);
    const ctx = this.ctx, src = this.source();
    if (!ctx || !src || !this.master || kind === 'none') return;
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    if (kind === 'wind') {
      filter.type = 'bandpass'; filter.frequency.value = 520; filter.Q.value = 0.7;
      gain.gain.value = 0.09; lfo.frequency.value = 0.13; lfoGain.gain.value = 260;
      lfo.connect(lfoGain).connect(filter.frequency);
    } else {
      filter.type = 'lowpass'; filter.frequency.value = kind === 'cold' ? 70 : 140; filter.Q.value = 0.9;
      gain.gain.value = kind === 'cold' ? 0.05 : 0.22; lfo.frequency.value = 0.25; lfoGain.gain.value = kind === 'cold' ? 0.01 : 0.05;
      lfo.connect(lfoGain).connect(gain.gain);
    }
    src.connect(filter).connect(gain).connect(this.master);
    src.start(); lfo.start();
    this.ambienceNodes = [src, lfo, filter, gain, lfoGain];
    if (kind === 'kiln') {
      this.crackleTimer = window.setInterval(() => {
        if (Math.random() < 0.6) this.burst('highpass', 2500 + Math.random() * 2500, 0.05 + Math.random() * 0.06, 0.002, 0.02 + Math.random() * 0.04);
      }, 380);
    }
  }

  step(depth = 1): void { this.burst('lowpass', 500, 0.16 * depth, 0.004, 0.09); this.tone('sine', 110, 60, 0.05 * depth, 0.07); }
  blip(): void { this.tone('sine', 660, 720, 0.05, 0.06); }
  choose(): void { this.tone('triangle', 880, 640, 0.06, 0.12); }
  pickup(): void { this.tone('triangle', 520, 1040, 0.07, 0.18); this.tone('sine', 1040, 1300, 0.03, 0.2, 0.08); }
  latch(): void { this.burst('highpass', 3200, 0.25, 0.001, 0.025); this.burst('highpass', 2600, 0.2, 0.001, 0.03, 1, 0.12); this.tone('triangle', 1250, 1150, 0.06, 0.25, 0.12); }
  rumble(ms: number): void { this.burst('lowpass', 90, 0.5, 0.06, ms / 1000); this.tone('sine', 48, 34, 0.18, ms / 1000); }
  hiss(ms = 1600): void { this.burst('highpass', 2400, 0.22, 0.05, ms / 1000, 0.7); }
  brushes(ms: number): void {
    for (let t = 0; t < ms; t += 90) this.burst('bandpass', 900 + Math.random() * 500, 0.06, 0.01, 0.06, 2, t / 1000);
  }
}

export const sound = new Sound();
