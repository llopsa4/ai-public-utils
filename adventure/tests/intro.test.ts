import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAPTER_IDS, loadChapter, setChapter } from '../src/chapters';
import { heroIdentity } from '../src/chapters/hero';
import { resolveNode } from '../src/engine/dialogue';
import { newGame } from '../src/engine/state';
import { openChapters } from '../src/engine/unlock';
import type { GameState } from '../src/engine/types';
import { enterStoryRoom, interactStory, runStoryCommands, type StoryOptions } from './support/story-driver';

const INTRO = await loadChapter('intro');
await loadChapter('ch1');
setChapter('intro');

/** Picks dialogue choices by node: the first listed choice whose next node is offered. */
const choosing = (prefer: string[]): StoryOptions => ({
  choose: next => prefer.find(p => next.includes(p)) ?? (() => { throw new Error(`no preferred choice among ${next.join(', ')}`); })(),
});
const good = choosing(['scolded', 'warm', 'palmed', 'tally', 'kitchen', 'clerk']);

function play(s: GameState, verb: Parameters<typeof interactStory>[1], target: string, item?: string, options: StoryOptions = good) {
  return interactStory(s, verb, target, item, options);
}

/** The cell, up to Silas wearing Harrow's face. */
function toHarrow(): GameState {
  const s = newGame('intro');
  enterStoryRoom(s, good);
  play(s, 'take', 'plate');
  play(s, 'use', 'window', 'plate');
  assert.ok(s.flags.cellLit, 'the plate throws the moonlight');
  play(s, 'take', 'cot');
  play(s, 'take', 'cot');
  play(s, 'use', 'item:nail', 'strip');
  play(s, 'use', 'table', 'hookLine');
  assert.ok(s.inventory.includes('frame'), 'the frame is fished off the table');
  play(s, 'look', 'roster');
  play(s, 'take', 'wall');
  play(s, 'use', 'bucket', 'plaster');
  play(s, 'use', 'item:wetPlaster', 'crust');
  play(s, 'use', 'item:frame', 'putty');
  assert.ok(s.inventory.includes('maskHarrow'));
  play(s, 'use', 'hero', 'maskHarrow');
  assert.ok(s.flags.wearingHarrow);
  return s;
}

test('the intro comes first in the order of play, and opens only Mara 1 once done', () => {
  assert.equal(CHAPTER_IDS[0], 'intro');
  assert.deepEqual(openChapters([]), []);
  assert.deepEqual(openChapters(['intro']), ['ch1']);
  assert.deepEqual(openChapters(['intro', 'ch1']), ['ch2']);
});

test('the cell is dark until Silas lights it, and far things only show once lit', () => {
  const s = newGame('intro');
  assert.equal(s.room, 'cell');
  assert.ok(INTRO.rooms.cell.dark);
  assert.deepEqual(play(s, 'use', 'table', 'hookLine').spoken, ['line.i.fishDark']);
});

test('the full escape: Harrow fools Benn, the clerk fools Kell, Sigrid waits, then the chapter map', () => {
  const s = toHarrow();
  assert.equal(heroIdentity(s).name, 'speaker.harrow', 'the mask gives his persona');
  play(s, 'read', 'guard');
  const talk = play(s, 'talk', 'guard');
  assert.ok(s.flags.guardGone && s.inventory.includes('keys'), 'Benn goes up; Silas palms his keys');
  assert.ok(talk.spoken.includes('line.i.afterGuardKeys'));
  assert.equal(heroIdentity(s).name, 'speaker.silas', 'the cracked mask comes off');
  play(s, 'use', 'cellDoor', 'keys');
  assert.ok(s.flags.cellOpen);
  play(s, 'go', 'cellDoor');
  assert.equal(s.room, 'guardroom');
  play(s, 'read', 'warden');
  assert.deepEqual(play(s, 'talk', 'warden').spoken, ['line.i.notAsMyself']);
  play(s, 'take', 'hood');
  play(s, 'take', 'ledger');
  play(s, 'use', 'item:hood', 'ledger');
  play(s, 'use', 'hero', 'maskClerk');
  assert.equal(heroIdentity(s).name, 'speaker.clerk');
  play(s, 'talk', 'warden');
  assert.ok(s.flags.wardenBusy);
  play(s, 'use', 'grate', 'nail');
  assert.ok(s.flags.grateOpen);
  const out = play(s, 'go', 'grate');
  assert.equal(s.room, 'outerDoor');
  assert.ok(s.flags.metSigrid);
  assert.equal(out.stopped, 'chooseChapter');
});

test('marked choices stay hidden until Silas has read the guard', () => {
  const s = toHarrow();
  const tree = INTRO.dialogues.guard;
  const unread = resolveNode(tree, 'hub1', s).choices;
  assert.ok(!unread.some(c => c.read), 'no read choice before reading him');
  s.flags.readGuard = true;
  const read = resolveNode(tree, 'hub1', s).choices;
  assert.ok(read.some(c => c.read && c.next === 'scolded'));
});

test('three wrong notes and Benn sees through him; Silas starts the confrontation again', () => {
  const s = toHarrow();
  assert.equal(INTRO.story.suspicion?.(s), null, 'no eye before the guard is awake');
  const result = play(s, 'talk', 'guard', undefined, choosing(['keysAsk', 'friend']));
  assert.ok(result.spoken.includes('line.i.caught.guard'));
  assert.ok(!s.flags.gSus1 && !s.flags.gSus2 && !s.flags.gSus3 && !s.flags.guardAwake, 'suspicion forgotten');
  assert.ok(s.flags.wearingHarrow && !s.flags.guardGone, 'back at the checkpoint, mask still on');
  // And it can be won the second time.
  play(s, 'read', 'guard');
  play(s, 'talk', 'guard');
  assert.ok(s.flags.guardGone);
});

test('without the keys, the bent nail picks the cell lock once Benn has gone', () => {
  const s = toHarrow();
  play(s, 'read', 'guard');
  play(s, 'talk', 'guard', undefined, choosing(['scolded', 'warm', 'dismissed']));
  assert.ok(s.flags.guardGone && !s.inventory.includes('keys'));
  play(s, 'use', 'cellDoor', 'nail');
  assert.ok(s.flags.cellOpen);
});

test('Kell catches a clerk who strikes the wrong note three times, and the eye counts it', () => {
  const s = newGame('intro');
  Object.assign(s.flags, { cellLit: true, guardGone: true, cellOpen: true, sawWarden: true, readWarden: true, wearingClerk: true });
  s.room = 'guardroom';
  s.inventory = ['nail', 'maskClerk'];
  assert.equal(INTRO.story.suspicion?.(s), 0);
  const r = runStoryCommands(s, [{ type: 'dialogue', id: 'warden' }], choosing(['passing', 'orders']));
  assert.ok(r.spoken.includes('line.i.caught.warden'));
  assert.equal(INTRO.story.suspicion?.(s), 0);
});

test("every line the intro can say has a string", () => {
  const keys = new Set(Object.keys(INTRO.strings));
  const said = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === 'string' && /^(line\.i|dlgI)\./.test(v)) said.add(v);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(INTRO.dialogues);
  for (const verb of ['look', 'talk', 'read', 'use', 'take', 'open', 'go'] as const) {
    for (const room of Object.values(INTRO.rooms)) for (const h of room.hotspots) walk(INTRO.interact(newGame('intro'), verb, h.id));
  }
  for (const k of said) assert.ok(keys.has(k), `missing string ${k}`);
});
