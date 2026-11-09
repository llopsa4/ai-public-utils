import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAPTERS, loadChapterOf } from '../src/chapters';
import { parseSave, serializeSave } from '../src/engine/saveFile';
import { newGame } from '../src/engine/state';

// New game plays the intro (Silas), then Mara's chapter 1 from the chapter map: Mara's saves
// remember the intro. Reading one at start-up must load the intro first (it loads on demand).
test("a save in Mara's chapter 1 after the intro loads the intro before it is read", async () => {
  const s = newGame('ch1');
  s.reached = ['intro', 'ch1'];
  s.earlier = { intro: { cellLit: true, metSigrid: true } };
  const text = serializeSave(s);
  assert.ok(!CHAPTERS.intro, 'the intro is not loaded yet');
  assert.equal(parseSave(text).ok, false, 'unreadable while the intro is unknown');
  await loadChapterOf(text);
  const read = parseSave(text);
  assert.ok(read.ok, 'readable once loadChapterOf has loaded every chapter it reached');
  if (read.ok) assert.deepEqual(read.state.earlier.intro, { cellLit: true, metSigrid: true });
});
