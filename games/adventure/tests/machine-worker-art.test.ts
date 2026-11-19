import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

test('machine artwork is palette-matched, transparent, grounded and snapped to the two-pixel grid', () => {
  const palette = new Set(JSON.parse(readFileSync(new URL('../art/style/palette.json', import.meta.url), 'utf8')).colours.map((c: string) => c.toLowerCase()));
  for (const id of ['ash-collector', 'shard-sorter']) {
    const png = PNG.sync.read(readFileSync(new URL(`../art/src/characters/extra-${id}.png`, import.meta.url)));
    const pixel = (x: number, y: number) => png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4);
    let opaque = 0;
    for (let y = 0; y < png.height; y += 2) for (let x = 0; x < png.width; x += 2) {
      const p = pixel(x, y);
      assert.ok(p[3] === 0 || p[3] === 255, 'binary alpha has no fringe');
      if (p[3]) {
        opaque++;
        assert.ok(palette.has('#' + [...p.subarray(0, 3)].map(v => v.toString(16).padStart(2, '0')).join('')));
      }
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1]]) assert.deepEqual(pixel(x + dx, y + dy), p);
    }
    assert.ok(opaque > 1000 && opaque < png.width * png.height / 16, 'small silhouettes on transparent sheets');
    const meta = JSON.parse(readFileSync(new URL(`../art/src/characters/extra-${id}.json`, import.meta.url), 'utf8'));
    const frames: Buffer[] = [];
    for (const { frame } of meta.frames) {
      const rows = [];
      let count = 0, bottom = -1;
      for (let y = 0; y < frame.h; y++) {
        const row = png.data.subarray(((frame.y + y) * png.width + frame.x) * 4, ((frame.y + y) * png.width + frame.x + frame.w) * 4);
        rows.push(row);
        for (let x = 0; x < frame.w; x++) if (row[x * 4 + 3]) { count++; bottom = y; }
      }
      assert.ok(count > 300, 'every frame contains the full machine');
      assert.equal(bottom, 255, 'feet or tracks share the bottom-centre baseline');
      frames.push(Buffer.concat(rows));
    }
    for (const name of ['walk_side', 'walk_up', 'walk_down', 'work', 'reach']) {
      const tag = meta.meta.frameTags.find((t: { name: string }) => t.name === name);
      assert.notDeepEqual(frames[tag.from], frames[tag.to], `${name} must contain real movement`);
    }
  }
});
