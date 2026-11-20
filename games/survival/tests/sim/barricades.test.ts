// Spike barricades (DESIGN-upgrades-3.md `## Spike barricades`): placement, wolf A* round a gap, breaking a
// closed line, people blocked.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lineSites, lineTiles, placeBuilding, placementError } from '../../src/sim/buildings';
import { firstWallOnLine, stepEnemies, wallsOf } from '../../src/sim/combat';
import { findPath, walkable } from '../../src/sim/people';
import { addBuilding, type Enemy, type GameState, type Tile2 } from '../../src/sim/state';
import upgradeData from '../../src/data/upgrades.json';
import { buyUpgrade, missingRequirement } from '../../src/sim/upgrades';
import { newGame } from '../../src/sim/tick';

const wolf = (id: number, x: number, y: number): Enemy => ({ id, kind: 'wolf', x, y, hp: 40, cooldown: 0, fleeing: false, wave: 0 });

/** A camp with nobody in it (so wolves head for the fire) and the given finished barricades. */
function emptyCamp(walls: Tile2[]): { s: GameState; fc: Tile2 } {
  const s = newGame(1);
  s.people = [];
  for (const [x, y] of walls) addBuilding(s, 'barricade', x, y, true);
  return { s, fc: [s.map.fire[0] + 1, s.map.fire[1] + 1] };
}

const onWall = (s: GameState, e: Enemy) =>
  s.buildings.some((b) => b.type === 'barricade' && b.done && b.x === Math.round(e.x) && b.y === Math.round(e.y));

test('the barricade needs the Spike barricades upgrade, which needs the builders and the council fire', () => {
  const s = newGame(1);
  s.store.wood = 100;
  assert.equal(placementError(s, 'barricade', s.map.fire[0], s.map.fire[1] - 6), 'Needs the Spike barricades.');
  assert.equal(missingRequirement(s, 'barricades'), 'builders');
  assert.equal(upgradeData.upgrades.barricades.home, 'fire');
  s.upgrades.push('healers', 'builders');
  s.gift = 6;
  s.store.wood = 15;
  assert.equal(buyUpgrade(s, 'barricades'), true);
  assert.deepEqual([s.gift, s.store.wood], [0, 0]);
});

test('a dragged line snaps to horizontal, vertical or diagonal', () => {
  assert.deepEqual(lineTiles([5, 5], [9, 6]), [[5, 5], [6, 5], [7, 5], [8, 5], [9, 5]]);
  assert.deepEqual(lineTiles([5, 5], [4, 2]), [[5, 5], [5, 4], [5, 3], [5, 2]]);
  assert.deepEqual(lineTiles([5, 5], [8, 7]), [[5, 5], [6, 6], [7, 7], [8, 8]]);
  assert.deepEqual(lineTiles([5, 5], [5, 5]), [[5, 5]]);
});

test('a line places one 1x1 site per free tile until the wood runs out', () => {
  const s = newGame(1);
  s.upgrades.push('healers', 'builders', 'barricades');
  const y = s.map.fire[1] - 6;
  let x0 = -1;
  for (let x = s.map.fire[0] - 8; x < s.map.fire[0]; x++) {
    if ([0, 1, 2, 3, 4].every((k) => placementError(s, 'barricade', x + k, y) === null)) {
      x0 = x;
      break;
    }
  }
  assert.ok(x0 >= 0, 'five free tiles in a row');
  s.store.wood = 10; // 4 wood a segment: two fit
  const line = lineSites(s, 'barricade', [x0, y], [x0 + 4, y]);
  assert.deepEqual(line.ok, [true, true, false, false, false]);
  assert.equal(line.error, 'Not enough wood.');
  for (let i = 0; i < 2; i++) placeBuilding(s, 'barricade', ...line.tiles[i]);
  const sites = s.buildings.filter((b) => b.type === 'barricade');
  assert.equal(sites.length, 2);
  assert.ok(sites.every((b) => !b.done && b.hp === 60));
  assert.equal(s.store.wood, 2);
});

