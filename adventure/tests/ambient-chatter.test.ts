import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chatterDuration, placeChatter } from '../src/ui/ambientChatter';

test('ambient phrases keep the existing minimum reading time and give long remarks more time', () => {
  assert.equal(chatterDuration('Enough.'), 2600);
  assert.ok(chatterDuration('The pressure is dropping. We should stop working before the whole kiln goes cold.') > 4000);
});

test('floating phrases remain inside the stage at every edge and drift upward without scattering words', () => {
  for (const stage of [{ width: 1280, height: 720 }, { width: 800, height: 450 }]) {
    for (const anchor of [{ x: 0, y: 0 }, { x: stage.width, y: 0 }, { x: 0, y: stage.height }, { x: stage.width, y: stage.height }]) {
      for (const progress of [0, 0.1, 0.5, 0.9, 1]) {
        const box = placeChatter(anchor, { width: 280, height: 48 }, stage, progress, false);
        assert.ok(box.x >= 4 && box.y >= 4);
        assert.ok(box.x + 280 <= stage.width - 4 && box.y + 48 <= stage.height - 4);
        assert.ok(box.opacity >= 0 && box.opacity <= 1);
      }
    }
  }
  const start = placeChatter({ x: 400, y: 240 }, { width: 160, height: 24 }, { width: 800, height: 450 }, 0.1, false);
  const end = placeChatter({ x: 400, y: 240 }, { width: 160, height: 24 }, { width: 800, height: 450 }, 0.9, false);
  assert.ok(end.y < start.y);
});

test('reduced motion keeps complete ambient phrases stationary while fading', () => {
  const frame = (progress: number) => placeChatter({ x: 400, y: 240 }, { width: 160, height: 24 }, { width: 800, height: 450 }, progress, true);
  assert.deepEqual([frame(0.1).x, frame(0.1).y], [frame(0.9).x, frame(0.9).y]);
  assert.equal(frame(0).opacity, 0);
  assert.equal(frame(0.5).opacity, 1);
  assert.equal(frame(1).opacity, 0);
});
