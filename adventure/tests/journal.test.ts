import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAPTERS, loadChapter, setChapter } from '../src/chapters';
import { PLACES } from '../src/content/world';
import { TABLES } from '../src/engine/i18n';
import { newGame } from '../src/engine/state';
import { dayLine, diary, mapState } from '../src/ui/journalData';

test('every chapter is set on a day, with its time, place, viewpoint and diary written', async () => {
  await loadChapter('ch2');
  for (const ch of Object.values(CHAPTERS)) {
    assert.ok(ch.when.day >= 1 && ch.when.day <= 5, `${ch.id} is on one of the five days`);
    for (const key of [ch.when.time, ch.when.place, ch.when.viewpoint, ...ch.diary.map(e => e.key)]) assert.ok(TABLES.en[key], `${ch.id}: missing ${key}`);
    for (const e of ch.diary) for (const f of e.after) assert.ok(ch.flags.includes(f), `${ch.id}: diary flag ${f}`);
    assert.equal(ch.diary[0].after.length, 0, `${ch.id}: the diary has an entry from the start`);
  }
  assert.equal(dayLine(CHAPTERS.ch1), 'Day 1 · Morning · Cinderfold');
  assert.equal(dayLine(CHAPTERS.ch2), 'Day 2 · Dawn · The service tunnels');
});

test('the diary grows with the story and keeps earlier chapters under their day', async () => {
  await loadChapter('ch2');
  setChapter('ch1');
  const s = newGame();
  const lines = () => diary(s).flatMap(d => d.chapters.flatMap(c => c.entries));
  assert.deepEqual(diary(s).map(d => d.day), [1]);
  assert.equal(lines().length, 1, 'a new game: only the morning');
  Object.assign(s.flags, { hoistHelped: true, nellFed: true });
  assert.equal(lines().length, 3);
  assert.ok(!lines().some(l => l.includes('First Hearth')), 'nothing he has not heard of yet');
  Object.assign(s.flags, { latchFixed: true, patchFailed: true, decided: true });
  assert.ok(lines().some(l => l.includes('First Hearth')));

  // On Day 2, Day 1's entries stay (from the flags chapter 1 ended with), then Day 2's begin.
  const ch1Flags = { ...s.flags, kilnCold: true, fought: true, ashwaysWon: true };
  setChapter('ch2');
  s.chapter = 'ch2';
  s.earlier = { ch1: ch1Flags };
  s.flags = {};
  s.room = 'tunnelMouth';
  const days = diary(s);
  assert.deepEqual(days.map(d => d.day), [1, 2]);
  assert.equal(days[0].chapters[0].entries.length, 9, 'the morning and eight milestones');
  assert.equal(days[1].chapters[0].entries.length, 1);
  assert.match(days[0].chapters[0].heading, /Morning, Cinderfold\. Mara/);
  setChapter('ch1');
});

test('the map marks where the viewpoint is and names only the places known', async () => {
  await loadChapter('ch2');
  setChapter('ch1');
  const s = newGame();
  assert.deepEqual(mapState(s), { at: 'cinderfold', known: ['cinderfold', 'ashways'] });
  s.flags.decided = true;
  assert.ok(mapState(s).known.includes('firstHearth'), 'Oren names the First Hearth');
  s.room = 'ashways';
  assert.equal(mapState(s).at, 'ashways');

  setChapter('ch2');
  Object.assign(s, { chapter: 'ch2', earlier: { ch1: { ...s.flags } }, flags: {}, room: 'tunnelSteam' });
  let m = mapState(s);
  assert.equal(m.at, 'tunnels');
  assert.ok(['cinderfold', 'ashways', 'firstHearth', 'tunnels'].every(p => m.known.includes(p)), 'earlier places stay known');
  assert.ok(!m.known.includes('temperingHouse') && !m.known.includes('ironhaven'));
  s.room = 'workshop';
  m = mapState(s);
  assert.equal(m.at, 'temperingHouse');
  assert.ok(m.known.includes('temperingHouse'));
  for (const p of Object.values(PLACES)) assert.ok(TABLES.en[p.name], `missing ${p.name}`);
  setChapter('ch1');
});
