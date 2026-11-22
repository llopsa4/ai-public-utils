// defaultFrame names a frame the validator expects, for every real key that has final-art frames (not legacy keys).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { expectedFrames } from '../../scripts/art/lib.mjs';
import { defaultFrame } from '../../src/render/frames';
import { manifest } from '../../src/render/manifest';

test('every non-legacy key has a default frame that the delivery would contain', () => {
  for (const [key, e] of Object.entries(manifest)) {
    if (e.legacy) continue;
    const names = new Set(expectedFrames(key, e).map((f) => f.name));
    assert.ok(names.has(defaultFrame(key)), `${key}: ${defaultFrame(key)} is not an expected frame`);
  }
});

test('default frames follow the spec examples', () => {
  assert.equal(defaultFrame('tile_grass'), 'tile_grass/summer/0');
  assert.equal(defaultFrame('building_tipi'), 'building_tipi/finished/00');
  assert.equal(defaultFrame('icon_food'), 'icon_food');
  assert.equal(defaultFrame('ui_button'), 'ui_button/normal');
});
