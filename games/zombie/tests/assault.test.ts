// Z99: base-wave raiders (DESIGN §25) advance on the survivors, shoot those in view and are stopped by barricades.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import enemies from '../src/data/enemies.json';
import { nearestReachable, newAi } from '../src/sim/ai';
import { type BaseState, addRaider, addZombie, cloneBase, createBase, stepBase } from '../src/sim/base';
import { COVER, isBlocked } from '../src/sim/grid';
import { type MissionState, createMission, setStance, stepMission } from '../src/sim/mission';
import { findPath } from '../src/sim/path';
import { dist } from '../src/sim/vision';

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));
const corner = { x: 0, y: 0, w: 1, h: 1 };
const GUN = enemies.human.gun;

/** A mission whose humans are all raiders. */
function raid(map: string[], survivors: { id: string; kind: 'fighter' | 'scout'; x: number; y: number }[], raiders: { id: string; x: number; y: number; facing?: [number, number] }[]): MissionState {
  const s = createMission({ map, extract: corner, survivors, enemies: raiders.map((r) => ({ ...r, kind: 'human' as const })) });
  for (const e of s.enemies) e.ai = newAi('human', true);
  return s;
}
const runM = (s: MissionState, ticks: number): void => {
  for (let i = 0; i < ticks; i++) stepMission(s);
};
const runB = (s: BaseState, ticks: number): void => {
  for (let i = 0; i < ticks; i++) stepBase(s);
};

test('a raider is always alert and flagged; the flag never makes a zombie a raider', () => {
  const ai = newAi('human', true);
  assert.equal(ai.mode, 'alert');
  assert.equal(ai.assault, true);
  assert.equal(newAi('human').assault, undefined);
  assert.equal(newAi('human').mode, 'patrol');
  assert.equal(newAi('zombie', true).assault, undefined);
  assert.equal(newAi('zombie', true).mode, 'wander');
});

test('approach: a raider out of sight walks toward the nearest survivor without being shown the way', () => {
  const s = raid(open(32), [
    { id: 'fighter', kind: 'fighter', x: 3, y: 28 },
    { id: 'scout', kind: 'scout', x: 28, y: 28 },
  ], [{ id: 'g1', x: 4, y: 2, facing: [0, -1] }]);
  const g = s.enemies[0]!;
  const start = dist(g.x, g.y, 3, 28);
  runM(s, 30);
  assert.equal(g.ai.target, 'fighter', 'the nearer survivor');
  assert.ok(dist(g.x, g.y, 3, 28) < start - 4, `closed in: ${dist(g.x, g.y, 3, 28).toFixed(1)}`);
  assert.equal(g.ai.mode, 'alert');
  // it moves at the assault speed: 30 ticks at 2 tiles/s is 6 tiles
  assert.ok(Math.abs(start - dist(g.x, g.y, 3, 28) - 6) < 0.6);
});

test('firing: a raider with a survivor near in its cone stops and shoots at once, loudly', () => {
  const s = raid(open(24), [{ id: 'fighter', kind: 'fighter', x: 10, y: 14 }], [{ id: 'g1', x: 10, y: 10, facing: [0, 1] }]);
  const g = s.enemies[0]!;
  const u = s.survivors[0]!;
  stepMission(s);
  assert.equal(u.hp, u.maxHp - GUN.damage);
  assert.deepEqual([g.x, g.y], [10, 10], 'it stands still to fire');
  assert.equal(g.path.length, 0);
  assert.equal(g.act?.kind, 'shot');
  assert.ok(s.noises.some((n) => n.kind === 'shot' && n.from === 'g1'), 'the shot is a noise (it draws zombies)');
  runM(s, Math.round(GUN.cooldown * 10));
  assert.equal(u.hp, u.maxHp - 2 * GUN.damage, 'again after the cooldown');
});

test('a survivor seen beyond gun range is closed on, then shot', () => {
  const s = raid(open(24), [{ id: 'fighter', kind: 'fighter', x: 10, y: 19 }], [{ id: 'g1', x: 10, y: 10, facing: [0, 1] }]);
  const g = s.enemies[0]!;
  const u = s.survivors[0]!;
  stepMission(s);
  assert.equal(u.hp, u.maxHp, 'nine tiles: out of range');
  assert.ok(g.y > 10, 'it advances');
  runM(s, 10);
  assert.ok(u.hp < u.maxHp);
  assert.ok(dist(g.x, g.y, u.x, u.y) <= GUN.range + 1e-9);
});

