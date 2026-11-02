import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CARDS, cardAvailability, endTurn, playCard, preview } from '../src/combat/combat';
import type { BattleState, CardType } from '../src/combat/types';
import { ENCOUNTERS, HERO_MAX_HP, REWARDS, STARTER_CARDS, TONIC, TUTORIAL, maraProfile } from '../src/content/combat';
import { buyTonic, drinkTonic, equip, finishBattle, newBag, newKit, optionsFor, startBattle, statsWith, validKit } from '../src/engine/kit';
import { parseSave, serializeSave } from '../src/engine/saveFile';
import { applyCommand, newGame } from '../src/engine/state';

// ----------------------------------------------------------------- the card rules (Kiln Courier's) ---
function fixture(types: CardType[], extra: Partial<BattleState> = {}): BattleState {
  const b = startBattle(newGame(), 'hatchScavenger', 1, false);
  return { ...b, draw: [], discard: [], hand: types.map((type, i) => ({ type, id: `test-${i}` })), ...extra };
}

test('a fight starts with the starter deck, full resources and a seeded, reproducible hand', () => {
  const s = startBattle(newGame(), 'hatchScavenger', 42, false);
  assert.deepEqual(s, startBattle(newGame(), 'hatchScavenger', 42, false));
  assert.equal(s.hand.length, 5);
  assert.equal(s.draw.length, 7);
  assert.equal(s.hero.hp, HERO_MAX_HP);
  assert.equal(s.enemy.hp, ENCOUNTERS.hatchScavenger.enemy.maxHp);
  assert.equal(s.energy, 3);
  assert.equal(s.mp, 10);
  assert.equal(STARTER_CARDS.length, 12);
});

test('cards spend energy, deal damage, add strain and are discarded; the input state is untouched', () => {
  const state = fixture(['strike']);
  const before = structuredClone(state);
  const next = playCard(state, 'test-0');
  assert.deepEqual(state, before);
  assert.equal(next.energy, 2);
  assert.equal(next.enemy.hp, 26 - CARDS.strike.damage!);
  assert.equal(next.strain, 1);
  assert.equal(next.discard[0].id, 'test-0');
});

test('strain: hot attacks hit harder, and reaching 10 overloads (6 HP, strain back to 4)', () => {
  const hot = fixture(['strike'], { strain: 6 });
  assert.equal(preview(hot, hot.hand[0]).damage, CARDS.strike.damage! + 2);
  const over = playCard(fixture(['piston'], { strain: 8 }), 'test-0');
  assert.equal(over.strain, 4);
  assert.equal(over.hero.hp, HERO_MAX_HP - 6);
});

test('ending the turn: the enemy acts on its intent, block absorbs it, and a new hand is drawn', () => {
  const guarded = playCard(fixture(['guard'], { draw: STARTER_CARDS.slice(0, 6).map(c => ({ ...c })) }), 'test-0');
  const after = endTurn(guarded);
  assert.equal(after.hero.hp, HERO_MAX_HP); // 5 block vs Collect (4)
  assert.equal(after.turn, 2);
  assert.equal(after.energy, 3);
  assert.equal(after.intent, 1);
  assert.equal(after.hand.length, 5);
  assert.ok(!cardAvailability(fixture(['pulse'], { energy: 1 }), { type: 'pulse', id: 'x' }).affordable);
});

// -------------------------------------------------------------------------- the guided fight ---
test('the guided fight has a fixed hand, asks for each step, and can be won', () => {
  let b = startBattle(newGame(), 'hatchScavenger', 7, true);
  assert.deepEqual(b.hand.map(c => c.id), [...TUTORIAL.hand]);
  assert.equal(b.practice?.requiredCardId, 'card-0');
  assert.equal(playCard(b, 'card-3'), b, 'other cards wait until the asked one is played');
  b = playCard(b, 'card-0');
  b.practice = { requiredCardId: 'card-3' };
  b = playCard(b, 'card-3');
  b.practice = { requiredCardId: null };
  b = endTurn(b);
  assert.ok(b.hand.some(c => c.id === 'card-11'), 'Kiln Pulse arrives on turn 2');
  b = playCard(b, 'card-11');
  // Play on: attack while affordable, end turn, until it is over.
  for (let guard = 0; guard < 40 && !b.outcome; guard++) {
    const card = b.hand.find(c => CARDS[c.type].damage && cardAvailability(b, c).affordable);
    b = card ? playCard(b, card.id) : endTurn(b);
  }
  assert.equal(b.outcome, 'victory');
});

