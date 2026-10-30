import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newBattle, playCard, endTurn, preview } from '../client/src/game/combat';
import type { BattleState } from '../client/src/game/types';

function pulseBattle(): BattleState {
  return { ...newBattle(1), hand: [{ type: 'pulse', id: 'pulse' }, { type: 'strike', id: 'strike' }], draw: [], discard: [] };
}

test('Kiln Pulse spends energy and MP, deals damage, grants block, and adds strain', () => {
  const state = pulseBattle();
  const next = playCard(state, 'pulse');
  assert.equal(next.energy, 1);
  assert.equal(next.mp, 6);
  assert.equal(next.enemy.hp, 56);
  assert.equal(next.hero.block, 6);
  assert.equal(next.strain, 4);
  assert.equal(state.mp, 10);
});

test('Pulse cannot spend missing MP or energy; ordinary cards work at zero MP', () => {
  const lowMP = { ...pulseBattle(), mp: 3 };
  assert.equal(playCard(lowMP, 'pulse'), lowMP);
  const lowEnergy = { ...pulseBattle(), energy: 1 };
  assert.equal(playCard(lowEnergy, 'pulse'), lowEnergy);
  const ordinary = { ...pulseBattle(), mp: 0 };
  assert.notEqual(playCard(ordinary, 'strike'), ordinary);
  assert.equal(playCard(ordinary, 'strike').mp, 0);
});

test('Pulse receives hot damage before adding strain and overload bypasses its new block', () => {
  const state = { ...pulseBattle(), strain: 6 };
  const effect = preview(state, state.hand[0]);
  assert.equal(effect.damage, 18);
  assert.equal(effect.overload, true);
  const next = playCard(state, 'pulse');
  assert.equal(next.enemy.hp, 54);
  assert.equal(next.hero.hp, 54);
  assert.equal(next.hero.block, 6);
  assert.equal(next.strain, 4);
  assert.equal(next.mp, 6);
});

test('Pulse returns after reshuffling, is reusable, and MP does not refill at end turn', () => {
  let state = playCard(pulseBattle(), 'pulse');
  state = endTurn(state);
  assert.equal(state.mp, 6);
  assert.ok(state.hand.some(c => c.id === 'pulse'));
  state = playCard(state, 'pulse');
  assert.equal(state.mp, 2);
  assert.equal(state.enemy.hp, 40);
  state = endTurn(state);
  assert.equal(state.mp, 2);
  assert.equal(playCard(state, 'pulse'), state);
});

test('ordinary starting hands do not guarantee Pulse and the deck has exactly one copy', () => {
  let seen = false, absent = false;
  for (let seed = 1; seed <= 40; seed++) {
    const state = newBattle(seed);
    assert.equal([...state.hand, ...state.draw].filter(c => c.type === 'pulse').length, 1);
    const present = state.hand.some(c => c.type === 'pulse');
    seen ||= present;
    absent ||= !present;
  }
  assert.ok(seen && absent);
});
