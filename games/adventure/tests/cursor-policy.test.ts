import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sceneCursorKind } from '../src/ui/cursorPolicy';

test('empty scenery uses the game default while scene targets keep their specialized cursors', () => {
  assert.equal(sceneCursorKind(null, false), 'default');
  for (const kind of ['hand', 'look', 'talk', 'exit'] as const) {
    assert.equal(sceneCursorKind(kind, false), kind);
  }
});

test('carrying an item keeps the hand cursor alongside its separate item image', () => {
  for (const kind of [null, 'hand', 'look', 'talk', 'exit'] as const) {
    assert.equal(sceneCursorKind(kind, true), 'hand');
  }
  assert.equal(sceneCursorKind('exit', false), 'exit', 'cancelling restores ordinary target cues');
});
