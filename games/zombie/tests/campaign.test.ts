import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkpointOf, createBase, stepBase } from '../src/sim/base';
import {
  SAVE_KEY,
  SCENES,
  STAGES,
  TITLES,
  type StorageLike,
  clearSave,
  hasSlot,
  loadCampaign,
  newCampaign,
  parseSave,
  replayBase1,
  saveCampaign,
  toBase1,
  toDone,
  toMission1,
  withCassGun,
  withCheckpoint,
} from '../src/sim/campaign';

/** An in-memory stand-in for localStorage. */
function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

test('a new campaign starts at the Intro and every stage has a scene and a title', () => {
  const c = newCampaign();
  assert.equal(c.stage, 'intro');
  assert.deepEqual([...STAGES], ['intro', 'mission1', 'base1', 'done']);
  assert.deepEqual(STAGES.map((s) => SCENES[s]), ['Intro', 'Mission', 'Base', null]); // done has no scene
  for (const s of STAGES) assert.ok(TITLES[s].length > 0, s);
});

test('the story advances Intro -> Mission 1 -> Base 1 and carries resources; the old campaign is untouched', () => {
  const c = newCampaign();
  const m = toMission1(c, 2);
  assert.equal(m.stage, 'mission1');
  assert.equal(m.ammo, 2);
  assert.equal(c.stage, 'intro');
  const b = toBase1(m, { food: 5, scrap: 4, ammo: 6 });
  assert.equal(b.stage, 'base1');
  assert.deepEqual([b.food, b.scrap, b.ammo], [5, 4, 6]);
  assert.equal(m.food, 0);
});

test('Base 1 starts with what Mission 1 carried over', () => {
  const b = toBase1(toMission1(newCampaign(), 2), { food: 5, scrap: 4, ammo: 6 });
  const s = createBase({ food: b.food, scrap: b.scrap, ammo: b.ammo, calm: true });
  assert.deepEqual([s.food, s.scrap, s.ammo], [5, 4, 6]);
});

test('save and load round-trip the campaign under deadwoods.save', () => {
  const st = fakeStorage();
  assert.equal(loadCampaign(st), null);
  const c = toBase1(toMission1(newCampaign(), 2), { food: 5, scrap: 4, ammo: 6 });
  assert.equal(saveCampaign(st, c), true);
  assert.ok(st.data.has(SAVE_KEY));
  assert.deepEqual(loadCampaign(st), c);
  clearSave(st);
  assert.equal(loadCampaign(st), null);
});

test('the slice-era v1 save is not resumed, but the slot is kept', () => {
  const st = fakeStorage();
  const v1 = JSON.stringify({ version: 1, food: 5, scrap: 2, missionsDone: 0, barricades: [] });
  st.setItem(SAVE_KEY, v1);
  assert.equal(loadCampaign(st), null);
  assert.equal(st.data.get(SAVE_KEY), v1); // never erased by loading
  assert.equal(hasSlot(st), true); // so New Game knows to ask before replacing it
});

test('an unreadable slot is kept untouched across loads; only an explicit save replaces it', () => {
  const st = fakeStorage();
  assert.equal(hasSlot(st), false);
  st.setItem(SAVE_KEY, 'not json');
  assert.equal(loadCampaign(st), null);
  assert.equal(loadCampaign(st), null);
  assert.equal(st.data.get(SAVE_KEY), 'not json');
  assert.equal(hasSlot(st), true);
  saveCampaign(st, newCampaign()); // New Game after the confirmation
  assert.deepEqual(loadCampaign(st), newCampaign());
  assert.equal(hasSlot(undefined), false);
  assert.equal(hasSlot({ getItem: () => { throw new Error('blocked'); }, setItem: () => {}, removeItem: () => {} }), false);
});

test('winning Base 1 saves stage done with the same stock; Replay Base 1 goes back to Base 1', () => {
  const st = fakeStorage();
  const b = withCassGun(toBase1(toMission1(newCampaign(), 2), { food: 5, scrap: 4, ammo: 6 }));
  const d = toDone(b);
  assert.equal(d.stage, 'done');
  assert.equal(b.stage, 'base1'); // the old campaign is not changed
  saveCampaign(st, d);
  const back = loadCampaign(st)!;
  assert.equal(back.stage, 'done');
  assert.equal(SCENES[back.stage], null);
  assert.ok(TITLES.done.length > 0);
  const r = replayBase1(back);
  assert.equal(SCENES[r.stage], 'Base');
  assert.deepEqual([r.food, r.scrap, r.ammo, r.cassGun], [5, 4, 6, true]); // same stock, no second arrival beat
  assert.equal(back.stage, 'done');
});

test('a missing, damaged or foreign save is ignored instead of crashing', () => {
  const good = JSON.stringify(newCampaign());
  assert.notEqual(parseSave(good), null);
  for (const bad of [
    null,
    '',
    'not json',
    '42',
    'null',
    '{}',
    JSON.stringify({ ...newCampaign(), version: 1 }),
    JSON.stringify({ ...newCampaign(), version: 99 }),
    JSON.stringify({ ...newCampaign(), stage: 'base2' }),
    JSON.stringify({ ...newCampaign(), stage: undefined }),
    JSON.stringify({ ...newCampaign(), food: -1 }),
    JSON.stringify({ ...newCampaign(), scrap: 'lots' }),
    JSON.stringify({ ...newCampaign(), ammo: 1.5 }),
  ]) {
    assert.equal(parseSave(bad), null, String(bad));
  }
});

