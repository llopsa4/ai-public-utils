import assert from 'node:assert/strict';
import { test } from 'node:test';
import m01 from '../src/data/missions/m01.json';
import { isBlocked } from '../src/sim/grid';
import { createBase, stepBase } from '../src/sim/base';
import { type MissionSpec, type MissionState, createMission, failText, orderMove, stepMission, underRoof } from '../src/sim/mission';
import { findPath } from '../src/sim/path';

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));
const run = (s: MissionState, ticks: number): void => {
  for (let i = 0; i < ticks; i++) stepMission(s);
};
const spec = m01 as unknown as MissionSpec;

test('m01: 10 zombies (2 inside the house, 1 in the shed), 6 crates with the settled loot, win by clearing, no extract', () => {
  const s = createMission(spec);
  assert.equal(s.grid.size, 64);
  assert.equal(s.win, 'clear');
  assert.equal(s.extract.w, 0);
  assert.equal(s.enemies.length, 10);
  assert.ok(s.enemies.every((e) => e.kind === 'zombie'));
  assert.equal(s.enemies.filter((e) => underRoof(s, e.x, e.y)).length, 2);
  assert.equal(s.crates.length, 6);
  const sum = (k: 'food' | 'scrap' | 'ammo') => s.crates.reduce((a, c) => a + c[k], 0);
  assert.deepEqual([sum('food'), sum('scrap'), sum('ammo')], [7, 6, 6]);
  assert.deepEqual(s.crates.map((c) => [c.food, c.scrap, c.ammo]), [[0, 0, 3], [3, 0, 0], [0, 4, 0], [2, 0, 2], [0, 2, 1], [2, 0, 0]]);
  assert.equal(s.crates.filter((c) => underRoof(s, c.x, c.y)).length, 2);
});

test('m01: everything stands on a free tile and every crate is reachable from the start', () => {
  const s = createMission(spec);
  const start: [number, number] = [Math.round(s.survivors[0]!.x), Math.round(s.survivors[0]!.y)];
  for (const u of [...s.survivors, ...s.enemies]) assert.ok(!isBlocked(s.grid, Math.round(u.x), Math.round(u.y)), u.id);
  for (const c of s.crates) {
    assert.ok(!isBlocked(s.grid, c.x, c.y), c.id);
    assert.ok(findPath(s.grid, start, [c.x, c.y]), `${c.id} reachable`);
  }
  for (const u of s.survivors) assert.ok(!underRoof(s, u.x, u.y), 'survivors start outside the house');
  assert.equal(s.roofOpen, false);
  for (let i = 0; i < 600; i++) stepMission(s); // runs without throwing
});

test('the roof stays closed outside and opens for good when a survivor enters', () => {
  const s = createMission({
    map: open(16),
    roof: { x: 6, y: 6, w: 5, h: 5 },
    survivors: [{ id: 'f', kind: 'fighter', x: 2, y: 8 }],
    enemies: [],
  });
  assert.equal(s.roofOpen, false);
  run(s, 5);
  assert.equal(s.roofOpen, false); // still outside
  assert.equal(underRoof(s, 5, 8), false);
  assert.equal(underRoof(s, 6, 8), true); // the footprint includes its walls
  orderMove(s, ['f'], [8, 8], true);
  run(s, 40);
  assert.equal(s.roofOpen, true);
  orderMove(s, ['f'], [1, 1], true);
  run(s, 60);
  assert.equal(underRoof(s, s.survivors[0]!.x, s.survivors[0]!.y), false);
  assert.equal(s.roofOpen, true); // it does not close again
});

test('a mission without a roof has nothing hidden', () => {
  const s = createMission({ map: open(8), survivors: [{ id: 'f', kind: 'fighter', x: 1, y: 1 }], enemies: [] });
  assert.equal(s.roof, null);
  assert.equal(s.roofOpen, true);
  assert.equal(underRoof(s, 3, 3), false);
});

test('win "clear": every enemy dead and every crate opened; the survivors can be anywhere', () => {
  const s = createMission({
    map: open(12),
    win: 'clear',
    survivors: [{ id: 'f', kind: 'fighter', x: 1, y: 1 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 9, y: 9 }],
    crates: [{ id: 'c', x: 5, y: 5, food: 1, scrap: 0 }],
  });
  run(s, 1);
  assert.equal(s.status, 'playing');
  s.crates[0]!.opened = true;
  run(s, 1);
  assert.equal(s.status, 'playing'); // the zombie lives
  s.enemies[0]!.hp = 0;
  run(s, 1);
  assert.equal(s.status, 'success');
});

test('win "clear": a dead zombie alone is not enough while a crate is closed; a death still fails', () => {
  const s = createMission({
    map: open(12),
    win: 'clear',
    survivors: [{ id: 'f', kind: 'fighter', x: 1, y: 1 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 9, y: 9 }],
    crates: [{ id: 'c', x: 5, y: 5, food: 1, scrap: 0 }],
  });
  s.enemies[0]!.hp = 0;
  run(s, 1);
  assert.equal(s.status, 'playing');
  s.survivors[0]!.hp = 0;
  run(s, 1);
  assert.equal(s.status, 'failed');
});

test('with no crates and no enemies, "clear" is won at once', () => {
  const s = createMission({ map: open(8), win: 'clear', survivors: [{ id: 'f', kind: 'fighter', x: 1, y: 1 }], enemies: [] });
  run(s, 1);
  assert.equal(s.status, 'success');
});

test('a survivor killed by a zombie is named with that cause on the fail screen', () => {
  const s = createMission({
    map: open(12),
    survivors: [{ id: 'f', kind: 'fighter', x: 5, y: 5 }, { id: 's', kind: 'scout', x: 2, y: 2 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 6, y: 5 }],
  });
  assert.equal(failText(s), '', 'nobody has died yet');
  s.survivors[0]!.hp = 1;
  run(s, 100);
  assert.equal(s.status, 'failed');
  assert.equal(s.survivors[0]!.killedBy, 'zombie');
  assert.equal(failText(s), 'Cass was killed by a zombie.');
});

test('a survivor who starves is named with hunger as the cause', () => {
  const s = createBase({ calm: true });
  const u = s.survivors[1]!;
  u.hp = 1;
  s.hunger[u.id]!.left = 0;
  s.hunger[u.id]!.starveIn = 1;
  stepBase(s);
  assert.equal(s.status, 'failed');
  assert.equal(u.killedBy, 'hunger');
  assert.equal(failText(s), 'Eli starved.');
});
