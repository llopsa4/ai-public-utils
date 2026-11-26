import assert from 'node:assert/strict';
import { test } from 'node:test';
import enemies from '../src/data/enemies.json';
import { chasers, sinceSeen } from '../src/audio/mood';
import { damage } from '../src/sim/combat';
import { type MissionSpec, type MissionState, createMission, riseIn, risenId, stepMission } from '../src/sim/mission';
import { TICK_HZ } from '../src/sim/time';

// Z105: zombies and squatters fight (DESIGN §26): zombies hunt squatters, squatters shoot zombies, shots draw both,
// and a squatter a zombie kills rises as a zombie 30 s later.

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));

function mission(spec: Pick<MissionSpec, 'enemies'> & Partial<MissionSpec>): MissionState {
  return createMission({ map: open(40), win: 'squatters', survivors: [{ id: 'fighter', kind: 'fighter', x: 1, y: 38 }], ...spec });
}
function run(s: MissionState, ticks: number): void {
  for (let i = 0; i < ticks; i++) stepMission(s);
}
const enemy = (s: MissionState, id: string) => s.enemies.find((e) => e.id === id)!;
const RISE = Math.round(enemies.zombie.rise * TICK_HZ);
/** A second squatter far off, facing away, so a single death does not end a `squatters` mission. */
const spare = { id: 'h9', kind: 'human' as const, x: 38, y: 2, facing: [1, 0] as [number, number] };

test('a zombie sees a squatter in its sight radius, chases and bites it; the squatter turns and shoots back', () => {
  const s = mission({
    enemies: [
      { id: 'h1', kind: 'human', x: 10, y: 10, facing: [1, 0] },
      { id: 'z1', kind: 'zombie', x: 7.5, y: 10, facing: [1, 0] },
      spare,
    ],
  });
  stepMission(s);
  const z = enemy(s, 'z1');
  const h = enemy(s, 'h1');
  assert.equal(z.ai.mode, 'chase');
  assert.equal(z.ai.target, 'h1');
  assert.equal(h.hp, h.maxHp, 'the squatter does not see the zombie behind it yet');
  run(s, 20);
  assert.ok(h.hp < h.maxHp, 'bitten');
  assert.ok(z.hp < z.maxHp, 'shot by the squatter it bit');
});

test('a zombie out of its sight radius ignores a squatter', () => {
  const s = mission({
    enemies: [
      { id: 'h1', kind: 'human', x: 10, y: 10, facing: [1, 0] },
      { id: 'z1', kind: 'zombie', x: 5, y: 10, facing: [1, 0] },
      spare,
    ],
  });
  stepMission(s);
  assert.notEqual(enemy(s, 'z1').ai.mode, 'chase');
});

test('a squatter shoots a zombie in its cone and gun range, without raising the alarm; it keeps its patrol state', () => {
  const s = mission({
    enemies: [
      { id: 'h1', kind: 'human', x: 10, y: 10, facing: [1, 0] },
      { id: 'z1', kind: 'zombie', x: 16, y: 10, facing: [0, 1] },
      spare,
    ],
  });
  stepMission(s);
  const z = enemy(s, 'z1');
  assert.equal(z.hp, z.maxHp - enemies.human.gun.damage);
  assert.equal(enemy(s, 'h1').ai.mode, 'patrol');
  assert.equal(enemy(s, 'h1').ai.alarmed, false);
  assert.ok(s.noises.some((n) => n.kind === 'shot' && n.from === 'h1'));
  assert.ok(!s.noises.some((n) => n.kind === 'alarm'));
  run(s, 30);
  assert.equal(z.hp, 0, 'shot down');
});

test('a zombie behind a squatter, or beyond gun range, is not shot', () => {
  const s = mission({
    enemies: [
      { id: 'h1', kind: 'human', x: 10, y: 10, facing: [1, 0] },
      { id: 'z1', kind: 'zombie', x: 6, y: 10, facing: [0, 1] },
      { id: 'z2', kind: 'zombie', x: 18.5, y: 10, facing: [0, 1] },
      spare,
    ],
  });
  stepMission(s);
  assert.equal(enemy(s, 'z1').hp, enemy(s, 'z1').maxHp);
  assert.equal(enemy(s, 'z2').hp, enemy(s, 'z2').maxHp);
});

