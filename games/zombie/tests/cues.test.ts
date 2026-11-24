import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NOISE_DASH, barMetrics, dashSegments, hungerLabel, scaled, squadMetrics, stateCue, uiFactor } from '../src/render/cues';

test('uiFactor and scaled follow the text size and survive bad input', () => {
  assert.equal(uiFactor(100), 1);
  assert.equal(uiFactor(150), 1.5);
  assert.equal(uiFactor(NaN), 1);
  assert.equal(uiFactor(0), 1);
  assert.equal(scaled(22, 125), 28); // 27.5 rounds up
  assert.equal(scaled(15, 150), 23);
  assert.equal(scaled(15, 100), 15);
});

test('stateCue: ! when chasing or alerted, ? when investigating, searching or at a body', () => {
  assert.equal(stateCue('chase'), '!');
  assert.equal(stateCue('alert'), '!');
  assert.equal(stateCue('investigate'), '?');
  assert.equal(stateCue('search'), '?');
  assert.equal(stateCue('body'), '?');
  assert.equal(stateCue('wander'), null);
  assert.equal(stateCue('patrol'), null);
});

test('every noise kind has a style and the styles tell the kinds apart', () => {
  const kinds = ['step', 'shot', 'lure', 'alarm', 'can'] as const;
  for (const k of kinds) assert.ok(k in NOISE_DASH);
  assert.equal(NOISE_DASH.step.off, 0); // solid
  const looks = kinds.map((k) => `${NOISE_DASH[k].on}/${NOISE_DASH[k].off}`);
  assert.equal(new Set(looks).size, kinds.length);
});

test('dashSegments: a solid style returns one closed run', () => {
  const sq: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const runs = dashSegments(sq, 0, 0);
  assert.equal(runs.length, 1);
  assert.deepEqual(runs[0]![0], runs[0]![runs[0]!.length - 1]);
});

test('dashSegments: drawn lengths follow on/off and add up to the drawn share of the outline', () => {
  const sq: [number, number][] = [[0, 0], [40, 0], [40, 40], [0, 40]]; // perimeter 160
  const runs = dashSegments(sq, 10, 10);
  assert.equal(runs.length, 8); // 160 / 20
  let drawn = 0;
  for (const run of runs) {
    for (let i = 1; i < run.length; i++) drawn += Math.hypot(run[i]![0] - run[i - 1]![0], run[i]![1] - run[i - 1]![1]);
  }
  assert.ok(Math.abs(drawn - 80) < 1e-6);
});

test('dashSegments: a dash can turn a corner and degenerate input is empty', () => {
  const runs = dashSegments([[0, 0], [10, 0], [10, 10]], 15, 5);
  assert.ok(runs[0]!.length >= 3); // the first dash passes the corner at (10, 0)
  assert.deepEqual(dashSegments([], 5, 5), []);
  assert.deepEqual(dashSegments([[1, 1]], 5, 5), []);
});

test('hungerLabel is empty when fed and a word otherwise', () => {
  assert.equal(hungerLabel('ok'), '');
  assert.equal(hungerLabel('low'), 'Hungry');
  assert.equal(hungerLabel('critical'), 'Very hungry');
  assert.equal(hungerLabel('starving'), 'Starving');
});

test('barMetrics: heights grow with the text size; buttons stop where the bar still fits 1280 px', () => {
  const a = barMetrics(100, 12, 1280);
  assert.equal(a.barH, 68);
  assert.equal(a.btnW, 56); // square buttons at 100%, even with Base 1's 12
  for (const size of [100, 125, 150]) {
    for (const count of [4, 8, 12]) {
      const m = barMetrics(size, count, 1280);
      const total = m.portrait + m.gap + count * (m.btnW + m.gap) - m.gap;
      assert.ok(total <= 1280 - 80, `bar ${total}px at ${size}% with ${count}`);
      assert.ok(m.btnH >= 56 && m.barH >= 68);
    }
  }
  assert.ok(barMetrics(150, 10, 1280).barH > barMetrics(125, 10, 1280).barH);
});

test('barMetrics: the icon is 48 px at 100% and grows with the text size while the button has room', () => {
  assert.equal(barMetrics(100, 6, 1280).icon, 48);
  assert.equal(barMetrics(150, 4, 1280).icon, 72);
  assert.ok(barMetrics(150, 4, 1280).keyPx > barMetrics(100, 4, 1280).keyPx);
});

test('barMetrics: an icon never exceeds what its button can hold', () => {
  for (const size of [100, 125, 150]) {
    for (const count of [3, 6, 10, 12]) {
      const m = barMetrics(size, count, 1280);
      assert.ok(m.icon <= m.btnW && m.icon <= m.btnH, `${size}% ${count} buttons`);
      assert.ok(m.icon <= m.btnW - 8 || m.icon === 16, `${size}% ${count} buttons leave a margin`);
    }
  }
});

test('squadMetrics scale linearly and keep the panel below the HUD lines', () => {
  assert.deepEqual(squadMetrics(100), { x: 16, y: 140, w: 214, h: 50, gap: 6, portrait: 36 });
  const m = squadMetrics(150);
  assert.equal(m.y, 210);
  assert.equal(m.h, 75);
});

test('squadMetrics: a card with a hunger row is taller', () => {
  assert.equal(squadMetrics(100, true).h, 62);
  assert.equal(squadMetrics(150, true).h, 93);
});
