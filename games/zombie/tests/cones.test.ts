import assert from 'node:assert/strict';
import { test } from 'node:test';
import { conePolygon, survivorCone } from '../src/render/cones';
import { makeGrid } from '../src/sim/grid';

const g = makeGrid(20);
const v = { x: 5, y: 5, facing: [1, 0] as [number, number], range: 6, angle: 60 };

test('survivor cone (DESIGN §13): none when merely selected, fixed when holding', () => {
  assert.equal(survivorCone(g, v, false, null), null);
  assert.deepEqual(survivorCone(g, v, true, null), conePolygon(g, v));
});

test('survivor cone: aiming turns it live toward the pointer, even over a fixed Hold', () => {
  const live = survivorCone(g, v, false, [5, 12])!; // pointer straight south of the survivor
  assert.deepEqual(live, conePolygon(g, { ...v, facing: [0, 1] }));
  assert.deepEqual(survivorCone(g, v, true, [5, 12]), live);
  assert.notDeepEqual(live, conePolygon(g, v));
});

test('survivor cone: a pointer on the survivor keeps the current facing', () => {
  assert.deepEqual(survivorCone(g, v, true, [5, 5]), conePolygon(g, v));
  assert.equal(survivorCone(g, v, false, [5, 5]), null);
});
