import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cycleNext, pressCard, selectIndex, squadCards } from '../src/render/squad';

// Z35: squad panel cards and the selection they drive (no Phaser).
const units = [
  { id: 'fighter', hp: 100, maxHp: 100 },
  { id: 'scout', hp: 60, maxHp: 100 },
  { id: 'third', hp: 0, maxHp: 100 },
];
const nameOf = (id: string): string => id.toUpperCase();

test('one card per survivor in roster order, with name, HP, key and selection', () => {
  const cards = squadCards(units, new Set(['scout']), nameOf, ['F1', 'F2']);
  assert.deepEqual(cards.map((c) => [c.id, c.name, c.hp, c.selected, c.key]), [
    ['fighter', 'FIGHTER', 100, false, 'F1'],
    ['scout', 'SCOUT', 60, true, 'F2'],
    ['third', 'THIRD', 0, false, ''],
  ]);
  assert.equal(cards[2]!.alive, false);
});

test('a dead survivor is never shown selected and shows no hunger', () => {
  const cards = squadCards(units, new Set(['third']), nameOf, [], () => ({ frac: 0.5, level: 'low' }));
  assert.equal(cards[2]!.selected, false);
  assert.equal(cards[2]!.hunger, undefined);
  assert.deepEqual(cards[0]!.hunger, { frac: 0.5, level: 'low' });
});

test('clicking a card selects only that survivor', () => {
  assert.deepEqual([...pressCard(units, new Set(['fighter']), 'scout', false)], ['scout']);
});

test('Shift-click adds a survivor and removes one already selected', () => {
  const both = pressCard(units, new Set(['fighter']), 'scout', true);
  assert.deepEqual([...both].sort(), ['fighter', 'scout']);
  assert.deepEqual([...pressCard(units, both, 'fighter', true)], ['scout']);
});

test('clicking a dead survivor or an unknown id leaves the selection as it was', () => {
  assert.deepEqual([...pressCard(units, new Set(['fighter']), 'third', false)], ['fighter']);
  assert.deepEqual([...pressCard(units, new Set(['fighter']), 'nobody', true)], ['fighter']);
});

test('F-keys pick by roster slot and ignore a dead or missing slot', () => {
  assert.equal(selectIndex(units, 0), 'fighter');
  assert.equal(selectIndex(units, 1), 'scout');
  assert.equal(selectIndex(units, 2), null);
  assert.equal(selectIndex(units, 5), null);
});

test('Tab cycles living survivors and wraps; with nothing selected it picks the first', () => {
  assert.equal(cycleNext(units, new Set()), 'fighter');
  assert.equal(cycleNext(units, new Set(['fighter'])), 'scout');
  assert.equal(cycleNext(units, new Set(['scout'])), 'fighter'); // the dead one is skipped
  assert.equal(cycleNext(units, new Set(['fighter', 'scout'])), 'scout'); // from the first selected
  assert.equal(cycleNext([{ id: 'x', hp: 0, maxHp: 1 }], new Set()), null);
});
