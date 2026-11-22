import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clampCenter, edgeDirection, panVector, zoomAtCursor, zoomStep } from '../src/render/camera';
import { tileToWorld, worldBounds, worldToTile, worldToTileF } from '../src/render/iso';
import { makeRng, rngInt, rngNext } from '../src/sim/rng';
import manifest from '../art/manifest.json';

const N = 32;

test('tile -> world -> tile round-trips at the corners and the centre', () => {
  for (const [x, y] of [[0, 0], [N - 1, 0], [0, N - 1], [N - 1, N - 1], [N / 2, N / 2]]) {
    const w = tileToWorld(x, y, N);
    assert.deepEqual(worldToTile(w.x, w.y, N), { x, y });
    const f = worldToTileF(w.x, w.y, N);
    assert.ok(Math.abs(f.x - x) < 1e-9 && Math.abs(f.y - y) < 1e-9);
  }
  assert.deepEqual(tileToWorld(0, 0, N), { x: (N * 64) / 2, y: 32 });
});

test('the whole map projects inside the world bounds', () => {
  const b = worldBounds(N);
  for (const [x, y] of [[0, 0], [N - 1, 0], [0, N - 1], [N - 1, N - 1]]) {
    const w = tileToWorld(x, y, N);
    assert.ok(w.x >= 0 && w.x <= b.w && w.y >= 0 && w.y <= b.h);
  }
});

test('camera: clamp, wheel zoom steps, pan speed and zoom under the cursor', () => {
  const b = { w: 2048, h: 1088 };
  assert.deepEqual(clampCenter(-5, 9999, b), [0, 1088]);
  assert.equal(zoomStep(1, -100, 0.1, 0.5, 2), 1.1);
  assert.equal(zoomStep(2, -100, 0.1, 0.5, 2), 2);
  assert.equal(zoomStep(0.5, 100, 0.1, 0.5, 2), 0.5);
  assert.deepEqual(edgeDirection(0, 360, 1280, 720, 16), [-1, 0]);
  assert.deepEqual(edgeDirection(1270, 715, 1280, 720, 16), [1, 1]);
  assert.deepEqual(panVector(1, 0, 1000, 2, 600), [300, 0]);
  const [dx, dy] = panVector(1, 1, 1000, 1, 600);
  assert.ok(Math.abs(Math.hypot(dx, dy) - 600) < 1e-9);
  // The point under the cursor stays put: centre the cursor, zooming changes nothing.
  assert.deepEqual(zoomAtCursor(100, 100, 1, 640, 360, 1280, 720, 2), [100, 100]);
});

test('seeded rng repeats and stays in range', () => {
  const a = makeRng(7);
  const b = makeRng(7);
  for (let i = 0; i < 100; i++) {
    const v = rngNext(a);
    assert.equal(v, rngNext(b));
    assert.ok(v >= 0 && v < 1);
  }
  const r = makeRng(1);
  for (let i = 0; i < 200; i++) {
    const n = rngInt(r, 2, 5);
    assert.ok(Number.isInteger(n) && n >= 2 && n <= 5);
  }
});

test('every manifest key has size, anchor, frames and a known status', () => {
  for (const [key, e] of Object.entries(manifest.keys as Record<string, { size: number[]; anchor: number[]; frames: number; status: string }>)) {
    assert.equal(e.size.length, 2, key);
    assert.ok(e.anchor.every((v) => v >= 0 && v <= 1), key);
    assert.ok(e.frames >= 1, key);
    assert.ok(['placeholder', 'final'].includes(e.status), key);
  }
});
