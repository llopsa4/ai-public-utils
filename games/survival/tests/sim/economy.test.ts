import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mealNeed, unityBand, unityWork } from '../../src/sim/economy';
import { workRate } from '../../src/sim/jobs';
import { removePerson } from '../../src/sim/people';
import { type GameState, type Tile2 } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';
import { stepFed } from './helpers';

const adults = (s: GameState) => s.people.filter((p) => p.age === 'adult');
const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

function nearestBerry(s: GameState): Tile2 {
  let best: Tile2 = [0, 0];
  let bestD = Infinity;
  s.map.tiles.forEach((t, i) => {
    if (t !== 'berry') return;
    const d = Math.hypot((i % 48) - 24, Math.floor(i / 48) - 24);
    if (d < bestD) {
      bestD = d;
      best = [i % 48, Math.floor(i / 48)];
    }
  });
  return best;
}

test('the start store and meter match the data: 120 food, 40 wood, 6 hides, 0 pemmican, Wotakuye 60 (Steady)', () => {
  const s = newGame(1);
  assert.deepEqual(s.store, { food: 120, wood: 40, hides: 6, pemmican: 0 });
  assert.equal(s.wotakuye, 60);
  assert.equal(unityBand(s).name, 'Steady');
  assert.equal(mealNeed(s), 18);
});

test('gathering fills the store: a delivered load of 5 food arrives', () => {
  const s = newGame(1);
  const [g] = adults(s);
  queueOrders(s, [{ type: 'assign', ids: [g.id], job: 'gather', tile: nearestBerry(s) }]);
  let tick = 0;
  while (tick < 4000 && s.store.food === 120) {
    stepFed(s, 1);
    tick++;
  }
  close(s.store.food, 125);
});

test('hunger drains every tick: +1/12 per tick, 100 at most', () => {
  const s = newGame(1);
  step(s, 120);
  for (const p of s.people) close(p.hunger, 20 + 120 * 0.08333);
  step(s, 479); // tick 599, still before the first meal
  assert.ok(s.people.every((p) => p.hunger > 69.9 && p.hunger < 70.1));
  s.tick = 700; // between meals
  for (const p of s.people) p.hunger = 99.99;
  step(s, 5);
  assert.ok(s.people.every((p) => p.hunger === 100));
});

test('a meal for the start camp takes 18 food, relieves 50 hunger and adds 2 Wotakuye', () => {
  const s = newGame(1);
  s.tick = 599;
  for (const p of s.people) p.hunger = 70;
  step(s, 1);
  assert.equal(s.store.food, 102);
  assert.equal(s.wotakuye, 62);
  for (const p of s.people) close(p.hunger, 70.08333 - 50);
});

test('a short meal is shared evenly and lowers Wotakuye by 1 + 8 x (1 - share)', () => {
  const s = newGame(1);
  s.tick = 599;
  s.store.food = 9; // share 0.5
  for (const p of s.people) p.hunger = 70;
  step(s, 1);
  assert.equal(s.store.food, 0);
  close(s.wotakuye, 60 - (1 + 8 * 0.5));
  for (const p of s.people) close(p.hunger, 70.08333 - 25);
  assert.ok(s.messages.some((m) => m.text.includes('Not enough food')));

  const t = newGame(1);
  t.tick = 599;
  t.store.food = 0;
  step(t, 1);
  close(t.wotakuye, 60 - 9);
  assert.ok(t.messages.some((m) => m.text.includes('nobody ate')));
});

test('starving (hunger 100) drains 0.05 health per tick; a fed person heals 0.01', () => {
  const s = newGame(1);
  const [a, b] = adults(s);
  a.hunger = 100;
  b.health = 50;
  step(s, 100);
  close(a.health, 95, 1e-6);
  close(b.health, 51, 1e-6);
  b.health = 100;
  step(s, 10);
  assert.equal(b.health, 100, 'health never goes above 100');
});

test('a starved person dies: removed, bed freed, Wotakuye -8, a message', () => {
  const s = newGame(1);
  const victim = s.people.find((p) => p.home !== null)!;
  const tipi = s.buildings.find((b) => b.id === victim.home)!;
  victim.hunger = 100;
  victim.health = 0.04;
  step(s, 1);
  assert.equal(s.people.some((p) => p.id === victim.id), false);
  assert.equal(s.people.length, 19);
  assert.equal(tipi.residents.includes(victim.id), false);
  assert.equal(s.wotakuye, 52);
  assert.ok(s.messages.some((m) => m.text === `${victim.name} has died.`));
});

