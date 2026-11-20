import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assignWorkers, placementError } from '../../src/sim/buildings';
import { loadState, parseSave, serialize } from '../../src/sim/save';
import { addBuilding, horseCap, type Building, type GameState } from '../../src/sim/state';
import { buyUpgrade, upgradeNeeds } from '../../src/sim/upgrades';
import { newGame, step } from '../../src/sim/tick';

/** A camp with the warriors upgrade, a finished corral beside the fire, and one person tending it. */
function corralCamp(): { s: GameState; corral: Building; tender: GameState['people'][number] } {
  const s = newGame(1);
  s.upgrades.push('warriors');
  const corral = addBuilding(s, 'horse_corral', 28, 26, true);
  const tender = s.people.find((p) => p.age === 'adult')!;
  assert.equal(assignWorkers(s, [tender.id], corral.id), 1);
  tender.x = corral.x - 1;
  tender.y = corral.y;
  return { s, corral, tender };
}

test('the corral needs the warriors upgrade to be placed', () => {
  const s = newGame(1);
  s.store.wood = 100;
  assert.equal(placementError(s, 'horse_corral', 28, 26), 'Needs the Akicita warriors.');
  s.upgrades.push('warriors');
  assert.equal(placementError(s, 'horse_corral', 28, 26), null);
});

test('Breed horses needs warriors and a finished corral, then brings two horses at once', () => {
  const s = newGame(1);
  s.gift = 20;
  s.store.food = 100;
  assert.equal(upgradeNeeds(s, 'horses'), 'Needs Akicita warriors');
  assert.equal(buyUpgrade(s, 'horses'), false);
  s.upgrades.push('warriors');
  assert.equal(upgradeNeeds(s, 'horses'), 'Needs a finished horse corral');
  const corral = addBuilding(s, 'horse_corral', 28, 26, false);
  assert.equal(buyUpgrade(s, 'horses'), false, 'an unfinished corral is not a home');
  corral.done = true;
  assert.equal(upgradeNeeds(s, 'horses'), null);
  assert.equal(buyUpgrade(s, 'horses'), true);
  assert.equal(s.horses, 2);
  assert.equal(s.gift, 14, 'six gift value spent');
  assert.equal(s.store.food, 80, 'twenty food spent');
  assert.equal(s.messages.at(-1)?.text, 'Horses joined the camp.');
  assert.equal(buyUpgrade(s, 'horses'), false, 'owned');
});

test('a tended corral breeds one horse every 3600 ticks of tending', () => {
  const { s, corral } = corralCamp();
  corral.tended = 3598;
  step(s, 1);
  assert.equal(s.horses, 0);
  step(s, 2);
  assert.equal(s.horses, 1);
  assert.equal(corral.tended, 1, 'the extra tick carries over');
  assert.equal(s.messages.at(-1)?.text, 'A foal was born.');
});

test('an untended corral, or one whose tender is drafted, breeds nothing', () => {
  const { s, corral, tender } = corralCamp();
  tender.job = null;
  step(s, 100);
  assert.equal(corral.tended, 0, 'nobody assigned');
  const again = corralCamp();
  again.tender.drafted = true;
  step(again.s, 100);
  assert.equal(again.corral.tended, 0, 'a drafted tender leaves the corral');
});

test('a tender who walks to the corral starts the clock', () => {
  const { s, corral, tender } = corralCamp();
  tender.x = 36;
  tender.y = 36;
  step(s, 400);
  assert.ok(corral.tended > 0, `tended ${corral.tended}`);
  assert.ok(corral.tended < 400);
});

test('horses stop at six per finished corral and the tending time waits full', () => {
  const { s, corral } = corralCamp();
  assert.equal(horseCap(s), 6);
  s.horses = 6;
  corral.tended = 3599;
  step(s, 50);
  assert.equal(s.horses, 6);
  assert.equal(corral.tended, 3600, 'time waits at the cap');
  const second = addBuilding(s, 'horse_corral', 28, 30, true);
  assert.equal(horseCap(s), 12);
  step(s, 1);
  assert.equal(s.horses, 7, 'room again: the waiting time becomes a foal');
  assert.equal(second.tended, 0);
});

test('Breed horses never goes past the cap', () => {
  const s = newGame(1);
  s.upgrades.push('warriors');
  addBuilding(s, 'horse_corral', 28, 26, true);
  s.horses = 5;
  s.gift = 10;
  s.store.food = 50;
  assert.equal(buyUpgrade(s, 'horses'), true);
  assert.equal(s.horses, 6);
});

test('horses and the corral clock are saved; a v4 file or one without them is unreadable', () => {
  const { s, corral } = corralCamp();
  s.horses = 3;
  corral.tended = 1234;
  const parsed = parseSave(serialize(s));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const back = loadState(parsed.save);
  assert.equal(back.horses, 3);
  assert.equal(back.buildings.find((b) => b.type === 'horse_corral')?.tended, 1234);

  assert.equal(parsed.save.version, 5);
  const v4 = structuredClone(parsed.save);
  v4.version = 4;
  assert.equal(parseSave(JSON.stringify(v4)).ok, false, 'a version 4 file is unreadable');

  const noHorses = structuredClone(parsed.save) as unknown as { state: Partial<GameState> };
  delete noHorses.state.horses;
  assert.equal(parseSave(JSON.stringify(noHorses)).ok, false);

  const noTended = structuredClone(parsed.save);
  delete (noTended.state.buildings[0] as Partial<Building>).tended;
  assert.equal(parseSave(JSON.stringify(noTended)).ok, false);
});
