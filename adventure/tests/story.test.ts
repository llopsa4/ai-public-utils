import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAPTERS, chapter, loadAllChapters } from '../src/chapters';

await loadAllChapters();
import { afterRelease } from '../src/chapters/ch1/interactions';
import { conditionsHold } from '../src/engine/geometry';
import { ambienceFor, crowdMoodFor, guided, heroSheetFor, hushed, musicFor, onEnter, type StoryContext } from '../src/engine/story';
import { newGame } from '../src/engine/state';
import { goldenStates } from './golden';

// Chapter 1's story rules must answer exactly what the scene used to work out in code.
test('chapter 1 story rules match the scene\'s old choices in every room and stage', () => {
  const { story, rooms } = chapter();
  for (const { state } of goldenStates()) {
    for (const room of Object.values(rooms)) {
      const cold = room.coldIf ? conditionsHold(state, room.coldIf) : false;
      const ctx: StoryContext = { state: { ...state, room: room.id }, room, cold };
      const f = state.flags;
      assert.equal(musicFor(story, ctx), f.fought ? 'nervous' : cold ? 'cold' : room.music ?? 'warm');
      assert.equal(ambienceFor(story, ctx), room.id === 'ashways' ? 'wind' : cold ? 'cold' : 'kiln');
      assert.equal(crowdMoodFor(story, ctx), cold ? 'cold' : f.alarm ? 'alarm' : 'warm');
      assert.equal(hushed(story, ctx), !!f.fought);
      assert.equal(guided(story, ctx), !f.fought);
      assert.equal(heroSheetFor(story, ctx), f.hasGauntlet ? 'mara-gauntlet' : 'mara-casual');
      assert.deepEqual(onEnter(story, ctx), room.id === 'gallery' && f.kilnCold ? afterRelease(f) : []);
    }
  }
});

test('every chapter is complete: start room, flags, strings for its title', () => {
  for (const c of Object.values(CHAPTERS)) {
    assert.ok(c.rooms[c.start.room]?.entries[c.start.entry], `${c.id} start`);
    for (const i of c.keptItems) assert.ok(c.items.includes(i), `${c.id} kept item ${i}`);
    for (const f of [...c.secretFlags, ...c.metFlags]) assert.ok(c.flags.includes(f), `${c.id} flag ${f}`);
    // Each secret has Mara's note for the notebook.
    for (const f of c.secretFlags) assert.ok(c.strings[`note.${f}`], `${c.id} notebook note for ${f}`);
    assert.ok(c.strings[c.title], `${c.id} title string`);
  }
  assert.equal(newGame().room, chapter().start.room);
});
