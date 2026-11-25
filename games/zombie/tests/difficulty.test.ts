import assert from 'node:assert/strict';
import { test } from 'node:test';
import base from '../src/data/base1.json';
import chars from '../src/data/characters.json';
import enemies from '../src/data/enemies.json';
import m01 from '../src/data/missions/m01.json';
import { enemySees } from '../src/sim/ai';
import { type BaseState, HUNGER_TICKS, TICK_HZ, createBase, herdCleared, herdCount, herdLeft, hungerLevel, hungerTicks, restoreBase, stepBase } from '../src/sim/base';
import { DIFFICULTIES, nextDifficulty, tuning } from '../src/sim/difficulty';
import { type MissionSpec, createMission, stepMission, withDifficulty } from '../src/sim/mission';

// DESIGN §21: Easy / Normal / Hard. Normal is today's tuning; each level applies its own numbers at scene start.

const spec = m01 as unknown as MissionSpec;
const crateAmmo = (s: { crates: { id: string; ammo: number }[] }): number[] => s.crates.map((c) => c.ammo);
const roamers = (s: BaseState): number => s.enemies.filter((e) => e.id.startsWith('r') && e.hp > 0).length;

test('Normal is exactly the tuning in base1.json and enemies.json', () => {
  const n = tuning('normal');
  assert.equal(n.ammoBonus, 0);
  assert.equal(n.crateAmmo, 0);
  assert.equal(n.herd, base.herd.count);
  assert.equal(n.hungerSeconds, base.hunger.seconds);
  assert.deepEqual(n.roamers, { start: base.roamers.start, max: base.roamers.max });
  assert.deepEqual(n.zombieSight, enemies.zombie.sight);
  assert.equal(tuning(undefined), n); // an old state without a level plays Normal
});

test('the levels: Easy herd 12, 10 min hunger, +2 ammo, sight 2; Hard herd 24, 6 min hunger, up to 9 roamers, -1 crate ammo', () => {
  const e = tuning('easy');
  assert.deepEqual([e.herd, e.hungerSeconds, e.ammoBonus, e.zombieSight.radius, e.zombieSight.crouchRadius], [12, 600, 2, 2, 1]);
  const h = tuning('hard');
  assert.deepEqual([h.herd, h.hungerSeconds, h.roamers.start, h.roamers.max, h.crateAmmo, h.ammoBonus], [24, 360, 6, 9, -1, 0]);
  assert.deepEqual(DIFFICULTIES.map(nextDifficulty), ['normal', 'hard', 'easy']);
});

test('Mission 1: Easy adds 2 starting ammo; Hard takes one ammo from each crate that holds any, never below 0', () => {
  const normal = createMission(withDifficulty(spec, 'normal'));
  const easy = createMission(withDifficulty(spec, 'easy'));
  const hard = createMission(withDifficulty(spec, 'hard'));
  assert.equal(normal.ammo, chars.startAmmo);
  assert.equal(easy.ammo, chars.startAmmo + 2);
  assert.equal(hard.ammo, chars.startAmmo);
  assert.equal(createMission(withDifficulty({ ...spec, ammo: 4 }, 'easy')).ammo, 6); // on the ammo the Intro left
  assert.deepEqual(crateAmmo(easy), crateAmmo(normal));
  assert.deepEqual(crateAmmo(hard), crateAmmo(normal).map((a) => Math.max(0, a - 1)));
  assert.ok(crateAmmo(normal).some((a) => a === 1)); // the clamp is exercised by m01's data
  assert.deepEqual([normal.difficulty, easy.difficulty, hard.difficulty], ['normal', 'easy', 'hard']);
  assert.equal(spec.crates![0]!.ammo, m01.crates[0]!.ammo); // the shared spec is not changed
});

