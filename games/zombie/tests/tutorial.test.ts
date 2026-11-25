import assert from 'node:assert/strict';
import { test } from 'node:test';
import story from '../src/data/story.json';
import { orderAttack, orderHold, orderMove } from '../src/sim/mission';
import { selectWeapon } from '../src/sim/abilities';
import { findPath } from '../src/sim/path';
import { type IntroState, STEPS, ackSay, admit, createIntro, hintOf, introLines, objectiveAt, reachable, resume, stepIntro } from '../src/sim/tutorial';

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

/** What the scene does with a click: the order filter, then the order, then time runs again. Returns whether it was given. */
type Cmd = { type: 'move'; ids: string[]; to: [number, number] } | { type: 'attack'; ids: string[]; target: string } | { type: 'hold'; id: string; toward: [number, number] };
function give(s: IntroState, c: Cmd): boolean {
  if (c.type === 'move') {
    const ids = admit(s, 'move', c.ids);
    if (ids.length === 0 || orderMove(s, ids, c.to).length === 0) return false;
  } else if (c.type === 'attack') {
    const ids = admit(s, 'attack', c.ids, c.target);
    if (ids.length === 0 || orderAttack(s, ids, c.target).length === 0) return false;
  } else if (admit(s, 'hold', [c.id]).length === 0 || !orderHold(s, c.id, c.toward)) return false;
  resume(s);
  return true;
}

/** Plays the dialogue away and walks Cass to the fire: step 0 done, step 1 begun. */
function afterMove(): IntroState {
  const s = createIntro();
  ackSay(s);
  assert.ok(give(s, { type: 'move', ids: ['fighter'], to: [STEPS[0]!.at!.x, STEPS[0]!.at!.y] }));
  assert.ok(until(s, () => s.say !== null), 'the move step never finished');
  ackSay(s);
  return s;
}

/** Teleports Cass beside the zombie so a short run settles the fight. */
function nextTo(s: IntroState): void {
  const u = fighter(s);
  const z = zombie(s);
  [u.x, u.y, u.path] = [z.x - 1, z.y, []];
}

/** Cass knifes the zombie: step 1 done, the dialogue away, step 2 begun (Eli is in, the zombie walking up). */
function afterKnife(): IntroState {
  const s = afterMove();
  nextTo(s);
  assert.ok(give(s, { type: 'attack', ids: ['fighter'], target: s.zombieId! }));
  assert.ok(until(s, () => s.say !== null));
  ackSay(s);
  return s;
}

/** The zombie has closed in and the world froze: step 2 waits for Eli's shot. */
function frozenForShot(): IntroState {
  const s = afterKnife();
  assert.ok(until(s, () => s.waiting), 'the rescue zombie never closed in');
  return s;
}

/** Eli shoots the rescue zombie: step 2 done, the dialogue away, step 3 begun. */
function afterGun(): IntroState {
  const s = frozenForShot();
  assert.ok(give(s, { type: 'attack', ids: ['scout'], target: s.zombieId! }));
  assert.ok(until(s, () => s.say !== null));
  ackSay(s);
  return s;
}

test('the intro starts with the opening dialogue, Cass alone, no zombies and the start ammo', () => {
  const s = createIntro();
  assert.equal(s.say, 'start');
  assert.equal(s.step, 0);
  assert.equal(s.enemies.length, 0);
  assert.equal(s.zombieId, null);
  assert.deepEqual(s.survivors.map((u) => u.kind), ['fighter']);
  assert.equal(s.ammo, 3);
  assert.equal(s.done, false);
});

test('the sim is frozen while a dialogue waits and then while the step waits for its order', () => {
  const s = createIntro();
  assert.equal(s.waiting, true);
  orderMove(s, ['fighter'], [14, 19]);
  run(s, 20);
  assert.equal(s.tick, 0);
  ackSay(s);
  run(s, 20); // the dialogue is gone, but the move order has not been given through the filter
  assert.equal(s.tick, 0);
  resume(s);
  run(s, 20);
  assert.equal(s.tick, 20);
});

