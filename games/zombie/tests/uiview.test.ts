import assert from 'node:assert/strict';
import test from 'node:test';
import { uiItem } from '../src/render/ui';
import { ammoCount, barIcon, buttonFrame, layoutCounters, lootCounters, plainName, tooltipBox, tooltipText } from '../src/render/uiview';

test('barIcon: every action bar button id the game builds has an icon item', () => {
  const ids = ['weapon:knife', 'weapon:pistol', 'weapon:club', 'takedown', 'carry', 'lure', 'hold', 'freefire', 'crouch', 'eat', 'give', 'fix', 'cook', 'build', 'spike', 'can'];
  for (const id of ids) {
    const icon = barIcon(id);
    assert.ok(icon && uiItem(icon), `${id} -> ${icon}`);
  }
  assert.equal(barIcon('weapon:pistol'), 'icon_bar_gun');
  assert.equal(barIcon('build'), 'icon_bar_barricade');
  assert.equal(barIcon('nothing'), null);
  assert.equal(barIcon('weapon:bow'), null);
});

test('ammoCount and plainName read the count off a weapon label', () => {
  assert.equal(ammoCount('Gun 3'), 3);
  assert.equal(ammoCount('Gun 0'), 0);
  assert.equal(ammoCount('Knife'), null);
  assert.equal(ammoCount('Free fire'), null);
  assert.equal(plainName('Gun 12'), 'Gun');
  assert.equal(plainName('Spike pit'), 'Spike pit');
});

test('buttonFrame: disabled beats pressed, pressed beats active, active beats hover', () => {
  const on = { enabled: true, active: false, hover: false, down: false };
  assert.equal(buttonFrame(on), 'kit_button_normal');
  assert.equal(buttonFrame({ ...on, hover: true }), 'kit_button_hover');
  assert.equal(buttonFrame({ ...on, active: true, hover: true }), 'kit_button_active');
  assert.equal(buttonFrame({ ...on, active: true, down: true }), 'kit_button_pressed');
  assert.equal(buttonFrame({ ...on, enabled: false, active: true, hover: true, down: true }), 'kit_button_disabled');
  for (const f of ['normal', 'hover', 'pressed', 'disabled', 'active']) assert.ok(uiItem(`kit_button_${f}`), f);
});

test('tooltipText: the name, then the key in brackets', () => {
  assert.equal(tooltipText('Gun 3', '2'), 'Gun  [2]');
  assert.equal(tooltipText('Hold', 'V'), 'Hold  [V]');
  assert.equal(tooltipText('Hold', ''), 'Hold');
});

test('tooltipBox: centred above the button, clamped to the screen, below when there is no room above', () => {
  const btn = { x: 600, y: 660, w: 56, h: 56 };
  assert.deepEqual(tooltipBox(btn, 100, 24, 1280), { x: 578, y: 630, w: 100, h: 24 });
  assert.equal(tooltipBox({ x: 0, y: 660, w: 56, h: 56 }, 100, 24, 1280).x, 8);
  assert.equal(tooltipBox({ x: 1250, y: 660, w: 56, h: 56 }, 100, 24, 1280).x, 1280 - 8 - 100);
  const low = tooltipBox({ x: 600, y: 10, w: 56, h: 56 }, 100, 24, 1280);
  assert.equal(low.y, 10 + 56 + 6);
});

test('lootCounters: a fixed order, missing counters left out, every icon is a real item', () => {
  const m = lootCounters({ ammo: 3, food: 4, scrap: 5, crates: { opened: 1, total: 4 }, zombies: 2 });
  assert.deepEqual(m.map((c) => c.text), ['3', '4', '5', '1/4', '2']);
  assert.deepEqual(m.map((c) => c.icon), ['icon_hud_ammo', 'icon_hud_food', 'icon_hud_scrap', 'icon_hud_crate', 'icon_hud_zombie']);
  const base = lootCounters({ ammo: 1, food: 2, scrap: 3, herd: 'Herd in 3:20' });
  assert.deepEqual(base.map((c) => c.text), ['1', '2', '3', 'Herd in 3:20']);
  assert.equal(base[3].icon, 'icon_hud_herd');
  assert.deepEqual(lootCounters({ ammo: 0 }).map((c) => c.text), ['0']);
  assert.equal(lootCounters({ ammo: 1, herd: '' }).length, 1);
  for (const c of [...m, ...base]) assert.ok(c.icon && uiItem(c.icon), String(c.icon));
});

test('layoutCounters: icon, pad, text, gap, next; the row width is where the last text ends', () => {
  const widthOf = (t: string): number => t.length * 10;
  const row = layoutCounters(
    [
      { icon: 'icon_hud_ammo', text: '12' },
      { icon: 'icon_hud_food', text: '3' },
    ],
    widthOf, 24, 30, 6, 20,
  );
  assert.deepEqual(row.items[0].icon, { x: 0, y: 3, w: 24, h: 24 });
  assert.deepEqual(row.items[0].text, { x: 30, y: 0 });
  assert.deepEqual(row.items[1].icon, { x: 70, y: 3, w: 24, h: 24 });
  assert.deepEqual(row.items[1].text, { x: 100, y: 0 });
  assert.equal(row.width, 110);
  const bare = layoutCounters([{ icon: null, text: 'abc' }], widthOf, 24, 30, 6, 20);
  assert.equal(bare.items[0].icon, null);
  assert.equal(bare.width, 30);
  assert.deepEqual(layoutCounters([], widthOf, 24, 30, 6, 20), { items: [], width: 0 });
});
