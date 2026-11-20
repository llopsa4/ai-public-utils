import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assignWorkers, buildingDefs, BUILDABLE, cancelSite, placeBuilding, placementError,
} from '../../src/sim/buildings';
import { workRate } from '../../src/sim/jobs';
import { walkable } from '../../src/sim/people';
import type { Building, GameState } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';
import { UPGRADE_IDS } from '../../src/sim/upgrades';
import { stepFed } from './helpers';

const rich = (s: GameState) => {
  s.store.wood = 100;
  s.store.hides = 20;
};

/** The valid top-left tile for a type nearest to `near` (default: the fire). */
function spot(s: GameState, type: string, near: [number, number] = [24, 24]): [number, number] {
  let best: [number, number] | null = null;
  let bestD = Infinity;
  for (let y = 10; y <= 38; y++) {
    for (let x = 10; x <= 38; x++) {
      if (placementError(s, type, x, y) !== null) continue;
      const d = Math.hypot(x + 0.5 - near[0], y + 0.5 - near[1]);
      if (d < bestD) {
        bestD = d;
        best = [x, y];
      }
    }
  }
  assert.ok(best, `a valid spot for ${type}`);
  return best!;
}

function place(s: GameState, type: string, near?: [number, number]): Building {
  const [x, y] = spot(s, type, near);
  const r = placeBuilding(s, type, x, y);
  assert.ok(r.building, r.error ?? "placed");
  return r.building!;
}

const adults = (s: GameState) => s.people.filter((p) => p.age === 'adult');
const tilesOf = (s: GameState, type: string) =>
  s.map.tiles.map((t, i) => [t, i] as const).filter(([t]) => t === type).map(([, i]) => [i % 48, Math.floor(i / 48)] as [number, number]);

test('the buildable types are in menu order', () => {
  assert.deepEqual(BUILDABLE, [
    'tipi', 'gathering_spot', 'hunting_lodge', 'store', 'drying_rack', 'horse_corral', 'healers_lodge', 'scouts_lodge',
    'lancers_lodge', 'archers_lodge', 'trap', 'fire_pit', 'barricade', 'spirit_lodge',
  ]);
});

test('placement is refused off grass, out of range, overlapping, off the map or short of cost', () => {
  const s = newGame(1);
  rich(s);
  const cases: [string, number, number, string][] = [
    ['store', tilesOf(s, 'forest')[0][0], tilesOf(s, 'forest')[0][1], 'Needs open grass.'],
    ['store', tilesOf(s, 'river')[0][0], tilesOf(s, 'river')[0][1], 'Needs open grass.'],
    ['store', tilesOf(s, 'berry')[0][0], tilesOf(s, 'berry')[0][1], 'Needs open grass.'],
    ['store', 21, 22, 'Something is in the way.'], // overlaps a tipi
    ['store', 22, 22, 'Something is in the way.'], // overlaps the fire
    ['store', 47, 47, 'Outside the map.'],
    ['store', -1, 5, 'Outside the map.'],
    ['fire', 30, 30, "Can't build that."],
  ];
  // A grass block more than 14 tiles from the fire.
  for (let y = 0; y < 47; y++) {
    for (let x = 0; x < 47; x++) {
      const far = Math.max(Math.abs(x - 24), Math.abs(y - 24)) > 15;
      const grass = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => s.map.tiles[(y + dy) * 48 + x + dx] === 'grass');
      if (far && grass && !cases.some((c) => c[3] === 'Too far from the fire.')) cases.push(['store', x, y, 'Too far from the fire.']);
    }
  }
  const before = JSON.stringify({ store: s.store, n: s.buildings.length, blocked: s.blocked });
  for (const [type, x, y, why] of cases) {
    assert.equal(placementError(s, type, x, y), why, `${type} at ${x},${y}`);
    assert.equal(placeBuilding(s, type, x, y).error, why);
  }
  assert.equal(JSON.stringify({ store: s.store, n: s.buildings.length, blocked: s.blocked }), before, 'a refusal changes nothing');
  assert.equal(s.messages.length, 5, 'each refusal is a message (last 5 kept)');

  const [x, y] = spot(s, 'tipi');
  s.store.wood = 10;
  assert.equal(placementError(s, 'tipi', x, y), 'Not enough wood.');
  s.store.wood = 100;
  s.store.hides = 7;
  assert.equal(placementError(s, 'tipi', x, y), 'Not enough hides.');
});