test('four steps in order: move, knife, gun, hold; three zombies; each asks for one order', () => {
  assert.deepEqual(STEPS.map((x) => x.id), ['move', 'knife', 'gun', 'hold']);
  assert.equal(STEPS.filter((x) => x.zombie).length, 3);
  assert.equal(STEPS[0]!.zombie, undefined);
  assert.deepEqual(STEPS.map((x) => x.order), ['move', 'attack', 'attack', 'hold']);
  assert.equal(STEPS[2]!.arrives?.kind, 'scout'); // Eli comes in with the rescue shot
});

test('every fixed zombie spawn is a walkable tile and a free tile lies within reach of the fire', () => {
  const s = createIntro();
  for (const step of STEPS) {
    if (step.zombie && step.zombie.near === undefined) assert.ok(reachable(s, [step.zombie.x, step.zombie.y]), `${step.id} spawn ${JSON.stringify(step.zombie)} is not reachable`);
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

test('the order filter: while the step waits only its order is accepted', () => {
  const s = createIntro();
  ackSay(s);
  assert.deepEqual(admit(s, 'move', ['fighter']), ['fighter']);
  assert.deepEqual(admit(s, 'hold', ['fighter']), []);
  assert.deepEqual(admit(s, 'attack', ['fighter'], 'zombie1'), []);
  assert.equal(give(s, { type: 'hold', id: 'fighter', toward: [10, 10] }), false);
  assert.equal(s.waiting, true);
  resume(s);
  // once time runs, every order is accepted (the step's retry is the safety net)
  assert.deepEqual(admit(s, 'hold', ['fighter']), ['fighter']);
});

test('step 1: walking Cass near the fire plays afterMove and brings the first zombie', () => {
  const s = createIntro();
  ackSay(s);
  assert.equal(s.step, 0);
  assert.deepEqual(objectiveAt(s), [STEPS[0]!.at!.x, STEPS[0]!.at!.y]);
  run(s, 30); // standing still does nothing: the world waits for the order
  assert.equal(s.tick, 0);
  assert.ok(give(s, { type: 'move', ids: ['fighter'], to: [STEPS[0]!.at!.x, STEPS[0]!.at!.y] }));
  assert.ok(until(s, () => s.say !== null));
  assert.equal(s.say, 'afterMove');
  assert.equal(s.step, 1);
  assert.equal(s.enemies.length, 1);
  assert.equal(s.waiting, true); // the knife step freezes at once
  const z = zombie(s);
  assert.deepEqual([z.x, z.y], [STEPS[1]!.zombie!.x, STEPS[1]!.zombie!.y]);
  const tick = s.tick;
  ackSay(s);
  run(s, 10); // still frozen until the attack order is given
  assert.equal(s.tick, tick);
  assert.equal(s.done, false);
});

test('step 2: only Cass may attack with the knife; the kill brings Eli in and a zombie walking up on Cass', () => {
  const s = afterMove();
  assert.deepEqual(admit(s, 'move', ['fighter']), []);
  assert.deepEqual(admit(s, 'attack', ['fighter'], 'nope'), []);
  assert.deepEqual(admit(s, 'attack', ['fighter'], s.zombieId!), ['fighter']);
  nextTo(s);
  assert.ok(give(s, { type: 'attack', ids: ['fighter'], target: s.zombieId! }));
  assert.ok(until(s, () => s.say !== null));
  assert.equal(s.say, 'afterKnife');
  assert.equal(s.step, 2);
  assert.equal(s.ammo, 3);
  // Eli arrived at the edge of the woods and the rescue zombie is on the map, both already visible for the dialogue
  assert.deepEqual(s.survivors.map((u) => u.kind), ['fighter', 'scout']);
  assert.equal(s.enemies.length, 2);
  const [cass, eli, z] = [fighter(s), scout(s), zombie(s)];
  assert.equal(z.hp, 60);
  assert.equal(z.ai.mode, 'investigate');
  assert.ok(Math.abs(Math.hypot(z.x - cass.x, z.y - cass.y) - 6) <= 1, 'the zombie starts about 6 tiles from Cass');
  assert.ok(Math.abs(Math.hypot(eli.x - cass.x, eli.y - cass.y) - 7) <= 1, 'Eli starts about 7 tiles from Cass');
  assert.ok(reachable(s, [Math.round(eli.x), Math.round(eli.y)]));
  assert.equal(s.waiting, false); // the world runs until the zombie closes in
});

test("step 3: the zombie closes in on Cass, the world freezes, and only Eli's pistol shot is accepted", () => {
  const s = frozenForShot();
  const cass = fighter(s);
  const z = zombie(s);
  assert.ok(Math.hypot(z.x - cass.x, z.y - cass.y) <= STEPS[2]!.stopWithin! + 0.3, 'it is close to Cass when time stops');
  assert.ok(z.hp > 0);
  const tick = s.tick;
  run(s, 30);
  assert.equal(s.tick, tick);
  assert.equal(hintOf(s), STEPS[2]!.hint);

  assert.deepEqual(admit(s, 'attack', ['fighter'], s.zombieId!), []); // Cass cannot do it
  assert.deepEqual(admit(s, 'move', ['scout']), []);
  assert.deepEqual(admit(s, 'attack', ['scout', 'fighter'], s.zombieId!), ['scout']); // a mixed selection sends only Eli
  selectWeapon(s, 'scout', 'club');
  assert.deepEqual(admit(s, 'attack', ['scout'], s.zombieId!), []); // not with the club
  selectWeapon(s, 'scout', 'pistol');
  assert.deepEqual(admit(s, 'attack', ['scout'], s.zombieId!), ['scout']);

  assert.ok(give(s, { type: 'attack', ids: ['scout'], target: s.zombieId! }));
  assert.equal(s.waiting, false);
  assert.ok(until(s, () => s.say !== null));
  assert.equal(s.say, 'afterGun');
  assert.equal(s.step, 3);
  assert.equal(s.ammo, 2);
  assert.ok(cass.hp > 0);
});

test('step 3: it freezes only once, so the shooting is not interrupted again', () => {
  const s = frozenForShot();
  assert.ok(give(s, { type: 'attack', ids: ['scout'], target: s.zombieId! }));
  const tick = s.tick;
  run(s, 5);
  assert.equal(s.tick, tick + 5);
  assert.equal(s.waiting, false);
});

test('step 4: the zombie waits in view until Hold is ordered; killing it without Hold does not count, with Hold it does and ends the intro', () => {
  const s = afterGun();
  assert.equal(s.step, 3);
  const z = zombie(s);
  assert.equal(z.ai.mode, 'investigate');
  assert.ok(z.path.length > 0);
  assert.equal(s.waiting, true);
  const tick = s.tick;
  run(s, 20);
  assert.equal(s.tick, tick);
  assert.deepEqual(admit(s, 'attack', ['fighter'], s.zombieId!), []);
  assert.deepEqual(admit(s, 'move', ['fighter']), []);

  // killed by an attack order that slipped past the filter: not a hold, so the zombie is replaced and the retry hint shows
  s.waiting = false;
  nextTo(s);
  orderAttack(s, ['fighter'], s.zombieId!);
  assert.ok(until(s, () => s.note !== null));
  assert.equal(s.step, 3);
  assert.equal(s.waiting, true);
  assert.equal(hintOf(s), STEPS[3]!.retry);

  // a survivor holding toward the next zombie kills it as it walks into the cone
  const f = fighter(s);
  const next = zombie(s);
  [f.x, f.y, f.path, f.order] = [next.x, next.y + 4, [], null];
  [scout(s).x, scout(s).y, scout(s).path] = [next.x + 1, next.y + 4, []];
  next.path = findPath(s.grid, [next.x, next.y], [f.x, f.y]) ?? [];
  assert.ok(next.path.length > 0);
  assert.ok(give(s, { type: 'hold', id: 'fighter', toward: [next.x, next.y] }));
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
  resume(s);
  fighter(s).hp = 0;
  run(s, 1);
  // the mission tick marks the death; later ticks do nothing
  const tick = s.tick;
  run(s, 20);
  assert.equal(s.status, 'failed');
  assert.equal(s.tick, tick);
});
