import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ROOMS } from '../src/chapters/ch1/rooms';
import { pointInPolygon } from '../src/engine/geometry';
import { COLD_GRADE, NEUTRAL_GRADE, addLight, gradeMatrix, lerpGrade, localLight, mixColor } from '../src/engine/lighting';
import { defaultSettings, parseSettings } from '../src/engine/settings';

/** Applies a colour matrix to an RGB colour in 0..1. */
const apply = (m: number[], [r, g, b]: number[]) => [0, 1, 2].map(row => m[row * 5] * r + m[row * 5 + 1] * g + m[row * 5 + 2] * b + m[row * 5 + 3] + m[row * 5 + 4]);
const close = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

test('the neutral grade changes nothing; saturation 0 is grey; warmth warms', () => {
  const colour = [0.8, 0.4, 0.2];
  assert.ok(close(apply(gradeMatrix(NEUTRAL_GRADE), colour), colour));
  const grey = apply(gradeMatrix({ ...NEUTRAL_GRADE, saturation: 0 }), colour);
  assert.ok(Math.abs(grey[0] - grey[1]) < 1e-9 && Math.abs(grey[1] - grey[2]) < 1e-9);
  const warm = apply(gradeMatrix({ ...NEUTRAL_GRADE, warmth: 1 }), [0.5, 0.5, 0.5]);
  assert.ok(warm[0] > 0.5 && warm[2] < 0.5);
  const cold = apply(gradeMatrix(COLD_GRADE), [0.8, 0.5, 0.3]);
  assert.ok(cold[2] - cold[0] > -0.3, 'the cold grade pulls warm colours toward blue');
});

test('grades blend smoothly from warm to cold', () => {
  const mid = lerpGrade(NEUTRAL_GRADE, COLD_GRADE, 0.5);
  assert.equal(mid.saturation, (1 + COLD_GRADE.saturation) / 2);
  assert.deepEqual(lerpGrade(NEUTRAL_GRADE, COLD_GRADE, 2), COLD_GRADE);
});

test('characters warm up near glows, and warm glows go out with the cold', () => {
  const kiln = [{ x: 100, y: 100, r: 30, color: 0xff8a2a, warm: true }];
  const near = localLight({ x: 110, y: 100 }, kiln, 0);
  const far = localLight({ x: 300, y: 100 }, kiln, 0);
  assert.ok(near[0] > 0.1 && near[0] > near[2]);
  assert.deepEqual(far, [0, 0, 0]);
  assert.deepEqual(localLight({ x: 110, y: 100 }, kiln, 1), [0, 0, 0]);
  assert.ok(near.every(v => v <= 0.45), 'light is capped');
  assert.equal(addLight(0x808080, [0, 0, 0]), 0x808080);
  assert.ok(((addLight(0x808080, near) >> 16) & 255) > 0x80);
  assert.equal(mixColor(0x000000, 0xffffff, 0.5), 0x808080);
});

test('room looks are valid: hazes and shafts on screen, reflections on walkable floor', () => {
  for (const room of Object.values(ROOMS)) {
    const look = room.look;
    if (!look) continue;
    for (const h of look.haze ?? []) assert.ok(h.x >= 0 && h.y >= 0 && h.x + h.w <= 640 && h.y + h.h <= 360, `${room.id} haze off screen`);
    for (const s of look.shafts ?? []) assert.ok(s.x >= 0 && s.x <= 640 && s.y >= 0 && s.y <= 360, `${room.id} shaft origin off screen`);
    if (look.reflective) {
      const inside = room.walkable.outer.filter(p => pointInPolygon({ x: p.x, y: p.y - 1 }, look.reflective!.polygon));
      assert.ok(inside.length > 0 || look.reflective.polygon.length >= 3, `${room.id} reflection polygon`);
    }
  }
});

test('visual quality defaults to Low on touch screens and only accepts known values', () => {
  assert.equal(defaultSettings(false, true).visualQuality, 'low');
  assert.equal(defaultSettings(false, false).visualQuality, 'high');
  assert.equal(parseSettings({ visualQuality: 'ultra' }, defaultSettings()).visualQuality, 'high');
  assert.equal(parseSettings({ visualQuality: 'low' }, defaultSettings()).visualQuality, 'low');
});
