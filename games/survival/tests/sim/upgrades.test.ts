import assert from 'node:assert/strict';
import { test } from 'node:test';
import upgradesData from '../../src/data/upgrades.json';
import wavesData from '../../src/data/waves.json';
import { assignWorkers, placeBuilding } from '../../src/sim/buildings';
import { fighterOf } from '../../src/sim/combat';
import { coldPerPerson } from '../../src/sim/economy';
import {
  bandOf, buyUpgrade, giftForBand, hasUpgrade, homeOf, missingBand, missingFor, missingHome, upgradeNeeds, upgradesOf,
} from '../../src/sim/upgrades';
import { loadState, parseSave, serialize } from '../../src/sim/save';
import { addBuilding, type GameState } from '../../src/sim/state';
import { newGame, step } from '../../src/sim/tick';
import { addHuntingLodge, stepFed } from './helpers';

/** One step across the day start at `tick` (a multiple of 1200) with the given Wotakuye. */
function dayStartAt(tick: number, wotakuye: number): GameState {
  const s = newGame(1);
  s.store.food = 1000;
  s.wotakuye = wotakuye;
  s.tick = tick - 1;
  step(s, 1);
  return s;
}

test('gift value by band: United 2, Steady 1, Strained 0, Quarrelling 0', () => {
  assert.equal(giftForBand('United'), 2);
  assert.equal(giftForBand('Steady'), 1);
  assert.equal(giftForBand('Strained'), 0);
  assert.equal(giftForBand('Quarrelling'), 0);
  assert.equal(newGame(1).gift, 0);
  assert.deepEqual(newGame(1).upgrades, []);
  // Summer (tick 3600) has no newcomer rule and no cold surprises; the meal at tick 3600 is not due.
  assert.equal(dayStartAt(3600, 85).gift, 2);
  assert.equal(dayStartAt(3600, 55).gift, 1);
  assert.equal(dayStartAt(3600, 30).gift, 0);
});

test('buying takes the cost, refuses when short or already owned', () => {
  const s = newGame(1);
  addHuntingLodge(s);
  assert.equal(buyUpgrade(s, 'dogs'), false, 'no gift yet');
  assert.deepEqual(missingFor(s, 'dogs'), ['gift 4']);
  s.gift = 5;
  s.store.food = 50;
  assert.equal(buyUpgrade(s, 'dogs'), true);
  assert.equal(s.gift, 1);
  assert.equal(s.store.food, 40);
  assert.ok(hasUpgrade(s, 'dogs'));
  assert.equal(s.messages.at(-1)?.text, 'Hunting dogs joined the hunters.');
  s.gift = 20;
  assert.equal(buyUpgrade(s, 'dogs'), false, 'already owned');
  assert.equal(s.gift, 20);

  s.store.wood = 4;
  s.store.hides = 3;
  assert.deepEqual(missingFor(s, 'bows'), ['wood 1']);
  assert.equal(buyUpgrade(s, 'bows'), false);
  s.store.wood = 5;
  assert.equal(buyUpgrade(s, 'bows'), true);
  assert.equal(s.gift, 14);
  assert.deepEqual(s.upgrades, ['dogs', 'bows']);
});

test('a saved and loaded run keeps gift and upgrades and stays in step with the unsaved run', () => {
  const a = newGame(3);
  addHuntingLodge(a);
  step(a, 1300);
  a.gift = 9;
  buyUpgrade(a, 'dogs');
  const parsed = parseSave(serialize(a));
  assert.ok(parsed.ok);
  const b = loadState((parsed as { ok: true; save: Parameters<typeof loadState>[0] }).save);
  assert.equal(b.gift, a.gift);
  assert.deepEqual(b.upgrades, ['dogs']);
  b.paused = false;
  a.messages = [];
  step(a, 500);
  step(b, 500);
  assert.deepEqual({ ...b, messages: [] }, { ...a, messages: [] });
});

