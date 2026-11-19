import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ENEMIES } from '../../src/sim/combat';
import { queueOrders } from '../../src/sim/orders';
import type { Enemy, GameState, Person } from '../../src/sim/state';
import { newGame, step } from '../../src/sim/tick';

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** A run with one adult standing at (24, 28) and nobody else, so a fight is the only thing going on. */
function duel(opts: { hunter: boolean; stance: Person['stance']; wolf: Partial<Enemy> & { kind?: string } }): { s: GameState; p: Person; e: Enemy } {
  const s = newGame(1);
  const p = s.people.find((q) => q.age === 'adult')!;
  s.people = [p];
  p.x = 24;
  p.y = 28;
  p.drafted = true;
  p.post = [24, 28];
  p.stance = opts.stance;
  p.society = opts.hunter ? 'hunters' : null;
  const kind = opts.wolf.kind ?? 'wolf';
  const e: Enemy = {
    id: s.nextEnemyId++, kind, x: 24, y: 24, hp: ENEMIES[kind].hp, cooldown: 0, fleeing: false, wave: 0, ...opts.wolf,
  };
  s.enemies.push(e);
  return { s, p, e };
}

test('a drafted hunter shoots a wolf from range 4 without moving', () => {
  const { s, p, e } = duel({ hunter: true, stance: 'hold', wolf: { x: 24, y: 24 } });
  assert.equal(dist(p, e), 4);
  let range = 0;
  for (let i = 0; i < 40 && e.hp === 40; i++) {
    range = dist(p, e);
    step(s, 1);
  }
  assert.ok(e.hp < 40, 'the bow hit');
  assert.ok(range > 1.0, `shot from ${range.toFixed(2)} tiles away`);
  assert.deepEqual([p.x, p.y], [24, 28]);
});

test('a club fighter must close in before a hit lands', () => {
  const { s, p, e } = duel({ hunter: false, stance: 'chase', wolf: { y: 20 } });
  let before = dist(p, e);
  let hitAt = Infinity;
  for (let i = 0; i < 300 && s.enemies.includes(e) && hitAt === Infinity; i++) {
    before = dist(p, e);
    const hp = e.hp;
    step(s, 1);
    if (e.hp < hp) hitAt = before;
  }
  assert.ok(hitAt <= 1.0, `club hit from ${hitAt.toFixed(2)} tiles`);
  assert.ok(p.y < 28, 'the fighter walked toward the wolf');
});

test('a wolf below 20% HP flees to the edge; the pack leader does not', () => {
  const { s, e } = duel({ hunter: false, stance: 'hold', wolf: { hp: 7 } });
  step(s, 1);
  assert.equal(e.fleeing, true);
  step(s, 400);
  assert.equal(s.enemies.length, 0, 'the wolf left the map');

  const leader = duel({ hunter: false, stance: 'hold', wolf: { kind: 'pack_leader', hp: 5 } });
  step(leader.s, 1);
  assert.equal(leader.e.fleeing, false);
});

test('an undrafted person flees to the fire and goes back to work later', () => {
  const { s, p, e } = duel({ hunter: false, stance: 'defend', wolf: { y: 25 } });
  p.drafted = false;
  p.post = null;
  p.x = 24;
  p.y = 28;
  step(s, 1);
  assert.equal(p.task.step, 'flee');
  s.enemies = [];
  step(s, 150);
  assert.notEqual(p.task.step, 'flee');
  assert.ok(e.hp > 0);
});

test('only drafted people take an attack order', () => {
  const { s, p, e } = duel({ hunter: true, stance: 'hold', wolf: { x: 40, y: 40 } });
  const other = newGame(1).people.find((q) => q.age === 'adult' && q.id !== p.id)!;
  s.people.push(other);
  queueOrders(s, [{ type: 'attack', ids: [p.id, other.id], enemy: e.id }]);
  step(s, 1);
  assert.equal(p.attackTarget, e.id);
  assert.equal(other.attackTarget, null);
});
