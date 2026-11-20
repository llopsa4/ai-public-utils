import assert from 'node:assert/strict';
import { test } from 'node:test';
import wavesData from '../../src/data/waves.json';
import { assignWorkers, placeBuilding } from '../../src/sim/buildings';
import { mealNeed } from '../../src/sim/economy';
import { workRate } from '../../src/sim/jobs';
import { removePerson } from '../../src/sim/people';
import { dayInSeason, seasonAt, seasonLabel, seasonOf, yearOf } from '../../src/sim/seasons';
import { loadState, serialize, type SaveFile } from '../../src/sim/save';
import { storeCap, type GameState } from '../../src/sim/state';
import { newGame, step } from '../../src/sim/tick';
import { stepFed } from './helpers';

const SPRING = 0;
const SUMMER = 3600;
const AUTUMN = 7200;
const WINTER = 10800;
const adults = (s: GameState) => s.people.filter((p) => p.age === 'adult');

/** One step across a day start at `tick` (a multiple of 1200), with plenty of food in the store. */
function dayStartAt(tick: number, food = 1000, wotakuye?: number): GameState {
  const s = newGame(1);
  s.store.food = food;
  if (wotakuye !== undefined) s.wotakuye = wotakuye;
  s.tick = tick - 1;
  s.messages = [];
  step(s, 1);
  return s;
}

test('the calendar: 3-day seasons, a 12-day year, a camp starts in spring', () => {
  assert.equal(seasonAt(0), 'spring');
  assert.equal(seasonAt(3599), 'spring');
  assert.equal(seasonAt(3600), 'summer');
  assert.equal(seasonAt(7200), 'autumn');
  assert.equal(seasonAt(10800), 'winter');
  assert.equal(seasonAt(14399), 'winter');
  assert.equal(seasonAt(14400), 'spring');
  assert.equal(seasonOf(newGame(1)), 'spring');
  assert.equal(seasonLabel('winter'), 'Winter');
  assert.equal(yearOf({ tick: 14399 }), 1);
  assert.equal(yearOf({ tick: 14400 }), 2);
  assert.deepEqual([0, 1199, 1200, 2400, 3599, 3600].map((tick) => dayInSeason({ tick })), [1, 1, 2, 3, 3, 1]);
});

test('a toast names the season when it changes, and only then', () => {
  const texts = (s: GameState) => s.messages.map((m) => m.text).filter((t) => /^(Spring|Summer|Autumn|Winter):/.test(t));
  assert.deepEqual(texts(dayStartAt(SUMMER)), ['Summer: good hunting, food spoils fast.']);
  assert.deepEqual(texts(dayStartAt(AUTUMN)), ['Autumn: gather and dry what you can.']);
  assert.deepEqual(texts(dayStartAt(WINTER)), ['Winter: gathering nearly stops, and the cold bites.']);
  assert.deepEqual(texts(dayStartAt(14400)), ['Spring: newcomers may arrive.']);
  assert.deepEqual(texts(dayStartAt(2400)), [], 'a day start inside a season');
  assert.deepEqual(texts(dayStartAt(1200)), []);
});

test('gathering is x1.0 in spring, x1.2 in summer, x1.5 in autumn and x0.3 in winter', () => {
  const s = newGame(1);
  const [p] = adults(s);
  const rate = (tick: number) => {
    s.tick = tick;
    return workRate(s, p, 'gather');
  };
  const base = rate(SPRING);
  assert.ok(base > 0);
  assert.ok(Math.abs(rate(SUMMER) / base - 1.2) < 1e-9);
  assert.ok(Math.abs(rate(AUTUMN) / base - 1.5) < 1e-9);
  assert.ok(Math.abs(rate(WINTER) / base - 0.3) < 1e-9);
  assert.equal(workRate(s, p, 'chop') > 0, true);
  s.tick = WINTER;
  assert.ok(Math.abs(workRate(s, p, 'chop') - workRate({ ...s, tick: SPRING }, p, 'chop')) < 1e-12, 'only gathering changes');
});

