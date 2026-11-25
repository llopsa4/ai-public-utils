import assert from 'node:assert/strict';
import { test } from 'node:test';
import { barButtons } from '../src/sim/abilities';
import { addZombie, cloneBase, createBase, restoreBase, stepBase } from '../src/sim/base';
import { BOND, bondAim, bondPlaying, bondTargets, startBond } from '../src/sim/bond';
import { type MissionSpec, type MissionState, createMission, stepMission } from '../src/sim/mission';
import { TICK_HZ } from '../src/sim/time';
import { dist } from '../src/sim/vision';

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));
const corner = { x: 0, y: 0, w: 1, h: 1 };
const pair = [
  { id: 'fighter', kind: 'fighter' as const, x: 6, y: 12 },
  { id: 'scout', kind: 'scout' as const, x: 6, y: 14 },
];

function mission(enemies: MissionSpec['enemies'], extra: Partial<MissionSpec> = {}): MissionState {
  return createMission({ map: open(32), extract: corner, survivors: pair, enemies, bond: true, ...extra });
}
const z = (id: string, x: number, y: number): MissionSpec['enemies'][number] => ({ id, kind: 'zombie', x, y });
const unitOf = (s: MissionState, id: string) => s.survivors.find((u) => u.id === id)!;
const enemy = (s: MissionState, id: string) => s.enemies.find((e) => e.id === id)!;

/** Steps until the set piece ends (or `max` ticks) and returns how many ticks it took. */
function playOut(s: MissionState, max = 200): number {
  let n = 0;
  while (bondPlaying(s) && n < max) {
    stepMission(s);
    n++;
  }
  return n;
}

test('the circle marks up to 3 live zombies nearest its centre, within its radius', () => {
  const s = mission([z('a', 12, 12), z('b', 13, 12), z('c', 12, 14), z('d', 14, 13), z('far', 12, 12 + BOND.radius + 1)]);
  enemy(s, 'c').hp = 0;
  assert.deepEqual(bondTargets(s, [12, 12]), ['a', 'b', 'd']);
  assert.deepEqual(bondTargets(s, [30, 30]), []);
});

test('the centre must be within reach of both survivors and mark at least one zombie', () => {
  const s = mission([z('a', 14, 13), z('b', 28, 13)]);
  assert.equal(bondAim(s, [14, 13]).refusal, null);
  assert.equal(bondAim(s, [28, 13]).refusal, 'far'); // 22 tiles from both
  assert.equal(bondAim(s, [8, 20]).refusal, 'empty');
  assert.equal(startBond(s, [28, 13]), false);
  assert.equal(s.bond!.used, false);
});

test('a scene without the move (the Intro) refuses it and shows no button', () => {
  const s = mission([z('a', 12, 12)], { bond: false });
  assert.equal(s.bond, null);
  assert.equal(bondAim(s, [12, 12]).refusal, 'none');
  assert.equal(startBond(s, [12, 12]), false);
  assert.ok(!barButtons(s, unitOf(s, 'fighter')).some((b) => b.id === 'bond'));
});

test('both must be alive', () => {
  const s = mission([z('a', 12, 12)]);
  unitOf(s, 'scout').hp = 0;
  assert.equal(bondAim(s, [12, 12]).refusal, 'dead');
  assert.ok(!barButtons(s, unitOf(s, 'fighter')).find((b) => b.id === 'bond')!.enabled);
});

test('the set piece kills every marked zombie silently in about 4-6 s, and the world waits', () => {
  const s = mission([z('a', 13, 11), z('b', 14, 13), z('c', 13, 15), z('other', 24, 24)]);
  const other = { ...enemy(s, 'other') };
  assert.ok(startBond(s, [13, 13]));
  assert.ok(bondPlaying(s));
  const n = playOut(s);
  assert.ok(!bondPlaying(s));
  assert.ok(n >= 2 * TICK_HZ && n <= BOND.maxTime * TICK_HZ, `took ${n} ticks`);
  for (const id of ['a', 'b', 'c']) assert.equal(enemy(s, id).hp, 0, id);
  assert.equal(s.bodies.length, 3);
  assert.equal(s.noises.length, 0);
  assert.equal(s.rings.length, 0);
  const o = enemy(s, 'other');
  assert.deepEqual([o.x, o.y, o.hp, o.ai.mode], [other.x, other.y, other.hp, other.ai.mode]); // frozen
  const cass = unitOf(s, 'fighter');
  const eli = unitOf(s, 'scout');
  assert.equal(cass.hp, 100);
  assert.equal(eli.hp, 100);
  assert.deepEqual([cass.order, eli.order, cass.running, eli.running, cass.stance, eli.stance], [null, null, false, false, 'walk', 'walk']);
  assert.ok(dist(cass.x, cass.y, eli.x, eli.y) >= 2, 'Eli ends a little further on');
});

test('the move works once per scene: the button shows it used', () => {
  const s = mission([z('a', 12, 12), z('b', 20, 20)]);
  assert.ok(startBond(s, [12, 12]));
  playOut(s);
  assert.equal(bondAim(s, [20, 20]).refusal, 'used');
  assert.equal(startBond(s, [20, 20]), false);
  const b = barButtons(s, unitOf(s, 'scout')).find((b) => b.id === 'bond')!;
  assert.deepEqual([b.enabled, b.label, b.key], [false, 'Bond (used)', 'J']);
});

test('Base 1: herd zombies cannot be marked; roamers can; hunger waits during the set piece', () => {
  const s = createBase({ calm: true });
  const cass = s.survivors.find((u) => u.kind === 'fighter')!;
  const [cx, cy] = [Math.round(cass.x) + 3, Math.round(cass.y)];
  addZombie(s, cx, cy, [0, 1], 'h1');
  assert.deepEqual(bondTargets(s, [cx, cy]), []);
  addZombie(s, cx, cy + 1, [0, 1], 'r9');
  assert.deepEqual(bondTargets(s, [cx, cy]), ['r9']);
  const hunger = s.hunger[cass.id]!.left;
  assert.ok(startBond(s, [cx, cy]));
  let n = 0;
  while (bondPlaying(s) && n++ < 200) stepBase(s);
  assert.equal(s.enemies.find((e) => e.id === 'r9')!.hp, 0);
  assert.ok(s.enemies.find((e) => e.id === 'h1')!.hp > 0);
  assert.equal(s.hunger[cass.id]!.left, hunger);
});

test('Base 1: the used flag is saved in the checkpoint; an older checkpoint without it still loads', () => {
  const s = createBase({ calm: true });
  s.herd.warned = true;
  s.bond!.used = true;
  assert.equal(restoreBase(cloneBase(s))!.bond!.used, true);
  const old = cloneBase(s) as unknown as Record<string, unknown>;
  delete old.bond;
  assert.deepEqual(restoreBase(old)!.bond, { used: false, run: null });
});
