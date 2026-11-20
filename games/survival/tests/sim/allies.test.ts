import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALLIES, alliesOf } from '../../src/sim/allies';
import { ENEMIES } from '../../src/sim/combat';
import type { GameState } from '../../src/sim/state';
import { castPower } from '../../src/sim/upgrades';
import { newGame, step } from '../../src/sim/tick';

/** A camp that owns both ally powers and is Steady, with no wave pending soon. */
function camp(): GameState {
  const s = newGame(1);
  s.wotakuye = 80;
  s.upgrades.push('spirit_warriors', 'guardian_wolves');
  return s;
}

function addWolf(s: GameState, x: number, y: number): number {
  const id = s.nextEnemyId++;
  s.enemies.push({ id, kind: 'wolf', x, y, hp: ENEMIES.wolf.hp, cooldown: 0, fleeing: false, wave: 0 });
  return id;
}

const fire = (s: GameState): [number, number] => [s.map.fire[0] + 1, s.map.fire[1] + 1];

test('Spirit warriors: four spirits appear around the fire; guardian wolves: five wolves', () => {
  const s = camp();
  assert.equal(castPower(s, 'spirit_warriors'), true);
  assert.equal(alliesOf(s).length, 4);
  assert.ok(alliesOf(s).every((a) => a.kind === 'spirit' && a.hp === 80));
  assert.equal(castPower(s, 'guardian_wolves'), true);
  assert.equal(alliesOf(s).filter((a) => a.kind === 'guardian').length, 5);
  const [fx, fy] = fire(s);
  for (const a of alliesOf(s)) assert.ok(Math.hypot(a.x - fx, a.y - fy) <= 2.5, 'near the fire');
});

test('allies vanish after 600 ticks', () => {
  const s = camp();
  castPower(s, 'spirit_warriors');
  step(s, 599);
  assert.equal(alliesOf(s).length, 4);
  step(s, 2);
  assert.equal(alliesOf(s).length, 0);
});

test('allies close in on a wolf and kill it', () => {
  const s = camp();
  const [fx, fy] = fire(s);
  castPower(s, 'spirit_warriors');
  castPower(s, 'guardian_wolves');
  addWolf(s, fx + 6, fy);
  step(s, 200);
  assert.equal(s.enemies.length, 0, 'the wolf is dead');
});

test('allies take damage from wolves, and a wolf targets an ally when it is the nearest in sight', () => {
  const s = camp();
  castPower(s, 'guardian_wolves');
  const ally = alliesOf(s)[0];
  s.enemies.push({ id: 99, kind: 'pack_leader', x: ally.x + 0.5, y: ally.y, hp: 90, cooldown: 0, fleeing: false, wave: 0 });
  const before = alliesOf(s).reduce((sum, a) => sum + a.hp, 0);
  step(s, 25);
  const after = alliesOf(s).reduce((sum, a) => sum + a.hp, 0);
  assert.ok(after < before || alliesOf(s).length < 5, `wolves hurt the allies (${before} -> ${after})`);
});

test('allies never harm people, and wait near the fire when no wolf is in sight', () => {
  const s = camp();
  castPower(s, 'spirit_warriors');
  const healthBefore = s.people.map((p) => p.health);
  step(s, 100);
  assert.deepEqual(s.people.map((p) => p.health), healthBefore);
  const [fx, fy] = fire(s);
  for (const a of alliesOf(s)) assert.ok(Math.hypot(a.x - fx, a.y - fy) <= 3, 'still near the fire');
});

test('an ally dies at 0 hp', () => {
  const s = camp();
  castPower(s, 'spirit_warriors');
  alliesOf(s)[0].hp = 0;
  step(s, 1);
  assert.equal(alliesOf(s).length, 3);
});

test('a state without allies (an older file) still runs', () => {
  const s = camp();
  delete (s as unknown as { allies?: unknown }).allies;
  step(s, 5);
  assert.deepEqual(alliesOf(s), []);
});

test('ally stats come from the data', () => {
  assert.equal(ALLIES.spirit.range, 1.2);
  assert.equal(ALLIES.guardian.hp, ENEMIES.wolf.hp);
  assert.equal(ALLIES.spirit.ticks, 600);
});