test('blocked or throwing storage never throws and reports the failed save', () => {
  const broken: StorageLike = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
  };
  assert.equal(saveCampaign(broken, newCampaign()), false);
  assert.equal(loadCampaign(broken), null);
  assert.doesNotThrow(() => clearSave(broken));
  assert.equal(saveCampaign(undefined, newCampaign()), false);
  assert.equal(loadCampaign(undefined), null);
});

test('the whole flow: a save at each scene start resumes at that scene', () => {
  const st = fakeStorage();
  let c = newCampaign();
  saveCampaign(st, c); // New Game
  assert.equal(SCENES[loadCampaign(st)!.stage], 'Intro');
  c = toMission1(c, 2); // the Intro ends
  saveCampaign(st, c);
  assert.equal(SCENES[loadCampaign(st)!.stage], 'Mission');
  assert.equal(loadCampaign(st)!.ammo, 2);
  c = toBase1(c, { food: 5, scrap: 4, ammo: 6 }); // Mission 1 is won
  saveCampaign(st, c);
  const back = loadCampaign(st)!;
  assert.equal(SCENES[back.stage], 'Base');
  assert.deepEqual([back.food, back.scrap, back.ammo], [5, 4, 6]);
});

test('the Cass gun flag starts false, survives the save, and a save without it reads as false', () => {
  const st = fakeStorage();
  const c = toBase1(toMission1(newCampaign(), 2), { food: 5, scrap: 4, ammo: 6 });
  assert.equal(c.cassGun, false);
  const g = withCassGun(c);
  assert.equal(g.cassGun, true);
  assert.equal(c.cassGun, false); // the old campaign is not changed
  saveCampaign(st, g);
  assert.equal(loadCampaign(st)!.cassGun, true);
  const { cassGun: _drop, ...old } = c; // a v2 slot written before the flag existed
  assert.equal(parseSave(JSON.stringify(old))!.cassGun, false);
  assert.equal(parseSave(JSON.stringify({ ...c, cassGun: 'yes' }))!.cassGun, false);
});

test('the herd checkpoint is saved with the campaign, survives a reload, and every stage change drops it', () => {
  const st = fakeStorage();
  const base1 = toBase1(toMission1(newCampaign(), 2), { food: 5, scrap: 4, ammo: 6 });
  assert.equal(base1.checkpoint, null);
  const s = createBase({ food: 5, scrap: 4, ammo: 6 });
  for (const u of s.survivors) u.hp = u.maxHp = 100000; // roamers must not end the run first
  for (let i = 0; i < 3100 && !s.herd.warned; i++) stepBase(s);
  assert.equal(s.herd.warned, true);
  const c = withCheckpoint(base1, checkpointOf(s));
  assert.equal(base1.checkpoint, null); // the old campaign is not changed
  saveCampaign(st, c);
  const back = loadCampaign(st)!;
  assert.deepEqual(back.checkpoint, s);
  assert.equal(withCassGun(back).checkpoint !== null, true); // the arrival beat keeps it
  assert.equal(withCheckpoint(back, null).checkpoint, null);
  assert.equal(toDone(back).checkpoint, null); // Base 1 won: Replay starts clean
  assert.equal(replayBase1(toDone(back)).checkpoint, null);
  assert.equal(replayBase1(back).checkpoint, null);
  assert.equal(toBase1(toMission1(back, 1), { food: 1, scrap: 1, ammo: 1 }).checkpoint, null);
});

test('a damaged checkpoint is dropped alone: the rest of the save still loads, and only Base 1 keeps one', () => {
  const s = createBase();
  for (const u of s.survivors) u.hp = u.maxHp = 100000; // roamers must not end the run first
  for (let i = 0; i < 3100 && !s.herd.warned; i++) stepBase(s);
  assert.equal(s.herd.warned, true);
  const c = withCheckpoint(toBase1(toMission1(newCampaign(), 2), { food: 5, scrap: 4, ammo: 6 }), checkpointOf(s));
  const broken = JSON.parse(JSON.stringify(c)) as Record<string, any>;
  broken.checkpoint.survivors.length = 1;
  const r = parseSave(JSON.stringify(broken))!;
  assert.equal(r.stage, 'base1');
  assert.deepEqual([r.food, r.scrap, r.ammo], [5, 4, 6]);
  assert.equal(r.checkpoint, null);
  assert.equal(parseSave(JSON.stringify({ ...c, checkpoint: 'x' }))!.checkpoint, null);
  const { checkpoint: _drop, ...old } = c; // a save written before checkpoints existed
  assert.equal(parseSave(JSON.stringify(old))!.checkpoint, null);
  assert.equal(parseSave(JSON.stringify({ ...c, stage: 'mission1' }))!.checkpoint, null);
});
