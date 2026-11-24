import assert from 'node:assert/strict';
import { test } from 'node:test';
import story from '../src/data/story.json';
import { orderAttack, orderHold, orderMove } from '../src/sim/mission';
import { selectWeapon } from '../src/sim/abilities';
import { findPath } from '../src/sim/path';
import { type IntroState, STEPS, ackSay, createIntro, hintOf, introLines, objectiveAt, reachable, stepIntro } from '../src/sim/tutorial';

const run = (s: IntroState, ticks: number): void => {
  for (let i = 0; i < ticks; i++) stepIntro(s);
};

/** Runs until `done` is true (at most `max` ticks); returns whether it became true. */
const until = (s: IntroState, done: () => boolean, max = 1500): boolean => {
  for (let i = 0; i < max && !done(); i++) stepIntro(s);
  return done();
};

const fighter = (s: IntroState) => s.survivors.find((u) => u.kind === 'fighter')!;
const scout = (s: IntroState) => s.survivors.find((u) => u.kind === 'scout')!;
const zombie = (s: IntroState) => s.enemies.find((e) => e.id === s.zombieId)!;

/** Plays the dialogue away and walks both survivors to the fire: step 0 done, step 1 begun. */
function afterMove(): IntroState {
  const s = createIntro();
  ackSay(s);
  orderMove(s, ['fighter', 'scout'], [STEPS[0]!.at!.x, STEPS[0]!.at!.y]);
  assert.ok(until(s, () => s.say !== null), 'the move step never finished');
  ackSay(s);
  return s;
}

/** Teleports a survivor beside the zombie so a short run settles the fight. */
function nextTo(s: IntroState, id: 'fighter' | 'scout'): void {
  const u = id === 'fighter' ? fighter(s) : scout(s);
  const z = zombie(s);
  [u.x, u.y, u.path] = [z.x - 1, z.y, []];
}

test('the intro starts with the opening dialogue, no zombies and both survivors armed with the start ammo', () => {
  const s = createIntro();
  assert.equal(s.say, 'start');
  assert.equal(s.step, 0);
  assert.equal(s.enemies.length, 0);
  assert.equal(s.zombieId, null);
  assert.deepEqual(s.survivors.map((u) => u.kind), ['fighter', 'scout']);
  assert.equal(s.ammo, 3);
  assert.equal(s.done, false);
});

test('the sim is frozen while a dialogue waits to be shown', () => {
  const s = createIntro();
  orderMove(s, ['fighter'], [14, 19]);
  run(s, 20);
  assert.equal(s.tick, 0);
  ackSay(s);
  run(s, 20);
  assert.equal(s.tick, 20);
});

test('four steps in order: move, knife, gun, hold; three zombies', () => {
  assert.deepEqual(STEPS.map((x) => x.id), ['move', 'knife', 'gun', 'hold']);
  assert.equal(STEPS.filter((x) => x.zombie).length, 3);
  assert.equal(STEPS[0]!.zombie, undefined);
});

test('every zombie spawn is a walkable tile and a free tile lies within reach of the fire', () => {
  const s = createIntro();
  for (const step of STEPS) {
    if (step.zombie) assert.ok(reachable(s, [step.zombie.x, step.zombie.y]), `${step.id} spawn ${JSON.stringify(step.zombie)} is not reachable`);
  }
  const { at, radius } = STEPS[0]!;
  let near = 0;
  for (let y = 0; y < s.grid.size; y++) for (let x = 0; x < s.grid.size; x++) if (Math.hypot(x - at!.x, y - at!.y) <= radius! && reachable(s, [x, y])) near++;
  assert.ok(near >= 8, `only ${near} walkable tiles within ${radius} of the fire`);
});

test('every dialogue the steps and the opening name exists in story.json', () => {
  assert.ok(introLines('start').length > 0);
  for (const step of STEPS) assert.ok(introLines(step.after).length > 0, `no lines for ${step.after}`);
  assert.deepEqual(introLines('nothing'), []);
  assert.ok(Object.keys(story.dialogue.intro).length >= 5);
});

test('step 1: walking a survivor near the fire opens the gate, plays afterMove and brings the first zombie', () => {
  const s = createIntro();
  ackSay(s);
  assert.equal(s.step, 0);
  assert.deepEqual(objectiveAt(s), [STEPS[0]!.at!.x, STEPS[0]!.at!.y]);
  run(s, 30); // standing still does nothing
  assert.equal(s.step, 0);
  orderMove(s, ['scout'], [STEPS[0]!.at!.x, STEPS[0]!.at!.y]);
  assert.ok(until(s, () => s.say !== null));
  assert.equal(s.say, 'afterMove');
  assert.equal(s.step, 1);
  assert.equal(s.enemies.length, 1);
  const z = zombie(s);
  assert.deepEqual([z.x, z.y], [STEPS[1]!.zombie!.x, STEPS[1]!.zombie!.y]);
  const tick = s.tick;
  run(s, 10); // frozen until acknowledged
  assert.equal(s.tick, tick);
  ackSay(s);
  assert.equal(s.done, false);
});

