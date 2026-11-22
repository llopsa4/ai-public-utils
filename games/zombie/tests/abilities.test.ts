import assert from 'node:assert/strict';
import { test } from 'node:test';
import { orderOpen, orderTakedown, toggleCarry, useLure } from '../src/sim/abilities';
import { damage } from '../src/sim/combat';
import { type MissionSpec, type MissionState, createMission, orderMove, stepMission } from '../src/sim/mission';

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));
const corner = { x: 0, y: 0, w: 1, h: 1 };

function mission(spec: Partial<MissionSpec> & Pick<MissionSpec, 'survivors' | 'enemies'>, n = 24): MissionState {
  return createMission({ map: open(n), extract: corner, ...spec });
}
function run(s: MissionState, ticks: number): void {
  for (let i = 0; i < ticks; i++) stepMission(s);
}
const enemy = (s: MissionState, id: string) => s.enemies.find((e) => e.id === id)!;
const unitOf = (s: MissionState, id: string) => s.survivors.find((u) => u.id === id)!;

const fighter = { id: 'f', kind: 'fighter' as const, x: 10, y: 10 };

test('takedown from behind kills a guard silently after 1 s and leaves a body and blood', () => {
  const s = mission({ survivors: [fighter], enemies: [{ id: 'h', kind: 'human', x: 11, y: 10, facing: [1, 0] }] });
  assert.ok(orderTakedown(s, 'f', 'h'));
  run(s, 9);
  assert.equal(enemy(s, 'h').hp, 80);
  run(s, 1);
  assert.equal(enemy(s, 'h').hp, 0);
  assert.equal(s.bodies.length, 1);
  assert.equal(s.decals.length, 1);
  assert.ok(!s.noises.some((n) => n.kind === 'shot'));
  assert.equal(unitOf(s, 'f').order, null);
  assert.equal(s.status, 'playing');
});

test('a takedown on a guard who faces the fighter fails', () => {
  const s = mission({ survivors: [fighter], enemies: [{ id: 'h', kind: 'human', x: 11, y: 10, facing: [-1, 0] }] });
  assert.ok(orderTakedown(s, 'f', 'h'));
  stepMission(s);
  assert.equal(unitOf(s, 'f').order, null);
  assert.ok(enemy(s, 'h').hp > 0);
});

test('the fighter walks up to a distant target before the takedown starts', () => {
  const s = mission({ survivors: [fighter], enemies: [{ id: 'h', kind: 'human', x: 10, y: 5, facing: [0, -1] }] });
  assert.ok(orderTakedown(s, 'f', 'h'));
  run(s, 40);
  assert.equal(enemy(s, 'h').hp, 0);
});

test('only the fighter can take down; only the scout can lure', () => {
  const s = mission({
    survivors: [fighter, { id: 's', kind: 'scout', x: 12, y: 10 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 11, y: 10, facing: [1, 0] }],
  });
  assert.equal(orderTakedown(s, 's', 'z'), false);
  assert.equal(useLure(s, 'f', [12, 12]), false);
  assert.equal(toggleCarry(s, 's'), false);
});

test('carry picks up an adjacent body, slows the carrier to 60 %, and drop leaves it', () => {
  const s = mission({ survivors: [fighter], enemies: [{ id: 'z', kind: 'zombie', x: 11, y: 10, facing: [1, 0] }] });
  damage(s, enemy(s, 'z'), 999);
  assert.ok(toggleCarry(s, 'f'));
  const u = unitOf(s, 'f');
  assert.equal(s.bodies[0]!.carriedBy, 'f');
  orderMove(s, ['f'], [10, 20]);
  run(s, 20); // 2 s at 3 * 0.6 = 1.8 tiles/s
  assert.ok(Math.abs(u.y - 10 - 3.6) < 0.1, `moved to ${u.y}`);
  assert.equal(s.bodies[0]!.x, u.x);
  assert.equal(s.bodies[0]!.y, u.y);
  assert.ok(toggleCarry(s, 'f'));
  assert.equal(s.bodies[0]!.carriedBy, null);
  assert.equal(u.carrying, null);
  run(s, 10);
  assert.ok(s.bodies[0]!.y < u.y); // stays where it was dropped
});