test('a barricade line stops a raider; it shoots a standing survivor over it', () => {
  const map = open(24);
  map[12] = 'c'.repeat(24);
  const s = raid(map, [{ id: 'fighter', kind: 'fighter', x: 12, y: 18 }], [{ id: 'g1', x: 12, y: 2, facing: [0, 1] }]);
  const g = s.enemies[0]!;
  const u = s.survivors[0]!;
  runM(s, 120);
  assert.ok(g.y < 12, 'never crosses');
  assert.ok(dist(g.x, g.y, u.x, u.y) <= GUN.range + 1e-9, 'it fired from gun range');
  assert.ok(u.hp < u.maxHp, 'standing: hit over the cover');
});

test('behind the barricade line a crouched survivor is not shot; the raider waits facing them', () => {
  const map = open(24);
  map[12] = 'c'.repeat(24);
  const s = raid(map, [{ id: 'fighter', kind: 'fighter', x: 12, y: 14 }], [{ id: 'g1', x: 12, y: 2, facing: [0, 1] }]);
  setStance(s, 'fighter', 'crouch');
  const g = s.enemies[0]!;
  const u = s.survivors[0]!;
  runM(s, 200);
  assert.equal(u.hp, u.maxHp);
  assert.deepEqual([Math.round(g.x), Math.round(g.y)], [12, 11], 'the reachable tile nearest them');
  assert.equal(g.path.length, 0);
  assert.ok(g.facing[1] > 0.9, 'facing the survivor');
});

test('nearestReachable: the tile nearest the goal on this side of a wall, the start when sealed in, none off the map', () => {
  const map = open(10);
  map[5] = '##########';
  const s = createMission({ map, extract: corner, survivors: [], enemies: [] });
  assert.deepEqual(nearestReachable(s.grid, [3, 1], [7, 8]), [7, 4]);
  map[2] = '##########';
  const t = createMission({ map, extract: corner, survivors: [], enemies: [] });
  assert.deepEqual(nearestReachable(t.grid, [3, 3], [7, 8]), [7, 4]);
  assert.equal(nearestReachable(t.grid, [-1, 3], [7, 8]), null);
});

/** Fixes every opening at once (the rule under test is blocking, not the work). */
function sealAll(s: BaseState): void {
  for (const o of s.openings) {
    o.fixed = true;
    o.hp = 100;
    s.grid.tiles[o.y * s.grid.size + o.x] = COVER;
  }
}

test('Base 1 sealed: raiders stay outside and never chew a fixed opening; a zombie beside them does', () => {
  const s = createBase({ calm: true });
  sealAll(s);
  for (const u of s.survivors) {
    [u.x, u.y, u.path] = [27, 28, []];
    u.stance = 'crouch';
  }
  assert.equal(findPath(s.grid, [30, 45], [27, 28]), null, 'sealed');
  addRaider(s, 30, 45, [0, -1]);
  addRaider(s, 20, 40, [0, -1]);
  const raiders = s.enemies.filter((e) => e.kind === 'human');
  assert.deepEqual(raiders.map((e) => e.id), ['g1', 'g2']);
  runB(s, 400);
  for (const o of s.openings) assert.deepEqual([o.fixed, o.hp], [true, 100], `${o.id} untouched`);
  for (const e of raiders) {
    assert.ok(!isBlocked(s.grid, Math.round(e.x), Math.round(e.y)));
    assert.equal(findPath(s.grid, [Math.round(e.x), Math.round(e.y)], [27, 28]), null, `${e.id} is still outside`);
    assert.ok(dist(e.x, e.y, 27, 28) < dist(30, 45, 27, 28), `${e.id} came up to the house`);
    assert.equal(e.act, null, `${e.id} never bit or shot`);
  }
  for (const u of s.survivors) assert.equal(u.hp, u.maxHp);
  // the contrast: a zombie that hunts the same survivors chews its way in
  const z = addZombie(s, 30, 45, [0, -1], 'h1');
  s.herd.spawned = 1;
  runB(s, 400);
  assert.ok(s.enemies.find((e) => e.id === z)!.act?.kind === 'bite' || s.openings.some((o) => o.hp < 100));
});

test('a raider round-trips through a base checkpoint copy', () => {
  const s = createBase({ calm: true });
  addRaider(s, 30, 45);
  const c = cloneBase(s);
  assert.equal(c.enemies.at(-1)!.ai.assault, true);
  assert.equal(c.enemies.at(-1)!.side, 'human');
});
