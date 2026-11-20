import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeRng } from '../src/sim/rng';
import {
  AMBIENT_BEAT, DEGREE_MAX, DEGREE_MIN, WAR_BEAT, WAR_HOLD_TICKS, hitsPerSecond, nextMode, nextNote, noteFreq, patternHits,
  type ModeState,
} from '../src/audio/theory';

const calm: ModeState = { mode: 'ambient', calmSince: null };

test('the war music starts at the first wolf and holds 5 s after the last one is gone', () => {
  let m = nextMode(calm, false, 100);
  assert.equal(m.mode, 'ambient');
  m = nextMode(m, true, 200);
  assert.equal(m.mode, 'war');
  m = nextMode(m, true, 900);
  assert.deepEqual(m, { mode: 'war', calmSince: null });
  m = nextMode(m, false, 1000); // the last wolf is gone
  assert.deepEqual(m, { mode: 'war', calmSince: 1000 });
  m = nextMode(m, false, 1000 + WAR_HOLD_TICKS - 1);
  assert.equal(m.mode, 'war');
  m = nextMode(m, false, 1000 + WAR_HOLD_TICKS);
  assert.deepEqual(m, { mode: 'ambient', calmSince: null });
});

test('a wolf that returns during the hold keeps the war music and cancels the countdown', () => {
  let m = nextMode({ mode: 'war', calmSince: null }, false, 1000);
  m = nextMode(m, true, 1020);
  assert.deepEqual(m, { mode: 'war', calmSince: null });
  m = nextMode(m, false, 1030);
  assert.equal(m.calmSince, 1030);
});

test('notes: D4 at degree 0, an octave up every five degrees, the minor third in between', () => {
  assert.ok(Math.abs(noteFreq(0) - 293.66) < 1e-9);
  assert.ok(Math.abs(noteFreq(5) / noteFreq(0) - 2) < 1e-9);
  assert.ok(Math.abs(noteFreq(-5) / noteFreq(0) - 0.5) < 1e-9);
  assert.ok(Math.abs(noteFreq(1) / noteFreq(0) - 2 ** (3 / 12)) < 1e-9);
});

test('the melody stays inside its range and is the same for the same seed', () => {
  const run = (seed: number) => {
    const rng = makeRng(seed);
    let d = 2;
    const out: number[] = [];
    for (let i = 0; i < 500; i++) {
      const n = nextNote(rng, d);
      assert.ok(n.degree >= DEGREE_MIN && n.degree <= DEGREE_MAX);
      assert.ok(n.beats > 0 && n.rest >= 0);
      assert.ok(Math.abs(n.degree - d) <= 2);
      d = n.degree;
      out.push(d);
    }
    return out;
  };
  assert.deepEqual(run(3), run(3));
  assert.notDeepEqual(run(3), run(4));
});

test('the war drum is faster and busier than the heartbeat; hits of a cycle fall inside it', () => {
  assert.ok(hitsPerSecond(WAR_BEAT) > hitsPerSecond(AMBIENT_BEAT) * 2);
  for (const p of [AMBIENT_BEAT, WAR_BEAT]) {
    const hits = patternHits(p, 0);
    assert.equal(hits.length, p.hits.length);
    const len = (p.length * 60) / p.bpm;
    for (const [t, g] of hits) assert.ok(t >= 0 && t < len && g > 0 && g <= 1);
    assert.ok(patternHits(p, 2)[0][0] > patternHits(p, 1)[0][0]);
  }
});
