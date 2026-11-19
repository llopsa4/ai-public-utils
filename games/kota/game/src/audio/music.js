// Fight music, synthesised in code with WebAudio (no recordings): a steady hand-drum heartbeat, a soft rattle, a low
// drone and a sparse, invented flute line in a minor pentatonic scale. It plays during waves only. No voices, no chant,
// no war-cries (CULTURE.md). Tempo rises from 84 to 112 bpm over the 20 waves; the drum thickens with the waves; on
// boss waves the drum is heavier and the flute is silent. `createMusic` borrows the audio context from audio.js.

const D_MINOR_PENTATONIC = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 784.0, 880.0];   // D4 F4 G4 A4 C5 D5 F5 G5 A5
const LOOKAHEAD = 0.18;                                                                           // seconds scheduled ahead
const bpmFor = (wave) => 84 + (Math.min(Math.max(wave, 1), 20) - 1) * (28 / 19);

export function createMusic({ getCtx, getMaster, getNoise, settings }) {
  let bus = null, timer = null, drone = null;
  let want = null;                        // { wave, boss } while a wave is being fought (even if music is off or paused)
  let playing = false, paused = false;
  let nextTime = 0, step = 0, bar = 0, nextPhrase = 0, phrase = [], bpm = 84, level = 0, boss = false;

  const ctx = () => getCtx();

  function ensureBus() {
    if (bus) return bus;
    bus = ctx().createGain();
    bus.gain.value = 0;
    bus.connect(getMaster());
    return bus;
  }

  /* ---------- voices ---------- */

  function drum(t, vel, deep) {
    const c = ctx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(deep ? 95 : 130, t);
    o.frequency.exponentialRampToValueAtTime(deep ? 48 : 62, t + 0.14);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (deep ? 0.42 : 0.3));
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.5);
    // The skin: a short, dull slap of filtered noise.
    const n = c.createBufferSource(), f = c.createBiquadFilter(), ng = c.createGain();
    n.buffer = getNoise(); n.loop = true;
    f.type = 'bandpass'; f.frequency.value = deep ? 420 : 700; f.Q.value = 0.8;
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.35 * vel, t + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(f); f.connect(ng); ng.connect(bus); n.start(t); n.stop(t + 0.08);
  }

  function rattle(t, vel) {
    const c = ctx(), n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    n.buffer = getNoise(); n.loop = true;
    f.type = 'bandpass'; f.frequency.value = 5600; f.Q.value = 1.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16 * vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    n.connect(f); f.connect(g); g.connect(bus); n.start(t); n.stop(t + 0.1);
  }

  function flute(t, freq, dur, vel) {
    const c = ctx(), g = c.createGain(), end = t + dur;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5 * vel, t + 0.09);
    g.gain.setValueAtTime(0.5 * vel, Math.max(t + 0.1, end - 0.12));
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.25);
    g.connect(bus);
    const vib = c.createOscillator(), vibGain = c.createGain();                  // gentle vibrato that grows in
    vib.frequency.value = 5; vibGain.gain.setValueAtTime(0, t); vibGain.gain.linearRampToValueAtTime(freq * 0.009, t + 0.35);
    vib.connect(vibGain);
    for (const [mul, type, amp] of [[1, 'sine', 1], [2, 'sine', 0.12]]) {
      const o = c.createOscillator(), og = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq * mul * 0.985, t); o.frequency.linearRampToValueAtTime(freq * mul, t + 0.07);   // a breathy scoop up to the note
      og.gain.value = amp; vibGain.connect(o.frequency); o.connect(og); og.connect(g);
      o.start(t); o.stop(end + 0.3);
    }
    vib.start(t); vib.stop(end + 0.3);
    const n = c.createBufferSource(), f = c.createBiquadFilter(), ng = c.createGain();   // breath
    n.buffer = getNoise(); n.loop = true; f.type = 'bandpass'; f.frequency.value = freq * 2.2; f.Q.value = 2.5;
    ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.06 * vel, t + 0.05); ng.gain.exponentialRampToValueAtTime(0.0001, end + 0.2);
    n.connect(f); f.connect(ng); ng.connect(g); n.start(t); n.stop(end + 0.3);
  }

  /** A short invented phrase: [{ at (beats from the phrase start), len (beats), note index }], ending on a resting tone. */
  function makePhrase() {
    const len = 3 + Math.floor(Math.random() * 3), out = [];
    let idx = [0, 3, 5][Math.floor(Math.random() * 3)], at = 0;
    for (let i = 0; i < len; i++) {
      const last = i === len - 1;
      out.push({ at, len: last ? 3 : [1, 1, 2][Math.floor(Math.random() * 3)], idx });
      at += out[out.length - 1].len + (Math.random() < 0.3 ? 0.5 : 0);
      idx = Math.min(8, Math.max(0, idx + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      if (i === len - 2) idx = [0, 3, 5][Math.floor(Math.random() * 3)];            // settle on D4, A4 or D5
    }
    return out;
  }

  /* ---------- the drone ---------- */

  function startDrone() {
    const c = ctx(), g = c.createGain();
    g.gain.value = 0.0001; g.connect(bus);
    const oscs = [];
    for (const [f, type, amp] of [[73.42, 'sine', 0.5], [73.9, 'triangle', 0.18], [110.0, 'sine', 0.28], [146.84, 'sine', 0.12]]) {
      const o = c.createOscillator(), og = c.createGain();
      o.type = type; o.frequency.value = f; og.gain.value = amp; o.connect(og); og.connect(g); o.start(); oscs.push(o);
    }
    const lfo = c.createOscillator(), lg = c.createGain();                      // slow breathing
    lfo.frequency.value = 0.12; lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    g.gain.setTargetAtTime(0.2, c.currentTime, 1.2);
    drone = { g, oscs, lfo };
  }

  function stopDrone(after) {
    if (!drone) return;
    const d = drone, c = ctx(); drone = null;
    d.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.4);
    setTimeout(() => { for (const o of [...d.oscs, d.lfo]) { try { o.stop(); } catch { /* already stopped */ } } d.g.disconnect(); }, after * 1000 + 800);
  }

  /* ---------- the scheduler ---------- */

  function scheduleStep(t, s) {
    const beat = 60 / bpm, eighth = beat / 2;
    const human = () => (Math.random() - 0.5) * 0.012;
    // Drum: strong-soft pairs on the beat; more hits with the waves; a heavy double on boss waves.
    const strong = s % 4 === 0, onBeat = s % 2 === 0;
    if (onBeat) drum(t + human(), strong ? 1 : 0.62, boss);
    if (boss && s % 2 === 1 && s % 4 === 3) drum(t + human(), 0.55, true);
    if (level >= 1 && !onBeat) drum(t + human(), 0.3, false);
    if (level >= 2 && s === 7) { drum(t + eighth * 0.5 + human(), 0.45, false); }
    // Rattle: soft on every eighth, louder on the beat.
    rattle(t + human(), (onBeat ? 0.55 : 0.3) * (level >= 1 || boss ? 1.25 : 1));
    // Flute: a phrase every so many bars, never on boss waves.
    if (!boss && s === 0) {
      if (bar >= nextPhrase) { phrase = makePhrase().map((n) => ({ ...n })); nextPhrase = bar + 3 + Math.floor(Math.random() * 3); phrase.start = bar; }
    }
    if (phrase.length && phrase.start != null) {
      const stepsFromStart = (bar - phrase.start) * 8 + s;                       // eighths since the phrase began
      for (const n of phrase) {
        if (!n.done && Math.round(n.at * 2) === stepsFromStart) {
          n.done = true;
          flute(t + human(), D_MINOR_PENTATONIC[n.idx], n.len * beat * 0.95, level >= 2 ? 0.85 : 0.7);
        }
      }
      if (stepsFromStart > 40) phrase = [];
    }
  }

  function tick() {
    if (!playing) return;
    const c = ctx();
    if (paused) { nextTime = Math.max(nextTime, c.currentTime + 0.05); return; }
    if (nextTime < c.currentTime) nextTime = c.currentTime + 0.05;              // we fell behind (tab was hidden)
    while (nextTime < c.currentTime + LOOKAHEAD) {
      scheduleStep(nextTime, step);
      nextTime += 60 / bpm / 2;
      step = (step + 1) % 8; if (step === 0) bar++;
    }
  }

  /* ---------- control ---------- */

  function begin() {
    if (playing || !getCtx() || !settings.values.music || !want) return;
    const c = ctx(); ensureBus();
    playing = true; step = 0; bar = 0; nextPhrase = 1; phrase = []; nextTime = c.currentTime + 0.15;
    bpm = bpmFor(want.wave); boss = !!want.boss; level = want.wave >= 13 ? 2 : want.wave >= 6 ? 1 : 0;
    bus.gain.cancelScheduledValues(c.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, c.currentTime);
    bus.gain.linearRampToValueAtTime(paused ? 0 : 0.7, c.currentTime + 0.9);
    startDrone();
    timer = setInterval(tick, 50);
    api.onDuck?.(true);
  }

  function end(fade) {
    if (!playing) return;
    playing = false;
    clearInterval(timer); timer = null;
    const c = ctx();
    bus.gain.cancelScheduledValues(c.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, c.currentTime);
    bus.gain.linearRampToValueAtTime(0, c.currentTime + fade);
    stopDrone(fade);
    api.onDuck?.(false);
  }

  const api = {
    onDuck: null,
    /** A wave starts: play the fight music for it (tempo and layers follow the wave; `boss` for waves 10 and 20). */
    start(wave, bossWave) { want = { wave, boss: bossWave }; end(0.3); begin(); },
    /** The wave is over (or the run ended): fade out. */
    stop(fade = 1.2) { want = null; end(fade); },
    /** Settings: Music on or off. Turning it on during a fight brings it back at once. */
    setEnabled(on) { if (!on) end(0.4); else begin(); },
    /** The game is paused (Settings open): the music goes quiet and waits. */
    setPaused(on) {
      paused = on;
      if (!playing || !bus) return;
      const c = ctx(); bus.gain.cancelScheduledValues(c.currentTime);
      bus.gain.setTargetAtTime(on ? 0 : 0.7, c.currentTime, 0.15);
    },
    /** Called once the audio context exists (first tap): start a wave that began before it. */
    ready() { begin(); },
    isPlaying: () => playing,
  };
  return api;
}