test('zombie sight follows the scene level: Easy sees 2 tiles standing, 1 crouched', () => {
  const mk = (d: 'easy' | 'normal') =>
    createMission({
      map: Array.from({ length: 24 }, () => '.'.repeat(24)),
      survivors: [{ id: 'f', kind: 'fighter', x: 10, y: 12 }],
      enemies: [{ id: 'z', kind: 'zombie', x: 13, y: 12, facing: [1, 0] }],
      difficulty: d,
    });
  const n = mk('normal');
  const e = mk('easy');
  assert.ok(enemySees(n, n.enemies[0]!, n.survivors[0]!)); // 3 tiles
  assert.ok(!enemySees(e, e.enemies[0]!, e.survivors[0]!));
  e.survivors[0]!.x = 11; // 2 tiles
  assert.ok(enemySees(e, e.enemies[0]!, e.survivors[0]!));
  e.survivors[0]!.stance = 'crouch';
  assert.ok(!enemySees(e, e.enemies[0]!, e.survivors[0]!));
  e.survivors[0]!.x = 12; // 1 tile crouched
  assert.ok(enemySees(e, e.enemies[0]!, e.survivors[0]!));
});

test('Base 1: each level sets its ammo bonus, starting roamers and hunger', () => {
  for (const d of DIFFICULTIES) {
    const t = tuning(d);
    const s = createBase({ ammo: 4, difficulty: d });
    assert.equal(s.difficulty, d);
    assert.equal(s.ammo, 4 + t.ammoBonus);
    assert.equal(roamers(s), t.roamers.start);
    assert.equal(hungerTicks(s), t.hungerSeconds * TICK_HZ);
    for (const u of s.survivors) assert.equal(s.hunger[u.id]!.left, hungerTicks(s));
  }
  assert.equal(hungerTicks(createBase()), HUNGER_TICKS);
  const easy = createBase({ calm: true, difficulty: 'easy' });
  const normal = createBase({ calm: true });
  for (let i = 0; i < HUNGER_TICKS; i++) {
    stepBase(easy);
    stepBase(normal);
  }
  assert.equal(hungerLevel(normal, 'fighter'), 'starving'); // 8 min on Normal
  assert.equal(hungerLevel(easy, 'fighter'), 'low'); // 2 min still left on Easy
});

test('Base 1: the herd brings the level count and the roamers stop at the level cap', () => {
  for (const d of DIFFICULTIES) {
    const t = tuning(d);
    const s = createBase({ difficulty: d });
    for (const u of s.survivors) u.maxHp = u.hp = 1e9; // the schedule is under test, not the fight
    let most = 0;
    for (let i = 0; i < (base.herd.arriveAt + base.herd.over + 5) * TICK_HZ; i++) {
      stepBase(s);
      most = Math.max(most, roamers(s));
      for (const u of s.survivors) s.hunger[u.id]!.left = hungerTicks(s);
    }
    assert.equal(herdCount(s), t.herd);
    assert.equal(s.herd.spawned, t.herd, d);
    assert.ok(most <= t.roamers.max, `${d}: ${most} roamers`);
    assert.ok(herdLeft(s) <= t.herd && !herdCleared(s));
  }
});

test('a herd checkpoint keeps the level it started on; an old one without a level reads as Normal', () => {
  const s = createBase({ difficulty: 'hard' });
  for (const u of s.survivors) u.maxHp = u.hp = 1e9;
  for (let i = 0; i <= base.herd.warnAt * TICK_HZ; i++) {
    stepBase(s);
    for (const u of s.survivors) s.hunger[u.id]!.left = hungerTicks(s);
  }
  const saved = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
  assert.equal(restoreBase(saved)?.difficulty, 'hard');
  delete saved.difficulty;
  assert.equal(restoreBase(saved)?.difficulty, 'normal');
  assert.equal(restoreBase({ ...JSON.parse(JSON.stringify(s)), difficulty: 'nightmare' }), null);
});

test('Intro and other specs without a level play Normal', () => {
  const s = createMission(spec);
  assert.equal(s.difficulty, 'normal');
  stepMission(s);
  assert.equal(s.ammo, chars.startAmmo);
});
