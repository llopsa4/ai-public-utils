import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newGame, step } from '../../src/sim/tick';
import { waveBanner } from '../../src/sim/waves';

test('the warning starts at tick 3300 with an allowed edge and a countdown', () => {
  const s = newGame(1);
  s.tick = 3298;
  step(s, 1);
  assert.equal(s.waves[0].phase, 'pending');
  assert.equal(waveBanner(s), null);
  step(s, 1);
  assert.equal(s.tick, 3300);
  assert.equal(s.waves[0].phase, 'warning');
  assert.ok(['north', 'east', 'south'].includes(s.waves[0].edge!));
  assert.equal(waveBanner(s)!.seconds, 30);
  step(s, 300);
  assert.equal(s.waves[0].phase === 'warning', false);
  assert.equal(s.enemies.filter((e) => e.wave === 0).length === 1 || s.waves[0].phase === 'defeated', true);
});

test('wave 3 spawns 5 wolves and a pack leader on one edge', () => {
  const s = newGame(1);
  s.waves[0].phase = 'defeated';
  s.waves[1].phase = 'defeated';
  s.tick = 10499;
  step(s, 1);
  assert.equal(s.waves[2].phase, 'warning');
  step(s, 300);
  const spawned = s.enemies.filter((e) => e.wave === 2);
  assert.equal(spawned.length, 6);
  assert.equal(spawned.filter((e) => e.kind === 'pack_leader').length, 1);
  assert.equal(s.waves[2].phase, 'active');
  assert.equal(waveBanner(s)!.text, 'Wave 3');
});

test('defeating wave 3 does not end the run; defeating wave 4 wins it, and a finished run stops', () => {
  const s = newGame(1);
  s.waves[0].phase = 'defeated';
  s.waves[1].phase = 'defeated';
  s.tick = 10499;
  step(s, 301);
  s.enemies = [];
  step(s, 1);
  assert.equal(s.waves[2].phase, 'defeated');
  assert.equal(s.result, null, 'the first winter is still ahead');
  s.tick = 14099; // wave 4 warns at 14100 and arrives at 14400
  step(s, 301);
  assert.equal(s.enemies.filter((e) => e.wave === 3).length, 8, '7 wolves and a pack leader');
  s.enemies = [];
  step(s, 1);
  assert.equal(s.waves[3].phase, 'defeated');
  assert.equal(s.result, 'won');
  const tick = s.tick;
  step(s, 10);
  assert.equal(s.tick, tick);
});

test('losing every person, or the fire, loses the run', () => {
  const s = newGame(1);
  s.people = [];
  step(s, 1);
  assert.equal(s.result, 'lost');

  const t = newGame(1);
  t.buildings.find((b) => b.type === 'fire')!.hp = 0;
  step(t, 1);
  assert.equal(t.result, 'lost');
});