test('dogs and bows change the hunter bow; a club fighter is unchanged', () => {
  const s = newGame(1);
  const [hunter, other] = s.people.filter((p) => p.age === 'adult');
  hunter.society = 'hunters';
  const base = { ...fighterOf(s, hunter) };
  assert.deepEqual([base.range, base.damage, base.accuracy], [4, 12, 0.75]);
  s.upgrades.push('dogs');
  assert.ok(Math.abs(fighterOf(s, hunter).accuracy - 0.8) < 1e-9);
  assert.equal(fighterOf(s, hunter).range, 4);
  s.upgrades.push('bows');
  const better = fighterOf(s, hunter);
  assert.deepEqual([better.range, better.damage], [5, 15]);
  assert.equal(fighterOf(s, other).range, 0.8, 'the club');
  assert.equal(fighterOf(s, other).accuracy, 0.8);
});

test('with bows a hunter takes a shot at a wolf 5 tiles away; without, not yet', () => {
  const fired = (bows: boolean): boolean => {
    const s = newGame(2);
    const p = s.people.find((q) => q.age === 'adult')!;
    s.people = [p];
    Object.assign(p, { x: 24, y: 29, drafted: true, post: [24, 29], stance: 'hold', society: 'hunters' });
    if (bows) s.upgrades.push('bows');
    s.enemies.push({ id: 1, kind: 'wolf', x: 24, y: 24, hp: 40, cooldown: 0, fleeing: false, wave: 0 });
    s.nextEnemyId = 2;
    step(s, 1);
    return p.cooldown > 0;
  };
  assert.equal(fired(false), false, 'out of range 4');
  assert.equal(fired(true), true, 'inside range 5');
});

test('dogs never lower a hunt: same seed, at least as many hides', () => {
  const hides = (dogs: boolean): number => {
    const s = newGame(1);
    s.store.wood = 100;
    s.store.hides = 20;
    s.store.food = 100;
    const lodge = placeBuilding(s, 'hunting_lodge', 28, 26).building!;
    lodge.done = true;
    assignWorkers(s, [s.people.find((p) => p.age === 'adult')!.id], lodge.id);
    if (dogs) s.upgrades.push('dogs');
    const before = s.store.hides;
    stepFed(s, 3000);
    return s.store.hides - before;
  };
  const wave = wavesData.waves.map((w) => w.at);
  wavesData.waves.forEach((w) => (w.at = 1e9));
  try {
    assert.ok(hides(true) >= hides(false));
  } finally {
    wavesData.waves.forEach((w, i) => (w.at = wave[i]));
  }
});

/** A camp with a finished healers' lodge staffed by `n` adults (the upgrade bought). */
function campWithLodge(n: number): { s: GameState; healers: GameState['people'] } {
  const s = newGame(1);
  s.upgrades.push('healers');
  s.store.wood = 100;
  s.store.hides = 20;
  s.store.food = 1000;
  const lodge = placeBuilding(s, 'healers_lodge', 28, 26).building!;
  lodge.done = true;
  const healers = s.people.filter((p) => p.age === 'adult').slice(0, n);
  assert.equal(assignWorkers(s, healers.map((p) => p.id), lodge.id), n);
  return { s, healers };
}

test("the healers' lodge needs the society first", () => {
  const s = newGame(1);
  s.store.wood = 100;
  s.store.hides = 20;
  assert.equal(placeBuilding(s, 'healers_lodge', 28, 26).error, "Needs the Healers' society.");
  s.upgrades.push('healers');
  const r = placeBuilding(s, 'healers_lodge', 28, 26);
  assert.ok(r.building, r.error ?? 'placed');
  assert.equal(s.store.wood, 80);
  assert.equal(s.store.hides, 17);
});

