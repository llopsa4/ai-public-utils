import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadChapter } from '../src/chapters';
import { daysEarlier, mapPins } from '../src/ui/mapPins';

test('after the intro the map shows it played and Mara\'s Day 1 as the only choice, two days earlier', async () => {
  const intro = await loadChapter('intro'), ch1 = await loadChapter('ch1');
  const pins = mapPins([ch1], [intro]);
  const played = pins.filter(p => p.played), live = pins.filter(p => !p.played);
  assert.deepEqual(played.map(p => p.label), ['Silas · Day 3 · Intro']);
  assert.deepEqual(live.map(p => p.ch.id), ['ch1']);
  assert.equal(live[0].earlier, 'Two days earlier…');
  assert.match(live[0].day, /^Day 1 · /);
});

test('the time-jump line counts back from the latest played chapter', () => {
  assert.equal(daysEarlier(0), '');
  assert.equal(daysEarlier(-2), '');
  assert.equal(daysEarlier(1), 'The day before…');
  assert.equal(daysEarlier(2), 'Two days earlier…');
  assert.equal(daysEarlier(9), '9 days earlier…');
});
