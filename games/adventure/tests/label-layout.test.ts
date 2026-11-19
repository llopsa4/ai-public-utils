import assert from 'node:assert/strict';
import { test } from 'node:test';
import { overlaps, placeLabels } from '../src/ui/labelLayout';

test('nearby object labels keep every name with a four-pixel gap', () => {
  const boxes = placeLabels([
    { x: 90, y: 80, width: 100, height: 22 },
    { x: 100, y: 83, width: 88, height: 22 },
    { x: 95, y: 85, width: 110, height: 22 },
  ], { width: 320, height: 180 });
  assert.equal(boxes.length, 3);
  assert.equal(boxes[0].displaced, false);
  assert.ok(boxes[1].displaced);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    assert.equal(overlaps(boxes[i], boxes[j]), false);
  }
});

test('edge labels and wrapped long names remain inside resized stages', () => {
  for (const width of [640, 320, 240]) {
    const boxes = placeLabels([
      { x: 0, y: 0, width: Math.min(220, width - 8), height: 44 },
      { x: width, y: 175, width: 150, height: 44 },
    ], { width, height: 180 });
    for (const box of boxes) {
      assert.ok(box.x >= 4 && box.y >= 4);
      assert.ok(box.x + box.width <= width - 4);
      assert.ok(box.y + box.height <= 176);
      assert.ok(box.displaced);
    }
    assert.equal(overlaps(boxes[0], boxes[1]), false);
  }
});

test('layout is stable and leaves separated labels at their targets', () => {
  const targets = [{ x: 45, y: 30, width: 50, height: 20 }, { x: 200, y: 90, width: 70, height: 20 }];
  const first = placeLabels(targets, { width: 320, height: 180 });
  assert.ok(first.every(box => !box.displaced));
  assert.deepEqual(first, placeLabels(targets, { width: 320, height: 180 }));
});
