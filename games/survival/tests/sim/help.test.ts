import assert from 'node:assert/strict';
import { test } from 'node:test';
import data from '../../src/data/resources.json';
import { assignWorkers, placeBuilding } from '../../src/sim/buildings';
import { wotakuyeHelp } from '../../src/sim/help';
import type { GameState } from '../../src/sim/state';
import { newGame } from '../../src/sim/tick';
import { o } from './helpers';

const WINTER = 10800;
const has = (lines: string[], text: string): boolean => lines.some((l) => l.includes(text));

test('the start camp: 10 people without a bed cost 10 at the next day start', () => {
  const s = newGame(1);
  const h = wotakuyeHelp(s);
  assert.equal(h.band, 'Steady');
  assert.ok(has(h.live, '10 people have no bed: -10 at the next day start'), h.live.join(' | '));
  assert.ok(has(h.live, 'Gift tomorrow: +1 (Steady)'));
});

test('winter costs 3 a person, and a staffed healer eases it', () => {
  const s = newGame(1);
  s.tick = WINTER;
  assert.ok(has(wotakuyeHelp(s).live, 'no bed: -30 '));
  s.upgrades.push('healers');
  s.store.wood = 100;
  s.store.hides = 20;
  const lodge = placeBuilding(s, 'healers_lodge', o(28), o(26)).building!;
  lodge.done = true;
  assignWorkers(s, [s.people.find((p) => p.age === 'adult')!.id], lodge.id);
  assert.ok(has(wotakuyeHelp(s).live, 'no bed: -20 '), wotakuyeHelp(s).live.join(' | '));
});

test('everyone housed says so', () => {
  const s = newGame(1);
  for (const p of s.people) p.home = 1;
  assert.ok(has(wotakuyeHelp(s).live, 'Everyone has a bed'));
});

test('the next meal: covered by the store, or short with the penalty', () => {
  const s = newGame(1);
  s.store.food = 100;
  assert.ok(has(wotakuyeHelp(s).live, 'Next meal: +2 (the store covers it)'));
  s.store.food = 0;
  s.store.pemmican = 0;
  assert.ok(has(wotakuyeHelp(s).live, 'Next meal: 18 food short, about -9'), wotakuyeHelp(s).live.join(' | '));
  s.store.pemmican = 12; // 12 x 1.5 = 18 food units: covers the 18 the start camp needs
  assert.ok(has(wotakuyeHelp(s).live, 'Next meal: +2'));
  s.store.pemmican = 6; // 9 of 18: half
  assert.ok(has(wotakuyeHelp(s).live, 'Next meal: 9 food short, about -5'), wotakuyeHelp(s).live.join(' | '));
});

test('gift tomorrow and the band gaps, at the band edges', () => {
  const at = (w: number): GameState => {
    const s = newGame(1);
    s.wotakuye = w;
    return s;
  };
  let h = wotakuyeHelp(at(69));
  assert.equal(h.band, 'Steady');
  assert.ok(has(h.live, '1 more to United (at 70)'));
  assert.ok(has(h.live, 'Steady holds down to 40'));
  h = wotakuyeHelp(at(70));
  assert.equal(h.band, 'United');
  assert.ok(has(h.live, 'Gift tomorrow: +2 (United)'));
  assert.ok(!has(h.live, 'more to'), 'nothing above United');
  h = wotakuyeHelp(at(40));
  assert.equal(h.band, 'Steady');
  h = wotakuyeHelp(at(39));
  assert.equal(h.band, 'Strained');
  assert.ok(has(h.live, 'Gift tomorrow: 0 (Strained)'));
  assert.ok(has(h.live, '1 more to Steady (at 40)'));
  h = wotakuyeHelp(at(5));
  assert.equal(h.band, 'Quarrelling');
  assert.ok(!has(h.live, 'holds down'), 'nothing below Quarrelling');
});

test('the rules list the events and the four bands, with the current band marked', () => {
  const h = wotakuyeHelp(newGame(1));
  assert.ok(has(h.rules, 'Full meal: +2 (2 a day)'));
  assert.ok(has(h.rules, 'Short meal: -1, down to -9 with no food'));
  assert.ok(has(h.rules, 'A death: -8'));
  assert.ok(has(h.rules, 'No bed, each person each day: -1 (winter -3)'));
  assert.ok(has(h.rules, 'Wave beaten: +6, or +2 if someone died'));
  assert.ok(has(h.rules, 'United 70-100: work x1.2, newcomers join, gift +2 a day'));
  assert.ok(has(h.rules, 'Quarrelling 0-19: work x0.7, an adult leaves each day'));
  assert.equal(h.rules.filter((l) => l.startsWith('> ')).length, 1);
  assert.ok(h.rules.find((l) => l.startsWith('> '))!.includes('Steady 40-69'));
});

test('the numbers come from the data files: a changed value changes the text', () => {
  const s = newGame(1);
  const before = data.wotakuye.events.death;
  try {
    data.wotakuye.events.death = -5;
    assert.ok(has(wotakuyeHelp(s).rules, 'A death: -5'));
  } finally {
    data.wotakuye.events.death = before;
  }
  assert.ok(has(wotakuyeHelp(s).rules, 'A death: -8'));
});