test('step 2: the Fighter\'s knife kills the zombie, restores nothing it did not spend and moves on', () => {
  const s = afterMove();
  nextTo(s, 'fighter');
  orderAttack(s, ['fighter'], s.zombieId!);
  assert.ok(until(s, () => s.say !== null));
  assert.equal(s.say, 'afterKnife');
  assert.equal(s.step, 2);
  assert.equal(s.ammo, 3);
  assert.equal(s.enemies.length, 2); // the next zombie has come
  assert.equal(zombie(s).hp, 60);
});

test('step 2: a kill by the Scout does not count; the ammo is refunded and a new zombie comes with the retry hint', () => {
  const s = afterMove();
  nextTo(s, 'scout');
  selectWeapon(s, 'scout', 'pistol');
  orderAttack(s, ['scout'], s.zombieId!);
  assert.ok(until(s, () => s.note !== null));
  assert.equal(s.step, 1); // the gate stayed shut
  assert.equal(s.say, null);
  assert.equal(s.ammo, 3);
  assert.equal(s.enemies.filter((e) => e.hp > 0).length, 1);
  assert.equal(hintOf(s), STEPS[1]!.retry);
  // and the retry can then be won with the knife
  nextTo(s, 'fighter');
  orderAttack(s, ['fighter'], s.zombieId!);
  assert.ok(until(s, () => s.say !== null));
  assert.equal(s.say, 'afterKnife');
});

test('step 3: the zombie must die with at least one shot fired; the narrative ammo is then two', () => {
  const s = afterMove();
  nextTo(s, 'fighter');
  orderAttack(s, ['fighter'], s.zombieId!);
  until(s, () => s.say !== null);
  ackSay(s);
  assert.equal(s.step, 2);

  // killed with the club: no shot, so it does not count
  nextTo(s, 'scout');
  selectWeapon(s, 'scout', 'club');
  orderAttack(s, ['scout'], s.zombieId!);
  assert.ok(until(s, () => s.note !== null));
  assert.equal(s.step, 2);
  assert.equal(s.ammo, 3);

  // killed with the pistol: counts
  selectWeapon(s, 'scout', 'pistol');
  nextTo(s, 'scout');
  orderAttack(s, ['scout'], s.zombieId!);
  assert.ok(until(s, () => s.say !== null));
  assert.equal(s.say, 'afterGun');
  assert.equal(s.step, 3);
  assert.equal(s.ammo, 2);
});

test('step 4: the zombie walks in on its own; killing it without Hold does not count, with Hold it does and ends the intro', () => {
  const s = afterMove();
  const skip = (needs: 'fighter' | 'scout'): void => {
    nextTo(s, needs);
    if (needs === 'scout') selectWeapon(s, 'scout', 'pistol');
    orderAttack(s, [needs], s.zombieId!);
    until(s, () => s.say !== null);
    ackSay(s);
  };
  skip('fighter');
  skip('scout');
  assert.equal(s.step, 3);
  const z = zombie(s);
  assert.equal(z.ai.mode, 'investigate');
  assert.ok(z.path.length > 0);

  // killed by an attack order: not a hold
  nextTo(s, 'fighter');
  orderAttack(s, ['fighter'], s.zombieId!);
  assert.ok(until(s, () => s.note !== null));
  assert.equal(s.step, 3);

  // a Fighter holding toward the next zombie kills it as it walks into the cone
  const f = fighter(s);
  const next = zombie(s);
  [f.x, f.y, f.path, f.order] = [next.x, next.y + 4, [], null];
  [scout(s).x, scout(s).y, scout(s).path] = [next.x + 1, next.y + 4, []];
  next.path = findPath(s.grid, [next.x, next.y], [f.x, f.y]) ?? [];
  assert.ok(next.path.length > 0);
  assert.ok(orderHold(s, 'fighter', [next.x, next.y]));
  assert.ok(until(s, () => s.say !== null, 3000), 'the held survivor never stopped the zombie');
  assert.equal(s.say, 'afterHold');
  assert.equal(s.step, STEPS.length);
  assert.equal(s.done, false);
  ackSay(s);
  assert.equal(s.done, true);
});

test('a survivor dying fails the intro and freezes it', () => {
  const s = createIntro();
  ackSay(s);
  fighter(s).hp = 0;
  run(s, 1);
  // the mission tick marks the death; later ticks do nothing
  const tick = s.tick;
  run(s, 20);
  assert.equal(s.status, 'failed');
  assert.equal(s.tick, tick);
});
