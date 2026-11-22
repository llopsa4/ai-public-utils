// A full store (DESIGN-hunting.md `## Full store`, PLAN.md G9): orders win, blocked people find other work.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { placeBuilding } from '../../src/sim/buildings';
import { storeBlocked } from '../../src/sim/jobs';
import { campCentre } from '../../src/sim/map';
import { idleTask } from '../../src/sim/people';
import { storeCap, type Building, type GameState, type Person } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';

const FULL = 'Store is full';

/** Fills every store to its cap. */
function fillStores(s: GameState): void {
  for (const res of ['food', 'wood', 'hides', 'pemmican'] as const) s.store[res] = storeCap(s, res);
}

/** Steps `n` ticks, keeps the stores full (meals and spoilage would make room) and counts the `Store is full` toasts. */
function stepFull(s: GameState, n: number, keepFull = true): number {
  const seen = new Set<object>();
  for (let i = 0; i < n; i++) {
    step(s, 1);
    if (keepFull) fillStores(s);
    for (const m of s.messages) if (m.text === FULL) seen.add(m);
  }
  return seen.size;
}

/** An adult holding a full load of food, standing beside the store, with no job. */
function loadedAdult(s: GameState, food = 10): Person {
  const p = s.people.find((q) => q.age === 'adult')!;
  p.job = null;
  p.carry = { res: 'food', amount: food, hides: 0 };
  p.task = idleTask();
  return p;
}

/** A site a few tiles east of the camp. */
function site(s: GameState, type = 'gathering_spot'): Building {
  const [cx, cy] = campCentre(s.map);
  for (let x = cx + 4; x < cx + 10; x++) {
    const r = placeBuilding(s, type, x, cy + 4);
    if (r.building) return r.building;
  }
  throw new Error('no room for a site');
}

test('a blocked person does not wait at the store, keeps the goods, and is told once', () => {
  const s = newGame(1);
  fillStores(s);
  const p = loadedAdult(s);
  const toasts = stepFull(s, 1200);
  assert.equal(p.carry.amount, 10, 'goods kept');
  assert.notEqual(p.task.step, 'deliver', 'not stuck at the store');
  assert.ok(storeBlocked(s, p));
  assert.equal(toasts, 1, 'one toast for one blocked person');
});

test('with no order, a blocked person takes free building work', () => {
  const s = newGame(1);
  fillStores(s);
  const b = site(s);
  b.delivered = { wood: 10 }; // materials in: only building is left
  const p = loadedAdult(s);
  let built = false;
  for (let i = 0; i < 1500 && !built; i++) {
    stepFull(s, 1);
    built = p.job?.kind === 'build' && p.job.building === b.id;
  }
  assert.ok(built, 'the blocked person took the build job');
  assert.equal(p.carry.amount, 10, 'still holding the food');
});

test('a build order wins over a stuck delivery and the person builds holding the goods', () => {
  const s = newGame(1);
  fillStores(s);
  const b = site(s, 'tipi'); // 300 build points: still unfinished when the order comes
  b.delivered = { wood: 20, hides: 8 };
  const p = loadedAdult(s);
  stepFull(s, 50); // blocked once
  queueOrders(s, [{ type: 'assign', ids: [p.id], building: b.id }]);
  stepFull(s, 1);
  assert.equal(p.job?.kind, 'build');
  stepFull(s, 1500);
  assert.ok(b.built > 0 || b.done, 'built');
  assert.equal(p.carry.amount, 10, 'food kept');
});

test('a move order wins: the person goes there and does not return to queue at the store', () => {
  const s = newGame(1);
  fillStores(s);
  const p = loadedAdult(s);
  stepFull(s, 100);
  queueOrders(s, [{ type: 'move', ids: [p.id], to: [p.x + 8, p.y + 8] }]);
  stepFull(s, 1);
  assert.equal(p.task.step, 'walk');
  stepFull(s, 1500);
  assert.notEqual(p.task.step, 'deliver');
  assert.equal(p.carry.amount, 10);
});

test('a builder holding wood drops it at a site that needs it; the rest stays carried', () => {
  const s = newGame(1);
  fillStores(s);
  const b = site(s); // needs 10 wood
  const p = s.people.find((q) => q.age === 'adult')!;
  p.carry = { res: 'wood', amount: 14, hides: 0 };
  queueOrders(s, [{ type: 'assign', ids: [p.id], building: b.id }]);
  stepFull(s, 600);
  assert.equal(b.delivered.wood, 10, 'the site took what it needed');
  assert.ok(Math.abs(p.carry.amount - 4) < 1e-9, `4 wood left, got ${p.carry.amount}`);
});

test('a builder drops hides at a site that needs them', () => {
  const s = newGame(1);
  fillStores(s);
  const b = site(s, 'drying_rack'); // 15 wood, 2 hides
  const p = s.people.find((q) => q.age === 'adult')!;
  p.carry = { res: 'food', amount: 5, hides: 3 };
  queueOrders(s, [{ type: 'assign', ids: [p.id], building: b.id }]);
  stepFull(s, 600);
  assert.equal(b.delivered.hides, 2);
  assert.ok(Math.abs((p.carry.hides ?? 0) - 1) < 1e-9);
  assert.equal(p.carry.amount, 5, 'the food is not needed and stays carried');
});

test('a woodcutter with a full load waits at the tree, not at the store, and keeps the job', () => {
  const s = newGame(1);
  fillStores(s);
  const i = s.map.tiles.findIndex((t, k) => t === 'forest' && s.map.amount[k] > 1);
  const tile: [number, number] = [i % s.map.size, Math.floor(i / s.map.size)];
  const p = s.people.find((q) => q.age === 'adult')!;
  queueOrders(s, [{ type: 'assign', ids: [p.id], job: 'chop', tile }]);
  stepFull(s, 3000);
  assert.equal(p.job?.kind, 'chop', 'the order stands');
  assert.equal(p.carry.res, 'wood');
  assert.notEqual(p.task.step, 'deliver');
  assert.ok(Math.hypot(p.x - tile[0], p.y - tile[1]) < 2, 'standing by the tree');
});

test('when a store has room again the goods are delivered', () => {
  const s = newGame(1);
  fillStores(s);
  const p = loadedAdult(s);
  assert.equal(stepFull(s, 300), 1);
  s.store.food -= 50;
  stepFull(s, 1200, false);
  assert.equal(p.carry.amount, 0, 'delivered');
});

test('determinism holds with a full store', () => {
  const run = () => {
    const s = newGame(7);
    fillStores(s);
    loadedAdult(s);
    stepFull(s, 2000);
    return JSON.stringify({ people: s.people, store: s.store, buildings: s.buildings });
  };
  assert.equal(run(), run());
});