// ------------------------------------------------------------------------- kit, bag and shop ---
test('winning pays salvage and a pressure coil; health and MP carry over', () => {
  const s = newGame();
  const b = { ...startBattle(s, 'hatchScavenger', 3, false), outcome: 'victory' as const, mp: 6 };
  b.hero = { hp: 41, block: 0 };
  finishBattle(s, b, 'hatchScavenger');
  assert.equal(s.bag.salvage, REWARDS.hatchScavenger.salvage);
  assert.deepEqual(s.bag.materials, { 'pressure-coil': 1 });
  assert.equal(s.kit.hp, 41);
  assert.equal(s.kit.mp, 6);
});

test('the merchant sells tonics for salvage, up to three; a tonic heals in a fight without energy', () => {
  const bag = { ...newBag(), salvage: 17 };
  assert.equal(buyTonic(bag), 'bought');
  assert.equal(buyTonic(bag), 'bought');
  assert.equal(buyTonic(bag), 'bought');
  assert.equal(buyTonic(bag), 'full');
  assert.equal(bag.salvage, 17 - 3 * TONIC.price);
  assert.equal(buyTonic({ ...newBag(), salvage: 4 }), 'noSalvage');
  const hurt = { ...startBattle(newGame(), 'hatchScavenger', 1, false) };
  hurt.hero = { hp: 30, block: 0 };
  const healed = drinkTonic(hurt, bag);
  assert.equal(healed.hero.hp, 30 + TONIC.heal);
  assert.equal(healed.energy, hurt.energy);
  assert.equal(bag.tonics, 2);
  const full = { ...hurt, hero: { hp: HERO_MAX_HP, block: 0 } };
  assert.equal(drinkTonic(full, bag), full, 'no tonic is wasted at full health');
  assert.equal(bag.tonics, 2);
});

test('gear: Oren\'s spares can be worn; the gauntlet stays; stats change as the items say', () => {
  const s = newGame();
  assert.equal(equip(s.kit, 'armor', 'light-armor'), false, 'not owned yet');
  applyCommand(s, { type: 'giveSpares' });
  assert.deepEqual(optionsFor(s.kit, 'armor'), ['patched-coat', 'light-armor']);
  assert.equal(equip(s.kit, 'armor', 'light-armor'), true);
  assert.equal(equip(s.kit, 'utility', 'quick-harness'), true);
  assert.equal(equip(s.kit, 'gauntlet', 'courier-gauntlet'), false, 'the gauntlet slot is locked');
  assert.equal(equip(s.kit, 'armor', 'quick-harness'), false, 'wrong slot');
  assert.deepEqual(statsWith(s.kit), { power: 0, defense: 1, speed: 3, maxMp: 10, attackStrain: 0 });
  assert.equal(statsWith(s.kit, 'armor', 'patched-coat').defense, 0);
  // Speed 3 adds a card to the opening hand.
  assert.equal(startBattle(s, 'hatchScavenger', 1, false).hand.length, 6);
  assert.ok(validKit(s.kit));
  assert.equal(maraProfile(s.kit).equipment!.armor.id, 'light-armor');
});

test('saves keep the kit and bag; older saves get a fresh kit; tampered kits are rejected', () => {
  const s = newGame();
  applyCommand(s, { type: 'giveSpares' });
  equip(s.kit, 'armor', 'light-armor');
  s.kit.hp = 44;
  s.bag = { salvage: 7, materials: { 'pressure-coil': 1 }, tonics: 1 };
  const round = parseSave(serializeSave(s));
  assert.ok(round.ok);
  assert.deepEqual(round.state, s);

  const old = JSON.parse(serializeSave(newGame()));
  old.version = 4;
  delete old.state.kit;
  delete old.state.bag;
  const migrated = parseSave(JSON.stringify(old));
  assert.ok(migrated.ok);
  assert.deepEqual(migrated.state.kit, newKit());
  assert.deepEqual(migrated.state.bag, newBag());

  for (const tamper of [
    (d: any) => { d.state.kit.hp = 999; },
    (d: any) => { d.state.kit.equipment.armor = { id: 'light-armor' }; },
    (d: any) => { d.state.kit.owned.push('heavy-gauntlet', 'heavy-gauntlet'); },
    (d: any) => { d.state.bag.tonics = 9; },
    (d: any) => { d.state.bag.materials = { gold: 3 }; },
  ]) {
    const d = JSON.parse(serializeSave(newGame()));
    tamper(d);
    assert.equal(parseSave(JSON.stringify(d)).ok, false);
  }
});