test('a valid placement takes the whole cost at once and makes an unfinished site', () => {
  const s = newGame(1);
  rich(s);
  s.store.wood = 300;
  s.store.hides = 60;
  s.upgrades.push(...UPGRADE_IDS);
  for (const type of BUILDABLE) {
    const cost = buildingDefs[type].cost!;
    const before = { ...s.store };
    const b = place(s, type);
    assert.equal(b.done, false);
    assert.equal(b.built, 0);
    assert.equal(s.store.wood, before.wood - (cost.wood ?? 0), `${type} wood`);
    assert.equal(s.store.hides, before.hides - (cost.hides ?? 0), `${type} hides`);
    assert.equal(walkable(s, b.x, b.y), false, 'the footprint is blocked');
    assert.equal(placementError(s, type, b.x, b.y), 'Something is in the way.');
  }
  assert.equal(s.buildings.length, 4 + BUILDABLE.length); // fire, 2 tipis, store, then one of each type
});

test('a place order is applied at the start of the next tick', () => {
  const s = newGame(1);
  rich(s);
  const [x, y] = spot(s, 'store');
  queueOrders(s, [{ type: 'place', building: 'store', at: [x, y] }]);
  assert.equal(s.buildings.length, 4);
  step(s, 1);
  assert.equal(s.buildings.length, 5);
});

test('a site completes after hauling and build points: max 2 haulers, max 3 builders, no work before material', () => {
  const s = newGame(1);
  const site = place(s, 'gathering_spot');
  assert.equal(s.store.wood, 30);
  let maxHaul = 0;
  let maxBuild = 0;
  let builtBeforeMaterial = 0;
  let done = -1;
  for (let i = 0; i < 3000 && done < 0; i++) {
    step(s, 1);
    maxHaul = Math.max(maxHaul, s.people.filter((p) => p.job?.kind === 'haul').length);
    maxBuild = Math.max(maxBuild, s.people.filter((p) => p.job?.kind === 'build').length);
    if ((site.delivered.wood ?? 0) < 10) builtBeforeMaterial = Math.max(builtBeforeMaterial, site.built);
    if (site.done) done = s.tick;
  }
  assert.ok(done > 0, 'finished');
  assert.equal(site.delivered.wood, 10);
  assert.equal(site.built, 150);
  assert.equal(builtBeforeMaterial, 0);
  assert.ok(maxHaul >= 1 && maxHaul <= 2, `haulers ${maxHaul}`);
  assert.equal(maxBuild, 3);
  assert.equal(s.store.wood, 30, 'hauling takes nothing more from the store');
  assert.ok(s.messages.some((m) => m.text === 'The gathering spot is finished.'));
  step(s, 50);
  assert.equal(s.people.filter((p) => p.job?.building === site.id).length, 0, 'everyone is free again');
  assert.ok(s.people.every((p) => p.carry.amount === 0));
});

test('a finished tipi houses more people at the next day start', () => {
  const s = newGame(1);
  s.store.hides = 10;
  const tipi = place(s, 'tipi');
  step(s, 1199);
  assert.equal(tipi.done, true);
  assert.equal(s.people.filter((p) => p.home !== null).length, 10, 'not before the day starts');
  step(s, 2);
  assert.equal(s.people.filter((p) => p.home !== null).length, 15);
  assert.equal(tipi.residents.length, 5);
});

test('drafted adults do not take building work by themselves', () => {
  const s = newGame(1);
  for (const p of adults(s)) p.drafted = true;
  const site = place(s, 'gathering_spot');
  step(s, 400);
  assert.equal(site.delivered.wood ?? 0, 0);
});

