import { campCentre } from '../../src/sim/map';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findPath, walkable } from '../../src/sim/people';
import { canWork, workRate } from '../../src/sim/jobs';
import { addMessage, storeCap, type GameState, type Order, type Tile2 } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';
import { stepFed } from './helpers';

/** The tile of a type nearest the fire. */
function nearest(s: GameState, type: string): Tile2 {
  let best: Tile2 = [0, 0];
  let bestD = Infinity;
  s.map.tiles.forEach((t, i) => {
    if (t !== type) return;
    const x = i % s.map.size;
    const y = Math.floor(i / s.map.size);
    const d = Math.hypot(x - 24, y - 24);
    if (d < bestD) {
      bestD = d;
      best = [x, y];
    }
  });
  return best;
}

function adults(s: GameState) {
  return s.people.filter((p) => p.age === 'adult');
}

function demoOrders(s: GameState): Order[] {
  const a = adults(s);
  const berry = nearest(s, 'berry');
  const forest = nearest(s, 'forest');
  return [
    { type: 'assign', ids: [a[0].id, a[1].id, a[2].id], job: 'gather', tile: berry },
    { type: 'assign', ids: [a[3].id, a[4].id], job: 'chop', tile: forest },
    { type: 'move', ids: [a[5].id], to: [30, 30] },
  ];
}

test('the same seed gives an identical state after step(100), however it is stepped', () => {
  const run = (chunks: number[]) => {
    const s = newGame(1);
    queueOrders(s, demoOrders(s));
    for (const c of chunks) step(s, c);
    return JSON.stringify(s);
  };
  assert.equal(run([100]), run([100]));
  assert.equal(run([100]), run(new Array(100).fill(1)));
  assert.notEqual(run([100]), run([101]));
});

test('20 people start: 12 adults, 4 elders, 4 children, 2 families, all on free tiles', () => {
  const s = newGame(1);
  assert.equal(s.people.length, 20);
  assert.equal(adults(s).length, 12);
  assert.equal(s.people.filter((p) => p.age === 'elder').length, 4);
  assert.equal(s.people.filter((p) => p.age === 'child').length, 4);
  assert.equal(s.people.filter((p) => p.family === 0).length, 10);
  assert.equal(new Set(s.people.map((p) => p.id)).size, 20);
  assert.equal(new Set(s.people.map((p) => `${p.x},${p.y}`)).size, 20);
  for (const p of s.people) assert.ok(walkable(s, p.x, p.y), `${p.name} stands on a free tile`);
  assert.equal(s.people[0].name, 'Wren');
  assert.equal(s.people[19].name, 'Sage');
  assert.equal(new Set(s.people.map((p) => p.name)).size, 20, 'every start name is different');
});

test('the start houses 10 of 20, five per tipi, each family in its own tipi', () => {
  const s = newGame(1);
  const tipis = s.buildings.filter((b) => b.type === 'tipi');
  assert.equal(tipis.length, 2);
  assert.deepEqual(tipis.map((t) => t.residents.length), [5, 5]);
  assert.equal(s.people.filter((p) => p.home !== null).length, 10);
  for (const t of tipis) {
    const fams = new Set(t.residents.map((id) => s.people.find((p) => p.id === id)!.family));
    assert.equal(fams.size, 1);
  }
});

test('work rate: elders x0.5, children cannot work, hungry x0.75', () => {
  const s = newGame(1);
  const adult = adults(s)[0];
  const elder = s.people.find((p) => p.age === 'elder')!;
  const child = s.people.find((p) => p.age === 'child')!;
  assert.equal(workRate(s, adult, 'gather'), 0.01);
  assert.equal(workRate(s, adult, 'chop'), 0.015);
  assert.equal(workRate(s, elder, 'gather'), 0.005);
  assert.equal(workRate(s, elder, 'chop'), 0);
  assert.equal(workRate(s, child, 'gather'), 0);
  adult.hunger = 70;
  assert.ok(Math.abs(workRate(s, adult, 'gather') - 0.0075) < 1e-12);
  assert.ok(canWork(adult, 'chop') && !canWork(elder, 'chop') && canWork(elder, 'gather'));
});

