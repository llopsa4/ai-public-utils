// Wild game and hunting (DESIGN-hunting.md `## Wild game`, `## Hunting`, PLAN.md G10).
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import wavesData from '../../src/data/waves.json';
import {
  addHerd, ANIMAL_DATA, animalsOf, carcasses, hurtAnimal, liveAnimals, spottingDistance, stepAnimals, takeLoad, type Animal,
} from '../../src/sim/animals';
import { assignWorkers } from '../../src/sim/buildings';
import { campCentre } from '../../src/sim/map';
import { walkable } from '../../src/sim/people';
import { addBuilding, type GameState, type Person, type Tile2 } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';
import { stepFed } from './helpers';

// Wolves keep to the clock; move them out of the way of long hunts.
const waveAt = wavesData.waves.map((w) => w.at);
before(() => wavesData.waves.forEach((w) => (w.at = 1e9)));
after(() => wavesData.waves.forEach((w, i) => (w.at = waveAt[i])));

const adult = (s: GameState, i = 0): Person => s.people.filter((p) => p.age === 'adult')[i];

/** A walkable tile at about `d` tiles east of the fire (or the nearest walkable one along the row). */
function tileFromFire(s: GameState, d: number): Tile2 {
  const [cx, cy] = campCentre(s.map);
  for (let k = 0; k < 20; k++) {
    for (const [x, y] of [[cx + d, cy + k], [cx + d, cy - k], [cx - d, cy + k], [cx - d, cy - k]] as Tile2[]) {
      if (walkable(s, x, y)) return [x, y];
    }
  }
  throw new Error('no tile');
}

/** A camp with one lone animal of `kind` at a tile and nothing else wild. */
function lone(s: GameState, kind: 'deer' | 'bison', at: Tile2): Animal {
  s.animals = [];
  addHerd(s, kind, at);
  const a = animalsOf(s)[0];
  s.animals = [a];
  return a;
}

test('the start herds: 2 herds of 3 deer and 1 herd of 4 bison, 14-22 tiles from the fire', () => {
  for (const seed of [1, 2, 3]) {
    const s = newGame(seed);
    const list = animalsOf(s);
    assert.equal(list.filter((a) => a.kind === 'deer').length, 6, `seed ${seed}`);
    assert.equal(list.filter((a) => a.kind === 'bison').length, 4, `seed ${seed}`);
    assert.equal(new Set(list.map((a) => a.herd)).size, 3);
    const [cx, cy] = campCentre(s.map);
    for (const a of list) {
      const d = Math.hypot(a.x - cx, a.y - cy);
      assert.ok(d >= 12 && d <= 24, `${a.kind} at ${d.toFixed(1)}`); // herd centre 14-22, members a tile or two round it
    }
  }
});

test('herds respawn at a map edge on respawn days, only while fewer than 12 animals live', () => {
  const s = newGame(1);
  s.animals = [];
  let spawned = 0;
  for (let day = 1; day <= 30; day++) {
    s.tick = day * 1200;
    const n = animalsOf(s).length;
    stepAnimals(s);
    const fresh = animalsOf(s).slice(n);
    if (fresh.length > 0) {
      spawned++;
      assert.equal(day % (s.tick >= 10800 && s.tick < 14400 ? 4 : 2), 0, `day ${day} is a respawn day`);
      assert.ok(fresh.every((a) => a.x <= 5 || a.y <= 5 || a.x >= s.map.size - 6 || a.y >= s.map.size - 6), 'at an edge');
    }
    s.animals = [];
  }
  assert.ok(spawned >= 5, `${spawned} herds`);
  // At the cap nothing comes.
  const full = newGame(1);
  while (liveAnimals(full).length < ANIMAL_DATA.cap) addHerd(full, 'deer', tileFromFire(full, 16));
  const n = animalsOf(full).length;
  for (let day = 2; day <= 20; day += 2) {
    full.tick = day * 1200;
    stepAnimals(full);
  }
  assert.equal(animalsOf(full).length, n);
});

test('a deer falls in 2 bow hits of 12 and a bison in 6; the dead animal is a carcass', () => {
  const s = newGame(1);
  const deer = lone(s, 'deer', tileFromFire(s, 16));
  hurtAnimal(s, deer, 12, { x: 0, y: 0 });
  assert.equal(deer.dead, false);
  assert.ok(deer.fleeing > 0, 'shot: it flees');
  hurtAnimal(s, deer, 12, { x: 0, y: 0 });
  assert.equal(deer.dead, true);
  const bison = lone(s, 'bison', tileFromFire(s, 16));
  for (let i = 0; i < 5; i++) hurtAnimal(s, bison, 12, { x: 0, y: 0 });
  assert.equal(bison.dead, false);
  hurtAnimal(s, bison, 12, { x: 0, y: 0 });
  assert.equal(bison.dead, true);
  assert.deepEqual([bison.meat, bison.hides], [30, 3]);
});