test('nothing to carry when no body is adjacent', () => {
  const s = mission({ survivors: [fighter], enemies: [{ id: 'z', kind: 'zombie', x: 18, y: 18 }] });
  damage(s, enemy(s, 'z'), 999);
  assert.equal(toggleCarry(s, 'f'), false);
});

test('a lure makes a noise at the target, needs range and a 10 s cooldown, and pulls zombies', () => {
  const s = mission({
    survivors: [{ id: 's', kind: 'scout', x: 2, y: 20 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 9, y: 12, facing: [0, -1] }],
  });
  assert.equal(useLure(s, 's', [2, 8]), false); // 12 tiles: out of the 8 range
  assert.ok(useLure(s, 's', [6, 14]));
  assert.ok(s.noises.some((n) => n.kind === 'lure' && n.x === 6 && n.y === 14 && n.radius === 6));
  assert.equal(useLure(s, 's', [6, 14]), false); // cooling down
  stepMission(s);
  assert.equal(enemy(s, 'z').ai.mode, 'investigate');
  run(s, 99);
  assert.ok(useLure(s, 's', [6, 14]));
});

test('a crate takes 2 s to open and adds its loot; success needs one opened', () => {
  const zone = { x: 8, y: 8, w: 6, h: 6 };
  const s = mission({
    extract: zone,
    survivors: [fighter],
    enemies: [],
    crates: [{ id: 'c1', x: 11, y: 10, food: 2, scrap: 3 }],
  });
  run(s, 3);
  assert.equal(s.status, 'playing'); // in the zone, but no crate opened yet
  assert.ok(orderOpen(s, 'f', 'c1'));
  run(s, 19);
  assert.equal(s.crates[0]!.opened, false);
  run(s, 1);
  assert.equal(s.crates[0]!.opened, true);
  assert.deepEqual(s.loot, { food: 2, scrap: 3 });
  assert.equal(s.status, 'success');
  assert.equal(orderOpen(s, 'f', 'c1'), false); // already open
});

test('any new order interrupts opening a crate', () => {
  const s = mission({ survivors: [fighter], enemies: [], crates: [{ id: 'c1', x: 11, y: 10, food: 1, scrap: 1 }] });
  orderOpen(s, 'f', 'c1');
  run(s, 10);
  orderMove(s, ['f'], [5, 5]);
  run(s, 30);
  assert.equal(s.crates[0]!.opened, false);
});

test('a survivor death fails the mission', () => {
  const s = mission({ survivors: [fighter], enemies: [] });
  damage(s, unitOf(s, 'f'), 999);
  stepMission(s);
  assert.equal(s.status, 'failed');
});

test('m01: everything stands on a free tile and every crate and the extract zone are reachable', async () => {
  const { default: m01 } = await import('../src/data/missions/m01.json', { with: { type: 'json' } });
  const { isBlocked } = await import('../src/sim/grid');
  const { findPath } = await import('../src/sim/path');
  const s = createMission(m01 as unknown as MissionSpec);
  assert.equal(s.grid.size, 32);
  const start: [number, number] = [Math.round(s.survivors[0]!.x), Math.round(s.survivors[0]!.y)];
  for (const u of [...s.survivors, ...s.enemies]) assert.ok(!isBlocked(s.grid, Math.round(u.x), Math.round(u.y)), u.id);
  for (const e of s.enemies) for (const w of e.patrol) assert.ok(!isBlocked(s.grid, w[0], w[1]), `${e.id} waypoint ${w}`);
  for (const c of s.crates) {
    assert.ok(!isBlocked(s.grid, c.x, c.y), c.id);
    assert.ok(findPath(s.grid, start, [c.x, c.y]), `${c.id} reachable`);
  }
  assert.equal(s.crates.length, 3);
  assert.equal(s.enemies.filter((e) => e.kind === 'zombie').length, 2);
  assert.equal(s.enemies.filter((e) => e.kind === 'human').length, 1);
  for (let i = 0; i < 600; i++) stepMission(s); // runs without throwing
});
