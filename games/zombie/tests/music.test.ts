import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LOOP_STEPS, STEPS_PER_BAR, VOICES, hz, padCutoff, stepNotes, stepSeconds, tempo, voiceLevels } from '../src/audio/music';

// Z75: the music's score, tempo and voice levels (DESIGN §6 *Music*). The sound itself is heard in play.

test('the tempo rises with the drive and stays in range', () => {
  assert.ok(tempo(1) > tempo(0.5) && tempo(0.5) > tempo(0));
  assert.equal(tempo(-1), tempo(0));
  assert.equal(tempo(5), tempo(1));
  assert.ok(tempo(0) >= 50 && tempo(0) <= 60, 'slow at rest');
  assert.ok(tempo(1) / tempo(0) > 1.7, 'clearly faster when seen');
  assert.ok(Math.abs(stepSeconds(0) - 60 / tempo(0) / 2) < 1e-12);
});

test('at rest only the pads, bass and motif play; percussion and high voices come in as the drive rises', () => {
  const calm = voiceLevels(0);
  assert.equal(calm.drum, 0);
  assert.equal(calm.high, 0);
  assert.equal(calm.tick, 0);
  for (const v of ['pad', 'bass', 'motif'] as const) assert.ok(calm[v] > 0.5, v);
  const full = voiceLevels(1);
  for (const v of VOICES) assert.ok(full[v] > 0.5 && full[v] <= 1, v);
  // they come in in order: drum, then the strings, then the tick
  const mid = voiceLevels(0.4);
  assert.ok(mid.drum > mid.high && mid.high >= mid.tick);
  // every level only rises with the drive, except the motif stepping back a little
  for (const v of VOICES) {
    if (v === 'motif') continue;
    let last = -1;
    for (let d = 0; d <= 1.0001; d += 0.05) {
      const l: number = voiceLevels(d)[v];
      assert.ok(l >= last - 1e-12, `${v} at ${d}`);
      last = l;
    }
  }
  assert.ok(padCutoff(1) > padCutoff(0));
});

test('the score loops, starts each chord with pad, bass and strings, and the motif is dissonant', () => {
  assert.deepEqual(stepNotes(0, 0), stepNotes(LOOP_STEPS, 0));
  assert.deepEqual(stepNotes(-1, 0), stepNotes(LOOP_STEPS - 1, 0));
  let chords = 0;
  const motif: number[] = [];
  for (let i = 0; i < LOOP_STEPS; i++) {
    const n = stepNotes(i, 0);
    if (n.some((x) => x.voice === 'pad')) {
      chords++;
      assert.ok(n.some((x) => x.voice === 'bass') && n.some((x) => x.voice === 'high'));
    }
    for (const x of n) if (x.voice === 'motif') motif.push(x.midi[0]!);
  }
  assert.equal(chords, 4);
  // a semitone step somewhere in the line (the sinister rub)
  assert.ok(motif.some((m, i) => i > 0 && Math.abs(m - motif[i - 1]!) === 1));
  assert.ok(Math.abs(hz(69) - 440) < 1e-9 && Math.abs(hz(81) - 880) < 1e-9);
});

test('the drum plays on the half bars, with an extra figure only near full drive', () => {
  const drums = (d: number): number => {
    let n = 0;
    for (let i = 0; i < STEPS_PER_BAR; i++) n += stepNotes(i, d).filter((x) => x.voice === 'drum').length;
    return n;
  };
  assert.equal(drums(0), 2);
  assert.equal(drums(0.5), 2);
  assert.ok(drums(1) > 2);
});
