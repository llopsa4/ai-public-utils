import assert from 'node:assert/strict';
import { test } from 'node:test';
import camp from '../src/data/camp.json';
import { COVER, getTile } from '../src/sim/grid';
import { createCamp, placeBarricade } from '../src/sim/camp';
import {
  MISSIONS,
  SAVE_KEY,
  type StorageLike,
  applyDebrief,
  clearSave,
  finished,
  loadCampaign,
  newCampaign,
  nextMission,
  parseSave,
  saveCampaign,
  withCamp,
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

test('a new campaign starts with the camp resources and offers the first mission', () => {
  const c = newCampaign();
  assert.equal(c.food, camp.start.food);
  assert.equal(c.scrap, camp.start.scrap);
  assert.equal(c.missionsDone, 0);
  assert.equal(nextMission(c)?.id, MISSIONS[0]!.id);
  assert.equal(finished(c), false);
});

test('a debrief adds the loot, counts the mission and ends the story; the old campaign is untouched', () => {
  const c = newCampaign();
  const d = applyDebrief(c, { food: 3, scrap: 4 });
  assert.equal(d.food, camp.start.food + 3);
  assert.equal(d.scrap, camp.start.scrap + 4);
  assert.equal(d.missionsDone, 1);
  assert.equal(c.missionsDone, 0);
  assert.equal(c.food, camp.start.food);
  assert.equal(finished(d), MISSIONS.length === 1);
  assert.equal(applyDebrief(applyDebrief(d, { food: 0, scrap: 0 }), { food: 0, scrap: 0 }).missionsDone, MISSIONS.length);
});

test('save and load round-trip the campaign under deadwoods.save', () => {
  const st = fakeStorage();
  assert.equal(loadCampaign(st), null);
  const c = withCamp(applyDebrief(newCampaign(), { food: 2, scrap: 1 }), 9, 6, [{ x: 12, y: 12, hp: 70 }]);
  assert.equal(saveCampaign(st, c), true);
  assert.ok(st.data.has(SAVE_KEY));
  assert.deepEqual(loadCampaign(st), c);
  clearSave(st);
  assert.equal(loadCampaign(st), null);
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
    JSON.stringify({ ...newCampaign(), version: 99 }),
    JSON.stringify({ ...newCampaign(), food: -1 }),
    JSON.stringify({ ...newCampaign(), scrap: 'lots' }),
    JSON.stringify({ ...newCampaign(), missionsDone: MISSIONS.length + 1 }),
    JSON.stringify({ ...newCampaign(), barricades: 'x' }),
    JSON.stringify({ ...newCampaign(), barricades: [{ x: 1, y: 1, hp: 0 }] }),
    JSON.stringify({ ...newCampaign(), barricades: [null] }),
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

test('the camp restores saved resources and fences, and drops a fence that no longer fits', () => {
  const fresh = createCamp();
  fresh.scrap = 5;
  assert.equal(placeBarricade(fresh, 17, 17), 'ok');
  const c = withCamp(newCampaign(), 11, fresh.scrap, [...fresh.barricades, { x: camp.tent.x, y: camp.tent.y, hp: 50 }]);
  const back = createCamp(c);
  assert.equal(back.food, 11);
  assert.equal(back.scrap, 4);
  assert.deepEqual(back.barricades, [{ x: 17, y: 17, hp: camp.barricade.hp }]);
  assert.equal(getTile(back.grid, 17, 17), COVER);
  assert.equal(back.enemies.length, 4);
});

test('the whole flow: camp spending, a mission debrief and a reload keep the numbers', () => {
  const st = fakeStorage();
  let c = newCampaign();
  const s = createCamp(c);
  assert.equal(placeBarricade(s, 17, 17), 'ok'); // 1 scrap
  c = withCamp(c, s.food, s.scrap, s.barricades); // leaving the camp for the mission
  saveCampaign(st, c);
  c = applyDebrief(c, { food: 4, scrap: 3 }); // extraction
  saveCampaign(st, c);
  const reloaded = loadCampaign(st)!;
  assert.equal(reloaded.food, camp.start.food + 4);
  assert.equal(reloaded.scrap, camp.start.scrap - 1 + 3);
  assert.equal(reloaded.barricades.length, 1);
  assert.equal(nextMission(reloaded), MISSIONS[reloaded.missionsDone] ?? null);
  assert.equal(createCamp(reloaded).scrap, reloaded.scrap);
});
