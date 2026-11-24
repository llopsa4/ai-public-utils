import assert from 'node:assert/strict';
import { test } from 'node:test';
import { enemySees, nearTarget } from '../src/sim/ai';
import { damage } from '../src/sim/combat';
import { emitNoise } from '../src/sim/noise';
import { type MissionSpec, type MissionState, type Survivor, createMission, orderMove, orderHold, stepMission } from '../src/sim/mission';
import { dist } from '../src/sim/vision';

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));
const corner = { x: 0, y: 0, w: 1, h: 1 };

function mission(spec: Partial<MissionSpec> & Pick<MissionSpec, 'survivors' | 'enemies'>, n = 24): MissionState {
  return createMission({ map: open(n), extract: corner, ...spec });
}
function run(s: MissionState, ticks: number): void {
  for (let i = 0; i < ticks; i++) stepMission(s);
}
const enemy = (s: MissionState, id: string) => s.enemies.find((e) => e.id === id)!;

test('a lure pulls a zombie in range to the noise; one out of range ignores it', () => {
  const s = mission({
    survivors: [{ id: 'scout', kind: 'scout', x: 0, y: 23 }],
    enemies: [
      { id: 'z1', kind: 'zombie', x: 3, y: 8, facing: [0, -1] },
      { id: 'z2', kind: 'zombie', x: 20, y: 2, facing: [0, -1] },
    ],
  });
  emitNoise(s, 8, 8, 6, 'lure', 'scout');
  stepMission(s);
  assert.equal(enemy(s, 'z1').ai.mode, 'investigate');
  assert.deepEqual(enemy(s, 'z1').ai.goal, [8, 8]);
  assert.equal(enemy(s, 'z2').ai.mode, 'wander');
  run(s, 50);
  assert.ok(dist(enemy(s, 'z1').x, enemy(s, 'z1').y, 8, 8) < 0.5);
});

test('reach: a zombie walking to a lure is near within 2 tiles of it, not at 3; a chaser never is', () => {
  const s = mission({
    survivors: [{ id: 'scout', kind: 'scout', x: 0, y: 23 }],
    enemies: [{ id: 'z1', kind: 'zombie', x: 2, y: 8, facing: [1, 0] }],
  });
  emitNoise(s, 8, 8, 8, 'lure', 'scout');
  stepMission(s);
  const z = enemy(s, 'z1');
  assert.equal(z.ai.mode, 'investigate');
  assert.equal(z.ai.near, false);
  let sawFar = false;
  for (let i = 0; i < 80 && z.ai.mode === 'investigate'; i++) {
    stepMission(s);
    const d = dist(z.x, z.y, 8, 8);
    if (d > 2.05) assert.equal(z.ai.near, false, `at ${d.toFixed(2)}`);
    if (d >= 3) sawFar = true;
    if (d <= 1.95 && z.path.length > 0) assert.equal(z.ai.near, true, `at ${d.toFixed(2)}`);
  }
  assert.ok(sawFar);
  const chaser = { x: 0, y: 0, ai: { ...z.ai, mode: 'chase' as const } };
  assert.equal(nearTarget(chaser, [[0, 1]]), false);
  assert.equal(nearTarget({ ...chaser, ai: { ...z.ai, mode: 'wander' } }, [[0, 2]]), true);
  assert.equal(nearTarget({ ...chaser, ai: { ...z.ai, mode: 'wander' } }, [[0, 3]]), false);
});

test('zombie senses: 360° at 3 tiles, 2 if crouched; no cone beyond', () => {
  const s = mission({
    survivors: [{ id: 'f', kind: 'fighter', x: 10, y: 12 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 13, y: 12, facing: [1, 0] }], // facing away from the survivor
  });
  const f = s.survivors[0]!;
  const z = enemy(s, 'z');
  assert.ok(enemySees(s, z, f)); // exactly 3 tiles, behind its back
  f.x = 9.9;
  assert.ok(!enemySees(s, z, f)); // just past 3
  f.x = 10.5;
  f.stance = 'crouch';
  assert.ok(!enemySees(s, z, f)); // 2.5 tiles: seen standing, not crouched
  f.x = 11;
  assert.ok(enemySees(s, z, f)); // exactly 2 tiles crouched
  f.stance = 'walk';
  f.x = 10;
  f.y = 12;
  stepMission(s);
  assert.equal(z.ai.mode, 'chase');
});

test('zombie senses: a wall blocks, and a bush hides a crouched survivor unless adjacent', () => {
  const rows = open(16);
  rows[8] = '.'.repeat(7) + '#' + '.'.repeat(8); // wall at (7, 8)
  rows[3] = '.'.repeat(7) + 'b' + '.'.repeat(8); // bush at (7, 3)
  const s = createMission({
    map: rows,
    extract: corner,
    survivors: [
      { id: 'a', kind: 'fighter', x: 9, y: 8 },
      { id: 'b', kind: 'scout', x: 7, y: 3 },
    ],
    enemies: [
      { id: 'zw', kind: 'zombie', x: 6, y: 8, facing: [1, 0] },
      { id: 'zb', kind: 'zombie', x: 5, y: 3, facing: [1, 0] },
    ],
  });
  const [a, b] = s.survivors as [Survivor, Survivor];
  assert.ok(!enemySees(s, enemy(s, 'zw'), a)); // 3 tiles, but the wall is between
  assert.ok(enemySees(s, enemy(s, 'zb'), b)); // standing in a bush is seen at 2 tiles
  b.stance = 'crouch';
  assert.ok(!enemySees(s, enemy(s, 'zb'), b)); // hidden at 2 tiles
  enemy(s, 'zb').x = 6;
  assert.ok(enemySees(s, enemy(s, 'zb'), b)); // adjacent: seen
});

