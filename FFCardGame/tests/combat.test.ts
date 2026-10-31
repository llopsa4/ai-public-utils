import type { BattleState, CardType } from '../client/src/game/types';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, INTENTS, newBattle, playCard, endTurn, preview, draw } from '../client/src/game/combat.ts';

function fixture(types: CardType[], extra: Partial<BattleState> = {}): BattleState {
  return { ...newBattle(1), draw: [], discard: [], hand: types.map((type, i) => ({ type, id: `test-${i}` })), ...extra };
}
const playFirst = (state: BattleState) => playCard(state, state.hand[0].id);

test('new battle has the complete deck, correct resources, and reproducible seeded draws', () => {
  const state = newBattle(42);
  assert.deepEqual(state, newBattle(42));
  assert.notDeepEqual(state.hand, newBattle(43).hand);
  assert.equal(state.hand.length, 5);
  assert.equal(state.draw.length, 7);
  assert.equal(state.discard.length, 0);
  assert.equal(state.hero.hp, 60);
  assert.equal(state.enemy.hp, 72);
  assert.equal(state.energy, 3);
  assert.equal(state.mp, 10);
  assert.equal(state.strain, 0);
  assert.equal(state.hero.block + state.enemy.block, 0);
  const counts = [...state.hand, ...state.draw].reduce<Partial<Record<CardType, number>>>((out, c) => ({ ...out, [c.type]: (out[c.type] ?? 0) + 1 }), {});
  assert.deepEqual(counts, { strike: 3, guard: 3, piston: 2, vent: 1, shield: 1, cycle: 1, pulse: 1 });
});

test('card definitions match the agreed costs and effects', () => {
  assert.deepEqual(Object.values(CARDS).map(c => c.cost), [1, 1, 1, 0, 1, 0, 2]);
  assert.deepEqual([CARDS.strike.damage, CARDS.piston.damage, CARDS.guard.block, CARDS.shield.block, CARDS.cycle.draw], [6, 10, 5, 9, 2]);
});

test('playing a card is immutable, spends energy, and moves it to discard', () => {
  const state = fixture(['strike']);
  const before = structuredClone(state);
  const next = playFirst(state);
  assert.deepEqual(state, before);
  assert.equal(next.energy, 2);
  assert.equal(next.enemy.hp, 66);
  assert.equal(next.strain, 1);
  assert.equal(next.hand.length, 0);
  assert.equal(next.discard[0].id, 'test-0');
});

test('unaffordable, missing, and stale inputs have no effects', () => {
  const state = fixture(['piston'], { energy: 0 });
  assert.equal(playFirst(state), state);
  assert.equal(playCard(state, 'missing'), state);
  const affordable = fixture(['strike', 'piston']);
  const next = playFirst(affordable);
  assert.equal(playCard(next, 'test-0'), next);
  assert.equal(playCard(next, 'test-1', affordable.revision), next);
  assert.equal(endTurn(next, affordable.revision), next);
});

test('zero-cost cards work with zero energy and strain never falls below zero', () => {
  const state = fixture(['vent'], { energy: 0, strain: 2 });
  assert.equal(playFirst(state).strain, 0);
  assert.equal(playFirst(state).energy, 0);
});

test('hot bonus uses strain before the played card, including threshold boundaries', () => {
  for (const [strain, damage] of [[0, 10], [5, 10], [6, 12], [9, 12]]) {
    const state = fixture(['piston'], { strain });
    assert.equal(preview(state, state.hand[0]).damage, damage);
    assert.equal(playFirst(state).enemy.hp, 72 - damage);
  }
  const guard = fixture(['guard'], { strain: 6 });
  assert.equal(playFirst(guard).hero.block, 5);
});

test('overload is immediate, bypasses block, resets to four and preserves card effects', () => {
  const state = fixture(['shield'], { strain: 9, hero: { hp: 60, block: 20 } });
  const next = playFirst(state);
  assert.equal(next.hero.hp, 54);
  assert.equal(next.hero.block, 29);
  assert.equal(next.strain, 4);
  assert.equal(next.outcome, null);
  assert.equal(preview(state, state.hand[0]).overload, true);
});

test('attack damage consumes enemy block first', () => {
  const state = fixture(['strike'], { enemy: { hp: 72, block: 4 } });
  assert.equal(preview(state, state.hand[0]).hpDamage, 2);
  const next = playFirst(state);
  assert.equal(next.enemy.hp, 70);
  assert.equal(next.enemy.block, 0);
  const defended = fixture(['strike'], { enemy: { hp: 72, block: 10 } });
  assert.equal(playFirst(defended).enemy.hp, 72);
  assert.equal(playFirst(defended).enemy.block, 4);
});

test('end turn retains strain, absorbs attack with block, clears block, refills energy and draws five', () => {
  const state = newBattle(4);
  state.energy = 0;
  state.strain = 7;
  state.hero.block = 12;
  const next = endTurn(state);
  assert.equal(next.hero.hp, 60);
  assert.equal(next.hero.block, 0);
  assert.equal(next.strain, 7);
  assert.equal(next.energy, 3);
  assert.equal(next.hand.length, 5);
  assert.equal(next.discard.length, 5);
  assert.equal(next.turn, 2);
  assert.equal(next.intent, 1);
  assert.equal(state.hero.block, 12);
});

