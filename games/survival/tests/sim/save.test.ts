import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SAVE_VERSION, loadState, parseSave, serialize, type SaveFile } from '../../src/sim/save';
import type { GameState } from '../../src/sim/state';
import { newGame, step } from '../../src/sim/tick';

function readable(text: string): SaveFile {
  const parsed = parseSave(text);
  assert.ok(parsed.ok, parsed.ok ? '' : parsed.reason);
  return parsed.save;
}

/** Everything the sim decides: playback and the toast list are the player's, not the camp's. */
function simPart(s: GameState) {
  return { ...s, paused: false, speed: 1, messages: [], orders: [] };
}

test('serialize then parseSave gives an equal state with orders and messages empty', () => {
  const s = newGame(1);
  step(s, 300);
  s.orders.push({ type: 'pause', on: true });
  s.messages.push({ tick: 5, text: 'hello' });
  const save = readable(serialize(s, new Date('2026-11-19T18:04:00.000Z')));
  assert.equal(save.savedAt, '2026-11-19T18:04:00.000Z');
  assert.deepEqual(save.summary, { day: 1, people: s.people.length, seed: 1 });
  assert.deepEqual(save.state, { ...s, orders: [], messages: [] });
  assert.equal(s.orders.length, 1, 'serialize does not change the live state');
  assert.equal(s.messages.length, 1);
});

test('loading starts paused at 1x with empty orders and messages', () => {
  const s = newGame(1);
  s.speed = 4;
  s.paused = false;
  const loaded = loadState(readable(serialize(s)));
  assert.equal(loaded.paused, true);
  assert.equal(loaded.speed, 1);
  assert.deepEqual(loaded.orders, []);
  assert.deepEqual(loaded.messages, []);
});

test('saved, loaded and stepped equals the same run never saved (2500 + 1000 = 3500)', () => {
  const whole = newGame(1);
  step(whole, 3500);

  const first = newGame(1);
  step(first, 2500);
  const loaded = loadState(readable(serialize(first)));
  step(loaded, 1000);

  assert.deepEqual(simPart(loaded), simPart(whole));
});

test('summary day is the tick divided by 1200, plus one', () => {
  const s = newGame(1);
  s.tick = 1200;
  assert.equal(readable(serialize(s)).summary.day, 2);
});

test('unreadable saves are refused', () => {
  const s = newGame(1);
  const good = JSON.parse(serialize(s));

  assert.equal(parseSave('{not json').ok, false);
  assert.equal(parseSave('[]').ok, false);
  assert.equal(parseSave(JSON.stringify({ ...good, format: 'other' })).ok, false);
  assert.equal(parseSave(JSON.stringify({ ...good, version: SAVE_VERSION + 1 })).ok, false);
  assert.equal(parseSave(JSON.stringify({ ...good, version: SAVE_VERSION - 1 })).ok, false);

  const shortTiles = structuredClone(good);
  shortTiles.state.map.tiles.pop();
  assert.equal(parseSave(JSON.stringify(shortTiles)).ok, false);

  const shortBlocked = structuredClone(good);
  shortBlocked.state.blocked.pop();
  assert.equal(parseSave(JSON.stringify(shortBlocked)).ok, false);

  const noRng = structuredClone(good);
  delete noRng.state.rng;
  assert.equal(parseSave(JSON.stringify(noRng)).ok, false);

  const noPemmican = structuredClone(good);
  delete (noPemmican.state.store as Partial<typeof noPemmican.state.store>).pemmican;
  assert.equal(parseSave(JSON.stringify(noPemmican)).ok, false, 'a version 1 style store');

  const noGift = structuredClone(good);
  delete noGift.state.gift;
  assert.equal(parseSave(JSON.stringify(noGift)).ok, false, 'a version 2 style state');

  const badUpgrades = structuredClone(good);
  badUpgrades.state.upgrades = 'dogs';
  assert.equal(parseSave(JSON.stringify(badUpgrades)).ok, false);

  const noStore = structuredClone(good);
  noStore.state.store.hides = 'lots';
  assert.equal(parseSave(JSON.stringify(noStore)).ok, false);

  s.result = 'won';
  assert.equal(parseSave(serialize(s)).ok, false, 'a finished run');
  s.result = 'lost';
  assert.equal(parseSave(serialize(s)).ok, false, 'a finished run');
});
