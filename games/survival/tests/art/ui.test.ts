// The interface's pure rules: which frame a surface shows, which cursor shows, and the cursors' hotspots and CSS.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cursorCss, cursorHotspot, pickCursor, type CursorContext } from '../../src/render/cursorLogic';
import { surfaceFrame } from '../../src/render/uiLogic';

test('a button shows normal, hover, pressed or disabled; active and held read as pressed; panels and bars have one frame', () => {
  assert.equal(surfaceFrame('button', 'normal', false, false), 'ui_button/normal');
  assert.equal(surfaceFrame('button', 'normal', true, false), 'ui_button/hover');
  assert.equal(surfaceFrame('button', 'normal', true, true), 'ui_button/pressed');
  assert.equal(surfaceFrame('button', 'active', true, false), 'ui_button/pressed');
  assert.equal(surfaceFrame('button', 'disabled', true, true), 'ui_button/disabled');
  assert.equal(surfaceFrame('panel', 'active', true, true), 'ui_panel');
  assert.equal(surfaceFrame('bar', 'normal', false, false), 'ui_bar_frame');
});

const base: CursorContext = { overUi: false, placing: false, placeOk: true, aiming: false, hasSelection: false, hasDrafted: false, overEnemy: false };

test('the cursor follows what a click would do', () => {
  assert.equal(pickCursor(base), 'pointer');
  assert.equal(pickCursor({ ...base, hasSelection: true }), 'move');
  assert.equal(pickCursor({ ...base, hasSelection: true, overEnemy: true }), 'move');
  assert.equal(pickCursor({ ...base, hasSelection: true, hasDrafted: true, overEnemy: true }), 'attack');
  assert.equal(pickCursor({ ...base, placing: true }), 'build');
  assert.equal(pickCursor({ ...base, placing: true, placeOk: false }), 'invalid');
  assert.equal(pickCursor({ ...base, aiming: true }), 'attack');
  assert.equal(pickCursor({ ...base, placing: true, hasSelection: true, overUi: true }), 'pointer');
});

test('hotspots match the spec table (px at 1x)', () => {
  assert.deepEqual(cursorHotspot('pointer'), [2, 2]);
  assert.deepEqual(cursorHotspot('move'), [16, 28]);
  assert.deepEqual(cursorHotspot('attack'), [16, 16]);
  assert.deepEqual(cursorHotspot('build'), [6, 28]);
  assert.deepEqual(cursorHotspot('invalid'), [16, 16]);
});

test('the CSS cursor is an image-set with a hotspot and a fallback', () => {
  assert.equal(cursorCss('a.png', 'b.png', [2, 2]), 'image-set(url("a.png") 1x, url("b.png") 2x) 2 2, default');
  assert.equal(cursorCss('a.png', null, [16, 28], 'pointer'), 'url("a.png") 16 28, pointer');
});
