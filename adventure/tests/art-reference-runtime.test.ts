import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ArtEntry } from '../art/manifest.mjs';
import { runtimeDimensions, runtimeReference } from '../scripts/art-reference-runtime';

test('Silas references use current targets, cage registration and Silas scale', async () => {
  const spec = await runtimeReference('intro');
  assert.equal(spec.private, false);
  assert.deepEqual(spec.rooms.map(r => r.id), ['cell', 'guardroom', 'outerDoor']);
  const cell = spec.rooms[0];
  assert.equal(cell.assetId, 'room-cell');
  assert.equal(cell.title, 'Cell');
  assert.ok(cell.backgroundVariants?.some(v => v.assetId === 'room-cell-bare' && v.condition.includes('tookCloak')));
  assert.ok(cell.targets?.some(t => t.id === 'floorWax'));
  assert.ok(cell.targets?.some(t => t.id === 'tableStub'));
  assert.ok(!cell.targets?.some(t => t.id === 'stub'));
  const gate = spec.assets.find(a => a.id === 'cell-gate')!;
  assert.deepEqual([gate.width, gate.height], [176, 324]);
  assert.deepEqual([gate.placements[0].x, gate.placements[0].y], [366, 676]);
  assert.equal(gate.classification, 'target');
  assert.deepEqual(gate.states.map(s => s.id), ['closed', 'open']);
  const cage = spec.assets.find(a => a.id === 'cell-cage')!;
  assert.equal(cage.classification, 'foreground');
  assert.equal(cage.anchor, 'top-left');
  assert.deepEqual([cage.placements[0].x, cage.placements[0].y], [0, 0]);
  assert.match(spec.rules!.join('\n'), /Silas, 220 art pixels/);
  assert.match(cell.notes!.join('\n'), /room-cell-bare.*tookCloak/);
});

test('reference dimensions keep the atlas source canvas rather than its trimmed rectangle', async () => {
  const root = mkdtempSync(join(tmpdir(), 'reference-size-'));
  try {
    mkdirSync(join(root, 'art/src'), { recursive: true });
    writeFileSync(join(root, 'art/src/padded.json'), JSON.stringify({ frames: [
      { frame: { x: 0, y: 0, w: 12, h: 20 }, sourceSize: { w: 176, h: 324 } },
    ] }));
    const asset = { id: 'padded', kind: 'object', sheet: 'padded.json', file: 'unused.png' } as ArtEntry;
    assert.deepEqual(await runtimeDimensions(asset, root), { width: 176, height: 324 });
  } finally {
    assert.ok(root.startsWith(join(tmpdir(), 'reference-size-')));
    rmSync(root, { recursive: true, force: true });
  }
});

test('unknown implemented chapter requests fail instead of generating an unrelated chapter', async () => {
  await assert.rejects(runtimeReference('does-not-exist'), /Unknown implemented chapter/);
});