test('workers: limit 4, adults only for the lodge, elders may gather, unfinished sites refused', () => {
  const s = newGame(1);
  rich(s);
  const lodge = place(s, 'hunting_lodge');
  assert.equal(assignWorkers(s, adults(s).map((p) => p.id), lodge.id), 0, 'not finished yet');
  lodge.done = true;
  const six = adults(s).slice(0, 6).map((p) => p.id);
  assert.equal(assignWorkers(s, six, lodge.id), 4);
  assert.equal(lodge.workers.length, 4);
  assert.ok(s.messages.some((m) => m.text === 'The hunting lodge is full.'));
  const hunters = s.people.filter((p) => lodge.workers.includes(p.id));
  assert.ok(hunters.every((p) => p.society === 'hunters' && p.job?.kind === 'hunt'));
  assert.equal(assignWorkers(s, [six[0]], lodge.id), 0, 'already a worker: not counted twice');
  assert.equal(lodge.workers.length, 4);

  const elder = s.people.find((p) => p.age === 'elder')!;
  assert.equal(assignWorkers(s, [elder.id], lodge.id), 0);
  assert.ok(s.messages.some((m) => m.text.includes("can't work at the hunting lodge")));
  const spotB = place(s, 'gathering_spot');
  spotB.done = true;
  assert.equal(assignWorkers(s, [elder.id], spotB.id), 1);

  // Moving a worker elsewhere frees the place.
  queueOrders(s, [{ type: 'move', ids: [lodge.workers[0]], to: [30, 30] }]);
  step(s, 1);
  assert.equal(lodge.workers.length, 3);
});

test('cancelling a site refunds the full cost, frees the tiles and drops the haulers\' loads', () => {
  const s = newGame(1);
  s.store.hides = 10;
  const before = { ...s.store };
  const site = place(s, 'tipi');
  step(s, 150); // haulers are on the way or carrying
  assert.ok(s.people.some((p) => p.job?.building === site.id));
  assert.equal(cancelSite(s, site.id), true);
  assert.deepEqual(s.store, before);
  assert.equal(s.buildings.some((b) => b.id === site.id), false);
  assert.equal(walkable(s, site.x, site.y), true);
  assert.ok(s.people.every((p) => p.job?.building !== site.id && p.carry.amount === 0));
  step(s, 300);
  assert.deepEqual(s.store, before, 'nothing leaks after the cancel');
  assert.equal(cancelSite(s, s.buildings[1].id), false, 'a finished building cannot be cancelled');
});

test('a gathering-spot worker picks the fullest berry tile within 10 tiles and works at x1.5', () => {
  const s = newGame(1);
  rich(s);
  const berries = tilesOf(s, 'berry');
  const b = place(s, 'gathering_spot', berries[0]);
  b.done = true;
  const [worker] = adults(s);
  const before = s.store.food;
  assignWorkers(s, [worker.id], b.id);
  assert.ok(Math.abs(workRate(s, worker, 'gather') - 0.015) < 1e-12);
  step(s, 2);
  const tile = worker.job!.tile!;
  assert.equal(s.map.tiles[tile[1] * 48 + tile[0]], 'berry');
  assert.ok(Math.hypot(tile[0] - (b.x + 0.5), tile[1] - (b.y + 0.5)) <= 10);
  stepFed(s, 2500);
  assert.ok(s.store.food >= before + 5, `food ${s.store.food}`);
  assert.equal(worker.job?.building, b.id, 'keeps the spot job');
});

test('a hunter brings back 10 food and 1 hide per successful trip', () => {
  const s = newGame(1);
  rich(s);
  const lodge = place(s, 'hunting_lodge');
  lodge.done = true;
  const hidesBefore = s.store.hides;
  const foodBefore = s.store.food;
  const [hunter] = adults(s);
  assignWorkers(s, [hunter.id], lodge.id);
  stepFed(s, 5000);
  const trips = s.store.hides - hidesBefore;
  assert.ok(trips >= 2, `successful trips ${trips}`);
  assert.equal(s.store.food - foodBefore, trips * 10);
});

test('the same seed and orders give an identical state with buildings', () => {
  const run = () => {
    const s = newGame(1);
    rich(s);
    place(s, 'gathering_spot');
    const lodge = place(s, 'hunting_lodge');
    lodge.done = true;
    assignWorkers(s, [adults(s)[0].id], lodge.id);
    step(s, 600);
    return JSON.stringify(s);
  };
  assert.equal(run(), run());
});
