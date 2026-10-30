import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, TEMPERED_FLOW, cardDefinition, cardLabel } from '../client/src/content/cards';
import { PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER } from '../client/src/content/encounter';
import { createBattle, playCard, endTurn, preview, cardAvailability } from '../client/src/game/combat';
import { learnTemperedFlow, recoverMP } from '../client/src/game/profile';
import type { CardInstance, CardUpgrade } from '../client/src/game/types';

const signatureId = PROTOTYPE_PROFILE.deck.find(c => c.type === 'pulse')!.id;
const trained = learnTemperedFlow(PROTOTYPE_PROFILE, signatureId);
const signature = trained.deck.find(c => c.id === signatureId)!;
function ready(mp = 3) {
  const state = createBattle({ ...trained, mp }, PROTOTYPE_ENCOUNTER, 1);
  assert.ok(state.hand.some(c => c.id === signatureId));
  return state;
}

test('Tempered Flow changes only the signature technique label, MP cost and strain', () => {
  const { technique, mpCost, strain, text, ...unchanged } = TEMPERED_FLOW;
  const { mpCost: oldCost, strain: oldStrain, text: oldText, ...original } = CARDS.pulse;
  assert.deepEqual(unchanged, original);
  assert.deepEqual([technique, mpCost, strain], ['Tempered Flow', 3, 3]);
  assert.equal(text, 'Deal 16 damage. Gain 6 block. Gain 3 strain.');
  assert.equal(cardLabel(signature), 'Kiln Pulse (Tempered Flow)');
  assert.equal(oldCost, 4); assert.equal(oldStrain, 4); assert.ok(oldText);
});

test('teacher handoff upgrades exactly the selected owned instance immutably and idempotently', () => {
  const owned = structuredClone(PROTOTYPE_PROFILE);
  for (const card of owned.deck) Object.freeze(card);
  Object.freeze(owned.deck); Object.freeze(owned);
  const before = structuredClone(owned);
  const result = learnTemperedFlow(owned, signatureId);
  assert.deepEqual(owned, before);
  assert.equal(result.deck.length, 12);
  assert.deepEqual(result.deck.map(c => c.id), owned.deck.map(c => c.id));
  assert.equal(result.deck.filter(c => c.upgrade).length, 1);
  assert.equal(result.deck.filter(c => c.type === 'pulse').length, 1);
  assert.deepEqual({ ...result, deck: owned.deck }, owned);
  assert.equal(learnTemperedFlow(result, signatureId), result);
  assert.throws(() => learnTemperedFlow(owned, 'missing'), /owned Kiln Pulse/);
  assert.throws(() => learnTemperedFlow(owned, owned.deck[0].id), /owned Kiln Pulse/);
  const duplicate = { ...owned, deck: [...owned.deck, owned.deck.find(c => c.id === signatureId)!] };
  assert.throws(() => learnTemperedFlow(duplicate, signatureId), /owned Kiln Pulse/);
  const extraPulse = { ...owned, deck: [...owned.deck, { id: 'other', type: 'pulse' as const }] };
  assert.equal(learnTemperedFlow(extraPulse, signatureId).deck.find(c => c.id === 'other')!.upgrade, undefined);
});

test('invalid or incompatible technique definitions cannot enter a battle', () => {
  const invalid: CardInstance[] = [
    { type: 'strike', id: 'wrong-card', upgrade: 'tempered-flow' },
    { type: 'pulse', id: 'unknown', upgrade: 'unreleased' as CardUpgrade },
  ];
  for (const card of invalid) {
    assert.throws(() => cardDefinition(card), /Invalid card technique/);
    assert.throws(() => createBattle({ ...trained, deck: [card] }, PROTOTYPE_ENCOUNTER, 1), /Invalid card technique/);
  }
});

test('configured MP affordability and effects resolve the trained definition, preserving inputs', () => {
  const state = ready();
  const before = structuredClone(state);
  const available = cardAvailability(state, signature);
  assert.deepEqual([available.affordable, available.mpAfter, available.energyAfter], [true, 0, 1]);
  const next = playCard(state, signatureId);
  assert.deepEqual(state, before);
  assert.deepEqual([next.energy, next.mp, next.enemy.hp, next.hero.block, next.strain], [1, 0, 56, 6, 3]);
  assert.equal(next.discard.at(-1)!.id, signatureId);
  assert.equal(next.discard.at(-1)!.upgrade, 'tempered-flow');
  assert.match(next.log.at(-1)!, /Kiln Pulse \(Tempered Flow\)/);
  const base = createBattle({ ...PROTOTYPE_PROFILE, mp: 3 }, PROTOTYPE_ENCOUNTER, 1);
  assert.equal(cardAvailability(base, base.hand.find(c => c.type === 'pulse')!).affordable, false);
  assert.equal(playCard(base, signatureId), base);
});

