import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CALM, FADE, LAYERS, type Mood, RELEASE, SILENT, approach, chasers, drive, moodOf, sinceSeen } from '../src/audio/mood';
import { createBase } from '../src/sim/base';
import { type MissionState, createMission, stepMission } from '../src/sim/mission';
import { emitNoise } from '../src/sim/noise';
import { TICK_HZ } from '../src/sim/time';

// Z40, Z75: the rules of the adaptive music (DESIGN §6 *Music*): how intense it should be and how it fades.
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

/** Marks enemy `i` as having seen a survivor `ago` seconds before now, chasing. */
function saw(s: MissionState, i: number, ago = 0): void {
  const e = s.enemies[i]!;
  e.ai.mode = 'chase';
  e.ai.lastSeen = [4, 4];
  e.ai.lastSeenTick = s.tick - Math.round(ago * TICK_HZ);
}

test('a calm scene wants the bed at full and nothing else', () => {
  assert.deepEqual(moodOf(mission()), CALM);
  assert.equal(sinceSeen(mission()), Infinity);
});

test('a zombie seeing a survivor raises the tension; wandering, investigating or searching does not', () => {
  const s = mission();
  s.tick = 500;
  s.enemies[0]!.ai.mode = 'investigate';
  s.enemies[1]!.ai.mode = 'search';
  assert.equal(moodOf(s).tension, 0);
  saw(s, 2);
  const m = moodOf(s);
  assert.ok(m.tension > 0.5 && m.tension < 1);
  assert.equal(m.bed, 1, 'the music itself intensifies; the bed is not ducked');
  assert.equal(m.herd, 0);
});

test('the tension holds for RELEASE seconds after the last sight, then relaxes', () => {
  const s = mission();
  s.tick = 500;
  saw(s, 0, 2);
  s.enemies[0]!.ai.mode = 'wander'; // lost track already: the music still holds
  assert.ok(moodOf(s).tension > 0.5);
  saw(s, 0, RELEASE - 0.1);
  assert.ok(moodOf(s).tension > 0.5);
  saw(s, 0, RELEASE + 0.1);
  assert.equal(moodOf(s).tension, 0);
  assert.ok(Math.abs(sinceSeen(s) - (RELEASE + 0.1)) < 1e-9);
  // a dead watcher's last sight does not count
  saw(s, 1, 1);
  s.enemies[1]!.hp = 0;
  assert.equal(moodOf(s).tension, 0);
});

test('the most recent sight of any enemy counts', () => {
  const s = mission();
  s.tick = 500;
  saw(s, 0, 20);
  saw(s, 1, 3);
  assert.equal(sinceSeen(s), 3);
  assert.ok(moodOf(s).tension > 0);
});

test('a real sighting in the sim counts as seen now', () => {
  const s = mission(1);
  const z = s.enemies[0]!;
  z.x = 6;
  z.y = 4;
  z.facing = [-1, 0];
  for (let i = 0; i < 3 && sinceSeen(s) === Infinity; i++) stepMission(s);
  assert.equal(sinceSeen(s), 0);
  assert.ok(moodOf(s).tension > 0.5);
});

test('more watchers push the tension up to a cap; a dead one counts for nothing', () => {
  const s = mission(6);
  s.tick = 100;
  const levels: number[] = [];
  for (let i = 0; i < s.enemies.length; i++) {
    saw(s, i);
    levels.push(moodOf(s).tension);
  }
  assert.ok(levels[1]! > levels[0]!);
  assert.equal(levels[levels.length - 1], 1);
  assert.equal(chasers(s), 6);
  s.enemies[0]!.hp = 0;
  assert.equal(chasers(s), 5);
  for (const e of s.enemies) e.hp = 0;
  assert.equal(moodOf(s).tension, 0);
});

test('a guard in alert raises the tension; a ringing alarm alone raises it less', () => {
  const s = mission();
  s.tick = 100;
  saw(s, 0);
  s.enemies[0]!.ai.mode = 'alert';
  const seen = moodOf(s).tension;
  assert.ok(seen > 0);
  const t = mission();
  emitNoise(t, 5, 5, 6, 'alarm', 'g');
  const alarm = moodOf(t).tension;
  assert.ok(alarm > 0 && alarm < seen);
  const u = mission();
  emitNoise(u, 5, 5, 6, 'shot', 'f');
  assert.equal(moodOf(u).tension, 0);
});

test('the herd layer is on from the warning to the end of Base 1, and drives the music to its top', () => {
  const s = createBase({ calm: true });
  assert.equal(moodOf(s).herd, 0);
  s.herd.warned = true;
  const m = moodOf(s);
  assert.equal(m.herd, 1);
  assert.equal(drive(m), 1);
  s.status = 'success';
  assert.deepEqual(moodOf(s).herd, 0);
  s.status = 'failed';
  assert.equal(moodOf(s).herd, 0);
});

test('a finished scene lets the tension and herd go and keeps a quieter bed, quieter still after a loss', () => {
  const s = mission();
  saw(s, 0);
  s.status = 'success';
  const won = moodOf(s);
  s.status = 'failed';
  const lost = moodOf(s);
  assert.equal(won.tension, 0);
  assert.equal(lost.tension, 0);
  assert.ok(lost.bed < won.bed && won.bed < 1 && lost.bed > 0);
});

test('approach moves each layer towards its target at its own rate and never overshoots', () => {
  let m: Mood = SILENT;
  const want: Mood = { bed: 1, tension: 1, herd: 1 };
  const one = approach(m, want, 0.5);
  assert.ok(one.tension > one.bed && one.bed > one.herd, 'the tension comes up fastest, the herd layer slowest');
  for (let i = 0; i < 400; i++) {
    m = approach(m, want, 0.05);
    for (const k of LAYERS) assert.ok(m[k] <= 1);
  }
  assert.deepEqual(m, want);
  // down: the tension falls slower than it rose, so the music relaxes rather than cuts
  const down = approach(want, SILENT, 0.5);
  assert.ok(1 - down.tension < one.tension);
});

test('approach with no time passed changes nothing, and the rates cover the same ground in the same time on any frame length', () => {
  const m: Mood = { bed: 0.4, tension: 0.2, herd: 0 };
  assert.deepEqual(approach(m, CALM, 0), m);
  assert.deepEqual(approach(m, CALM, -1), m);
  const coarse = approach(m, CALM, 1);
  let fine = m;
  for (let i = 0; i < 20; i++) fine = approach(fine, CALM, 0.05);
  for (const k of LAYERS) assert.ok(Math.abs(coarse[k] - fine[k]) < 1e-9, k);
  for (const k of LAYERS) assert.ok(FADE[k].up > 0 && FADE[k].down > 0);
});

test('the drive is the tension or the herd, whichever is higher, kept in 0..1', () => {
  assert.equal(drive({ bed: 1, tension: 0.3, herd: 0 }), 0.3);
  assert.equal(drive({ bed: 1, tension: 0.3, herd: 0.8 }), 0.8);
  assert.equal(drive({ bed: 1, tension: 2, herd: 0 }), 1);
});
