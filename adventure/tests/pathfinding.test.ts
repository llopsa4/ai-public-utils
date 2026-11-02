import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ROOMS } from '../src/chapters/ch1/rooms';
import { WalkArea } from '../src/engine/pathfinding';
import type { Point } from '../src/engine/types';

const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];

function assertPathInside(area: WalkArea, start: Point, path: Point[]) {
  let from = area.clamp(start);
  for (const p of path) {
    assert.ok(area.lineOfSight(from, p), `segment ${JSON.stringify(from)} -> ${JSON.stringify(p)} leaves the walkable area`);
    from = p;
  }
}

test('straight line when nothing is in the way', () => {
  const area = new WalkArea(square);
  assert.deepEqual(area.findPath({ x: 10, y: 10 }, { x: 90, y: 90 }), [{ x: 90, y: 90 }]);
});

test('routes around a hole and stays inside', () => {
  const hole = [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 70, y: 70 }, { x: 30, y: 70 }];
  const area = new WalkArea(square, [hole]);
  const path = area.findPath({ x: 10, y: 50 }, { x: 90, y: 50 });
  assert.ok(path.length >= 2, 'detours via hole corners');
  assertPathInside(area, { x: 10, y: 50 }, path);
  assert.deepEqual(path.at(-1), { x: 90, y: 50 });
});

test('routes around the inside corner of a concave room', () => {
  const lShape = [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 60 }, { x: 100, y: 60 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  const area = new WalkArea(lShape);
  const path = area.findPath({ x: 20, y: 10 }, { x: 90, y: 80 });
  assert.deepEqual(path[0], { x: 40, y: 60 });
  assertPathInside(area, { x: 20, y: 10 }, path);
});

test('targets outside the area are clamped to the nearest walkable point', () => {
  const area = new WalkArea(square);
  const path = area.findPath({ x: 50, y: 50 }, { x: 50, y: -40 });
  assert.deepEqual(path, [{ x: 50, y: 0 }]);
  const intoHole = new WalkArea(square, [[{ x: 40, y: 40 }, { x: 60, y: 40 }, { x: 60, y: 60 }, { x: 40, y: 60 }]]);
  const end = intoHole.findPath({ x: 10, y: 10 }, { x: 50, y: 42 }).at(-1)!;
  assert.ok(intoHole.contains(end));
  assert.equal(end.y, 40);
});

test('every room entry and hotspot approach point is reachable', () => {
  for (const room of Object.values(ROOMS)) {
    const area = new WalkArea(room.walkable.outer, room.walkable.holes);
    const points = [...Object.values(room.entries), ...room.hotspots.flatMap(h => (h.walkTo ? [h.walkTo] : []))];
    for (const p of points) assert.ok(area.contains(p), `${room.id}: ${JSON.stringify(p)} is not walkable`);
    const start = Object.values(room.entries)[0];
    for (const p of points) {
      const path = area.findPath(start, p);
      assertPathInside(area, start, path);
      if (Math.hypot(p.x - start.x, p.y - start.y) > 1) assert.deepEqual(path.at(-1), { x: p.x, y: p.y });
    }
  }
});
