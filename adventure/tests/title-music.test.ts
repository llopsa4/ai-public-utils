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

test('the Ashlands reveal builds for four bars, hits on the fifth, and settles before the warm music takes over', async () => {
  const { REVEAL_TIMING, TITLE } = await import('../src/audio/music');
  const bar = (60 / TITLE.bpm) * 4;
  assert.equal(REVEAL_TIMING.hit, bar * 4, '"The Rift" on the downbeat of bar 5');
  assert.ok(REVEAL_TIMING.subtitle > REVEAL_TIMING.hit && REVEAL_TIMING.subtitle < REVEAL_TIMING.fadeOut, '"Ashlands" fades in after it');
  assert.ok(REVEAL_TIMING.fadeOut < REVEAL_TIMING.end && REVEAL_TIMING.end < 25, 'the map within about 25 seconds');
});
