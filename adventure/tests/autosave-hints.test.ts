import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OBJECTIVE_KEYS } from '../src/chapters/ch1/objectives';
import { clearAutosave, readAutosave, writeAutosave } from '../src/engine/autosave';
import { TABLES } from '../src/engine/i18n';
import { newGame } from '../src/engine/state';

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v); },
    removeItem: (k: string) => { data.delete(k); },
  };
}

test('autosave round-trips a game through the browser slot', () => {
  const store = memoryStore();
  assert.deepEqual(readAutosave(store), { kind: 'none' });
  const s = newGame();
  s.flags.hasGauntlet = true;
  s.inventory.push('gauntlet');
  assert.ok(writeAutosave(s, store));
  const read = readAutosave(store);
  assert.equal(read.kind, 'ok');
  if (read.kind === 'ok') assert.deepEqual(read.state, s);
  clearAutosave(store);
  assert.deepEqual(readAutosave(store), { kind: 'none' });
});

test('a damaged or foreign autosave is reported and never loaded', () => {
  const store = memoryStore();
  store.setItem('cinderfold.autosave', '{not json');
  assert.deepEqual(readAutosave(store), { kind: 'corrupt' });
  store.setItem('cinderfold.autosave', JSON.stringify({ format: 'cinderfold-save', version: 1, state: {} }));
  assert.deepEqual(readAutosave(store), { kind: 'corrupt' });
  const s = newGame();
  writeAutosave(s, store);
  const tampered = JSON.parse(store.data.get('cinderfold.autosave')!);
  tampered.state.flags.flying = true;
  store.setItem('cinderfold.autosave', JSON.stringify(tampered));
  assert.deepEqual(readAutosave(store), { kind: 'corrupt' });
});

test('a blocked storage never throws', () => {
  const blocked = {
    getItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('denied'); },
    removeItem: () => { throw new Error('denied'); },
  };
  assert.equal(writeAutosave(newGame(), blocked), false);
  assert.deepEqual(readAutosave(blocked), { kind: 'none' });
  clearAutosave(blocked);
});

test('every required notebook goal has a nudge and a plain hint', () => {
  for (const key of OBJECTIVE_KEYS) {
    if (key === 'obj.goodbye') continue;
    for (const stage of [1, 2]) assert.ok(TABLES.en[`hint.${key.slice(4)}.${stage}`], `missing hint.${key.slice(4)}.${stage}`);
  }
});
