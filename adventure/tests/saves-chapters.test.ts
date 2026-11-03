import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CHAPTERS } from '../src/chapters';
import { migrate, READABLE_VERSIONS, SAVE_VERSION } from '../src/engine/migrations';
import { parseSave, serializeSave } from '../src/engine/saveFile';
import { applyCommand, newGame } from '../src/engine/state';

const fixture = (v: number) => readFileSync(new URL(`./fixtures/saves/v${v}.json`, import.meta.url), 'utf8');

test('saves from every older version load, upgraded to chapter 1', () => {
  for (const v of [3, 4, 5]) {
    const r = parseSave(fixture(v));
    assert.ok(r.ok, `v${v}`);
    const s = r.state;
    assert.equal(s.chapter, 'ch1');
    assert.deepEqual(s.reached, ['ch1']);
    assert.deepEqual(s.earlier, {});
    assert.equal(s.room, 'gallery');
    assert.deepEqual(s.inventory, ['gauntlet', 'notebook']);
    assert.ok(s.flags.patchFailed && s.flags.secretTally && s.flags.metHollis);
    assert.equal(s.npcs.nell!.pose, 'crouch');
    assert.deepEqual(s.looks, v === 3 ? {} : { rack: 2, 'item:gauntlet': 1 });
    if (v === 5) assert.deepEqual([s.kit.hp, s.bag.salvage, s.bag.tonics], [41, 12, 1]);
  }
  assert.deepEqual(READABLE_VERSIONS, [3, 4, 5, SAVE_VERSION]);
  assert.equal(migrate(2, {}), null);
});

test('version 6 keeps flags per chapter and round-trips', () => {
  const s = newGame();
  s.flags.kilnCold = true;
  const saved = JSON.parse(serializeSave(s));
  assert.equal(saved.version, 6);
  assert.deepEqual(saved.state.flags, { ch1: { kilnCold: true } });
  assert.equal(saved.state.earlier, undefined);
  const r = parseSave(serializeSave(s));
  assert.ok(r.ok);
  assert.deepEqual(r.state, s);
});

test('saves are checked against each chapter\'s own flags, items and rooms', () => {
  const good = JSON.parse(serializeSave(newGame()));
  for (const tamper of [
    (d: any) => { d.state.chapter = 'ch9'; },
    (d: any) => { d.state.reached = []; },
    (d: any) => { d.state.reached = ['ch1', 'ch1']; },
    (d: any) => { d.state.flags = { ch2: {} }; },
    (d: any) => { d.state.flags = { ch1: { notAFlag: true } }; },
    (d: any) => { d.state.flags = { ch1: [] }; },
    (d: any) => { d.state.inventory = ['crown']; },
    (d: any) => { d.state.room = 'moon'; },
  ]) {
    const d = structuredClone(good);
    tamper(d);
    assert.equal(parseSave(JSON.stringify(d)).ok, false, tamper.toString());
  }
});

test('a chapter change carries the kit, bag and kept items, and keeps the old flags for reading', () => {
  const s = newGame();
  s.flags.kilnCold = true;
  s.inventory = ['gauntlet', 'regulator'];
  s.looks.rack = 2;
  s.kit.hp = 30;
  s.bag.salvage = 9;
  // Chapter 1 into itself stands in for a next chapter until chapter 2 exists.
  applyCommand(s, { type: 'chapter', id: 'ch1' });
  const start = CHAPTERS.ch1.start;
  assert.equal(s.room, start.room);
  assert.deepEqual(s.flags, {});
  assert.deepEqual(s.earlier, { ch1: { kilnCold: true } });
  assert.deepEqual(s.looks, {});
  assert.deepEqual(s.inventory, ['gauntlet', 'regulator'].filter(i => CHAPTERS.ch1.keptItems.includes(i)));
  assert.deepEqual([s.kit.hp, s.bag.salvage], [30, 9]);
  assert.deepEqual(s.reached, ['ch1']);
});
