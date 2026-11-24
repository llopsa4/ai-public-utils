import assert from 'node:assert/strict';
import { test } from 'node:test';
import { barButtons, orderOpen, orderTakedown, selectWeapon, setFreeFire, toggleCarry, unlockGun, useLure } from '../src/sim/abilities';
import { damage } from '../src/sim/combat';
import { dist as distXY } from '../src/sim/vision';
import { type MissionSpec, type MissionState, createMission, orderAttack, orderMove, stepMission } from '../src/sim/mission';

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
  assert.deepEqual(s.loot, { food: 2, scrap: 3, ammo: 0 });
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

// ---- Weapons, ammo and the action bar (DESIGN §5, §17) ----

const scout = { id: 's', kind: 'scout' as const, x: 10, y: 10 };
const zombieAt = (x: number) => ({ id: 'z', kind: 'zombie' as const, x, y: 10, facing: [1, 0] as [number, number] });

test('a new mission has 3 ammo; each gun shot uses 1; the Gun greys out at 0', () => {
  const s = mission({ survivors: [scout], enemies: [zombieAt(14)] });
  assert.equal(s.ammo, 3);
  assert.equal(barButtons(s, unitOf(s, 's')).find((b) => b.id === 'weapon:pistol')!.enabled, true);
  orderAttack(s, ['s'], 'z');
  run(s, 1);
  assert.equal(s.ammo, 2);
  assert.equal(enemy(s, 'z').hp, 35);
  s.ammo = 0;
  const gun = barButtons(s, unitOf(s, 's')).find((b) => b.id === 'weapon:pistol')!;
  assert.equal(gun.enabled, false);
  assert.equal(selectWeapon(s, 's', 'pistol'), false);
});

test('a gun shot is loud and silent weapons are not; the Fighter has the knife only', () => {
  const s = mission({ survivors: [fighter, { ...scout, x: 12 }], enemies: [zombieAt(14)] });
  assert.deepEqual(barButtons(s, unitOf(s, 'f')).filter((b) => b.id.startsWith('weapon:')).map((b) => b.id), ['weapon:knife']);
  assert.deepEqual(barButtons(s, unitOf(s, 's')).filter((b) => b.id.startsWith('weapon:')).map((b) => b.id), ['weapon:pistol', 'weapon:club']);
  assert.equal(selectWeapon(s, 'f', 'pistol'), false);
  orderAttack(s, ['s'], 'z');
  stepMission(s);
  assert.ok(s.noises.some((n) => n.kind === 'shot' && n.from === 's'));
});

test("unlocking Cass's gun adds the Gun action, shares the ammo, plays a shot cue and is safe to repeat (DESIGN §5)", () => {
  const s = mission({ survivors: [fighter, { ...scout, x: 12 }], enemies: [zombieAt(14)] });
  assert.equal(unlockGun(s, 'f'), true);
  assert.equal(unlockGun(s, 'f'), false); // already has it: no duplicate
  assert.deepEqual(unitOf(s, 'f').weapons, ['knife', 'pistol']);
  assert.deepEqual(unitOf(s, 's').weapons, ['pistol', 'club']); // the scout is untouched
  const gun = () => barButtons(s, unitOf(s, 'f')).find((b) => b.id === 'weapon:pistol')!;
  assert.equal(gun().label, 'Gun 3');
  assert.equal(selectWeapon(s, 'f', 'pistol'), true);
  orderAttack(s, ['f'], 'z');
  run(s, 1);
  assert.equal(s.ammo, 2);
  assert.equal(unitOf(s, 'f').act?.kind, 'shot');
  s.ammo = 0;
  assert.equal(gun().enabled, false); // greys at 0 like the scout's
  assert.equal(selectWeapon(s, 'f', 'pistol'), false);
  assert.equal(unlockGun(s, 'nobody'), false);
});

test('at 0 ammo the Scout attacks with the club: walks up, 15 damage, silent, ammo stays 0', () => {
  const s = mission({ survivors: [scout], enemies: [zombieAt(15)], ammo: 0 });
  orderAttack(s, ['s'], 'z');
  run(s, 10);
  assert.equal(s.ammo, 0);
  assert.ok(enemy(s, 'z').hp < 60 || distXY(unitOf(s, 's').x, unitOf(s, 's').y, enemy(s, 'z').x, enemy(s, 'z').y) > 1.5);
  run(s, 80);
  assert.ok(enemy(s, 'z').hp <= 45);
  assert.ok(!s.noises.some((n) => n.kind === 'shot'));
  assert.equal(s.ammo, 0);
});

test('choosing the club makes a left-click attack use it even with ammo', () => {
  const s = mission({ survivors: [scout], enemies: [zombieAt(11)] });
  assert.ok(selectWeapon(s, 's', 'club'));
  assert.equal(unitOf(s, 's').weapon, 'club');
  orderAttack(s, ['s'], 'z');
  run(s, 1);
  assert.equal(enemy(s, 'z').hp, 45);
  assert.equal(s.ammo, 3);
  const club = barButtons(s, unitOf(s, 's')).find((b) => b.id === 'weapon:club')!;
  assert.equal(club.active, true);
});

test('crates can hold ammo: opening one adds it to the shared ammo and the loot', () => {
  const s = mission({ survivors: [scout], enemies: [], crates: [{ id: 'c', x: 11, y: 10, food: 0, scrap: 0, ammo: 4 }] });
  assert.ok(orderOpen(s, 's', 'c'));
  run(s, 30);
  assert.equal(s.ammo, 7);
  assert.equal(s.loot.ammo, 4);
});

test('bar buttons: crouch and hold show as active, the lure greys while it recharges', () => {
  const s = mission({ survivors: [scout], enemies: [] });
  const u = unitOf(s, 's');
  const find = (id: string) => barButtons(s, u).find((b) => b.id === id)!;
  assert.equal(find('crouch').active, false);
  u.stance = 'crouch';
  assert.equal(find('crouch').active, true);
  assert.equal(find('lure').enabled, true);
  useLure(s, 's', [12, 12]);
  assert.equal(find('lure').enabled, false);
  assert.deepEqual(barButtons(s, unitOf(s, 's')).map((b) => b.key), ['1', '2', 'L', 'V', 'Z', 'C']);
});

test('free fire: a survivor with a gun gets the toggle; one without a gun does not, and cannot set it', () => {
  const s = mission({ survivors: [scout, fighter], enemies: [] });
  const find = (id: string, b: string) => barButtons(s, unitOf(s, id)).find((x) => x.id === b);
  assert.equal(find('s', 'freefire')?.active, false);
  assert.ok(setFreeFire(s, 's', true));
  assert.equal(find('s', 'freefire')?.active, true);
  assert.ok(setFreeFire(s, 's', false));
  assert.equal(find('s', 'freefire')?.active, false);
  // the Fighter starts with the knife only (DESIGN §5), so no toggle until the gun unlocks
  assert.equal(find('f', 'freefire'), undefined);
  assert.equal(setFreeFire(s, 'f', true), false);
  assert.ok(unlockGun(s, 'f'));
  assert.equal(find('f', 'freefire')?.active, false);
  assert.ok(setFreeFire(s, 'f', true));
});
