import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSave, serialize } from '../../src/sim/save';
import { addBuilding, type GameState } from '../../src/sim/state';
import { buyUpgrade, castError, castPower, POWER_IDS, upgradeNeeds, upgradesOf } from '../../src/sim/upgrades';
import { queueOrders } from '../../src/sim/orders';
import { newGame, step } from '../../src/sim/tick';
import { o } from './helpers';

const UNITED = 80;
const STEADY = 50;
const STRAINED = 30;

/** A camp with a finished council fire and spirit lodge, rich enough to buy anything, in the United band. */
function spiritCamp(): GameState {
  const s = newGame(1);
  s.wotakuye = UNITED;
  s.gift = 200;
  s.store.food = 100;
  s.store.wood = 100;
  s.store.hides = 50;
  addBuilding(s, 'spirit_lodge', o(28), o(26), true);
  return s;
}

test('the spirit lodge and the four powers are sold where the spec says', () => {
  assert.deepEqual(upgradesOf('spirit_lodge'), ['spirit_warriors', 'guardian_wolves', 'bison_charge', 'storm_caller']);
  assert.deepEqual(POWER_IDS, ['spirit_warriors', 'guardian_wolves', 'bison_charge', 'storm_caller']);
});

test('Spirit society needs United and costs 10 gift + 20 wood; it unlocks the lodge', () => {
  const s = newGame(1);
  s.gift = 20;
  s.store.wood = 40;
  s.wotakuye = STEADY;
  assert.equal(upgradeNeeds(s, 'spirits'), 'Needs United');
  assert.equal(buyUpgrade(s, 'spirits'), false);
  s.wotakuye = UNITED;
  assert.equal(upgradeNeeds(s, 'spirits'), null);
  assert.equal(buyUpgrade(s, 'spirits'), true);
  assert.equal(s.gift, 10);
  assert.equal(s.store.wood, 20);
  assert.equal(s.messages.at(-1)?.text, 'The spirit society can build a lodge.');
});

test('the lodge cannot be placed before the society, and costs 25 wood + 5 hides after it', () => {
  const s = newGame(1);
  s.store.wood = 100;
  s.store.hides = 10;
  queueOrders(s, [{ type: 'place', building: 'spirit_lodge', at: [o(28), o(26)] }]);
  step(s, 1);
  assert.equal(s.buildings.some((b) => b.type === 'spirit_lodge'), false);
  assert.equal(s.messages.at(-1)?.text, 'Needs the Spirit society.');
  s.upgrades.push('spirits');
  queueOrders(s, [{ type: 'place', building: 'spirit_lodge', at: [o(28), o(26)] }]);
  step(s, 1);
  assert.equal(s.buildings.some((b) => b.type === 'spirit_lodge'), true);
  assert.equal(s.store.wood, 75);
  assert.equal(s.store.hides, 5);
});

test('each power needs its tier 2 upgrade, United, a finished lodge and its price', () => {
  const needs: [string, string][] = [
    ['spirit_warriors', 'warriors'], ['guardian_wolves', 'scouts'], ['bison_charge', 'tools'], ['storm_caller', 'builders'],
  ];
  for (const [power, req] of needs) {
    const s = spiritCamp();
    assert.match(upgradeNeeds(s, power as never) ?? '', /^Needs /, `${power} needs ${req}`);
    assert.equal(buyUpgrade(s, power as never), false);
    s.upgrades.push(req);
    assert.equal(upgradeNeeds(s, power as never), null);
    s.wotakuye = STEADY;
    assert.equal(upgradeNeeds(s, power as never), 'Needs United', `${power} is bought only at United`);
    assert.equal(buyUpgrade(s, power as never), false);
    s.wotakuye = UNITED;
    s.buildings = s.buildings.filter((b) => b.type !== 'spirit_lodge');
    assert.equal(upgradeNeeds(s, power as never), 'Needs a finished spirit lodge');
    addBuilding(s, 'spirit_lodge', o(28), o(26), true);
    assert.equal(buyUpgrade(s, power as never), true, power);
  }
});

test('a power is paid once: gift and goods are taken as listed', () => {
  const s = spiritCamp();
  s.upgrades.push('builders');
  assert.equal(buyUpgrade(s, 'storm_caller'), true);
  assert.equal(s.gift, 190);
  assert.equal(s.store.hides, 45);
  assert.equal(buyUpgrade(s, 'storm_caller'), false, 'owned');
  assert.equal(s.gift, 190);
});

test('a cast is refused for a power the camp does not own', () => {
  const s = spiritCamp();
  assert.equal(castPower(s, 'spirit_warriors'), false);
  assert.equal(castPower(s, 'nonsense'), false);
  assert.deepEqual(s.powersUsed, []);
});

test('a power can be cast once per wave, and recharges when the next wave warning starts', () => {
  const s = spiritCamp();
  s.upgrades.push('warriors', 'spirit_warriors');
  assert.equal(castPower(s, 'spirit_warriors'), true);
  assert.deepEqual(s.powersUsed, ['spirit_warriors']);
  assert.equal(castPower(s, 'spirit_warriors'), false);
  assert.match(s.messages.at(-1)!.text, /spent until the next wave warning/);
  // Run to the first wave warning (30 s before wave 1), keeping the camp United so nothing else interferes.
  while (s.waves[0].phase === 'pending' && s.tick < 6000) {
    s.wotakuye = UNITED;
    step(s, 1);
  }
  assert.equal(s.waves[0].phase, 'warning');
  assert.deepEqual(s.powersUsed, [], 'a warning recharges the powers');
  assert.equal(castPower(s, 'spirit_warriors'), true);
});

test('a cast is refused below Steady, allowed at Steady and United', () => {
  const s = spiritCamp();
  s.upgrades.push('guardian_wolves');
  s.wotakuye = STRAINED;
  assert.match(castError(s, 'guardian_wolves') ?? '', /too strained/);
  assert.equal(castPower(s, 'guardian_wolves'), false);
  assert.deepEqual(s.powersUsed, [], 'a refused cast is not spent');
  s.wotakuye = STEADY;
  assert.equal(castPower(s, 'guardian_wolves'), true);
});

test('an aimed power needs a point; an unaimed one does not', () => {
  const s = spiritCamp();
  s.upgrades.push('bison_charge', 'spirit_warriors');
  assert.equal(castPower(s, 'bison_charge'), false);
  assert.match(s.messages.at(-1)!.text, /needs a point on the map/);
  assert.equal(castPower(s, 'bison_charge', [20, 20]), true);
  assert.equal(castPower(s, 'spirit_warriors'), true);
});

test('the cast order works while paused and through the order queue', () => {
  const s = spiritCamp();
  s.upgrades.push('spirit_warriors');
  queueOrders(s, [{ type: 'pause', on: true }, { type: 'cast', power: 'spirit_warriors' }]);
  step(s, 1);
  assert.deepEqual(s.powersUsed, ['spirit_warriors']);
});

test('powers used are saved; a file without them is unreadable', () => {
  const s = spiritCamp();
  s.upgrades.push('spirit_warriors');
  castPower(s, 'spirit_warriors');
  const parsed = parseSave(serialize(s));
  assert.ok(parsed.ok);
  if (parsed.ok) assert.deepEqual(parsed.save.state.powersUsed, ['spirit_warriors']);
  const raw = JSON.parse(serialize(s));
  delete raw.state.powersUsed;
  const bad = parseSave(JSON.stringify(raw));
  assert.deepEqual(bad, { ok: false, reason: 'bad powersUsed' });
});
