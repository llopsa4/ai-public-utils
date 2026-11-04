import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import { isFinal } from '../art/guard.mjs';
import { importArt } from '../art/import.mjs';
import { MANIFEST, PILOT, RIGS } from '../art/manifest.mjs';
import { PALETTE, paletteConformity, snapToPalette } from '../art/normalize.mjs';
import { checkManifest } from '../scripts/art-check';

test('the manifest lists every art file once, and every listed file exists', () => {
  assert.deepEqual(checkManifest().filter(p => !p.warning), []);
  const ids = MANIFEST.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  for (const id of PILOT) assert.ok(ids.includes(id), `pilot asset ${id} is in the manifest`);
  for (const e of MANIFEST.filter(m => m.rig)) assert.ok(RIGS[e.rig!], `${e.id} has rig settings`);
});

test('the master palette has 160 colours, and snapping makes any image conform', () => {
  assert.equal(PALETTE.length, 160);
  const data = new Uint8Array(64 * 4);
  for (let i = 0; i < 64; i++) data.set([i * 4, 255 - i * 3, (i * 37) % 256, i % 2 ? 255 : 40], i * 4);
  assert.ok(paletteConformity(data) < 1);
  snapToPalette(data, 8);
  assert.equal(paletteConformity(data), 1);
});

test('generators keep their hands off final art', () => {
  // Nothing is final yet: every placeholder may be regenerated.
  for (const e of MANIFEST) assert.equal(isFinal(e.file), e.status === 'final');
});

test('importing a Codex image: fitted to size, snapped to the palette, outlined, marked final, previewed', async () => {
  const root = mkdtempSync(join(tmpdir(), 'cinderfold-art-'));
  try {
    mkdirSync(join(root, 'inbox'), { recursive: true });
    // A rough "delivery": a 300x200 orange disc on transparency.
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><circle cx="150" cy="100" r="90" fill="#e8902a"/><rect x="120" y="60" width="60" height="80" fill="#3a2a20"/></svg>';
    await sharp(Buffer.from(svg)).png().toFile(join(root, 'inbox', 'item-gauntlet.png'));
    const report = await importArt(root);
    assert.match(report.join('\n'), /item-gauntlet: → items\/gauntlet\.png/);
    const out = PNG.sync.read(readFileSync(join(root, 'src', 'items', 'gauntlet.png')));
    assert.deepEqual([out.width, out.height], [64, 64]);
    assert.ok(paletteConformity(out.data) === 1);
    assert.equal(JSON.parse(readFileSync(join(root, 'status.json'), 'utf8'))['item-gauntlet'], 'final');
    assert.ok(existsSync(join(root, 'inbox', 'preview', 'item-gauntlet.png')));
    assert.ok(existsSync(join(root, 'inbox', 'done', 'item-gauntlet.png')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('importing a room re-cuts its walk-behind pieces from the new painting', async () => {
  const root = mkdtempSync(join(tmpdir(), 'cinderfold-room-'));
  try {
    mkdirSync(join(root, 'inbox'), { recursive: true });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2416"/><stop offset="1" stop-color="#c8803a"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/></svg>';
    await sharp(Buffer.from(svg)).png().toFile(join(root, 'inbox', 'room-mara.png'));
    const report = (await importArt(root)).join('\n');
    assert.match(report, /hall-left: re-cut from room-mara/);
    const room = PNG.sync.read(readFileSync(join(root, 'src', 'rooms', 'mara-room.png')));
    assert.deepEqual([room.width, room.height], [1280, 720]);
    assert.equal(paletteConformity(room.data), 1);
    assert.ok(existsSync(join(root, 'src', 'rooms', 'mara-room.webp')));
    assert.ok(existsSync(join(root, 'src', 'foreground', 'hall-right.webp')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/** True when every GRID x GRID block of the image is one colour (the game's pixel grid). */
function onGrid(png: PNG, grid: number): boolean {
  for (let by = 0; by + grid <= png.height; by += grid) for (let bx = 0; bx + grid <= png.width; bx += grid) {
    const o0 = (by * png.width + bx) * 4;
    for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) {
      const o = ((by + y) * png.width + bx + x) * 4;
      for (let c = 0; c < 4; c++) if (png.data[o + c] !== png.data[o0 + c]) return false;
    }
  }
  return true;
}

test('a room lands on the 4x pixel grid, and a sprite on a magenta background is keyed out', async () => {
  const { GRID } = await import('../art/import.mjs');
  const root = mkdtempSync(join(tmpdir(), 'cinderfold-grid-'));
  try {
    mkdirSync(join(root, 'inbox'), { recursive: true });
    // A soft, off-grid room painting.
    const room = '<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941"><defs><radialGradient id="g"><stop offset="0" stop-color="#e09040"/><stop offset="1" stop-color="#2a1a10"/></radialGradient></defs><rect width="1672" height="941" fill="url(#g)"/><circle cx="700" cy="400" r="123" fill="#5a4a3a"/></svg>';
    await sharp(Buffer.from(room)).png().toFile(join(root, 'inbox', 'room-gallery.png'));
    // The rack's two states drawn on flat magenta instead of transparency.
    for (const state of ['full', 'empty']) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700"><rect width="600" height="700" fill="#ff00ff"/><rect x="200" y="150" width="200" height="500" fill="${state === 'full' ? '#c8a040' : '#6a5030'}"/></svg>`;
      await sharp(Buffer.from(svg)).png().toFile(join(root, 'inbox', `rack-${state}.png`));
    }
    await importArt(root);
    const r = PNG.sync.read(readFileSync(join(root, 'src', 'rooms', 'gallery.png')));
    assert.deepEqual([r.width, r.height], [1280, 720]);
    assert.ok(onGrid(r, GRID), 'the room is on the pixel grid');
    assert.equal(paletteConformity(r.data), 1);
    const rack = PNG.sync.read(readFileSync(join(root, 'src', 'objects', 'rack.png')));
    assert.ok(onGrid(rack, GRID), 'the object is on the pixel grid');
    let magenta = 0, clear = 0;
    for (let i = 0; i < rack.data.length; i += 4) {
      if (rack.data[i + 3] === 0) clear++;
      else if (rack.data[i] > 200 && rack.data[i + 1] < 80 && rack.data[i + 2] > 200) magenta++;
    }
    assert.equal(magenta, 0, 'no magenta left');
    assert.ok(clear > rack.data.length / 16, 'the background is transparent (a quarter or more of the frame)');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
