// Sitting on the council plaza (DESIGN-hunting.md `## Council plaza`, PLAN.md G8).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isSitting, plazaOf, standsAt } from '../../src/sim/buildings';
import { type GameState, type Person } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';
import { stepFed } from './helpers';

const tileOf = (p: Person) => `${Math.round(p.x)},${Math.round(p.y)}`;
const sitters = (s: GameState) => s.people.filter((p) => isSitting(p, s.buildings));

/** Everyone idle on the plaza ring (the start camp has nothing to build, so no one has work). */
function settle(s: GameState, ticks = 600): void {
  stepFed(s, ticks);
}

test('idle people (adults, elders and children) walk to the plaza ring and sit on distinct tiles', () => {
  const s = newGame(1);
  settle(s);
  const plaza = plazaOf(s)!;
  const sat = sitters(s);
  assert.ok(sat.length >= 15, `${sat.length} sitting`);
  for (const p of sat) assert.ok(standsAt(p, plaza), `${p.name} sits on the ring`);
  assert.equal(new Set(sat.map(tileOf)).size, sat.length, 'no two share a tile');
  for (const age of ['adult', 'elder', 'child'] as const) {
    assert.ok(sat.some((p) => p.age === age) || !s.people.some((p) => p.age === age), `a ${age} sits`);
  }
});

test('the ring has 20 tiles: the rest keep waiting where they are, none shares a tile', () => {
  const s = newGame(1);
  for (let i = 0; i < 8; i++) s.people.push({ ...s.people[0], id: 100 + i, name: `Extra ${i}`, x: 30 + (i % 4), y: 36 + Math.floor(i / 4) });
  settle(s);
  assert.ok(sitters(s).length <= 20, 'at most the ring');
  const keys = s.people.map(tileOf);
  assert.equal(new Set(keys).size, keys.length, 'no shared tile anywhere');
});

test('a work order gets a seated person up at once, and they sit again afterwards', () => {
  const s = newGame(1);
  settle(s);
  const p = sitters(s).find((q) => q.age === 'adult')!;
  assert.ok(p, 'an adult sits');
  queueOrders(s, [{ type: 'move', ids: [p.id], to: [p.x + 0, p.y + 9] }]);
  step(s, 1);
  assert.equal(isSitting(p, s.buildings), false, 'standing for the order');
  step(s, 400);
  assert.equal(isSitting(p, s.buildings), true, 'back on the plaza');
});

test('a drafted person does not sit', () => {
  const s = newGame(1);
  settle(s);
  const p = sitters(s).find((q) => q.age === 'adult')!;
  queueOrders(s, [{ type: 'draft', ids: [p.id], on: true }]);
  step(s, 5);
  assert.equal(isSitting(p, s.buildings), false);
});

test('an unfinished plaza seats no one', () => {
  const s = newGame(1);
  plazaOf(s)!.done = false;
  assert.equal(sitters(s).length, 0);
  settle(s, 100);
  assert.equal(sitters(s).length, 0);
});
