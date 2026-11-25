import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBase, stepBase } from '../src/sim/base';
import { orderMove } from '../src/sim/mission';
import { BUSH, TREE, isBlocked, makeGrid, setTile } from '../src/sim/grid';
import { findPath, nearestFree } from '../src/sim/path';

test('A* walks straight and diagonally on an open grid', () => {
  const g = makeGrid(8);
  assert.deepEqual(findPath(g, [0, 0], [3, 0]), [[1, 0], [2, 0], [3, 0]]);
  assert.equal(findPath(g, [0, 0], [3, 3])!.length, 3);
  assert.deepEqual(findPath(g, [2, 2], [2, 2]), []);
});

test('A* goes around a wall and refuses blocked or sealed goals', () => {
  const g = makeGrid(8);
  for (let y = 0; y < 7; y++) setTile(g, 4, y, TREE);
  const p = findPath(g, [0, 0], [7, 0])!;
  assert.ok(p.length > 7 && p.every(([x, y]) => !isBlocked(g, x, y)));
  setTile(g, 4, 7, TREE);
  assert.equal(findPath(g, [0, 0], [7, 0]), null);
  assert.equal(findPath(g, [0, 0], [4, 3]), null);
});

test('A* does not cut a corner between two blocked tiles, and bushes can be walked', () => {
  const g = makeGrid(4);
  setTile(g, 1, 0, TREE);
  setTile(g, 0, 1, TREE);
  assert.equal(findPath(g, [0, 0], [1, 1]), null);
  const b = makeGrid(4);
  setTile(b, 1, 0, BUSH);
  assert.deepEqual(findPath(b, [0, 0], [2, 0]), [[1, 0], [2, 0]]);
});

test('A* treats extra blocked tiles (barricades) as walls', () => {
  const g = makeGrid(5);
  const wall = new Set([0, 1, 2, 3, 4].map((y) => y * 5 + 2));
  assert.equal(findPath(g, [0, 2], [4, 2], wall), null);
  assert.ok(findPath(g, [0, 2], [4, 2]));
});

test('nearestFree skips blocked and taken tiles', () => {
  const g = makeGrid(6);
  setTile(g, 3, 3, TREE);
  assert.deepEqual(nearestFree(g, [3, 3], new Set()), [3, 2]);
  assert.notDeepEqual(nearestFree(g, [3, 3], new Set([2 * 6 + 3])), [3, 2]);
});

test('the base map has four survivors on free tiles and trees around the clearing', () => {
  const s = createBase({ calm: true });
  assert.equal(s.survivors.length, 4);
  assert.equal(s.food, 5);
  assert.equal(s.scrap, 4);
  for (const u of s.survivors) assert.equal(isBlocked(s.grid, u.x, u.y), false);
  assert.ok(s.grid.tiles.filter((k) => k === TREE).length > 100);
  assert.deepEqual(createBase({ calm: true }).grid, s.grid, 'same seed, same woods');
});

test('a move order walks the survivor to the tile at 3 tiles per second', () => {
  const s = createBase({ calm: true });
  const u = s.survivors[0]!;
  const [tx, ty] = [u.x + 6, u.y];
  assert.deepEqual(orderMove(s, [u.id], [tx, ty]), [u.id]);
  for (let i = 0; i < 10; i++) stepBase(s);
  assert.ok(Math.abs(u.x - (tx - 3)) < 1e-6 && u.y === ty, `after 1 s at x=${u.x}`);
  for (let i = 0; i < 20; i++) stepBase(s);
  assert.deepEqual([u.x, u.y], [tx, ty]);
  assert.equal(u.path.length, 0);
});

test('a group order spreads the survivors over different tiles; an order onto a tree ends beside it', () => {
  const s = createBase({ calm: true });
  orderMove(s, s.survivors.map((v) => v.id), [10, 20]);
  for (let i = 0; i < 100; i++) stepBase(s);
  const [a, b] = s.survivors;
  assert.notDeepEqual([a!.x, a!.y], [b!.x, b!.y]);
  orderMove(s, ['fighter'], [0, 0]);
  for (let i = 0; i < 400; i++) stepBase(s);
  assert.equal(isBlocked(s.grid, Math.round(a!.x), Math.round(a!.y)), false);
});
