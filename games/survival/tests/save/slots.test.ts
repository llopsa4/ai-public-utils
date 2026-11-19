import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clearSlot, firstEmptySlot, importSlot, listSlots, probe, readSlot, slotKey, writeSlot,
  type SlotStorage,
} from '../../src/save/slots';
import { serialize } from '../../src/sim/save';
import { newGame, step } from '../../src/sim/tick';

/** A Storage in memory; `data` is visible so tests can check the keys. */
function memory(): SlotStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

/** A blocked or full browser store: every call throws. */
const throwing: SlotStorage = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('full'); },
  removeItem: () => { throw new Error('blocked'); },
};

function aSave(ticks = 0, seed = 1): string {
  const s = newGame(seed);
  step(s, ticks);
  return serialize(s);
}

test('keys are campfire.slot.1 to 3', () => {
  assert.equal(slotKey(1), 'campfire.slot.1');
  assert.equal(slotKey(3), 'campfire.slot.3');
});

test('write, read, clear and list three slots', () => {
  const st = memory();
  assert.deepEqual(listSlots(st).map((i) => i.status), ['empty', 'empty', 'empty']);

  const text = aSave(1200);
  assert.equal(writeSlot(st, 2, text), true);
  assert.equal(readSlot(st, 2), text, 'the stored text is exactly the save text');
  assert.ok(st.data.has('campfire.slot.2'));

  const list = listSlots(st);
  assert.deepEqual(list.map((i) => i.status), ['empty', 'filled', 'empty']);
  const filled = list[1];
  assert.ok(filled.status === 'filled');
  assert.deepEqual(filled.summary, { day: 2, people: 20, seed: 1 });

  assert.equal(clearSlot(st, 2), true);
  assert.equal(readSlot(st, 2), null);
  assert.deepEqual(listSlots(st).map((i) => i.status), ['empty', 'empty', 'empty']);
});

test('an unreadable save is listed as unreadable and is not touched', () => {
  const st = memory();
  st.setItem(slotKey(1), '{"format":"camp-fire-save","version":0}');
  st.setItem(slotKey(3), 'garbage');
  assert.deepEqual(listSlots(st).map((i) => i.status), ['unreadable', 'empty', 'unreadable']);
  assert.equal(st.getItem(slotKey(3)), 'garbage');
});

test('import goes into an empty slot only, and only a readable file', () => {
  const st = memory();
  const text = aSave();
  assert.equal(importSlot(st, 1, text), 'ok');
  assert.equal(readSlot(st, 1), text);

  assert.equal(importSlot(st, 1, aSave(0, 2)), 'filled');
  assert.equal(readSlot(st, 1), text, 'the filled slot keeps its camp');

  assert.equal(importSlot(st, 2, 'not a save'), 'unreadable');
  assert.equal(readSlot(st, 2), null, 'the slot stays empty');

  st.setItem(slotKey(3), 'garbage');
  assert.equal(importSlot(st, 3, text), 'filled', 'an unreadable save still blocks import');
});

test('the first empty slot, or none when all are filled', () => {
  const st = memory();
  assert.equal(firstEmptySlot(st), 1);
  writeSlot(st, 1, aSave());
  writeSlot(st, 2, aSave());
  assert.equal(firstEmptySlot(st), 3);
  writeSlot(st, 3, aSave());
  assert.equal(firstEmptySlot(st), null);
});

test('probe writes and removes campfire.probe', () => {
  const st = memory();
  assert.equal(probe(st), true);
  assert.equal(st.data.size, 0);
  assert.equal(probe(null), false);
});

test('a storage that throws reports unavailable', () => {
  assert.equal(probe(throwing), false);
  assert.equal(writeSlot(throwing, 1, aSave()), false);
  assert.equal(clearSlot(throwing, 1), false);
  assert.deepEqual(listSlots(throwing).map((i) => i.status), ['unavailable', 'unavailable', 'unavailable']);
  assert.equal(importSlot(throwing, 1, aSave()), 'unavailable');
  assert.equal(firstEmptySlot(throwing), null);
});

test('a full storage: reads still work, writes report failure', () => {
  const st = memory();
  writeSlot(st, 1, aSave());
  const full: SlotStorage = { getItem: st.getItem, removeItem: st.removeItem, setItem: throwing.setItem };
  assert.equal(writeSlot(full, 1, aSave()), false);
  assert.equal(listSlots(full)[0].status, 'filled');
  assert.equal(importSlot(full, 2, aSave()), 'unavailable');
});