test('a heal worker treats the most wounded person: +15 health, and idles when nobody is below 80', () => {
  const { s, healers } = campWithLodge(1);
  const [h] = healers;
  assert.equal(h.society, 'healers');
  const others = s.people.filter((p) => p.id !== h.id && p.age === 'adult');
  others[0].health = 70;
  others[1].health = 40;
  const wound = (p: (typeof others)[number]) => p.health;
  const before = [wound(others[0]), wound(others[1])];
  stepFed(s, 400);
  // Natural regeneration is 0.01 a tick, so compare with the gain a healer adds on top.
  assert.ok(others[1].health >= before[1] + 15, `most wounded ${others[1].health}`);
  assert.ok(others[0].health > before[0], 'then the next one');
  const calm = campWithLodge(1);
  const t0 = calm.s.tick;
  stepFed(calm.s, 100);
  assert.ok(calm.s.tick > t0);
  assert.ok(calm.s.people.every((p) => p.health <= 100));
});

test('staffed healers ease winter cold: -3 becomes -2 with one and -1 with two; summer stays -1', () => {
  const cold = (tick: number, n: number): number => {
    const { s } = campWithLodge(n);
    s.tick = tick;
    return coldPerPerson(s);
  };
  assert.equal(cold(10800, 0), -3);
  assert.equal(cold(10800, 1), -2);
  assert.equal(cold(10800, 2), -1);
  assert.equal(cold(3600, 2), -1);
  assert.equal(cold(3600, 0), -1);
});

test('each upgrade has a home building; buying is refused without a finished one', () => {
  assert.deepEqual(upgradesOf('hunting_lodge'), ['dogs', 'bows', 'scouts']);
  assert.deepEqual(upgradesOf('fire'), ['healers', 'warriors', 'builders', 'barricades', 'tools', 'spirits']);
  assert.deepEqual(upgradesOf('tipi'), []);
  assert.equal(homeOf('dogs'), 'hunting_lodge');

  const s = newGame(1);
  s.gift = 50;
  s.store.food = 100;
  assert.equal(missingHome(s, 'dogs'), true);
  assert.equal(upgradeNeeds(s, 'dogs'), 'Needs a finished hunting lodge');
  assert.equal(buyUpgrade(s, 'dogs'), false);
  assert.equal(s.gift, 50, 'nothing was taken');

  const lodge = addBuilding(s, 'hunting_lodge', 36, 36, false);
  assert.equal(buyUpgrade(s, 'dogs'), false, 'an unfinished lodge does not count');
  lodge.done = true;
  assert.equal(missingHome(s, 'dogs'), false);
  assert.equal(upgradeNeeds(s, 'dogs'), null);
  assert.equal(buyUpgrade(s, 'dogs'), true);

  // The council fire is finished from the start, so its upgrades never wait for a building.
  assert.equal(missingHome(s, 'healers'), false);
  s.store.wood = 20;
  assert.equal(buyUpgrade(s, 'healers'), true);
});

test('a row reads Needs <upgrade label> while the tier 1 upgrade is missing', () => {
  const s = newGame(1);
  addHuntingLodge(s);
  assert.equal(upgradeNeeds(s, 'scouts'), 'Needs Hunting dogs');
  assert.equal(upgradeNeeds(s, 'tools'), 'Needs Better bows');
  assert.equal(upgradeNeeds(s, 'dogs'), null);
});

test('an upgrade with a band is refused outside that band (Fantasy upgrades need United)', () => {
  const dogs = upgradesData.upgrades.dogs as { band?: string };
  dogs.band = 'United';
  try {
    const s = newGame(1);
    addHuntingLodge(s);
    s.gift = 50;
    s.store.food = 100;
    s.wotakuye = 55;
    assert.equal(bandOf('dogs'), 'United');
    assert.equal(missingBand(s, 'dogs'), 'United');
    assert.equal(upgradeNeeds(s, 'dogs'), 'Needs United');
    assert.equal(buyUpgrade(s, 'dogs'), false);
    s.wotakuye = 90;
    assert.equal(missingBand(s, 'dogs'), null);
    assert.equal(buyUpgrade(s, 'dogs'), true);
  } finally {
    delete dogs.band;
  }
});