test('a human far cone spots a standing survivor only after 0.5 s', () => {
  const s = mission({
    survivors: [{ id: 'f', kind: 'fighter', x: 7, y: 12 }],
    enemies: [{ id: 'h', kind: 'human', x: 0, y: 12, facing: [1, 0] }],
  });
  run(s, 4);
  assert.equal(enemy(s, 'h').ai.mode, 'patrol');
  stepMission(s);
  assert.equal(enemy(s, 'h').ai.mode, 'alert');
});

test('a guard who sees a survivor raises an alarm that wakes another guard', () => {
  const s = mission({
    survivors: [{ id: 'f', kind: 'fighter', x: 5, y: 12 }],
    enemies: [
      { id: 'a', kind: 'human', x: 2, y: 12, facing: [1, 0] },
      { id: 'b', kind: 'human', x: 16, y: 12, facing: [1, 0] }, // 14 tiles: hears the alarm (15), not the shot (12)
    ],
  });
  stepMission(s);
  assert.equal(enemy(s, 'a').ai.mode, 'alert');
  assert.ok(s.noises.some((n) => n.kind === 'alarm' && n.from === 'a'));
  assert.equal(s.survivors[0]!.hp, 80); // shot at once
  assert.equal(enemy(s, 'b').ai.mode, 'patrol');
  stepMission(s);
  assert.equal(enemy(s, 'b').ai.mode, 'investigate');
  assert.deepEqual(enemy(s, 'b').ai.goal, [2, 12]);
});

test('a guard who sees a dead guard walks to the body, searches 10 s, then resumes patrol', () => {
  const s = mission({
    survivors: [{ id: 'f', kind: 'fighter', x: 22, y: 22 }],
    enemies: [
      { id: 'a', kind: 'human', x: 5, y: 5, facing: [0, -1] },
      { id: 'b', kind: 'human', x: 5, y: 10, facing: [0, -1] },
    ],
  });
  damage(s, enemy(s, 'a'), 999);
  assert.equal(s.bodies.length, 1);
  assert.equal(s.decals.length, 1);
  stepMission(s);
  assert.equal(enemy(s, 'b').ai.mode, 'body');
  assert.ok(s.bodies[0]!.found);
  run(s, 30);
  assert.equal(enemy(s, 'b').ai.mode, 'search');
  assert.ok(dist(enemy(s, 'b').x, enemy(s, 'b').y, 5, 5) < 0.01);
  run(s, 100);
  assert.equal(enemy(s, 'b').ai.mode, 'patrol');
});

test('hold: melee strikes an adjacent enemy; the gun fires only with Free fire; a new order ends it', () => {
  const s = mission(
    {
      survivors: [
        { id: 'scout', kind: 'scout', x: 3, y: 8 },
        { id: 'fighter', kind: 'fighter', x: 3, y: 2 },
      ],
      enemies: [
        { id: 'ahead', kind: 'zombie', x: 8, y: 8, facing: [1, 0] },
        { id: 'behind', kind: 'zombie', x: 0, y: 8, facing: [-1, 0] },
        { id: 'next', kind: 'zombie', x: 4, y: 2, facing: [1, 0] },
      ],
    },
    16,
  );
  assert.ok(orderHold(s, 'scout', [10, 8]));
  assert.ok(orderHold(s, 'fighter', [10, 2]));
  // Free fire is off by default: the scout holds fire at the zombie 5 tiles away
  stepMission(s);
  assert.equal(enemy(s, 'ahead').hp, 60);
  assert.ok(!s.noises.some((n) => n.kind === 'shot'));
  assert.equal(enemy(s, 'next').hp, 20); // knife 40, silent
  s.survivors.find((u) => u.id === 'scout')!.freeFire = true;
  stepMission(s);
  assert.equal(enemy(s, 'ahead').hp, 35); // gun 25
  assert.equal(enemy(s, 'behind').hp, 60);
  assert.ok(!s.noises.some((n) => n.kind === 'shot' && n.from === 'fighter'));

  orderMove(s, ['scout'], [3, 12]);
  assert.equal(s.survivors[0]!.order?.type, 'move');
  run(s, 20);
  assert.equal(enemy(s, 'ahead').hp, 35);
});

test('a survivor death fails the mission and freezes it', () => {
  const s = mission({
    survivors: [{ id: 'f', kind: 'fighter', x: 5, y: 5 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 6, y: 5, facing: [-1, 0] }],
  });
  s.survivors[0]!.hp = 10;
  stepMission(s);
  assert.equal(s.status, 'failed');
  assert.equal(s.survivors[0]!.hp, 0);
  assert.ok(s.bodies.some((b) => b.id === 'f'));
  const t = s.tick;
  stepMission(s);
  assert.equal(s.tick, t);
});

test('extract: both survivors in the zone with a crate opened is a success', () => {
  const s = mission({
    survivors: [
      { id: 'f', kind: 'fighter', x: 10, y: 22 },
      { id: 's', kind: 'scout', x: 11, y: 22 },
    ],
    enemies: [],
    crates: [{ id: 'c', x: 5, y: 5, food: 3, scrap: 0 }],
    extract: { x: 8, y: 21, w: 6, h: 3 },
  });
  stepMission(s);
  assert.equal(s.status, 'playing');
  s.crates[0]!.opened = true;
  stepMission(s);
  assert.equal(s.status, 'success');
});

test('mission state survives a JSON round trip', () => {
  const s = mission({
    survivors: [{ id: 'f', kind: 'fighter', x: 5, y: 5 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 15, y: 15 }],
  });
  run(s, 30);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});
