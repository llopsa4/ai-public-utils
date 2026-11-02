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