test('people cannot walk through a barricade, finished or not; wolves ignore an unfinished one', () => {
  const s = newGame(1);
  const [fx, fy] = [s.map.fire[0] + 1, s.map.fire[1] + 1];
  const y = fy - 6;
  const site = addBuilding(s, 'barricade', fx, y, false);
  assert.equal(walkable(s, fx, y), false);
  assert.equal(wallsOf(s), null, 'a site is no wall for wolves');
  site.done = true;
  const w = wallsOf(s)!;
  assert.equal(firstWallOnLine(s.map.size, w, fx, y - 3, fx, y + 3)?.id, site.id);
  assert.equal(firstWallOnLine(s.map.size, w, fx + 2, y - 3, fx + 2, y + 3), null);

  // A closed ring round the fire: nobody inside can walk out.
  const ring = emptyCamp([]).s;
  const [cx, cy] = [ring.map.fire[0] + 1, ring.map.fire[1] + 1];
  for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) === 5) addBuilding(ring, 'barricade', cx + dx, cy + dy, false);
  }
  let inside: Tile2 | null = null;
  for (let dx = -3; dx <= 3 && !inside; dx++) if (walkable(ring, cx + dx, cy - 3)) inside = [cx + dx, cy - 3];
  assert.ok(inside, 'a free tile inside the ring');
  assert.equal(findPath(ring, inside!, [cx, cy - 12]), null);
});

test('a diagonal line has no gaps for a wolf to slip through', () => {
  const { s } = emptyCamp([[10, 10], [11, 9], [12, 8]]);
  const w = wallsOf(s)!;
  // Straight through the corner between (10,10) and (11,9).
  assert.notEqual(firstWallOnLine(s.map.size, w, 9.6, 9.0, 11.4, 10.0), null);
});

test('a wolf walks round a barricade line with open ends and never steps on it', () => {
  const probe = emptyCamp([]);
  const [cx, cy] = probe.fc;
  const wall: Tile2[] = [];
  for (let dx = -3; dx <= 3; dx++) wall.push([cx + dx, cy - 5]);
  const { s } = emptyCamp(wall);
  s.enemies.push(wolf(1, cx, cy - 10));
  s.nextEnemyId = 2;
  let reached = false;
  let maxSide = 0;
  for (let i = 0; i < 400 && !reached; i++) {
    stepEnemies(s);
    const e = s.enemies[0];
    assert.equal(onWall(s, e), false, `tick ${i}: on a barricade at ${e.x},${e.y}`);
    maxSide = Math.max(maxSide, Math.abs(e.x - cx));
    reached = Math.hypot(e.x - cx, e.y - cy) <= 2;
  }
  assert.ok(reached, 'the wolf reached the fire');
  assert.ok(maxSide >= 3.5, 'it went round an end of the line');
  assert.equal(s.buildings.filter((b) => b.type === 'barricade').length, 7, 'nothing broken');
});

test('a wolf facing a closed ring breaks the barricade on its straight line in, then walks through', () => {
  const probe = emptyCamp([]);
  const [cx, cy] = probe.fc;
  const ring: Tile2[] = [];
  for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) === 5) ring.push([cx + dx, cy + dy]);
  }
  const { s } = emptyCamp(ring);
  s.enemies.push(wolf(1, cx, cy - 12));
  s.nextEnemyId = 2;
  let broke = -1;
  for (let i = 0; i < 600 && broke < 0; i++) {
    stepEnemies(s);
    assert.equal(onWall(s, s.enemies[0]), false);
    if (s.buildings.filter((b) => b.type === 'barricade').length < ring.length) broke = i;
  }
  assert.ok(broke >= 0, 'a barricade broke');
  assert.ok(s.messages.some((m) => m.text === 'A barricade broke.'));
  const left = new Set(s.buildings.filter((b) => b.type === 'barricade').map((b) => `${b.x},${b.y}`));
  assert.equal(left.has(`${cx},${cy - 5}`), false, 'the one straight between the wolf and the fire');
  assert.equal(s.blocked[(cy - 5) * s.map.size + cx], false, 'its tile is free again');
  let reached = false;
  for (let i = 0; i < 200 && !reached; i++) {
    stepEnemies(s);
    reached = Math.hypot(s.enemies[0].x - cx, s.enemies[0].y - cy) <= 2;
  }
  assert.ok(reached, 'then it walked in through the gap');
});

test('a wolf replans when a barricade finishes across its path', () => {
  const probe = emptyCamp([]);
  const [cx, cy] = probe.fc;
  const { s } = emptyCamp([]);
  s.enemies.push(wolf(1, cx, cy - 12));
  s.nextEnemyId = 2;
  stepEnemies(s);
  assert.equal(s.enemies[0].path, undefined, 'straight while nothing is in the way');
  for (let dx = -2; dx <= 2; dx++) addBuilding(s, 'barricade', cx + dx, cy - 6, true);
  stepEnemies(s);
  const path = s.enemies[0].path as Tile2[] | undefined;
  assert.ok(path && path.length > 0, 'a path round the new line');
  for (let i = 0; i < 300; i++) {
    stepEnemies(s);
    assert.equal(onWall(s, s.enemies[0]), false);
  }
});
