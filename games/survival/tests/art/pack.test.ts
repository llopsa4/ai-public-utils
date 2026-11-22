// The art packer and the grey stand-ins (scripts/art/pack-lib.mjs, standin-lib.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { GROUPS, expectedFrames, validateInbox } from '../../scripts/art/lib.mjs';
import { PAGE_BUDGET, atlasJson, packFrames, packGroup, trimBox } from '../../scripts/art/pack-lib.mjs';
import { standinImage, writeStandins } from '../../scripts/art/standin-lib.mjs';
import realManifest from '../../art/manifest.json';

const { PNG } = createRequire(import.meta.url)('pngjs');

function solid(w: number, h: number, x0: number, y0: number, x1: number, y1: number, c = [200, 50, 50, 255]) {
  const png = new PNG({ width: w, height: h });
  png.data.fill(0);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) png.data.set(c, (y * w + x) * 4);
  return png;
}

test('trimBox finds the opaque box, and a blank frame is 1 x 1', () => {
  assert.deepEqual(trimBox(solid(20, 20, 5, 6, 9, 12)), { x: 5, y: 6, w: 5, h: 7 });
  assert.deepEqual(trimBox(solid(8, 8, 0, 0, -1, -1)), { x: 0, y: 0, w: 1, h: 1 });
});

test('packFrames: trimmed frames, 2 px extrude, no overlap, several pages when needed', () => {
  const frames = Array.from({ length: 12 }, (_, i) => ({ name: `k/${String(i).padStart(2, '0')}`, png: solid(40, 40, 4, 4, 35, 35) }));
  const packed = packFrames(frames, { pageSize: 128 });
  assert.ok(packed.pages.length > 1, 'twelve 32 px frames cannot fit one 128 px page');
  const seen = new Set<string>();
  for (const page of packed.pages) {
    assert.ok(page.width <= 128 && page.height <= 128);
    const rects = page.frames.map((f) => f.frame);
    page.frames.forEach((f) => {
      seen.add(f.name);
      assert.equal(f.frame.w, 32);
      assert.deepEqual(f.spriteSourceSize, { x: 4, y: 4, w: 32, h: 32 });
      assert.deepEqual(f.sourceSize, { w: 40, h: 40 });
      assert.equal(f.trimmed, true);
      // The frame's pixels are the trimmed art, and the 2 px around it repeat its edge.
      const at = (x: number, y: number) => page.png.data[(y * page.width + x) * 4 + 3];
      assert.equal(at(f.frame.x, f.frame.y), 255);
      assert.equal(at(f.frame.x - 2, f.frame.y - 2), 255);
      assert.equal(at(f.frame.x + f.frame.w + 1, f.frame.y + f.frame.h + 1), 255);
    });
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        // Frames with their extrude and a gap of 2 px do not touch.
        const apart = a.x + a.w + 4 <= b.x || b.x + b.w + 4 <= a.x || a.y + a.h + 4 <= b.y || b.y + b.h + 4 <= a.y;
        assert.ok(apart, `${i} and ${j} overlap`);
      }
    }
  }
  assert.equal(seen.size, 12);
});

test('packFrames is the same whatever order the frames come in, and rejects a duplicate name', () => {
  const frames = ['c', 'a', 'b'].map((n, i) => ({ name: `k/${n}`, png: solid(16, 16, 1, 1, 4 + i, 4 + i) }));
  const a = JSON.stringify(atlasJson('g', packFrames(frames)));
  const b = JSON.stringify(atlasJson('g', packFrames([...frames].reverse())));
  assert.equal(a, b);
  assert.throws(() => packFrames([frames[0], frames[0]]), /Duplicate/);
});

test('atlasJson is Phaser multiatlas: textures with image, size and frames', () => {
  const json = atlasJson('man', packFrames([{ name: 'person_man/base/idle/s/00', png: solid(16, 16, 2, 2, 9, 9) }]));
  assert.equal(json.textures.length, 1);
  const t = json.textures[0] as { image: string; format: string; scale: number; frames: Record<string, unknown>[] };
  assert.equal(t.image, 'man-0.png');
  assert.equal(t.format, 'RGBA8888');
  assert.equal(t.scale, 1);
  assert.deepEqual(Object.keys(t.frames[0]).sort(), ['filename', 'frame', 'rotated', 'sourceSize', 'spriteSourceSize', 'trimmed']);
  assert.equal(t.frames[0].filename, 'person_man/base/idle/s/00');
});

test('stand-ins: exact cell, an empty border, retina cursors at twice the size', () => {
  const manifest = realManifest as Record<string, any>;
  for (const key of ['person_woman', 'animal_bison', 'building_store', 'tile_grass', 'icon_food', 'cursor_move', 'ui_button', 'tree_willow']) {
    const e = manifest[key];
    for (const f of expectedFrames(key, e).slice(0, 40)) {
      const scale = f.name.endsWith('@2x') ? 2 : 1;
      const png = standinImage(key, e, f, scale);
      assert.equal(png.width, f.size[0], `${f.name} width`);
      assert.equal(png.height, f.size[1], `${f.name} height`);
      const border = e.border * scale;
      for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
          if (x < border || y < border || x >= png.width - border || y >= png.height - border) {
            assert.equal(png.data[(y * png.width + x) * 4 + 3], 0, `${f.name} border at ${x},${y}`);
          }
        }
      }
    }
  }
});

test('every stand-in passes the inbox validator, and all of them pack within the page budget', () => {
  const manifest = realManifest as Record<string, any>;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'art-standins-'));
  const inbox = path.join(dir, 'inbox', 'AB00');
  const files = writeStandins(manifest, inbox);
  const keys = Object.keys(manifest).filter((k) => !manifest[k].legacy);
  assert.equal(files, keys.reduce((n, k) => n + expectedFrames(k, manifest[k]).length, 0));
  fs.writeFileSync(path.join(inbox, 'delivery.json'), JSON.stringify({ batch: 'AB00', revision: 1, brief: 'x', keys, tools: {}, prompts: {} }));
  fs.writeFileSync(path.join(inbox, 'contact.png'), PNG.sync.write(solid(4, 4, 0, 0, 3, 3)));
  const check = validateInbox(dir, 'AB00', manifest);
  assert.deepEqual(check.errors.slice(0, 5), []);

  const out = path.join(dir, 'atlas');
  let pages = 0;
  const names = new Set<string>();
  for (const group of GROUPS) {
    const groupKeys = keys.filter((k) => manifest[k].atlas === group);
    if (!groupKeys.length) continue;
    const r = packGroup(manifest, group, groupKeys, (k) => path.join(inbox, k), out);
    pages += r.pages;
    const json = JSON.parse(fs.readFileSync(path.join(out, `${group}.json`), 'utf8'));
    assert.equal(json.textures.length, r.pages);
    for (const t of json.textures) {
      assert.ok(fs.existsSync(path.join(out, t.image)));
      for (const f of t.frames) names.add(f.filename);
    }
  }
  assert.ok(pages <= PAGE_BUDGET, `${pages} pages`);
  assert.equal(names.size, files);
  fs.rmSync(dir, { recursive: true, force: true });
});