test('hunting succeeds more often in summer than in winter (same seed, same time)', () => {
  const trips = (tick: number) => {
    const s = newGame(1);
    s.tick = tick;
    s.store.wood = 100;
    s.store.hides = 20;
    s.store.food = 100;
    const r = placeBuilding(s, 'hunting_lodge', 28, 26);
    assert.ok(r.building, r.error ?? 'placed');
    const lodge = r.building!;
    lodge.done = true;
    const [hunter] = adults(s);
    assignWorkers(s, [hunter.id], lodge.id);
    const before = s.store.hides;
    stepFed(s, 3400);
    return s.store.hides - before;
  };
  // The wolves keep to the clock (3600, 7200, 10800, 14400), not to the season: move them out of the way.
  const at = wavesData.waves.map((w) => w.at);
  wavesData.waves.forEach((w) => (w.at = 1e9));
  let summer: number;
  let winter: number;
  try {
    summer = trips(SUMMER);
    winter = trips(WINTER);
  } finally {
    wavesData.waves.forEach((w, i) => (w.at = at[i]));
  }
  assert.ok(summer > winter, `summer ${summer} winter ${winter}`);
});

test('winter meals need x1.25 the food: 22.5 for the start camp instead of 18', () => {
  const s = newGame(1);
  assert.equal(mealNeed(s), 18);
  s.tick = WINTER;
  assert.equal(mealNeed(s), 22.5);
  const w = dayStartAt(WINTER + 600, 1000); // a meal time that is not a day start
  assert.equal(w.store.food, 1000 - 22.5);
});

test('winter cold costs 3 Wotakuye per unhoused person at day start (summer: 1)', () => {
  // 60 + 2 (a full meal) - 10 unhoused x rate
  assert.equal(dayStartAt(WINTER).wotakuye, 60 + 2 - 30);
  assert.equal(dayStartAt(SUMMER).wotakuye, 60 + 2 - 10);
  assert.equal(dayStartAt(1200).wotakuye, 60 + 2 - 10);
});

test('spoilage takes floor(food x rate) at day start: 3% spring, 10% summer, none in winter', () => {
  assert.equal(dayStartAt(1200).store.food, 1000 - 18 - 29);
  const summer = dayStartAt(SUMMER);
  assert.equal(summer.store.food, 1000 - 18 - 98);
  assert.ok(summer.messages.some((m) => m.text === 'Some food spoiled in the heat.'));
  assert.equal(dayStartAt(AUTUMN).store.food, 1000 - 18 - 29);
  assert.equal(dayStartAt(WINTER).store.food, 1000 - 22.5);
  // a small loss is silent
  assert.ok(!dayStartAt(SUMMER, 40).messages.some((m) => m.text.startsWith('Some food spoiled')));
});

test('spring newcomers arrive at Steady Wotakuye; summer needs United', () => {
  const run = (tick: number, wotakuye: number) => {
    const s = newGame(1);
    for (const p of s.people.filter((q) => q.home === null)) removePerson(s, p.id);
    removePerson(s, s.people.find((p) => p.family === 1)!.id); // a free bed
    s.store.food = 1000;
    s.wotakuye = wotakuye;
    s.tick = tick - 1;
    const before = s.people.length;
    step(s, 1);
    return s.people.length - before;
  };
  assert.equal(run(1200, 50), 1, 'spring, Steady');
  assert.equal(run(1200, 30), 0, 'spring, Strained');
  assert.equal(run(SUMMER, 50), 0, 'summer, Steady');
  assert.equal(run(SUMMER, 80), 1, 'summer, United');
  assert.equal(run(WINTER, 50), 0, 'winter, Steady');
});