test('an empty store starves the camp: meals fail, Wotakuye falls, then people die', () => {
  const s = newGame(1);
  s.store.food = 0;
  step(s, 600);
  close(s.wotakuye, 51);
  for (const p of s.people) p.hunger = 100;
  step(s, 2200);
  assert.ok(s.people.length < 20, `people left ${s.people.length}`);
  assert.ok(s.wotakuye < 51);
});

test('Wotakuye bands set the work rate: 1.2, 1.0, 0.85, 0.7', () => {
  const s = newGame(1);
  const [a] = adults(s);
  const expected: [number, string, number][] = [[80, 'United', 1.2], [50, 'Steady', 1], [30, 'Strained', 0.85], [10, 'Quarrelling', 0.7]];
  for (const [value, name, work] of expected) {
    s.wotakuye = value;
    assert.equal(unityBand(s).name, name);
    assert.equal(unityWork(s), work);
    close(workRate(s, a, 'gather'), 0.01 * work, 1e-12);
  }
  s.wotakuye = 40;
  assert.equal(unityBand(s).name, 'Steady');
  s.wotakuye = 39.9;
  assert.equal(unityBand(s).name, 'Strained');
});

test('day start: unhoused people cost 1 Wotakuye each (10 at the start)', () => {
  const s = newGame(1);
  s.tick = 1199;
  step(s, 1);
  close(s.wotakuye, 60 + 2 - 10); // a full meal, then 10 unhoused
  assert.equal(unityBand(s).name, 'Steady');
});

test('low Wotakuye makes an adult of the larger family leave at day start', () => {
  const s = newGame(1);
  for (const p of s.people.filter((q) => q.family === 1).slice(0, 2)) removePerson(s, p.id);
  const before = adults(s).filter((p) => p.family === 0).length;
  s.wotakuye = 10;
  s.tick = 1199;
  step(s, 1);
  assert.equal(unityBand(s).name, 'Quarrelling');
  assert.equal(adults(s).filter((p) => p.family === 0).length, before - 1);
  assert.equal(s.people.filter((p) => p.family === 1).length, 8, 'the smaller family keeps everyone');
  assert.ok(s.messages.some((m) => m.text.endsWith('has left the camp.')));
  close(s.wotakuye, 10 + 2 - 8, 1e-9); // meal, 8 unhoused; a departure is not a death: no -8
});

test('high Wotakuye brings a newcomer only when a bed is free and the store has 40 food', () => {
  /** 10 housed people (5 per tipi, full), then `setup`, then one day start at Wotakuye 100. */
  const run = (setup: (s: GameState) => void) => {
    const s = newGame(1);
    for (const p of s.people.filter((q) => q.home === null)) removePerson(s, p.id);
    setup(s);
    s.wotakuye = 100;
    s.tick = 1199;
    const before = s.people.length;
    step(s, 1);
    return { s, gained: s.people.length - before };
  };
  const freeBed = (s: GameState) => removePerson(s, s.people.find((p) => p.family === 1)!.id);

  assert.equal(run(() => {}).gained, 0, 'both tipis are full: no bed');
  assert.equal(run((s) => { freeBed(s); s.store.food = 30; }).gained, 0, 'a bed but under 40 food');

  const { s, gained } = run(freeBed);
  assert.equal(gained, 1);
  const newcomer = s.people[s.people.length - 1];
  assert.equal(newcomer.family, 1, 'joins the smaller family');
  assert.equal(newcomer.age, 'adult');
  assert.ok(newcomer.name.startsWith('Kingfisher '));
  assert.notEqual(newcomer.home, null, 'and gets the free bed');
  assert.ok(s.messages.some((m) => m.text === `${newcomer.name} joins the camp.`));
});

test('the same seed gives an identical state over two days of economy', () => {
  const run = () => {
    const s = newGame(1);
    queueOrders(s, [{ type: 'assign', ids: [adults(s)[0].id], job: 'gather', tile: nearestBerry(s) }]);
    step(s, 2500);
    return JSON.stringify(s);
  };
  assert.equal(run(), run());
});
