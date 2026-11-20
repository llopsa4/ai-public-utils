// Building from the villager panel (DESIGN-hunting.md `## Villager panel and building`): placing a site makes up to
// 3 of the selection its builders, and builders work a barricade line segment by segment.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { placementError } from '../../src/sim/buildings';
import type { GameState, Order, Tile2 } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';

const adults = (s: GameState) => s.people.filter((p) => p.age === 'adult');

function freeSpot(s: GameState, type: string): Tile2 {
  for (let y = 12; y < 36; y++) for (let x = 12; x < 36; x++) if (placementError(s, type, x, y) === null) return [x, y];
  throw new Error('no free spot');
}

/** A camp with the barricades bought and the first row of `n` free tiles north of the fire. */
function lineCamp(seed: number, n: number): { s: GameState; tiles: Tile2[] } {
  const s = newGame(seed);
  s.upgrades.push('healers', 'builders', 'barricades');
  s.store.wood = 200;
  for (let y = s.map.fire[1] - 8; y < s.map.fire[1] - 3; y++) {
    for (let x = s.map.fire[0] - 8; x < s.map.fire[0] + 4; x++) {
      const tiles = Array.from({ length: n }, (_, k): Tile2 => [x + k, y]);
      if (tiles.every(([tx, ty]) => placementError(s, 'barricade', tx, ty) === null)) return { s, tiles };
    }
  }
  throw new Error('no free row');
}

test('placing with a selection makes at most 3 able people builders and leaves the others as they were', () => {
  const s = newGame(1);
  s.store.wood = 100;
  s.store.hides = 20;
  const five = adults(s).slice(0, 5);
  const drafted = adults(s)[5];
  const elder = s.people.find((p) => p.age === 'elder')!;
  const child = s.people.find((p) => p.age === 'child')!;
  queueOrders(s, [{ type: 'draft', ids: [drafted.id], on: true }]);
  step(s, 5);
  const before = new Map([...five, drafted, elder, child].map((p) => [p.id, JSON.stringify(p.job)]));
  const ids = [...five, drafted, elder, child].map((p) => p.id);
  queueOrders(s, [{ type: 'place', building: 'store', at: freeSpot(s, 'store'), builders: ids }]);
  step(s, 1);
  const site = s.buildings.find((b) => !b.done)!;
  const building = s.people.filter((p) => p.job?.kind === 'build' && p.job.building === site.id);
  assert.equal(building.length, 3);
  assert.ok(building.every((p) => five.includes(p)), 'only able adults from the selection');
  for (const p of [...five.filter((q) => !building.includes(q)), drafted, elder, child]) {
    assert.equal(JSON.stringify(p.job), before.get(p.id), `${p.name} keeps the job`);
  }
  assert.equal(drafted.drafted, true);
  assert.ok(s.messages.some((m) => m.text === `3 of ${ids.length} joined the build`));
});

test('placing with only children or drafted people places the site and assigns nobody', () => {
  const s = newGame(1);
  s.store.wood = 100;
  s.store.hides = 50;
  const kids = s.people.filter((p) => p.age === 'child').map((p) => p.id);
  queueOrders(s, [{ type: 'place', building: 'tipi', at: freeSpot(s, 'tipi'), builders: kids }]);
  step(s, 1);
  const site = s.buildings.find((b) => !b.done)!;
  assert.ok(site);
  assert.equal(s.people.filter((p) => p.job?.kind === 'build' && p.job.building === site.id && kids.includes(p.id)).length, 0);
});

test('builders work a barricade line in order, moving on to the next unfinished segment', () => {
  const { s, tiles } = lineCamp(1, 4);
  const crew = adults(s).slice(0, 3);
  // Only the crew, so nobody else builds a segment out of turn.
  s.people = crew;
  queueOrders(s, [{ type: 'place', building: 'barricade', at: tiles[0], line: tiles.slice(1), builders: crew.map((p) => p.id) }]);
  step(s, 1);
  const line = s.buildings.filter((b) => b.type === 'barricade');
  assert.equal(line.length, 4);
  assert.ok(line.every((b) => b.lineId === line[0].id), 'one line id');
  assert.ok(crew.every((p) => p.job?.kind === 'build' && p.job.building === line[0].id));
  for (const b of line) b.delivered = { wood: 4 };

  const doneOrder: number[] = [];
  for (let t = 0; t < 6000 && doneOrder.length < line.length; t++) {
    step(s, 1);
    for (const b of line) if (b.done && !doneOrder.includes(b.id)) doneOrder.push(b.id);
    // Nobody works ahead of the first unfinished segment (a builder may hold a just-finished one for a tick).
    const open = line.find((b) => !b.done);
    if (open) for (const p of crew) if (p.job?.kind === 'build') assert.ok(p.job.building! <= open.id);
  }
  assert.deepEqual(doneOrder, line.map((b) => b.id));
  step(s, 2);
  assert.ok(crew.every((p) => p.job?.kind !== 'build'), 'free once the line is complete');
});

test('a site placed alone has no line id', () => {
  const { s, tiles } = lineCamp(1, 1);
  queueOrders(s, [{ type: 'place', building: 'barricade', at: tiles[0] }]);
  step(s, 1);
  assert.equal(s.buildings.find((b) => b.type === 'barricade')!.lineId, undefined);
});

test('placing with builders and a line is deterministic', () => {
  const run = () => {
    const { s, tiles } = lineCamp(7, 3);
    const orders: Order[] = [{ type: 'place', building: 'barricade', at: tiles[0], line: tiles.slice(1), builders: adults(s).slice(0, 5).map((p) => p.id) }];
    queueOrders(s, orders);
    step(s, 1500);
    return JSON.stringify({ people: s.people, buildings: s.buildings, store: s.store });
  };
  assert.equal(run(), run());
});

test('a line builder goes on to the next segment even before its wood is in (auto-work would not)', () => {
  const { s, tiles } = lineCamp(1, 3);
  const crew = adults(s).slice(0, 3);
  s.people = crew;
  queueOrders(s, [{ type: 'place', building: 'barricade', at: tiles[0], line: tiles.slice(1), builders: crew.map((p) => p.id) }]);
  step(s, 1);
  const line = s.buildings.filter((b) => b.type === 'barricade');
  // Wood for segments 1 and 3 only: free builders would pick segment 3, line builders wait at segment 2.
  line[0].delivered = { wood: 4 };
  line[2].delivered = { wood: 4 };
  for (let t = 0; t < 3000 && !line[0].done; t++) step(s, 1);
  assert.ok(line[0].done);
  step(s, 2);
  for (const p of crew) assert.deepEqual([p.job?.kind, p.job?.building], ['build', line[1].id], p.name);
});