test('pemmican: a fourth store resource (cap 100 per store) that meals use after raw food, at 1.5 each', () => {
  const meal = (food: number, pemmican: number) => {
    const s = newGame(1);
    s.store.food = food;
    s.store.pemmican = pemmican;
    s.tick = 599;
    step(s, 1); // tick 600: a meal for 18
    return s;
  };
  assert.equal(storeCap(newGame(1), 'pemmican'), 100);
  const a = meal(10, 30); // 10 food + 8 needed from pemmican = 5.333 pemmican
  assert.ok(Math.abs(a.store.pemmican - (30 - 8 / 1.5)) < 1e-9);
  assert.equal(a.store.food, 0);
  assert.equal(a.wotakuye, 62, 'a full meal');
  const b = meal(30, 30); // food covers it all: pemmican is kept
  assert.equal(b.store.pemmican, 30);
  assert.equal(b.store.food, 12);
  const c = meal(0, 6); // 6 pemmican = 9 food units: half the camp's meal
  assert.equal(c.store.pemmican, 0);
  assert.ok(c.messages.some((m) => m.text === 'Not enough food: everyone ate a little.'));
  const d = meal(0, 12); // 12 x 1.5 = 18: exactly enough
  assert.ok(Math.abs(d.store.pemmican) < 1e-9);
  assert.equal(d.wotakuye, 62);
});

test('pemmican never spoils, and a saved and loaded camp keeps it', () => {
  const s = dayStartAt(SUMMER);
  assert.equal(s.store.pemmican, 0);
  const t = newGame(1);
  t.store.pemmican = 50;
  t.store.food = 0;
  t.tick = SUMMER - 1;
  step(t, 1); // a meal and a summer day start: 18 food units from 12 pemmican, nothing rots
  assert.ok(Math.abs(t.store.pemmican - 38) < 1e-9);
  const loaded = loadState(JSON.parse(serialize(t)) as SaveFile);
  assert.equal(loaded.store.pemmican, t.store.pemmican);
});

test('a drying rack turns 6 food into 4 pemmican per trip (no loss of food value)', () => {
  const s = newGame(1);
  s.store.wood = 100;
  s.store.hides = 20;
  s.store.food = 100;
  const placed = placeBuilding(s, 'drying_rack', 28, 26);
  assert.ok(placed.building, placed.error ?? 'placed');
  const rack = placed.building!;
  assert.equal(assignWorkers(s, [adults(s)[0].id], rack.id), 0, 'an unfinished rack takes nobody');
  rack.done = true;
  const [worker, second, third] = adults(s);
  assert.equal(assignWorkers(s, [worker.id, second.id, third.id], rack.id), 2, 'at most 2 workers');
  assert.equal(worker.society, null, 'a rack has no society');
  stepFed(s, 1500);
  const inHand = worker.carry.res === 'food' ? worker.carry.amount : 0;
  assert.ok(s.store.pemmican >= 8, `pemmican ${s.store.pemmican}`);
  assert.equal(s.store.pemmican % 4 > 1e-9 ? 1 : 0, 0, 'whole batches of 4');
  // Food left plus pemmican (x1.5) plus what is in two workers' hands is the 100 we started with.
  const hands = [worker, second].reduce((n, w) => n + (w.carry.res === 'food' ? w.carry.amount : 0), 0);
  assert.ok(Math.abs(s.store.food + s.store.pemmican * 1.5 + hands - 100) < 1e-9, `food ${s.store.food} pem ${s.store.pemmican} hands ${hands} (${inHand})`);
});

test('a worker waits at an empty store for the 6 food of a batch, and the camp keeps no food it cannot spare', () => {
  const s = newGame(1);
  s.store.wood = 100;
  s.store.hides = 20;
  s.store.food = 5;
  const rack = placeBuilding(s, 'drying_rack', 28, 26).building!;
  rack.done = true;
  assignWorkers(s, [adults(s)[0].id], rack.id);
  stepFed(s, 599); // short of the meal at tick 600, which would take the 5 food itself
  assert.equal(s.store.pemmican, 0);
  assert.equal(s.store.food, 5, 'nothing was taken');
});