test('strain and its hot bonus persist between turns; vents and fresh fights still release heat', () => {
  let state = fixture(['strike'], { strain: 8 });
  const before = structuredClone(state);
  state = endTurn(state);
  assert.equal(state.strain, 8);
  assert.equal(before.strain, 8);
  const attack = state.hand.find(card => card.type === 'strike')!;
  assert.equal(preview(state, attack).damage, 8);
  state = playCard(state, attack.id);
  assert.equal(state.strain, 9);
  state = endTurn(state);
  assert.equal(state.strain, 9);
  const vent = fixture(['vent'], { strain: 9 });
  assert.equal(playFirst(vent).strain, 5);
  assert.equal(newBattle(42).strain, 0);
});

test('enemy intentions rotate and its remaining block expires before its next action', () => {
  let state = fixture([]);
  state = endTurn(state);
  assert.equal(state.hero.hp, 52);
  state = endTurn(state);
  assert.equal(state.enemy.block, 6);
  assert.equal(state.hero.hp, 48);
  state = endTurn(state);
  assert.equal(state.enemy.block, 0);
  assert.equal(state.hero.hp, 34);
  assert.equal(state.intent, 0);
  assert.deepEqual(INTENTS.map(i => i.damage), [8, 4, 14]);
});

test('draw exhausts the draw pile before shuffling discard, without duplicating cards', () => {
  const state = fixture([]);
  state.draw = [{ type: 'guard', id: 'first' }];
  state.discard = [{ type: 'vent', id: 'second' }, { type: 'strike', id: 'third' }];
  draw(state, 5);
  assert.equal(state.hand[0].id, 'first');
  assert.equal(state.hand.length, 3);
  assert.equal(new Set(state.hand.map(c => c.id)).size, 3);
  assert.equal(state.draw.length + state.discard.length, 0);
  draw(state, 2);
  assert.equal(state.hand.length, 3);
});

test('Pressure Cycle draws available cards, adds strain, and cannot draw itself while resolving', () => {
  const state = fixture(['cycle'], { energy: 0, strain: 5 });
  state.discard.push({ type: 'guard', id: 'discarded' });
  const next = playFirst(state);
  assert.deepEqual(next.hand.map(c => c.id), ['discarded']);
  assert.equal(next.discard[0].type, 'cycle');
  assert.equal(next.strain, 6);
  assert.equal(next.energy, 0);
  assert.match(next.log.at(-1)!, /Drew 1/);
  const empty = playFirst(fixture(['cycle']));
  assert.equal(empty.hand.length, 0);
  assert.equal(empty.discard.length, 1);
  assert.match(empty.log.at(-1)!, /Drew 0/);
});

test('simultaneous defeat is a loss after resolving the attack and overload', () => {
  const state = fixture(['piston'], { strain: 9, hero: { hp: 6, block: 100 }, enemy: { hp: 12, block: 0 } });
  const next = playFirst(state);
  assert.equal(next.hero.hp, 0);
  assert.equal(next.enemy.hp, 0);
  assert.equal(next.strain, 4);
  assert.equal(next.outcome, 'defeat');
});

test('victory and defeat stop all further card and enemy actions', () => {
  const victory = playFirst(fixture(['strike', 'piston'], { enemy: { hp: 6, block: 0 } }));
  assert.equal(victory.outcome, 'victory');
  assert.equal(endTurn(victory), victory);
  assert.equal(playCard(victory, 'test-1'), victory);
  const defeat = endTurn(fixture(['strike'], { hero: { hp: 1, block: 0 } }));
  assert.equal(defeat.outcome, 'defeat');
  assert.equal(defeat.turn, 1);
  assert.equal(endTurn(defeat), defeat);
  assert.equal(playCard(defeat, 'test-0'), defeat);
});

test('complete seeded battles conserve all 12 cards and resources across shuffles', () => {
  for (let seed = 1; seed <= 40; seed++) {
    let state = newBattle(seed);
    for (let i = 0; i < 150 && !state.outcome; i++) {
      const card = state.hand.find(c => CARDS[c.type].cost <= state.energy && (CARDS[c.type].mpCost ?? 0) <= state.mp);
      state = card ? playCard(state, card.id) : endTurn(state);
      const cards = [...state.hand, ...state.draw, ...state.discard];
      assert.equal(cards.length, 12);
      assert.equal(new Set(cards.map(c => c.id)).size, 12);
      assert.ok(state.energy >= 0 && state.energy <= 3);
      assert.ok(state.mp >= 0 && state.mp <= 10);
      assert.ok(state.strain >= 0 && state.strain < 10);
      assert.ok(state.hero.hp >= 0 && state.enemy.hp >= 0);
    }
    assert.ok(state.outcome, `Seed ${seed} should reach an outcome`);
  }
});
