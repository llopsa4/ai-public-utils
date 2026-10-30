import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, newBattle, currentIntent, playCard, endTurn, CARDS } from '../client/src/game/combat';
import { PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER } from '../client/src/content/encounter';
import type { CardType, CharacterProfile, EncounterDefinition } from '../client/src/game/types';
import { COOLING_RIG_SETUP } from './fixtures/encounters';

const { profile, encounter } = COOLING_RIG_SETUP;

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

test('explicit prototype setup matches the seed-only compatibility entry point', () => {
  for (let seed = 0; seed < 100; seed++) {
    assert.deepEqual(createBattle(PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER, seed), newBattle(seed));
  }
});

test('configured setup keeps current resources, maxima, IDs, intentions and seeded draws', () => {
  const state = createBattle(profile, encounter, 101);
  assert.deepEqual(state, createBattle(profile, encounter, 101));
  assert.equal(state.hero.hp, 42);
  assert.equal(state.mp, 3);
  assert.equal(state.config.hero.maxHp, 48);
  assert.equal(state.config.hero.maxMp, 6);
  assert.equal(state.enemy.hp, 27);
  assert.equal(state.energy, 2);
  assert.equal(state.hand.length, 3);
  assert.equal(state.draw.length, 4);
  assert.equal(state.strain + state.hero.block + state.enemy.block, 0);
  assert.equal(state.turn, 1);
  assert.equal(state.intent, 0);
  assert.deepEqual(currentIntent(state), encounter.enemy.intents[0]);
  assert.deepEqual([...state.hand, ...state.draw].map(c => c.id).sort(), profile.deck.map(c => c.id).sort());
  assert.deepEqual(state.log, [encounter.introduction]);
});

test('battle setup and transitions neither mutate nor retain references to caller inputs', () => {
  const owned = structuredClone(profile);
  const enemy = structuredClone(encounter);
  const ownedBefore = structuredClone(owned), enemyBefore = structuredClone(enemy);
  freeze(owned); freeze(enemy);
  let state = createBattle(owned, enemy, 8);
  assert.notEqual(state.config.encounter, enemy);
  assert.notEqual(state.config.encounter.enemy.intents, enemy.enemy.intents);
  const all = [...state.hand, ...state.draw];
  for (const card of owned.deck) assert.notEqual(all.find(c => c.id === card.id), card);
  const card = state.hand.find(c => CARDS[c.type].cost <= state.energy && (CARDS[c.type].mpCost ?? 0) <= state.mp)!;
  const before = structuredClone(state);
  state = playCard(state, card.id);
  assert.equal(before.revision, 0);
  state = endTurn(state);
  assert.deepEqual(owned, ownedBefore);
  assert.deepEqual(enemy, enemyBefore);
  assert.equal(state.config.hero.maxHp, 48);

  const mutableProfile = structuredClone(profile);
  const mutableEncounter = structuredClone(encounter);
  const isolated = createBattle(mutableProfile, mutableEncounter, 8);
  Object.assign(mutableProfile.deck[0], { id: 'changed' });
  Object.assign(mutableEncounter.enemy.intents[0], { damage: 999 });
  assert.equal(currentIntent(isolated).damage, 3);
  assert.ok([...isolated.hand, ...isolated.draw].some(c => c.id === 'rig-strike'));
});

test('configured enemy rotation, block expiry, energy and turn draws use encounter rules', () => {
  let state = createBattle(profile, encounter, 3);
  const before = structuredClone(state);
  state = endTurn(state);
  assert.equal(state.hero.hp, 39);
  assert.equal(state.enemy.block, 4);
  assert.equal(state.intent, 1);
  assert.equal(state.energy, 2);
  assert.equal(state.hand.length, 3);
  assert.equal(currentIntent(state).name, 'Release');
  assert.match(state.log.at(-1)!, /Rig gains 4 block/);
  state.hero.block = 1;
  state = endTurn(state);
  assert.equal(state.enemy.block, 0);
  assert.equal(state.hero.hp, 38);
  assert.equal(state.hero.block, 0);
  assert.equal(state.intent, 0);
  assert.equal(state.hand.length, 3);
  assert.equal(state.energy, 2);
  assert.equal(before.hero.hp, 42);
  assert.equal(before.revision, 0);
});

test('configured empty and short decks draw only available instances and permit zero MP', () => {
  for (const deck of [[], [{ id: 'only-cycle', type: 'cycle' as const }]]) {
    let state = createBattle({ ...profile, deck, maxMp: 0, mp: 0 }, { ...encounter, handSize: 7 }, 1);
    assert.equal(state.hand.length, deck.length);
    if (state.hand[0]) {
      state = playCard(state, state.hand[0].id);
      assert.equal(state.hand.length, 0);
      assert.equal(state.discard.length, 1);
    }
    state = endTurn(state);
    assert.equal(state.hand.length, deck.length);
    assert.equal(state.mp, 0);
  }
});

test('invalid configuration fails before starting an inconsistent battle', () => {
  const badProfiles: CharacterProfile[] = [
    { ...profile, hp: 49 }, { ...profile, hp: 0 }, { ...profile, mp: -1 },
    { ...profile, maxHp: NaN }, { ...profile, mp: 7 }, { ...profile, maxMp: -1 },
    { ...profile, deck: [profile.deck[0], profile.deck[0]] },
    { ...profile, deck: [{ id: 'bad', type: 'unknown' as CardType }] },
  ];
  const badEncounters: EncounterDefinition[] = [
    { ...encounter, enemy: { ...encounter.enemy, intents: [] } },
    { ...encounter, enemy: { ...encounter.enemy, maxHp: 0 } },
    { ...encounter, energyPerTurn: -1 }, { ...encounter, handSize: 1.5 },
    { ...encounter, enemy: { ...encounter.enemy, intents: [{ name: 'Bad', damage: -1, block: 0 }] } },
  ];
  for (const bad of badProfiles) assert.throws(() => createBattle(bad, encounter, 1), /Invalid battle setup/);
  for (const bad of badEncounters) assert.throws(() => createBattle(profile, bad, 1), /Invalid battle setup/);
});

test('both configured fixtures conserve cards across seeded complete battles and reject stale/terminal commands', () => {
  for (const [hero, opponent] of [[profile, encounter], [PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER]] as const) {
    const ids = hero.deck.map(c => c.id).sort();
    for (let seed = 1; seed <= 40; seed++) {
      let state = createBattle(hero, opponent, seed);
      for (let i = 0; i < 200 && !state.outcome; i++) {
        const before = state;
        const card = state.hand.find(c => CARDS[c.type].cost <= state.energy && (CARDS[c.type].mpCost ?? 0) <= state.mp);
        state = card ? playCard(state, card.id) : endTurn(state);
        assert.equal(endTurn(state, before.revision), state);
        if (card) assert.equal(playCard(state, card.id, before.revision), state);
        assert.deepEqual([...state.hand, ...state.draw, ...state.discard].map(c => c.id).sort(), ids);
        assert.ok(state.energy >= 0 && state.energy <= opponent.energyPerTurn);
      }
      assert.ok(state.outcome);
      assert.equal(endTurn(state), state);
      if (state.hand[0]) assert.equal(playCard(state, state.hand[0].id), state);
    }
  }
});
