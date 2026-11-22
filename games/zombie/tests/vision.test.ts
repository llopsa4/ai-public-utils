import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BUSH, COVER, WALL, makeGrid, setTile } from '../src/sim/grid';
import { type Viewer, inCone, lineOfSight, seeSurvivor } from '../src/sim/vision';

const east = (x: number, y: number, range: number, angle: number): Viewer => ({ x, y, facing: [1, 0], range, angle });

test('cone: range and angle; walls block line of sight', () => {
  const g = makeGrid(12);
  const v = east(1, 5, 6, 90);
  assert.ok(inCone(v, 5, 5));
  assert.ok(inCone(v, 4, 7)); // 34° off the facing, inside 45°
  assert.ok(!inCone(v, 2, 1)); // north: outside the angle
  assert.ok(!inCone(v, 8, 5)); // beyond range
  assert.equal(seeSurvivor(g, v, { x: 5, y: 5, mode: 'walk' }), 'far');
  setTile(g, 3, 5, WALL);
  assert.ok(!lineOfSight(g, 1, 5, 5, 5));
  assert.equal(seeSurvivor(g, v, { x: 5, y: 5, mode: 'walk' }), 'none');
  assert.equal(seeSurvivor(g, v, { x: 5, y: 7, mode: 'walk' }), 'far'); // a line that misses the wall
});

test('far half of a guard cone ignores crouched and crawling survivors', () => {
  const g = makeGrid(12);
  const v = east(0, 5, 9, 70);
  assert.equal(seeSurvivor(g, v, { x: 7, y: 5, mode: 'walk' }, true), 'far');
  assert.equal(seeSurvivor(g, v, { x: 7, y: 5, mode: 'crouch' }, true), 'none');
  assert.equal(seeSurvivor(g, v, { x: 7, y: 5, mode: 'crawl' }, true), 'none');
  assert.equal(seeSurvivor(g, v, { x: 7, y: 5, mode: 'crouch' }), 'far'); // zombies have no far rule
  assert.equal(seeSurvivor(g, v, { x: 3, y: 5, mode: 'crouch' }, true), 'near');
});

test('a bush hides a crouched survivor unless the enemy is adjacent; low cover hides too', () => {
  const g = makeGrid(12);
  setTile(g, 5, 5, BUSH);
  const v = east(2, 5, 6, 90);
  assert.equal(seeSurvivor(g, v, { x: 5, y: 5, mode: 'crouch' }), 'none');
  assert.equal(seeSurvivor(g, v, { x: 5, y: 5, mode: 'crawl' }), 'none');
  assert.equal(seeSurvivor(g, v, { x: 5, y: 5, mode: 'walk' }), 'near');
  assert.equal(seeSurvivor(g, east(4, 5, 6, 90), { x: 5, y: 5, mode: 'crouch' }), 'near');

  const c = makeGrid(12);
  setTile(c, 4, 5, COVER);
  assert.equal(seeSurvivor(c, v, { x: 6, y: 5, mode: 'crouch' }), 'none');
  assert.equal(seeSurvivor(c, v, { x: 6, y: 5, mode: 'walk' }), 'far');
});