test('unaffordable technique previews keep resources unchanged and explain both shortages', () => {
  const state = { ...ready(2), energy: 1 };
  const available = cardAvailability(state, signature);
  assert.equal(available.affordable, false);
  assert.equal(available.mpAfter, 2);
  assert.equal(available.energyAfter, 1);
  assert.match(available.mpReason, /needs 3, you have 2/);
  assert.match(available.energyReason, /needs 2, you have 1/);
  assert.equal(playCard(state, signatureId), state);
  const noMP = ready(0);
  assert.equal(playCard(noMP, signatureId), noMP);
  const attack = noMP.hand.find(c => c.type === 'strike')!;
  assert.notEqual(playCard(noMP, attack.id), noMP);
});

test('trained hot thresholds are evaluated before +3 strain and overload retains full effects', () => {
  for (const [heat, damage, after, overload] of [[5, 16, 8, false], [6, 18, 9, false], [7, 18, 4, true], [9, 18, 4, true]] as const) {
    const state = { ...ready(), strain: heat };
    const effect = preview(state, signature);
    assert.deepEqual([effect.damage, effect.strain, effect.overload], [damage, after, overload]);
    const next = playCard(state, signatureId);
    assert.equal(next.hero.hp, overload ? 54 : 60);
    assert.equal(next.hero.block, 6);
    assert.equal(next.enemy.hp, 72 - damage);
    assert.equal(next.mp, 0);
  }
});

test('trained simultaneous defeat is a loss after spending MP, block gain and overload', () => {
  const state = { ...ready(), strain: 7, hero: { hp: 6, block: 100 }, enemy: { hp: 18, block: 0 } };
  const next = playCard(state, signatureId);
  assert.deepEqual([next.hero.hp, next.enemy.hp, next.hero.block, next.mp, next.strain, next.outcome], [0, 0, 106, 0, 4, 'defeat']);
  assert.equal(endTurn(next), next);
  assert.equal(playCard(next, next.hand[0].id), next);
});

test('trained Pulse survives reshuffles and repeated use, without MP regeneration or extra copies', () => {
  const encounter = { ...PROTOTYPE_ENCOUNTER, enemy: { ...PROTOTYPE_ENCOUNTER.enemy,
    maxHp: 100, intents: [{ name: 'Idle', damage: 0, block: 0 }] } };
  let state = createBattle({ ...trained, mp: 9, deck: [signature] }, encounter, 42);
  for (let use = 1; use <= 3; use++) {
    const before = state;
    state = playCard(state, signatureId);
    assert.equal(state.mp, 9 - use * 3);
    assert.equal(state.hand.length, 0);
    assert.equal(state.discard.length, 1);
    assert.equal(playCard(state, signatureId, before.revision), state);
    state = endTurn(state);
    assert.equal(state.mp, 9 - use * 3);
    assert.deepEqual(state.hand, [signature]);
    assert.equal(state.draw.length + state.discard.length, 0);
  }
  assert.equal(playCard(state, signatureId), state);
});

test('normal trained opening hands still use seeded shuffles and conserve all twelve IDs', () => {
  let present = false, absent = false;
  for (let seed = 1; seed <= 100; seed++) {
    const state = createBattle(trained, PROTOTYPE_ENCOUNTER, seed);
    const all = [...state.hand, ...state.draw];
    assert.deepEqual(all.map(c => c.id).sort(), trained.deck.map(c => c.id).sort());
    assert.equal(all.filter(c => c.upgrade === 'tempered-flow').length, 1);
    present ||= state.hand.some(c => c.id === signatureId);
    absent ||= !state.hand.some(c => c.id === signatureId);
    assert.deepEqual(state, createBattle(trained, PROTOTYPE_ENCOUNTER, seed));
  }
  assert.ok(present && absent);
});

test('profile MP recovery is explicit, capped, immutable and independent of combat rewards', () => {
  const depleted = { ...trained, mp: 0 };
  Object.freeze(depleted);
  const partial = recoverMP(depleted, 2);
  assert.equal(partial.mp, 2);
  assert.equal(depleted.mp, 0);
  assert.deepEqual({ ...partial, mp: 0 }, depleted);
  assert.equal(recoverMP(partial, partial.maxMp).mp, partial.maxMp);
  assert.equal(recoverMP(partial, Number.MAX_SAFE_INTEGER).mp, partial.maxMp);
  assert.equal(recoverMP(depleted, 0), depleted);
  const full = { ...trained, mp: trained.maxMp };
  assert.equal(recoverMP(full, 2), full);
  assert.equal(recoverMP({ ...trained, maxMp: 0, mp: 0 }, 2).mp, 0);
  for (const amount of [-1, 0.5, NaN, Infinity]) assert.throws(() => recoverMP(depleted, amount));
  assert.throws(() => recoverMP({ ...depleted, mp: 11 }, 2), /Invalid profile MP/);
});
