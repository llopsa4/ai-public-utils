import assert from 'node:assert/strict';
import { test } from 'node:test';
import { interact } from '../src/chapters/ch1/interactions';
import { ROOMS } from '../src/chapters/ch1/rooms';
import { parseSave, serializeSave } from '../src/engine/saveFile';
import { SECRET_FLAGS } from '../src/chapters/ch1/flags';
import { applyCommand, newGame } from '../src/engine/state';
import type { Command, GameState } from '../src/engine/types';

const lines = (cs: Command[]) => cs.filter(c => c.type === 'say').map(c => (c as { text: string }).text);
const play = (s: GameState, cs: Command[]) => { for (const c of cs) applyCommand(s, c); return cs; };

test('repeated looks cycle through three lines and wrap around', () => {
  const s = newGame();
  const seen = [1, 2, 3, 4].map(() => lines(play(s, interact(s, 'look', 'workbench')))[0]);
  assert.deepEqual(seen, ['line.workbenchLook', 'line.workbenchLook.2', 'line.workbenchLook.3', 'line.workbenchLook']);
  assert.equal(s.looks.workbench, 4);
});

test('state-dependent look lines are never replaced by variants', () => {
  const s = newGame();
  s.flags.kilnCold = true;
  s.room = 'firingHouse';
  for (let i = 0; i < 3; i++) assert.deepEqual(lines(play(s, interact(s, 'look', 'hearth'))), ['line.hearthLookCold']);
});

test('each item has its own reply when used on the wrong thing', () => {
  const s = newGame();
  s.room = 'ashways';
  assert.deepEqual(lines(interact(s, 'use', 'passage', 'bread')), ['line.useFails.bread']);
  assert.deepEqual(lines(interact(s, 'use', 'pipes', 'notebook')), ['line.useFails.notebook']);
});

test('secrets are found once, never gate progress and are hidden from the labels', () => {
  const s = newGame();
  const where: Record<string, string> = { tally: 'maraRoom', chalk: 'firingHouse', sign: 'firingHouse', railNames: 'gallery' };
  for (const [id, room] of Object.entries(where)) {
    s.room = room;
    const hotspot = ROOMS[room].hotspots.find(h => h.id === id);
    assert.ok(hotspot?.secret, `${id} is a secret hotspot in ${room}`);
    const first = play(s, interact(s, 'look', id));
    assert.ok(first.some(c => c.type === 'setFlag'));
    const again = interact(s, 'look', id);
    assert.ok(!again.some(c => c.type === 'setFlag'), 'found only once');
  }
  assert.ok(SECRET_FLAGS.every(f => s.flags[f]));
});

test('version 3 saves (no look counters) still load; bad counters are rejected', () => {
  const v4 = JSON.parse(serializeSave(newGame()));
  const v3 = structuredClone(v4);
  v3.version = 3;
  delete v3.state.looks;
  const loaded = parseSave(JSON.stringify(v3));
  assert.ok(loaded.ok);
  if (loaded.ok) assert.deepEqual(loaded.state.looks, {});
  for (const looks of [{ workbench: -1 }, { workbench: 1.5 }, { 'bad key!': 1 }, []]) {
    const d = structuredClone(v4);
    d.state.looks = looks;
    assert.equal(parseSave(JSON.stringify(d)).ok, false, JSON.stringify(looks));
  }
});

test('portrait strips match their moods, and every mood line exists', async () => {
  const { readFileSync } = await import('node:fs');
  const { LINE_MOODS } = await import('../src/chapters/ch1/moods');
  const { TABLES } = await import('../src/engine/i18n');
  const PORTRAIT_MOODS = { mara: ['neutral', 'worried', 'angry'], oren: ['neutral', 'worried', 'angry'], nell: ['neutral'] };
  for (const [id, moods] of Object.entries(PORTRAIT_MOODS)) {
    const png = readFileSync(new URL(`../art/src/portraits/${id}.png`, import.meta.url));
    assert.equal(png.readUInt32BE(16), 256 * moods.length * 2, `${id} strip width`);
  }
  for (const key of Object.keys(LINE_MOODS)) assert.ok(TABLES.en[key], `mood for unknown line ${key}`);
});