test('the shot draws another squatter and a zombie that hear it to check the spot', () => {
  const s = mission({
    enemies: [
      { id: 'h1', kind: 'human', x: 10, y: 10, facing: [1, 0] },
      { id: 'z1', kind: 'zombie', x: 16, y: 10, facing: [0, 1] },
      { id: 'h2', kind: 'human', x: 10, y: 20, facing: [0, 1] },
      { id: 'z2', kind: 'zombie', x: 10, y: 1, facing: [0, 1] },
      spare,
    ],
  });
  run(s, 2);
  assert.equal(enemy(s, 'h2').ai.mode, 'investigate');
  assert.deepEqual(enemy(s, 'h2').ai.goal, [10, 10]);
  assert.equal(enemy(s, 'z2').ai.mode, 'investigate');
  assert.deepEqual(enemy(s, 'z2').ai.goal, [10, 10]);
});

test('a squatter killed by a zombie rises as a zombie 30 s later; its body shows the countdown', () => {
  const s = mission({ enemies: [{ id: 'h1', kind: 'human', x: 10, y: 10, facing: [1, 0] }, spare] });
  const h = enemy(s, 'h1');
  damage(s, h, h.hp, 'zombie');
  const b = s.bodies.find((b) => b.id === 'h1')!;
  assert.equal(b.riseAt, s.tick + RISE);
  assert.equal(riseIn(s, b), enemies.zombie.rise);
  run(s, RISE - 1);
  assert.equal(riseIn(s, b), 1);
  assert.ok(s.bodies.includes(b), 'still a body');
  assert.equal(s.enemies.length, 2);
  stepMission(s);
  assert.ok(!s.bodies.some((b) => b.id === 'h1'), 'the body is gone');
  const r = enemy(s, risenId('h1'));
  assert.equal(r.kind, 'zombie');
  assert.equal(r.turned, true);
  assert.equal(r.hp, enemies.zombie.hp);
  assert.deepEqual([r.x, r.y], [10, 10]);
  assert.equal(s.decals.length, 1, 'the blood stays');
});

test('a squatter killed by anything else never rises', () => {
  const s = mission({ enemies: [{ id: 'h1', kind: 'human', x: 10, y: 10 }, { id: 'z1', kind: 'zombie', x: 30, y: 30 }, spare] });
  damage(s, enemy(s, 'h1'), 999, 'fighter');
  damage(s, enemy(s, 'z1'), 999, 'human');
  assert.ok(s.bodies.every((b) => b.riseAt === undefined && riseIn(s, b) === null));
});

test('a risen zombie is not needed for the win: the last squatter down wins with risen zombies walking', () => {
  const s = mission({ enemies: [{ id: 'h1', kind: 'human', x: 10, y: 10 }, spare] });
  damage(s, enemy(s, 'h1'), 999, 'zombie');
  run(s, RISE);
  assert.equal(enemy(s, risenId('h1')).hp > 0, true);
  assert.equal(s.status, 'playing');
  damage(s, enemy(s, 'h9'), 999, 'fighter');
  stepMission(s);
  assert.equal(s.status, 'success');
});

test('a carried body that rises is dropped at its carrier', () => {
  const s = mission({ enemies: [{ id: 'h1', kind: 'human', x: 10, y: 10 }, spare] });
  damage(s, enemy(s, 'h1'), 999, 'zombie');
  const u = s.survivors[0]!;
  s.bodies[0]!.carriedBy = u.id;
  u.carrying = 'h1';
  run(s, RISE);
  assert.equal(u.carrying, null);
  const r = enemy(s, risenId('h1'));
  assert.deepEqual([r.x, r.y], [Math.round(u.x), Math.round(u.y)]);
});

test('the music ignores a zombie chasing a squatter', () => {
  const s = mission({
    enemies: [
      { id: 'h1', kind: 'human', x: 10, y: 10, facing: [1, 0] },
      { id: 'z1', kind: 'zombie', x: 7.5, y: 10, facing: [1, 0] },
      spare,
    ],
  });
  stepMission(s);
  assert.equal(enemy(s, 'z1').ai.mode, 'chase');
  assert.equal(chasers(s), 0);
  assert.equal(sinceSeen(s), Infinity);
});
