import { campCentre } from '../../src/sim/map';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bisonDirection, effectsOf, stepEffects } from '../../src/sim/effects';
import { ENEMIES } from '../../src/sim/combat';
import type { GameState } from '../../src/sim/state';
import { castPower } from '../../src/sim/upgrades';
import { newGame, step } from '../../src/sim/tick';

function camp(): GameState {
  const s = newGame(1);
  s.wotakuye = 80;
  s.upgrades.push('bison_charge', 'storm_caller');
  return s;
}

function addWolf(s: GameState, x: number, y: number, kind = 'wolf'): number {
  const id = s.nextEnemyId++;
  s.enemies.push({ id, kind, x, y, hp: ENEMIES[kind].hp, cooldown: 0, fleeing: false, wave: 0 });
  return id;
}

test('the bison run from the nearest edge: a point near the west edge sends them east', () => {
  assert.deepEqual(bisonDirection(48, [5, 20]), [1, 0]);
  assert.deepEqual(bisonDirection(48, [44, 20]), [-1, 0]);
  assert.deepEqual(bisonDirection(48, [20, 4]), [0, 1]);
  assert.deepEqual(bisonDirection(48, [20, 43]), [0, -1]);
});

test('a bison herd hurts a wolf in its lane once, and misses one outside it', () => {
  const s = camp();
  const fy = campCentre(s.map)[1]; // wolves walk to the fire, so the lane runs along it
  const inLane = addWolf(s, 30, fy + 0.5);
  const outside = addWolf(s, 30, fy + 6);
  s.enemies.forEach((e) => (e.hp = 1000)); // survive to be counted
  assert.equal(castPower(s, 'bison_charge', [10, fy]), true);
  // Only the herd moves here (the wolves would walk to the fire and in or out of the lane): 47 tiles at 0.4 a tick.
  for (let i = 0; i < 130; i++) {
    s.tick++;
    stepEffects(s);
  }
  assert.equal(s.enemies.find((e) => e.id === inLane)!.hp, 1000 - 40, 'hit exactly once');
  assert.equal(s.enemies.find((e) => e.id === outside)!.hp, 1000, 'outside the lane');
  assert.equal(effectsOf(s).length, 0, 'the herd has crossed the map and is gone');
});

test('a bison herd never harms people', () => {
  const s = camp();
  const p = s.people[0];
  p.x = 25;
  p.y = 20;
  const before = s.people.map((q) => q.health);
  castPower(s, 'bison_charge', [10, 20]);
  step(s, 130);
  assert.deepEqual(s.people.map((q) => q.health), before);
});

test('a bison herd can kill a wolf (40 damage)', () => {
  const s = camp();
  const fy = campCentre(s.map)[1];
  addWolf(s, 30, fy);
  s.enemies[0].hp = 30;
  castPower(s, 'bison_charge', [10, fy]);
  step(s, 130);
  assert.equal(s.enemies.length, 0);
});

test('a storm slows wolves inside it to 40% and hurts them 2 a second', () => {
  const s = camp();
  const [fx, fy] = campCentre(s.map);
  // Two wolves 12 tiles from the fire; one inside the storm, one far from it.
  const inside = addWolf(s, fx + 12, fy);
  const free = addWolf(s, fx + 12, fy + 8);
  s.enemies.forEach((e) => (e.hp = 1000));
  castPower(s, 'storm_caller', [fx + 12, fy]);
  const at = (id: number) => { const e = s.enemies.find((q) => q.id === id)!; return [e.x, e.y]; };
  const [x0, y0] = at(inside);
  const [f0x, f0y] = at(free);
  step(s, 10);
  const wIn = s.enemies.find((e) => e.id === inside)!;
  const wFree = s.enemies.find((e) => e.id === free)!;
  assert.ok(Math.abs(Math.hypot(wIn.x - x0, wIn.y - y0) - 10 * 0.16 * 0.4) < 1e-6, 'slowed to 40%');
  assert.ok(Math.abs(wIn.hp - (1000 - 10 * 0.2)) < 1e-6, `hurt 2 a second: ${wIn.hp}`);
  assert.ok(Math.hypot(wFree.x - f0x, wFree.y - f0y) > 10 * 0.16 * 0.9, 'a wolf beyond the radius walks at full speed');
});

test('a storm lasts 200 ticks, and the power is spent for the wave', () => {
  const s = camp();
  assert.equal(castPower(s, 'storm_caller', [20, 20]), true);
  assert.equal(effectsOf(s).length, 1);
  step(s, 199);
  assert.equal(effectsOf(s).length, 1);
  step(s, 2);
  assert.equal(effectsOf(s).length, 0);
  assert.equal(castPower(s, 'storm_caller', [20, 20]), false, 'spent until the next wave warning');
});

test('a storm leaves people alone', () => {
  const s = camp();
  const p = s.people[0];
  castPower(s, 'storm_caller', [p.x, p.y]);
  const before = s.people.map((q) => q.health);
  step(s, 50);
  assert.deepEqual(s.people.map((q) => q.health), before);
});

test('a state without effects (an older file) still runs', () => {
  const s = camp();
  delete (s as unknown as { effects?: unknown }).effects;
  step(s, 5);
  assert.deepEqual(effectsOf(s), []);
});
