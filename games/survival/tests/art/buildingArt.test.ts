// The building frame picks (stage, winter, barricade mask, rack and flame loops) name frames a delivery would hold.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { expectedFrames } from '../../scripts/art/lib.mjs';
import { barricadeMask, buildingFrame, buildingState, flameFrame, loopFrame } from '../../src/render/buildingArt';
import { manifest } from '../../src/render/manifest';

test('stage follows build progress: 34% and 67% are the limits', () => {
  assert.equal(buildingState(0, 50, false, false), 'stage1');
  assert.equal(buildingState(16, 50, false, false), 'stage1');
  assert.equal(buildingState(17, 50, false, false), 'stage2');
  assert.equal(buildingState(33, 50, false, false), 'stage2');
  assert.equal(buildingState(34, 50, false, false), 'stage3');
  assert.equal(buildingState(49, 50, false, false), 'stage3');
  assert.equal(buildingState(50, 50, true, false), 'finished');
  assert.equal(buildingState(50, 50, true, true), 'winter');
  // winter does not change a building still being built
  assert.equal(buildingState(10, 50, false, true), 'stage1');
});

test('a barricade mask adds NE 1, SE 2, SW 4, NW 8 for each neighbouring barricade', () => {
  const at = (...tiles: [number, number][]) => (x: number, y: number) => tiles.some(([a, b]) => a === x && b === y);
  assert.equal(barricadeMask(at(), 5, 5), 0);
  assert.equal(barricadeMask(at([5, 4]), 5, 5), 1);
  assert.equal(barricadeMask(at([6, 5]), 5, 5), 2);
  assert.equal(barricadeMask(at([5, 6]), 5, 5), 4);
  assert.equal(barricadeMask(at([4, 5]), 5, 5), 8);
  assert.equal(barricadeMask(at([5, 4], [5, 6]), 5, 5), 5, 'a straight NE-SW line');
  assert.equal(barricadeMask(at([5, 4], [6, 5], [5, 6], [4, 5]), 5, 5), 15);
  assert.equal(barricadeMask(at([4, 4], [6, 6]), 5, 5), 0, 'diagonal neighbours are ignored');
});

test('every building key and state gives a frame the delivery holds', () => {
  for (const [key, e] of Object.entries(manifest)) {
    if (!e.states || !(key.startsWith('building_') || key === 'fire_central')) continue;
    const names = new Set(expectedFrames(key, e).map((f) => f.name));
    for (const state of ['stage1', 'stage2', 'stage3', 'finished', 'winter']) {
      for (const mask of key === 'building_barricade' ? [0, 5, 15] : [0]) {
        for (const ms of [0, 250, 900]) {
          const frame = buildingFrame(key, state, mask, ms);
          assert.ok(names.has(frame), `${key} ${state}: ${frame} is not an expected frame`);
        }
      }
    }
  }
});

test('the fire has only finished and winter art, so it shows finished while built', () => {
  assert.equal(buildingFrame('fire_central', 'winter'), 'fire_central/winter/00');
  assert.equal(buildingFrame('fire_central', 'finished'), 'fire_central/finished/00');
  assert.equal(buildingFrame('fire_central', 'stage1'), 'fire_central/finished/00');
});

test('the barricade picks its piece by mask, the rack loops, the flame loops', () => {
  assert.equal(buildingFrame('building_barricade', 'stage2', 5), 'building_barricade/stage2/5');
  assert.equal(buildingFrame('building_barricade', 'winter', 12), 'building_barricade/winter/12');
  assert.equal(buildingFrame('building_tipi', 'stage3'), 'building_tipi/stage3/00');
  assert.equal(buildingFrame('building_drying_rack', 'finished', 0, 0), 'building_drying_rack/finished/00');
  assert.equal(buildingFrame('building_drying_rack', 'finished', 0, 300), 'building_drying_rack/finished/01');
  assert.equal(buildingFrame('building_drying_rack', 'winter', 0, 1000), 'building_drying_rack/winter/00', '4 frames at 4 fps wrap in a second');
  assert.equal(buildingFrame('building_drying_rack', 'stage1', 0, 5000), 'building_drying_rack/stage1/00', 'a stage is a still');
  assert.equal(loopFrame(8, 10, 100), 1);
  assert.equal(flameFrame(0), 'fx_flame/loop/00');
  assert.equal(flameFrame(790), 'fx_flame/loop/07');
  assert.equal(flameFrame(800), 'fx_flame/loop/00');
  assert.equal(loopFrame(4, 4, 0, 1), 1, 'a phase moves the start');
});
