import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CHAPTERS, loadChapter } from '../src/chapters';
import { migrate, READABLE_VERSIONS, SAVE_VERSION } from '../src/engine/migrations';
import { parseSave, serializeSave } from '../src/engine/saveFile';
import { applyCommand, newGame } from '../src/engine/state';
import { maraProfile } from '../src/content/kit';

const fixture = (v: number) => readFileSync(new URL(`./fixtures/saves/v${v}.json`, import.meta.url), 'utf8');

test('version 7 chapter 1 saves gain Tobi without changing learned techniques or supplies', () => {
  const s = newGame();
  applyCommand(s, { type: 'learn', technique: 'tempered-flow' });
  s.inventory = ['gauntlet', 'bread', 'scarf'];
  s.bag.salvage = 17;
  const legacy = JSON.parse(serializeSave(s));
  legacy.version = 7;
  delete legacy.state.npcs.tobi;
  const r = parseSave(JSON.stringify(legacy));
  assert.ok(r.ok);
  assert.deepEqual(r.state.npcs, { ...s.npcs, tobi: { pose: 'stand', face: 'right' } });
  assert.deepEqual(r.state.kit, s.kit);
  assert.deepEqual(r.state.bag, s.bag);
  assert.deepEqual(r.state.inventory, s.inventory);
  for (const npcs of [null, [], { nell: legacy.state.npcs.nell }, { ...legacy.state.npcs, stranger: { pose: 'stand', face: 'left' } }]) {
    const invalid = structuredClone(legacy);
    invalid.state.npcs = npcs;
    assert.equal(parseSave(JSON.stringify(invalid)).ok, false, 'migration keeps malformed casts invalid');
  }
});

test('version 7 chapter 2 saves keep Bryn as their only NPC', async () => {
  await loadChapter('ch2');
  const s = newGame('ch2');
  applyCommand(s, { type: 'learn', technique: 'tempered-flow' });
  const legacy = JSON.parse(serializeSave(s));
  legacy.version = 7;
  const r = parseSave(JSON.stringify(legacy));
  assert.ok(r.ok);
  assert.deepEqual(r.state, s);
  assert.deepEqual(Object.keys(r.state.npcs), ['bryn']);
});

test('saves from every older version load, upgraded to chapter 1', () => {
  for (const v of [3, 4, 5, 6, 7, 8]) {
    const r = parseSave(fixture(v));
    assert.ok(r.ok, `v${v}`);
    const s = r.state;
    assert.equal(s.chapter, 'ch1');
    assert.deepEqual(s.reached, ['ch1']);
    assert.deepEqual(s.earlier, {});
    assert.equal(s.room, 'gallery');
    assert.deepEqual(s.inventory, ['gauntlet', 'notebook']);
    assert.ok(s.flags.patchFailed && s.flags.secretTally && s.flags.metHollis);
    assert.equal(s.flags.gearUnlocked, true, 'old Oren contact keeps Gear available');
    assert.equal(s.flags.protectionPrepared, undefined, 'old games before shutdown still receive preparation');
    assert.equal(s.npcs.nell!.pose, 'crouch');
    assert.deepEqual(s.npcs.tobi, { pose: 'stand', face: 'right' });
    assert.deepEqual(s.looks, v === 3 ? {} : { rack: 2, 'item:gauntlet': 1 });
    if (v >= 5) assert.deepEqual([s.kit.hp, s.bag.salvage, s.bag.tonics], [41, 12, 1]);
    // Format 7: no techniques yet, the starting limits.
    assert.deepEqual([s.kit.techniques, s.kit.maxHp, s.kit.maxMp], [[], 60, 10]);
  }
  assert.deepEqual(READABLE_VERSIONS, [3, 4, 5, 6, 7, 8, 9, SAVE_VERSION]);
  assert.equal(migrate(2, {}), null);
});

test('the current version keeps flags per chapter and round-trips', () => {
  const s = newGame();
  s.flags.kilnCold = true;
  const saved = JSON.parse(serializeSave(s));
  assert.equal(saved.version, SAVE_VERSION);
  assert.deepEqual(saved.state.flags, { ch1: { kilnCold: true } });
  assert.equal(saved.state.earlier, undefined);
  const r = parseSave(serializeSave(s));
  assert.ok(r.ok);
  assert.deepEqual(r.state, s);
});

test('version 8 preparation migration preserves old Gear access and never rewinds completed shutdowns', () => {
  const cases: Record<string, boolean>[] = [{}, { metOren: true }, { kilnCold: true }, { fought: true }, { gearChecked: true }];
  for (const flags of cases) {
    const s = newGame();
    s.room = 'gallery';
    s.flags = { ...flags };
    s.kit.owned.push('layered-armor');
    const old = JSON.parse(serializeSave(s));
    old.version = 8;
    const r = parseSave(JSON.stringify(old));
    assert.ok(r.ok);
    const advanced = !!(flags.kilnCold || flags.fought || flags.gearChecked);
    assert.equal(!!r.state.flags.gearUnlocked, !!flags.metOren || advanced);
    assert.equal(!!r.state.flags.protectionPrepared, advanced);
    for (const [flag, value] of Object.entries(flags)) assert.equal(r.state.flags[flag], value);
    assert.equal(r.state.room, s.room);
    assert.deepEqual(r.state.kit, s.kit, 'migration never grants or equips armour');
    assert.deepEqual(r.state.inventory, s.inventory);
    assert.deepEqual(r.state.bag, s.bag);
  }
});

test('version 8 later-chapter saves retain Bryn, kit and progress while upgrading earlier chapter flags', async () => {
  await loadChapter('ch2');
  const s = newGame('ch2');
  s.reached = ['ch1', 'ch2'];
  s.earlier = { ch1: { metOren: true, kilnCold: true, gearChecked: true } };
  s.flags.sat = true;
  applyCommand(s, { type: 'learn', technique: 'tempered-flow' });
  const old = JSON.parse(serializeSave(s));
  old.version = 8;
  const r = parseSave(JSON.stringify(old));
  assert.ok(r.ok);
  assert.deepEqual(r.state.earlier.ch1, { ...s.earlier.ch1, gearUnlocked: true, protectionPrepared: true,
    hoistHelped:true,nellFed:true,boltLeft:true,boltRight:true,pressureBled:true,ringReleased:true,galleryQuiet:true,
    ashwaysStarted:true,ashwaysExploded:true,ashwaysWon:true,ashwaysAftermath:true,ashwaysRewarded:true });
  assert.deepEqual({ ...r.state, earlier: s.earlier }, s);
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

test('a teacher passes on a technique once: the card changes and the limits grow, and saves keep it', () => {
  const s = newGame();
  s.kit.hp = 50;
  applyCommand(s, { type: 'learn', technique: 'tempered-flow' });
  applyCommand(s, { type: 'learn', technique: 'tempered-flow' });
  assert.deepEqual([s.kit.techniques, s.kit.maxHp, s.kit.hp, s.kit.maxMp, s.kit.mp], [['tempered-flow'], 66, 56, 12, 12]);
  const profile = maraProfile(s.kit);
  assert.equal(profile.maxHp, 66);
  assert.deepEqual(profile.deck.filter(c => c.upgrade).map(c => [c.type, c.upgrade]), [['pulse', 'tempered-flow']]);
  const r = parseSave(serializeSave(s));
  assert.ok(r.ok);
  assert.deepEqual(r.state.kit, s.kit);
  // Limits that don't match the techniques learned are rejected.
  const d = JSON.parse(serializeSave(s));
  d.state.kit.maxHp = 90;
  assert.equal(parseSave(JSON.stringify(d)).ok, false);
});