test('pathfinding: avoids the river, crosses by a ford, fails for water and blocked tiles', () => {
  const s = newGame(1);
  const path = findPath(s, [0, 24], [47, 24]);
  assert.ok(path && path.length >= 47);
  for (const [x, y] of path!) assert.ok(walkable(s, x, y));
  assert.ok(path!.some(([x, y]) => s.map.tiles[y * 48 + x] === 'ford'));
  const river = s.map.tiles.indexOf('river');
  assert.equal(findPath(s, [24, 30], [river % 48, Math.floor(river / 48)]), null);
  assert.equal(findPath(s, [24, 30], [23, 23]), null, 'the fire blocks its tiles');
  assert.deepEqual(findPath(s, [30.2, 30.1], [30, 30]), [[30, 30]]);
});

test('a gatherer walks to the berries, works, and delivers food to the store', () => {
  const s = newGame(1);
  const [gatherer] = adults(s);
  const berry = nearest(s, 'berry');
  const before = s.store.food;
  queueOrders(s, [{ type: 'assign', ids: [gatherer.id], job: 'gather', tile: berry }]);
  let worked = false;
  for (let i = 0; i < 4000 && s.store.food === before; i++) {
    stepFed(s, 1);
    if (gatherer.task.step === 'work') {
      worked = true;
      assert.deepEqual([Math.round(gatherer.x), Math.round(gatherer.y)], berry);
    }
  }
  assert.ok(worked, 'reached the berry tile and worked');
  assert.ok(Math.abs(s.store.food - (before + 5)) < 1e-6, `delivered 5 food, store ${s.store.food}`);
  assert.equal(gatherer.carry.amount, 0);
  assert.ok(s.map.amount[berry[1] * 48 + berry[0]] < 40, 'the berry tile lost food');
});

test('a woodcutter fells a tile, which turns to grass, and moves to the next tree', () => {
  const s = newGame(1);
  const [cutter] = adults(s);
  const forest = nearest(s, 'forest');
  const i = forest[1] * 48 + forest[0];
  s.map.amount[i] = 0.3; // nearly bare: one short visit empties it
  queueOrders(s, [{ type: 'assign', ids: [cutter.id], job: 'chop', tile: forest }]);
  step(s, 2500);
  assert.equal(s.map.tiles[i], 'grass');
  assert.ok(s.mapVersion >= 1);
  assert.ok(s.store.wood > 40, `wood delivered, store ${s.store.wood}`);
  assert.ok(cutter.job === null || cutter.job.tile![0] !== forest[0] || cutter.job.tile![1] !== forest[1]);
});

test('a full store keeps the load: nothing is lost and nothing is added', () => {
  const s = newGame(1);
  const [gatherer] = adults(s);
  const cap = storeCap(s, 'food');
  s.store.food = cap;
  queueOrders(s, [{ type: 'assign', ids: [gatherer.id], job: 'gather', tile: nearest(s, 'berry') }]);
  stepFed(s, 2500);
  assert.equal(s.store.food, cap);
  assert.ok(Math.abs(gatherer.carry.amount - 5) < 1e-6, `still carrying ${gatherer.carry.amount}`);
  s.store.food = cap - 10;
  stepFed(s, 100);
  assert.ok(Math.abs(s.store.food - (cap - 5)) < 1e-6, `store ${s.store.food}`);
  assert.ok(gatherer.carry.amount < 5, `the load was delivered (now carrying ${gatherer.carry.amount})`);
});

test('orders that do not fit are dropped with a message', () => {
  const s = newGame(1);
  const elder = s.people.find((p) => p.age === 'elder')!;
  const child = s.people.find((p) => p.age === 'child')!;
  const [adult] = adults(s);
  queueOrders(s, [
    { type: 'assign', ids: [elder.id], job: 'chop', tile: nearest(s, 'forest') },
    { type: 'assign', ids: [child.id], job: 'gather', tile: nearest(s, 'berry') },
    { type: 'assign', ids: [adult.id], job: 'gather', tile: nearest(s, 'forest') },
  ]);
  step(s, 1);
  assert.equal(elder.job, null);
  assert.equal(child.job, null);
  assert.equal(adult.job, null);
  assert.equal(s.messages.length, 3);
  for (let i = 0; i < 10; i++) addMessage(s, 'x');
  assert.equal(s.messages.length, 5);
});

test('elders and children stay within 3 tiles of their tipi or the fire', () => {
  const s = newGame(1);
  step(s, 1500);
  for (const p of s.people.filter((q) => q.age !== 'adult')) {
    const home = s.buildings.find((b) => b.id === p.home);
    const [hx, hy] = home ? [home.x + 0.5, home.y + 0.5] : campCentre(s.map);
    assert.ok(Math.hypot(p.x - hx, p.y - hy) <= 4.5, `${p.name} strayed`);
  }
});
