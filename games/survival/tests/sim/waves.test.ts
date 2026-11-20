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

test('defeating waves 3 to 5 does not end the run; defeating wave 6 wins it, and a finished run stops', () => {
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
  assert.equal(s.result, null, 'waves 5 and 6 are still ahead');
  s.tick = 17699; // wave 5 warns at 17700 and arrives at 18000
  step(s, 301);
  assert.equal(s.enemies.filter((e) => e.wave === 4).length, 10, '9 wolves and a pack leader');
  s.enemies = [];
  step(s, 1);
  assert.equal(s.waves[4].phase, 'defeated');
  assert.equal(s.result, null, 'wave 6 is still ahead');
  s.tick = 21299; // wave 6 warns at 21300 and arrives at 21600
  step(s, 301);
  const sixth = s.enemies.filter((e) => e.wave === 5);
  assert.equal(sixth.length, 12, '10 wolves and 2 pack leaders');
  assert.equal(sixth.filter((e) => e.kind === 'pack_leader').length, 2);
  s.enemies = [];
  step(s, 1);
  assert.equal(s.waves[5].phase, 'defeated');
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
