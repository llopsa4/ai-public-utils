import assert from 'node:assert/strict';
import { test } from 'node:test';
import mapConfig from '../src/data/map.json';
import { tileToWorld, worldToTile, worldToTileF, worldBounds } from '../src/render/iso';
import { clampCenter, edgeDirection, panVector, zoomAtCursor, zoomStep } from '../src/render/camera';
import { generateMap, type MapConfig } from '../src/sim/map';

const cfg = mapConfig as MapConfig;
const N = cfg.size;

test('tile -> world -> tile round-trips at the corners and the camp centre', () => {
  for (const [x, y] of [[0, 0], [N - 1, 0], [0, N - 1], [N - 1, N - 1], [24, 24]]) {
    const w = tileToWorld(x, y, N);
    assert.deepEqual(worldToTile(w.x, w.y, N), { x, y });
    const f = worldToTileF(w.x, w.y, N);
    assert.ok(Math.abs(f.x - x) < 1e-9 && Math.abs(f.y - y) < 1e-9);
  }
  assert.deepEqual(tileToWorld(0, 0, N), { x: 1536, y: 32 });
});

test('the whole map projects inside the world bounds', () => {
  const b = worldBounds(N);
  for (const [x, y] of [[0, 0], [N - 1, 0], [0, N - 1], [N - 1, N - 1]]) {
    const w = tileToWorld(x, y, N);
    assert.ok(w.x >= 0 && w.x <= b.w && w.y >= 0 && w.y <= b.h);
  }
});

test('camera: clamp, wheel zoom steps, pan speed and zoom under the cursor', () => {
  const b = { w: 3072, h: 1536 };
  assert.deepEqual(clampCenter(-5, 9999, b), [0, 1536]);
  assert.equal(zoomStep(1, -100, 0.1, 0.5, 2), 1.1);
  assert.equal(zoomStep(2, -100, 0.1, 0.5, 2), 2);
  assert.equal(zoomStep(0.5, 100, 0.1, 0.5, 2), 0.5);
  assert.deepEqual(edgeDirection(0, 360, 1280, 720, 16), [-1, 0]);
  assert.deepEqual(edgeDirection(1270, 715, 1280, 720, 16), [1, 1]);
  assert.deepEqual(panVector(1, 0, 1000, 2, 600), [300, 0]);
  const [dx, dy] = panVector(1, 1, 1000, 1, 600);
  assert.ok(Math.abs(Math.hypot(dx, dy) - 600) < 1e-9);
  // The world point under the pointer does not move when zooming.
  const [cx, cy, z, nz, px, py] = [1500, 800, 1, 1.4, 900, 200];
  const [ncx, ncy] = zoomAtCursor(cx, cy, z, px, py, 1280, 720, nz);
  const before = [cx + (px - 640) / z, cy + (py - 360) / z];
  const after = [ncx + (px - 640) / nz, ncy + (py - 360) / nz];
  assert.ok(Math.abs(before[0] - after[0]) < 1e-9 && Math.abs(before[1] - after[1]) < 1e-9);
});

test('seed 1 map: 2-wide river, 2 fords, clear camp, 3 berry patches of 7', () => {
  const m = generateMap(1, cfg);
  assert.equal(m.tiles.length, N * N);
  const at = (x: number, y: number) => m.tiles[y * N + x];
  let fordRows = 0;
  for (let y = 0; y < N; y++) {
    let water = 0;
    let fords = 0;
    for (let x = 0; x < N; x++) {
      if (at(x, y) === 'river' || at(x, y) === 'ford') water++;
      if (at(x, y) === 'ford') fords++;
    }
    assert.equal(water, 2, `row ${y} river width`);
    if (fords > 0) {
      fordRows++;
      assert.equal(fords, 2);
    }
  }
  assert.equal(fordRows, 2);
  for (let y = 24 - 7; y <= 24 + 7; y++) {
    for (let x = 24 - 7; x <= 24 + 7; x++) assert.ok(!['forest', 'berry'].includes(at(x, y)), `camp tile ${x},${y}`);
  }
  // Prebuilt footprints and the fire stand on grass.
  for (const [bx, by] of [[23, 23], ...m.prebuilt.map((b) => b.at)]) {
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) assert.equal(at(bx + dx, by + dy), 'grass');
  }
  assert.equal(m.tiles.filter((t) => t === 'berry').length, 21);
  assert.ok(m.tiles.filter((t) => t === 'forest').length > 40);
});

test('the same seed gives the same map; another seed differs', () => {
  assert.deepEqual(generateMap(1, cfg), generateMap(1, cfg));
  assert.notDeepEqual(generateMap(1, cfg).tiles, generateMap(2, cfg).tiles);
  for (const seed of [2, 3, 7, 99, 12345]) {
    const m = generateMap(seed, cfg);
    assert.equal(m.tiles.filter((t) => t === 'berry').length, 21, `seed ${seed}`);
  }
});
