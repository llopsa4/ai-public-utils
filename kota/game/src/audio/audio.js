// Sound, made entirely in code with WebAudio: effects and natural ambience only.
// No music, no recorded audio, no files (user decision 2026-11-18; see PLAN-dakota.md).
// Browsers only start audio after a touch or key press, so call unlock() from one.

export function createAudio(settings) {
  let ctx = null, master = null, noise = null, ambience = null, crickets = null;
  const lastPlayed = {};

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = settings.values.sound ? 0.5 : 0;
      master.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  /** Skip a sound if it played less than `gap` seconds ago (many hits at once stay pleasant). */
  const ready = (name, gap) => {
    if (!ctx || !settings.values.sound) return false;
    const now = ctx.currentTime;
    if (now - (lastPlayed[name] ?? -1) < gap) return false;
    lastPlayed[name] = now;
    return true;
  };

  function burst({ type = 'bandpass', f0, f1 = f0, q = 1, dur, gain = 0.3 }) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type; filter.Q.value = q;
    filter.frequency.setValueAtTime(f0, t);
    filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter); filter.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.05);
  }

  function tone({ f0, f1 = f0, dur, gain = 0.2, type = 'sine', delay = 0 }) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  // Ambience: a looping, filtered noise bed per place, plus soft cricket ticks at night and in woods.
  const PLACES = {
    camp:  { type: 'lowpass',  f: 500,  q: 0.5, gain: 0.05, sway: 0.1 },
    wind:  { type: 'lowpass',  f: 700,  q: 0.6, gain: 0.10, sway: 0.5 },
    water: { type: 'bandpass', f: 1800, q: 0.7, gain: 0.07, sway: 0.2 },
    woods: { type: 'lowpass',  f: 900,  q: 0.5, gain: 0.07, sway: 0.3, crickets: true },
    night: { type: 'lowpass',  f: 450,  q: 0.5, gain: 0.06, sway: 0.2, crickets: true },
  };

  function startAmbience() {
    const src = ctx.createBufferSource();
    src.buffer = noise; src.loop = true;
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const lfo = ctx.createOscillator(), depth = ctx.createGain();       // slow sway of the filter
    lfo.frequency.value = 0.15; lfo.connect(depth); depth.connect(filter.frequency);
    src.connect(filter); filter.connect(gain); gain.connect(master);
    src.start(); lfo.start();
    ambience = { filter, gain, depth };
  }

  function chirp() {                                                    // one cricket-like tick burst
    if (!ctx || !settings.values.sound || !crickets) return;
    const f = 3800 + Math.random() * 600;
    for (let i = 0; i < 3; i++) tone({ f0: f, dur: 0.03, gain: 0.012, delay: i * 0.06 });
  }

  const api = {
    unlock,
    ctxState: () => (ctx ? ctx.state : 'none'),
    setEnabled(on) { if (master) master.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.05); },
    setAmbience(name) {
      if (!ctx) { api.pending = name; return; }
      const place = PLACES[name] ?? PLACES.camp;
      if (!ambience) startAmbience();
      const t = ctx.currentTime;
      ambience.filter.type = place.type; ambience.filter.Q.value = place.q;
      ambience.filter.frequency.setTargetAtTime(place.f, t, 0.3);
      ambience.depth.gain.setTargetAtTime(place.f * place.sway, t, 0.3);
      ambience.gain.gain.setTargetAtTime(place.gain, t, 0.5);
      crickets = place.crickets ? true : null;
    },
    swing() { if (ready('swing', 0.05)) burst({ f0: 500, f1: 1800, q: 1.5, dur: 0.12, gain: 0.25 }); },
    volley() { if (ready('volley', 0.1)) { burst({ type: 'highpass', f0: 1500, f1: 4000, dur: 0.18, gain: 0.2 }); tone({ f0: 300, f1: 150, dur: 0.1, gain: 0.08 }); } },
    track() { if (ready('track', 0.2)) { tone({ f0: 330, f1: 330, dur: 0.18, gain: 0.07 }); tone({ f0: 495, f1: 495, dur: 0.22, gain: 0.07, delay: 0.1 }); } },
    dash() { if (ready('dash', 0.1)) burst({ f0: 1800, f1: 400, q: 1, dur: 0.18, gain: 0.25 }); },
    hit(heavy) {
      if (!ready('hit', 0.04)) return;
      burst({ type: 'lowpass', f0: heavy ? 1800 : 1200, f1: 200, dur: heavy ? 0.16 : 0.1, gain: heavy ? 0.4 : 0.28 });
      tone({ f0: heavy ? 160 : 220, f1: 60, dur: 0.12, gain: heavy ? 0.3 : 0.18 });
    },
    kill(boss) {
      if (!ready('kill', 0.05)) return;
      burst({ type: 'lowpass', f0: 1500, f1: 100, dur: boss ? 0.9 : 0.3, gain: boss ? 0.5 : 0.25 });
      tone({ f0: boss ? 120 : 260, f1: 40, dur: boss ? 0.8 : 0.25, gain: boss ? 0.35 : 0.12 });
    },
    hurt() { if (ready('hurt', 0.15)) { tone({ f0: 200, f1: 90, dur: 0.22, gain: 0.3, type: 'triangle' }); burst({ type: 'lowpass', f0: 900, f1: 150, dur: 0.15, gain: 0.25 }); } },
    pickup() { if (ready('pickup', 0.1)) { tone({ f0: 660, dur: 0.08, gain: 0.12 }); tone({ f0: 880, dur: 0.1, gain: 0.12, delay: 0.07 }); } },
    click() { if (ready('click', 0.03)) tone({ f0: 700, f1: 520, dur: 0.06, gain: 0.1 }); },
    win() { if (ready('win', 0.5)) for (const [i, f] of [523, 659, 784].entries()) tone({ f0: f, dur: 0.5, gain: 0.14, delay: i * 0.18 }); },
    down() { if (ready('down', 0.5)) { tone({ f0: 220, f1: 70, dur: 1.0, gain: 0.25, type: 'triangle' }); burst({ type: 'lowpass', f0: 600, f1: 80, dur: 0.8, gain: 0.2 }); } },
    pending: null,
  };
  setInterval(chirp, 700);
  return api;
}
