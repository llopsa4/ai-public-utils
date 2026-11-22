import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type CampState, campFallen, createCamp, orderAttack, orderWatch, placeBarricade, stepCamp } from '../src/sim/camp';
import { COVER, FLOOR, getTile, isBlocked } from '../src/sim/grid';
import { findPath } from '../src/sim/path';

const run = (s: CampState, ticks: number): void => {
  for (let i = 0; i < ticks; i++) stepCamp(s);
};

/** The camp with a single zombie set at (x, y), facing the survivors, and the scout out of the way. */
function lone(x: number, y: number): { s: CampState; z: CampState['enemies'][number] } {
  const s = createCamp();
  const z = s.enemies[0]!;
  s.enemies = [z];
  s.survivors[1]!.hp = 0;
  [z.x, z.y, z.path, z.facing] = [x, y, [], [0, 1]];
  return { s, z };
}

test('four zombies spawn on distinct tiles the survivors can walk to, the same every time', () => {
  const s = createCamp();
  assert.equal(s.enemies.length, 4);
  assert.ok(s.enemies.every((e) => e.kind === 'zombie' && e.hp === 60));
  assert.equal(new Set(s.enemies.map((e) => `${e.x},${e.y}`)).size, 4);
  for (const e of s.enemies) assert.ok(findPath(s.grid, [16, 18], [e.x, e.y]), `${e.id} is walled in`);
  assert.deepEqual(createCamp().enemies.map((e) => [e.x, e.y]), s.enemies.map((e) => [e.x, e.y]));
});

test('zombies roam: left alone for 30 s, at least one leaves its spawn tile', () => {
  const s = createCamp();
  const from = s.enemies.map((e) => [e.x, e.y]);
  run(s, 300);
  assert.ok(s.enemies.some((e, i) => Math.hypot(e.x - from[i]![0]!, e.y - from[i]![1]!) > 0.5));
});

test('a barricade costs 1 scrap and blocks its tile; trees, units, repeats and an empty purse are refused', () => {
  const s = createCamp();
  assert.equal(placeBarricade(s, 16, 14), 'ok');
  assert.equal(s.scrap, 1);
  assert.equal(getTile(s.grid, 16, 14), COVER);
  assert.deepEqual(s.barricades, [{ x: 16, y: 14, hp: 100 }]);
  assert.equal(placeBarricade(s, 16, 14), 'blocked');
  assert.equal(placeBarricade(s, 0, 0), 'blocked');
  assert.equal(placeBarricade(s, 99, 99), 'blocked');
  assert.equal(placeBarricade(s, 16, 18), 'occupied');
  assert.equal(placeBarricade(s, 15, 14), 'ok');
  assert.equal(placeBarricade(s, 14, 15), 'scrap');
  assert.equal(s.scrap, 0);
});

test('a survivor cannot walk through a barricade', () => {
  const s = createCamp();
  placeBarricade(s, 16, 17);
  assert.ok(isBlocked(s.grid, 16, 17));
  assert.equal(findPath(s.grid, [16, 18], [16, 16])!.some(([x, y]) => x === 16 && y === 17), false);
});

test('a walled-off zombie chews the barricade, which breaks after about 7 s, and only then reaches the survivor', () => {
  const { s, z } = lone(16, 15);
  s.scrap = 20;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) assert.equal(placeBarricade(s, 16 + dx, 18 + dy), 'ok');
  assert.equal(s.barricades.length, 8);
  run(s, 60);
  assert.equal(z.ai.mode, 'chase');
  assert.ok(s.barricades.some((b) => b.hp < 100), 'the zombie is biting a segment');
  assert.equal(s.survivors[0]!.hp, 100);
  run(s, 300);
  assert.ok(s.barricades.length < 8, 'a segment broke');
  const broken = [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => [16 + dx, 18 + dy])).filter(([x, y]) => (x !== 16 || y !== 18) && getTile(s.grid, x!, y!) === FLOOR);
  assert.ok(broken.length >= 1, 'the broken segment is floor again');
  assert.ok(s.survivors[0]!.hp < 100, 'the zombie got in and bit');
});

test('V watch: a zombie walking into the cone is shot and killed, leaving a body and blood', () => {
  const { s, z } = lone(16, 13);
  assert.equal(orderWatch(s, 'fighter', [16, 13]), true);
  run(s, 200);
  assert.ok(z.hp <= 0, `zombie hp ${z.hp}`);
  assert.ok(s.survivors[0]!.hp > 0);
  assert.ok(s.bodies.some((b) => b.id === z.id) && s.decals.length >= 1);
});

test('an attack order sends the scout after a zombie and kills it with the bow', () => {
  const { s, z } = lone(18, 12);
  s.survivors[1]!.hp = 100;
  s.survivors[0]!.hp = 0;
  assert.deepEqual(orderAttack(s, ['scout'], z.id), ['scout']);
  run(s, 250);
  assert.ok(z.hp <= 0, `zombie hp ${z.hp}`);
  assert.ok(s.survivors[1]!.hp > 0);
});

test('one dead survivor does not end the camp; both dead does, and the camp then freezes', () => {
  const s = createCamp();
  s.survivors[0]!.hp = 0;
  run(s, 5);
  assert.equal(s.tick, 5);
  assert.equal(s.status, 'playing');
  assert.equal(campFallen(s), false);
  s.survivors[1]!.hp = 0;
  assert.equal(campFallen(s), true);
  run(s, 5);
  assert.equal(s.tick, 5);
});