test('a bison carcass is three loads of 10 meat, all 3 hides on the first; then it is gone', () => {
  const s = newGame(1);
  const b = lone(s, 'bison', tileFromFire(s, 16));
  hurtAnimal(s, b, 999, { x: 0, y: 0 });
  assert.deepEqual(takeLoad(b), { meat: 10, hides: 3 });
  assert.deepEqual(takeLoad(b), { meat: 10, hides: 0 });
  stepAnimals(s);
  assert.equal(carcasses(s).length, 1);
  assert.deepEqual(takeLoad(b), { meat: 10, hides: 0 });
  stepAnimals(s);
  assert.equal(animalsOf(s).length, 0, 'the empty carcass is removed');
});

test('a lodge hunter shoots a deer and carries its meat and hide to the store', () => {
  const s = newGame(1);
  lone(s, 'deer', tileFromFire(s, 12));
  const lodge = addBuilding(s, 'hunting_lodge', 36, 36, true);
  const p = adult(s);
  assignWorkers(s, [p.id], lodge.id);
  const food = s.store.food;
  const hides = s.store.hides;
  stepFed(s, 2500);
  assert.equal(s.store.food - food, 10, 'one load of meat');
  assert.equal(s.store.hides - hides, 1);
  assert.equal(carcasses(s).length, 0, 'the carcass is used up');
});

test('a bison takes three trips to the store', () => {
  const s = newGame(1);
  const b = lone(s, 'bison', tileFromFire(s, 12));
  const p = adult(s);
  queueOrders(s, [{ type: 'hunt', ids: [p.id], animal: b.id }]);
  const food = s.store.food;
  let trips = 0;
  let was = false;
  for (let i = 0; i < 6000 && animalsOf(s).length > 0; i++) {
    stepFed(s, 1);
    const carrying = p.carry.amount > 0;
    if (carrying && !was) trips++;
    was = carrying;
  }
  stepFed(s, 400);
  assert.equal(trips, 3);
  assert.equal(s.store.food - food, 30);
});

test('spotting distance: an animal 24 tiles out is hunted only with dogs', () => {
  const run = (dogs: boolean) => {
    const s = newGame(1);
    if (dogs) s.upgrades.push('dogs');
    const a = lone(s, 'deer', tileFromFire(s, 24));
    a.path = [];
    const [cx, cy] = campCentre(s.map);
    const d = Math.hypot(a.x - cx, a.y - cy);
    assert.ok(d > 22 && d <= 26, `at ${d}`);
    const lodge = addBuilding(s, 'hunting_lodge', 36, 36, true);
    const p = adult(s);
    assignWorkers(s, [p.id], lodge.id);
    step(s, 3);
    return p.job?.animal ?? null;
  };
  assert.equal(spottingDistance(newGame(1)), 22);
  assert.equal(run(false), null, 'out of sight: the hunter waits by the fire');
  assert.notEqual(run(true), null);
});

test('the hunt order: adults hunt that animal, an elder is refused, a drafted fighter ignores it', () => {
  const s = newGame(1);
  const a = lone(s, 'deer', tileFromFire(s, 14));
  const [p, q] = [adult(s, 0), adult(s, 1)];
  const elder = s.people.find((x) => x.age === 'elder')!;
  q.drafted = true;
  queueOrders(s, [{ type: 'hunt', ids: [p.id, q.id, elder.id], animal: a.id }]);
  step(s, 1);
  assert.deepEqual([p.job?.kind, p.job?.animal], ['hunt', a.id]);
  assert.notEqual(q.job?.kind, 'hunt');
  assert.notEqual(elder.job?.kind, 'hunt');
  assert.ok(s.messages.some((m) => m.text === 'Only adults can hunt.'));
  stepFed(s, 2500);
  assert.equal(a.dead, true, 'the deer was taken');
});

test('a fetch order on a carcass: the person brings its next load home', () => {
  const s = newGame(1);
  const a = lone(s, 'deer', tileFromFire(s, 10));
  hurtAnimal(s, a, 999, { x: 0, y: 0 });
  const p = adult(s);
  const food = s.store.food;
  queueOrders(s, [{ type: 'hunt', ids: [p.id], animal: a.id }]);
  stepFed(s, 1500);
  assert.equal(s.store.food - food, 10);
  assert.equal(animalsOf(s).length, 0);
});

test('wild game is deterministic: same seed and orders, identical state', () => {
  const run = () => {
    const s = newGame(5);
    const lodge = addBuilding(s, 'hunting_lodge', 36, 36, true);
    assignWorkers(s, [adult(s, 0).id, adult(s, 1).id], lodge.id);
    stepFed(s, 4000);
    return JSON.stringify(s);
  };
  assert.equal(run(), run());
});
