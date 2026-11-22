import assert from 'node:assert/strict';
import { test } from 'node:test';
import mapConfig from '../src/data/map.json';
import { miniSize, miniToTile, miniToWorld, terrainPixels, tileToMini, viewRect, worldToMini } from '../src/render/minimap';
import { worldBounds } from '../src/render/iso';
import { newGame } from '../src/sim/tick';

const N = mapConfig.size;

test('the minimap is the world at 1/32: 192 x 96 for 96 x 96 tiles', () => {
  assert.deepEqual(miniSize(N), { w: 192, h: 96 });
  const b = worldBounds(N);
  assert.deepEqual(worldToMini(b.w, b.h + 16), { x: 192, y: 96 });
});

test('tile -> minimap -> tile round-trips for every tile', () => {
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const m = tileToMini(x, y, N);
      assert.deepEqual(miniToTile(m.x, m.y, N), { x, y });
    }
  }
});

test('minimap <-> world round-trips, and points off the map are not tiles', () => {
  const w = miniToWorld(40.5, 12.25);
  const m = worldToMini(w.x, w.y);
  assert.ok(Math.abs(m.x - 40.5) < 1e-9 && Math.abs(m.y - 12.25) < 1e-9);
  assert.equal(miniToTile(0.2, 0.2, N), null); // the top-left corner of the rectangle is empty
  assert.equal(miniToTile(191.8, 95.8, N), null);
  assert.ok(miniToTile(96, 48, N) !== null); // the middle is a tile
});

test('the camera view is clipped to the minimap', () => {
  const inside = viewRect({ x: 3000, y: 1500, width: 1280, height: 720 }, N);
  assert.deepEqual(inside, { x: 3000 / 32, y: (1500 - 16) / 32, w: 40, h: 22.5 });
  const off = viewRect({ x: -500, y: -500, width: 1280, height: 720 }, N);
  assert.equal(off.x, 0);
  assert.equal(off.y, 0);
  assert.ok(off.w > 0 && off.h > 0 && off.w < 40);
});

test('terrain pixels: river, ford, forest and the camp grass are coloured; corners stay empty', () => {
  const s = newGame(1);
  const colors = { grass: 0x010203, river: 0x0a0b0c, ford: 0x111213, forest: 0x212223, berry: 0x313233 };
  const px = terrainPixels(s.map.tiles, N, colors);
  const m = miniSize(N);
  assert.equal(px.length, m.w * m.h * 4);
  assert.equal(px[3], 0); // top-left pixel is outside the diamond
  const at = (mx: number, my: number) => {
    const i = (my * m.w + mx) * 4;
    return (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
  };
  const seen = new Set<number>();
  for (let py = 0; py < m.h; py++) for (let pxx = 0; pxx < m.w; pxx++) if (px[(py * m.w + pxx) * 4 + 3]) seen.add(at(pxx, py));
  for (const c of [colors.grass, colors.river, colors.ford, colors.forest, colors.berry]) assert.ok(seen.has(c), `colour ${c.toString(16)} missing`);
  // The camp's centre is cleared grass.
  const centre = tileToMini(s.map.fire[0] + 2, s.map.fire[1] + 2, N);
  assert.equal(at(Math.floor(centre.x), Math.floor(centre.y)), colors.grass);
});

test('same seed, same pixels', () => {
  const c = { grass: 1, river: 2, ford: 3, forest: 4, berry: 5 };
  assert.deepEqual(terrainPixels(newGame(3).map.tiles, N, c), terrainPixels(newGame(3).map.tiles, N, c));
});
