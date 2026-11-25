import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  type AtmosModel,
  DRIZZLE,
  FOG_ALPHA,
  LIGHT_DAY,
  MAX_DROPS,
  RAIN_AT_HERD,
  duskLevel,
  flicker,
  fogBlobs,
  lightStrength,
  lightsOnScreen,
  rainDrops,
  rainLevel,
} from '../src/render/atmos';
import { HERD_ARRIVE_TICK, HERD_COUNT, HERD_WARN_TICK } from '../src/sim/base';

// Z60: the atmosphere's rules (DESIGN §20). The drawing is checked in the browser.

const W = HERD_WARN_TICK;
const A = HERD_ARRIVE_TICK;

test('dusk is none until the warning, deepens to the herd\'s arrival and then holds', () => {
  assert.equal(duskLevel(0, W, A), 0);
  assert.equal(duskLevel(W, W, A), 0);
  const mid = duskLevel((W + A) / 2, W, A);
  assert.ok(mid > 0.4 && mid < 0.6);
  assert.equal(duskLevel(A, W, A), 1);
  assert.equal(duskLevel(A + 5000, W, A), 1);
  let last = 0;
  for (let t = W; t <= A; t += 10) {
    const d = duskLevel(t, W, A);
    assert.ok(d >= last, 'dusk never lightens');
    last = d;
  }
});

test('the herd warning and arrival are the 5:00 and 7:00 of Base 1', () => {
  assert.equal(HERD_WARN_TICK / 10, 300);
  assert.equal(HERD_ARRIVE_TICK / 10, 420);
});

test('rain starts as a drizzle at the warning, is steady at the herd\'s arrival and full once it is in', () => {
  assert.equal(rainLevel(W - 1, W, A, 0, HERD_COUNT), 0);
  assert.equal(rainLevel(W, W, A, 0, HERD_COUNT), DRIZZLE);
  assert.ok(Math.abs(rainLevel(A - 1, W, A, 0, HERD_COUNT) - RAIN_AT_HERD) < 0.01);
  assert.equal(rainLevel(A, W, A, 0, HERD_COUNT), RAIN_AT_HERD);
  assert.ok(rainLevel(A + 100, W, A, HERD_COUNT / 2, HERD_COUNT) > RAIN_AT_HERD);
  assert.equal(rainLevel(A + 600, W, A, HERD_COUNT, HERD_COUNT), 1);
});

test('rain levels only ever grow with time and with the herd entering', () => {
  let last = 0;
  for (let t = 0; t <= A + 700; t += 20) {
    const spawned = t < A ? 0 : Math.min(HERD_COUNT, Math.floor((t - A) / 50));
    const r = rainLevel(t, W, A, spawned, HERD_COUNT);
    assert.ok(r >= last && r <= 1);
    last = r;
  }
});

test('the fire flickers inside a narrow band, differently for different phases, and is repeatable', () => {
  let min = 9;
  let max = 0;
  for (let ms = 0; ms < 20000; ms += 7) {
    const f = flicker(ms);
    min = Math.min(min, f);
    max = Math.max(max, f);
  }
  assert.ok(min >= 0.8 && max <= 1.2);
  assert.ok(max - min > 0.1, 'it visibly moves');
  assert.equal(flicker(1234, 1), flicker(1234, 1));
  assert.notEqual(flicker(1234, 0), flicker(1234, 2));
});

test('light pools glow faintly by day and fully at the deepest dusk', () => {
  assert.equal(lightStrength(0), LIGHT_DAY);
  assert.equal(lightStrength(1), 1);
  assert.equal(lightStrength(5), 1);
  assert.equal(lightStrength(-1), LIGHT_DAY);
});

test('a light pool lands under its world point, flat like the ground and scaled by the zoom', () => {
  const m: AtmosModel = { dusk: 0, rain: 0, fog: 0, lights: [{ x: 500, y: 300, r: 100, phase: 0 }], centre: [500, 300], zoom: 2 };
  const [l] = lightsOnScreen(m, 0, 800, 600);
  assert.equal(l!.x, 400);
  assert.equal(l!.y, 300);
  assert.equal(l!.rx, 200);
  assert.equal(l!.ry, 100);
  const off = lightsOnScreen({ ...m, centre: [600, 300] }, 0, 800, 600)[0]!;
  assert.equal(off.x, 200); // the camera moved right by 100 world px: the pool moves left by 200 screen px
});

test('fog is light, drifts, stays near the screen and is empty at level 0', () => {
  assert.deepEqual(fogBlobs(1000, 1280, 720, 0), []);
  const a = fogBlobs(0, 1280, 720, 1);
  const b = fogBlobs(5000, 1280, 720, 1);
  assert.equal(a.length, 7);
  for (const f of a) assert.ok(f.a > 0 && f.a <= FOG_ALPHA, 'light enough for cones to read');
  assert.ok(a.some((f, i) => f.x !== b[i]!.x), 'it drifts');
  for (const f of [...a, ...b]) assert.ok(f.x >= -f.rx && f.x <= 1280 + f.rx);
  assert.ok(fogBlobs(0, 1280, 720, 0.5)[0]!.a < a[0]!.a);
});

test('rain streaks scale with the level, fall over time and stay on a bounded screen', () => {
  assert.equal(rainDrops(0, 0, 1280, 720).length, 0);
  assert.equal(rainDrops(0, 1, 1280, 720).length, MAX_DROPS * 4);
  assert.ok(rainDrops(0, 0.25, 1280, 720).length < rainDrops(0, 0.75, 1280, 720).length);
  const a = rainDrops(0, 1, 1280, 720);
  const b = rainDrops(400, 1, 1280, 720);
  assert.notDeepEqual(a, b);
  for (let i = 0; i < b.length; i += 4) {
    assert.ok(b[i + 3]! > b[i + 1]!, 'each streak points down');
    assert.ok(b[i + 1]! >= -30 && b[i + 1]! <= 720);
  }
  assert.deepEqual(rainDrops(0, 7, 1280, 720), a); // levels past 1 are capped
});
