import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, endTurn, playCard, preview } from '../client/src/game/combat';
import { deriveStats, openingHandSize, withEquipment } from '../client/src/game/equipment';
import { EQUIPMENT, STARTING_EQUIPMENT } from '../client/src/content/equipment';
import { PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER } from '../client/src/content/encounter';
import { recoverMP } from '../client/src/game/profile';

test('neutral gear preserves seeded combat; power and defense apply once to mixed effects', () => {
  assert.deepEqual(createBattle(PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER, 7), createBattle({ ...PROTOTYPE_PROFILE, equipment: STARTING_EQUIPMENT }, PROTOTYPE_ENCOUNTER, 7));
  const equipped = withEquipment(PROTOTYPE_PROFILE, { ...STARTING_EQUIPMENT, gauntlet: { id: 'balanced-gauntlet' }, armor: { id: 'layered-armor' } });
  let state = createBattle({ ...equipped, deck: [{ id: 'pulse', type: 'pulse' }] }, PROTOTYPE_ENCOUNTER, 7);
  state.strain = 6;
  assert.equal(preview(state, state.hand[0]).damage, 19);
  assert.equal(preview(state, state.hand[0]).block, 8);
  state = playCard(state, 'pulse');
  assert.equal(state.enemy.hp, 53);
  assert.equal(state.hero.block, 8);
  assert.equal(state.hero.hp, 54); // overload still bypasses new block
});

test('speed aggregates penalties before clamping and changes only opening draws', () => {
  for (const [speed, cards] of [[0,5],[1,5],[2,6],[3,6],[4,7],[5,7]]) assert.equal(openingHandSize(5, speed), cards);
  const layered = withEquipment(PROTOTYPE_PROFILE, { ...STARTING_EQUIPMENT, armor: { id: 'layered-armor' }, utility: { id: 'quick-harness' } });
  assert.equal(deriveStats(layered).speed, 1);
  assert.equal(deriveStats(withEquipment(PROTOTYPE_PROFILE, { ...STARTING_EQUIPMENT, armor: { id: 'layered-armor' } })).speed, 0);
  const fast = withEquipment(PROTOTYPE_PROFILE, { ...STARTING_EQUIPMENT, utility: { id: 'quick-harness', upgraded: true } });
  const battle = createBattle(fast, PROTOTYPE_ENCOUNTER, 7);
  assert.equal(battle.hand.length, 7);
  assert.equal(endTurn(battle).hand.length, 5);
});

test('heavy attacks combine strain before a single overload calculation', () => {
  const profile = withEquipment(PROTOTYPE_PROFILE, { ...STARTING_EQUIPMENT, gauntlet: { id: 'heavy-gauntlet' } });
  let state = createBattle({ ...profile, deck: [{ id: 'p', type: 'pulse' }] }, PROTOTYPE_ENCOUNTER, 1);
  state.strain = 5;
  assert.equal(preview(state, state.hand[0]).strainDelta, 5);
  assert.equal(preview(state, state.hand[0]).damage, 18); // no pre-card heat bonus
  state = playCard(state, 'p');
  assert.equal(state.strain, 4);
  assert.equal(state.hero.hp, 54);
});

test('MP gear never refills on equip and clamps on removal; recovery uses the derived cap', () => {
  const loadout = { ...STARTING_EQUIPMENT, utility: { id: 'insulated-kit' } };
  const initial = { ...PROTOTYPE_PROFILE, mp: 3 };
  const equipped = withEquipment(initial, loadout);
  assert.equal(equipped.mp, 3);
  assert.equal(deriveStats(equipped).maxMp, 11);
  const filled = recoverMP(equipped, 100);
  assert.equal(filled.mp, 11);
  const removed = withEquipment(filled, STARTING_EQUIPMENT);
  assert.equal(removed.mp, 10);
  assert.equal(withEquipment(removed, loadout).mp, 10);
  assert.equal(initial.mp, 3);
});

test('equipment rejects unknown, wrong-slot and invalid upgrades without mutating inputs', () => {
  const before = structuredClone(EQUIPMENT), profile = structuredClone(PROTOTYPE_PROFILE);
  const loadout = structuredClone(STARTING_EQUIPMENT);
  const changed = withEquipment(profile, loadout);
  (loadout.gauntlet as { id: string }).id = 'heavy-gauntlet';
  assert.equal(deriveStats(changed).power, 0);
  for (const id of ['missing', '__proto__', 'layered-armor']) assert.throws(() => withEquipment(profile, { ...STARTING_EQUIPMENT, gauntlet: { id } }));
  assert.throws(() => withEquipment(profile, { ...STARTING_EQUIPMENT, gauntlet: { id: 'courier-gauntlet', upgraded: true } }));
  assert.deepEqual(EQUIPMENT, before);
  assert.deepEqual(profile, PROTOTYPE_PROFILE);
  assert.throws(() => withEquipment({ ...profile, maxMp: Number.MAX_SAFE_INTEGER }, { ...STARTING_EQUIPMENT, utility: { id: 'insulated-kit' } }));
});

test('every authored alternative and its upgrade use total bonuses once', () => {
  for (const [id, item] of Object.entries(EQUIPMENT)) {
    for (const upgraded of item.upgradedBonuses ? [false, true] : [false]) {
      const profile = withEquipment(PROTOTYPE_PROFILE, { ...STARTING_EQUIPMENT, [item.slot]: { id, upgraded } });
      const stats = deriveStats(profile), bonuses = upgraded ? item.upgradedBonuses! : item.bonuses;
      assert.equal(stats.power, bonuses.power ?? 0);
      assert.equal(stats.defense, bonuses.defense ?? 0);
      assert.equal(stats.speed, Math.max(0, bonuses.speed ?? 0));
      assert.equal(stats.maxMp, 10 + (bonuses.maxMp ?? 0));
      assert.equal(stats.attackStrain, bonuses.attackStrain ?? 0);
    }
  }
});
