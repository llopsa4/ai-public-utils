import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TITLE, titleStage } from '../src/audio/music';

// The title theme (src/audio/music.ts): an endless 16-bar arc of four stages, one chord cycle each.
test('the title theme builds, peaks and releases over 16 bars, then starts again', () => {
  assert.equal(TITLE.bars, 16);
  assert.deepEqual(Array.from({ length: 16 }, (_, b) => titleStage(b)), [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]);
  assert.equal(titleStage(16), 1);
  // D minor: Dm, B♭, F, C over warm's root, left hanging on C.
  assert.equal(TITLE.root, 146.83);
  assert.equal(TITLE.chords.length, 4);
  assert.ok(TITLE.bpm > 50 && TITLE.bpm < 126, 'faster than warm, slower than the fight');
});
