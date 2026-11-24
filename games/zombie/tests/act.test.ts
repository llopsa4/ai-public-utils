import assert from 'node:assert/strict';
import { test } from 'node:test';
import { orderTakedown, selectWeapon, useLure } from '../src/sim/abilities';
import { type MissionSpec, type MissionState, createMission, orderAttack, stepMission } from '../src/sim/mission';

// Z24: every action sets `act: {kind, tick}` on the unit that does it (the renderer plays the one-shot).

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));
const corner = { x: 0, y: 0, w: 1, h: 1 };

function mission(spec: Partial<MissionSpec> & Pick<MissionSpec, 'survivors' | 'enemies'>): MissionState {
  return createMission({ map: open(24), extract: corner, ...spec });
}
function run(s: MissionState, ticks: number): void {
  for (let i = 0; i < ticks; i++) stepMission(s);
}
const unitOf = (s: MissionState, id: string) => s.survivors.find((u) => u.id === id)!;
const enemy = (s: MissionState, id: string) => s.enemies.find((e) => e.id === id)!;

const zombieNear = { id: 'z', kind: 'zombie' as const, x: 11, y: 10 };

test('units start with no action cue', () => {
  const s = mission({
    survivors: [{ id: 'f', kind: 'fighter', x: 10, y: 10 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 20, y: 20 }],
  });
  assert.equal(unitOf(s, 'f').act, null);
  assert.equal(enemy(s, 'z').act, null);
});

test('the knife sets a stab cue at the tick of the hit', () => {
  const s = mission({ survivors: [{ id: 'f', kind: 'fighter', x: 10, y: 10 }], enemies: [zombieNear] });
  orderAttack(s, ['f'], 'z');
  run(s, 3);
  const f = unitOf(s, 'f');
  assert.equal(f.act?.kind, 'stab');
  assert.ok(f.act!.tick <= s.tick);
  assert.ok(enemy(s, 'z').hp < 60);
});

test('the pistol sets a shot cue and the club a club cue', () => {
  const s = mission({ survivors: [{ id: 's', kind: 'scout', x: 10, y: 10 }], enemies: [zombieNear] });
  orderAttack(s, ['s'], 'z');
  run(s, 3);
  assert.equal(unitOf(s, 's').act?.kind, 'shot');

  const c = mission({ survivors: [{ id: 's', kind: 'scout', x: 10, y: 10 }], enemies: [zombieNear] });
  assert.ok(selectWeapon(c, 's', 'club'));
  orderAttack(c, ['s'], 'z');
  run(c, 3);
  assert.equal(unitOf(c, 's').act?.kind, 'club');
});

test('a lure sets a throw cue and a takedown sets its cue when the 1 s starts', () => {
  const s = mission({ survivors: [{ id: 's', kind: 'scout', x: 10, y: 10 }], enemies: [{ id: 'z', kind: 'zombie', x: 20, y: 20 }] });
  s.tick = 7;
  assert.ok(useLure(s, 's', [14, 10]));
  assert.deepEqual(unitOf(s, 's').act, { kind: 'throw', tick: 7 });

  const t = mission({
    survivors: [{ id: 'f', kind: 'fighter', x: 10, y: 10 }],
    enemies: [{ id: 'h', kind: 'human', x: 11, y: 10, facing: [1, 0] }],
  });
  assert.ok(orderTakedown(t, 'f', 'h'));
  assert.equal(unitOf(t, 'f').act, null); // ordered, not started
  stepMission(t);
  assert.equal(unitOf(t, 'f').act?.kind, 'takedown');
  const started = unitOf(t, 'f').act!.tick;
  run(t, 3);
  assert.equal(unitOf(t, 'f').act!.tick, started); // set once, not every tick
});

test('a zombie that bites sets a bite cue; a guard that shoots sets a shot cue', () => {
  const s = mission({ survivors: [{ id: 'f', kind: 'fighter', x: 10, y: 10 }], enemies: [{ id: 'z', kind: 'zombie', x: 11, y: 10, facing: [-1, 0] }] });
  run(s, 30);
  assert.equal(enemy(s, 'z').act?.kind, 'bite');

  const g = mission({
    survivors: [{ id: 's', kind: 'scout', x: 10, y: 10 }],
    enemies: [{ id: 'h', kind: 'human', x: 14, y: 10, facing: [-1, 0] }],
  });
  run(g, 60);
  assert.equal(enemy(g, 'h').act?.kind, 'shot');
});
