import assert from 'node:assert/strict';
import { test } from 'node:test';
import { barIconKey, cursorArtFor, cursorCss, hudIconKey, isFinal, nineSlice, portraitKey, smallPortraitKey, uiGroup, uiItem, uiOf, UI_NAMES } from '../src/render/ui';

// Z53: the UI art contract in art/manifest.json `ui` (no Phaser).

test('the manifest holds every UI item the plan names', () => {
  assert.equal(uiGroup('kit').length, 12);
  assert.equal(uiGroup('icon_bar').length, 16);
  assert.equal(uiGroup('icon_hud').length, 8);
  assert.equal(uiGroup('cursor').length, 5);
  assert.equal(uiGroup('portrait').length, 8);
  assert.equal(uiGroup('portrait_small').length, 4);
  assert.equal(uiGroup('title').length, 2);
  assert.equal(new Set(UI_NAMES).size, UI_NAMES.length);
});

test('display sizes follow the brief (kit and icons at 2x, cursors and title at 1x)', () => {
  assert.deepEqual(uiOf('kit_panel').display, [48, 48]);
  assert.deepEqual(uiOf('kit_tooltip').display, [32, 32]);
  assert.deepEqual(uiOf('kit_slider_track').display, [64, 12]);
  assert.deepEqual(uiOf('kit_slider_knob').display, [16, 20]);
  assert.deepEqual(uiOf('kit_check_on').display, [20, 20]);
  assert.deepEqual(uiOf('icon_bar_knife').display, [48, 48]);
  assert.deepEqual(uiOf('icon_hud_food').display, [24, 24]);
  assert.deepEqual(uiOf('portrait_fighter_hurt').display, [128, 128]);
  assert.deepEqual(uiOf('portrait_small_scout_neutral').display, [36, 36]);
  assert.deepEqual(uiOf('cursor_select').display, [32, 32]);
  assert.deepEqual(uiOf('title_bg').display, [640, 360]);
  assert.equal(uiOf('cursor_attack').packed, false);
  assert.equal(uiOf('kit_panel').packed, true);
});

test('insets fit inside their pieces and cursor hot spots inside their images', () => {
  for (const name of UI_NAMES) {
    const it = uiOf(name);
    if (it.inset) {
      const [l, t, r, b] = it.inset;
      assert.ok(l + r < it.display[0] && t + b <= it.display[1], `${name} insets`);
    }
    if (it.group === 'cursor') {
      assert.ok(it.hotspot && it.hotspot[0] < it.size[0] && it.hotspot[1] < it.size[1], `${name} hotspot`);
    } else {
      assert.equal(it.hotspot, null, name);
    }
  }
  assert.ok(uiOf('kit_panel').inset && uiOf('kit_slider_track').inset);
  assert.equal(uiOf('kit_slider_knob').inset, null);
});

test('key lookups', () => {
  assert.equal(barIconKey('knife'), 'icon_bar_knife');
  assert.equal(barIconKey('nope'), null);
  assert.equal(hudIconKey('herd'), 'icon_hud_herd');
  assert.equal(portraitKey('fighter', 'afraid'), 'portrait_fighter_afraid');
  assert.equal(smallPortraitKey('scout', true), 'portrait_small_scout_hurt');
  assert.equal(smallPortraitKey('scout', false), 'portrait_small_scout_neutral');
  for (const who of ['fighter', 'scout'] as const) for (const m of ['neutral', 'afraid', 'determined', 'hurt'] as const) assert.ok(uiItem(portraitKey(who, m)), `${who} ${m}`);
  assert.throws(() => uiOf('kit_nonsense'), /No UI item/);
});

test('nineSlice: a 48x48 panel stretched to 200x80 keeps its corners and covers the target exactly', () => {
  const parts = nineSlice('kit_panel', 200, 80);
  assert.equal(parts.length, 9);
  const corner = parts[0];
  assert.deepEqual(corner.dst, { x: 0, y: 0, w: 12, h: 12 });
  assert.deepEqual(corner.src, { x: 0, y: 0, w: 24, h: 24 }); // source px: 12 display px x 2
  const middle = parts[4];
  assert.deepEqual(middle.dst, { x: 12, y: 12, w: 176, h: 56 });
  assert.deepEqual(middle.src, { x: 24, y: 24, w: 48, h: 48 });
  const area = parts.reduce((n, p) => n + p.dst.w * p.dst.h, 0);
  assert.equal(area, 200 * 80);
  const last = parts[8];
  assert.deepEqual(last.dst, { x: 188, y: 68, w: 12, h: 12 });
});

test('nineSlice: the slider track is a 3-slice, and the text-size factor grows only the corners', () => {
  const track = nineSlice('kit_slider_track', 160, 12);
  assert.equal(track.length, 3);
  assert.deepEqual(track.map((p) => p.dst.w), [6, 148, 6]);
  assert.ok(track.every((p) => p.dst.h === 12));
  const big = nineSlice('kit_panel', 200, 80, 1.5);
  assert.deepEqual(big[0].dst, { x: 0, y: 0, w: 18, h: 18 });
  assert.equal(big.reduce((n, p) => n + p.dst.w * p.dst.h, 0), 200 * 80);
});

test('nineSlice: a target smaller than its corners shrinks them instead of overlapping', () => {
  const parts = nineSlice('kit_panel', 16, 16);
  const area = parts.reduce((n, p) => n + p.dst.w * p.dst.h, 0);
  assert.equal(area, 16 * 16);
  for (const p of parts) assert.ok(p.dst.w >= 0 && p.dst.h >= 0);
});

test('painted cursors use their hotspot and fall back if there is no image URL', () => {
  assert.equal(cursorArtFor('pointer'), 'cursor_select');
  assert.equal(cursorArtFor('crosshair'), 'cursor_attack');
  assert.equal(cursorArtFor('default'), null);
  const url = (name: string) => `/img/${name}.png`;
  assert.equal(cursorCss('pointer', url), 'url("/img/cursor_select.png") 6 3, pointer');
  assert.equal(cursorCss('pointer', () => undefined), 'pointer');
  assert.equal(cursorCss('default', url), 'default');
  assert.equal(isFinal('icon_bar_knife'), true);
});
