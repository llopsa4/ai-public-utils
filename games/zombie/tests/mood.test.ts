import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CALM, FADE, LAYERS, type Mood, SILENT, approach, beatGap, chasers, moodOf } from '../src/audio/mood';
import { createBase } from '../src/sim/base';
import { type MissionState, createMission } from '../src/sim/mission';
import { emitNoise } from '../src/sim/noise';

// Z40: the rules of the adaptive ambience (DESIGN §6 *Audio*): which layers are wanted and how they fade.
// The WebAudio layers themselves are checked in the browser.

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));

function mission(zombies = 3): MissionState {
  return createMission({
    map: open(20),
    survivors: [{ id: 'f', kind: 'fighter', x: 4, y: 4 }],
    enemies: Array.from({ length: zombies }, (_, i) => ({ id: `z${i}`, kind: 'zombie' as const, x: 10 + i, y: 15 })),
    extract: { x: 0, y: 0, w: 1, h: 1 },
  });
}

test('a calm scene wants the bed at full and nothing else', () => {
  assert.deepEqual(moodOf(mission()), CALM);
});

test('a chasing zombie raises the pulse and ducks the bed; wandering or investigating does not', () => {
  const s = mission();
  s.enemies[0]!.ai.mode = 'investigate';
  s.enemies[1]!.ai.mode = 'search';
  assert.equal(moodOf(s).pulse, 0);
  s.enemies[2]!.ai.mode = 'chase';
  const m = moodOf(s);
  assert.ok(m.pulse > 0.5 && m.pulse < 1);
  assert.ok(m.bed < 1 && m.bed > 0.5);
  assert.equal(m.herd, 0);
});

test('more chasers push the pulse up to a cap; a dead chaser counts for nothing', () => {
  const s = mission(6);
  const levels: number[] = [];
  for (const e of s.enemies) {
    e.ai.mode = 'chase';
    levels.push(moodOf(s).pulse);
  }
  assert.ok(levels[1]! > levels[0]!);
  assert.equal(levels[levels.length - 1], 1);
  assert.equal(chasers(s), 6);
  s.enemies[0]!.hp = 0;
  assert.equal(chasers(s), 5);
  for (const e of s.enemies) e.hp = 0;
  assert.equal(moodOf(s).pulse, 0);
});

test('a guard in alert and a ringing alarm both raise the pulse', () => {
  const s = mission();
  s.enemies[0]!.ai.mode = 'alert';
  assert.ok(moodOf(s).pulse > 0);
  s.enemies[0]!.ai.mode = 'wander';
  assert.equal(moodOf(s).pulse, 0);
  emitNoise(s, 5, 5, 6, 'alarm', 'g');
  assert.ok(moodOf(s).pulse > 0);
  const t = mission();
  emitNoise(t, 5, 5, 6, 'shot', 'f');
  assert.equal(moodOf(t).pulse, 0);
});

test('the herd layer is on from the warning to the end of Base 1', () => {
  const s = createBase({ calm: true });
  assert.equal(moodOf(s).herd, 0);
  s.herd.warned = true;
  const m = moodOf(s);
  assert.equal(m.herd, 1);
  assert.ok(m.bed < 1);
  s.status = 'success';
  assert.deepEqual(moodOf(s).herd, 0);
  s.status = 'failed';
  assert.equal(moodOf(s).herd, 0);
});

test('a finished scene lets the pulse and herd go and keeps a quieter bed, quieter still after a loss', () => {
  const s = mission();
  s.enemies[0]!.ai.mode = 'chase';
  s.status = 'success';
  const won = moodOf(s);
  s.status = 'failed';
  const lost = moodOf(s);
  assert.equal(won.pulse, 0);
  assert.equal(lost.pulse, 0);
  assert.ok(lost.bed < won.bed && won.bed < 1 && lost.bed > 0);
});

test('approach moves each layer towards its target at its own rate and never overshoots', () => {
  let m: Mood = SILENT;
  const want: Mood = { bed: 1, pulse: 1, herd: 1 };
  const one = approach(m, want, 0.5);
  assert.ok(one.pulse > one.bed && one.bed > one.herd, 'the pulse comes up fastest, the herd layer slowest');
  for (let i = 0; i < 400; i++) {
    m = approach(m, want, 0.05);
    for (const k of LAYERS) assert.ok(m[k] <= 1);
  }
  assert.deepEqual(m, want);
  // down: the pulse falls slower than it rose, so a lost sight does not cut the beat
  const down = approach(want, SILENT, 0.5);
  assert.ok(1 - down.pulse < one.pulse);
});

test('approach with no time passed changes nothing, and the rates cover the same ground in the same time on any frame length', () => {
  const m: Mood = { bed: 0.4, pulse: 0.2, herd: 0 };
  assert.deepEqual(approach(m, CALM, 0), m);
  assert.deepEqual(approach(m, CALM, -1), m);
  const coarse = approach(m, CALM, 1);
  let fine = m;
  for (let i = 0; i < 20; i++) fine = approach(fine, CALM, 0.05);
  for (const k of LAYERS) assert.ok(Math.abs(coarse[k] - fine[k]) < 1e-9, k);
  for (const k of LAYERS) assert.ok(FADE[k].up > 0 && FADE[k].down > 0);
});

test('the heartbeat speeds up with the pulse level and stays in range', () => {
  assert.ok(beatGap(1) < beatGap(0.5) && beatGap(0.5) < beatGap(0));
  assert.equal(beatGap(5), beatGap(1));
  assert.equal(beatGap(-1), beatGap(0));
  assert.ok(beatGap(1) >= 0.5 && beatGap(0) <= 1);
});
