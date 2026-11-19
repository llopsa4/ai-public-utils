import assert from 'node:assert/strict';
import { test } from 'node:test';
import { placementError } from '../../src/sim/buildings';
import { flushOrders, spreadTargets } from '../../src/sim/orders';
import type { GameState, Tile2 } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';
import { stepFed } from './helpers';

const adults = (s: GameState) => s.people.filter((p) => p.age === 'adult');
const withAge = (s: GameState, age: 'elder' | 'child') => s.people.filter((p) => p.age === age);

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

test('draft and undraft work for adults only, and a drafted person stops', () => {
  const s = newGame(1);
  const [a] = adults(s);
  const [elder] = withAge(s, 'elder');
  queueOrders(s, [{ type: 'assign', ids: [a.id], job: 'gather', tile: nearest(s, 'berry') }]);
  step(s, 5);
  assert.equal(a.job?.kind, 'gather');

  queueOrders(s, [{ type: 'draft', ids: [a.id, elder.id], on: true }]);
  step(s, 1);
  assert.equal(a.drafted, true);
  assert.equal(elder.drafted, false);
  const { x, y } = a;
  step(s, 50);
  assert.equal(a.x, x, 'a drafted person stays put');
  assert.equal(a.y, y);
  assert.equal(a.job?.kind, 'gather', 'the job is kept to resume later');

  queueOrders(s, [{ type: 'draft', ids: [a.id], on: false }]);
  step(s, 1);
  assert.equal(a.drafted, false);
  stepFed(s, 300);
  assert.ok(s.store.food > 0 && a.job?.kind === 'gather', 'the person goes back to gathering');
});

test('drafting only children or elders is refused with a message', () => {
  const s = newGame(1);
  queueOrders(s, [{ type: 'draft', ids: [withAge(s, 'child')[0].id], on: true }]);
  step(s, 1);
  assert.equal(s.people.filter((p) => p.drafted).length, 0);
  assert.match(s.messages.at(-1)!.text, /adults/);
});

test('a drafted person walks to a move order and keeps the position', () => {
  const s = newGame(1);
  const a = adults(s)[0];
  queueOrders(s, [{ type: 'draft', ids: [a.id], on: true }, { type: 'move', ids: [a.id], to: [30, 30] }]);
  step(s, 800);
  assert.ok(Math.hypot(a.x - 30, a.y - 30) < 0.01);
  step(s, 100);
  assert.ok(Math.hypot(a.x - 30, a.y - 30) < 0.01, 'drafted people do not wander off or auto-work');
});

test('a move order releases an undrafted person\'s job', () => {
  const s = newGame(1);
  const a = adults(s)[0];
  queueOrders(s, [{ type: 'assign', ids: [a.id], job: 'chop', tile: nearest(s, 'forest') }]);
  step(s, 2);
  assert.equal(a.job?.kind, 'chop');
  queueOrders(s, [{ type: 'move', ids: [a.id], to: [30, 30] }]);
  step(s, 1);
  assert.equal(a.job, null);
});

test('work orders skip drafted people with a message', () => {
  const s = newGame(1);
  const a = adults(s)[0];
  queueOrders(s, [{ type: 'draft', ids: [a.id], on: true }]);
  step(s, 1);
  queueOrders(s, [{ type: 'assign', ids: [a.id], job: 'gather', tile: nearest(s, 'berry') }]);
  step(s, 1);
  assert.equal(a.job, null);
  assert.match(s.messages.at(-1)!.text, /Drafted/);
});

test('a mixed group refused a work order gets one message, not one per person', () => {
  const s = newGame(1);
  const ids = s.people.filter((p) => p.age !== 'adult').map((p) => p.id);
  queueOrders(s, [{ type: 'assign', ids, job: 'chop', tile: nearest(s, 'forest') }]);
  step(s, 1);
  assert.equal(s.messages.length, 1);
  assert.match(s.messages[0].text, /^8 people can't chop there/);
});

test('stance changes only apply to drafted people', () => {
  const s = newGame(1);
  const [a, b] = adults(s);
  queueOrders(s, [{ type: 'draft', ids: [a.id], on: true }]);
  step(s, 1);
  queueOrders(s, [{ type: 'stance', ids: [a.id, b.id], stance: 'chase' }]);
  step(s, 1);
  assert.equal(a.stance, 'chase');
  assert.equal(b.stance, 'defend');
});

test('a group move spreads over distinct tiles', () => {
  const s = newGame(1);
  const ids = adults(s).slice(0, 9).map((p) => p.id);
  queueOrders(s, [{ type: 'move', ids, to: [30, 30] }]);
  step(s, 1);
  const targets = s.people.filter((p) => ids.includes(p.id)).map((p) => p.task.target!.join(','));
  assert.equal(new Set(targets).size, 9);
  assert.equal(spreadTargets(s, [30, 30], 1)[0].join(','), '30,30');
});

test('a move onto a blocked tile goes to the nearest free one', () => {
  const s = newGame(1);
  const fire = s.map.fire;
  const [t] = spreadTargets(s, [fire[0], fire[1]], 1);
  assert.notDeepEqual(t, [fire[0], fire[1]]);
  assert.ok(Math.hypot(t[0] - fire[0], t[1] - fire[1]) <= 2);
});

test('speed and pause orders set the state; orders can be flushed while paused', () => {
  const s = newGame(1);
  queueOrders(s, [{ type: 'speed', value: 4 }, { type: 'pause', on: true }]);
  flushOrders(s);
  assert.equal(s.speed, 4);
  assert.equal(s.paused, true);
  assert.equal(s.orders.length, 0);
  queueOrders(s, [{ type: 'pause', on: false }]);
  flushOrders(s);
  assert.equal(s.paused, false);
});

test('a site can be ordered built and cancelled by order', () => {
  const s = newGame(1);
  s.store.wood = 100;
  s.store.hides = 20;
  let at: Tile2 | null = null;
  for (let y = 12; y < 36 && !at; y++) {
    for (let x = 12; x < 36 && !at; x++) if (placementError(s, 'store', x, y) === null) at = [x, y];
  }
  queueOrders(s, [{ type: 'place', building: 'store', at: at! }]);
  step(s, 1);
  const site = s.buildings.find((b) => !b.done)!;
  const wood = s.store.wood;
  queueOrders(s, [{ type: 'assign', ids: adults(s).slice(0, 2).map((p) => p.id), building: site.id }]);
  step(s, 1);
  assert.equal(adults(s).filter((p) => p.job?.kind === 'build' && p.job.building === site.id).length, 2);
  queueOrders(s, [{ type: 'cancel', building: site.id }]);
  step(s, 1);
  assert.equal(s.buildings.some((b) => b.id === site.id), false);
  assert.equal(s.store.wood, wood + 15);
});
