import assert from 'node:assert/strict';
import { test } from 'node:test';
import chars from '../src/data/characters.json';
import { newWatch, observe } from '../src/render/fx';
import { barButtons, selectWeapon } from '../src/sim/abilities';
import { restoreBase, createBase } from '../src/sim/base';
import { activeWeapon, cooldownOf, weapon } from '../src/sim/combat';
import { buttonAction } from '../src/sim/keymap';
import { type MissionSpec, type Survivor, createMission, orderAttack, orderHold, orderMove, stepMission } from '../src/sim/mission';
import { TICK_HZ } from '../src/sim/time';
import { trackedEnemies } from '../src/sim/traits';

// Z80: Ray's and June's bow (DESIGN §5 *Bow*), arrows on the map, Hold bow-first (§13), Quick draw and Tracker.

const open = (n = 24): string[] => Array.from({ length: n }, () => '.'.repeat(n));

function mission(extra: Partial<MissionSpec> = {}) {
  return createMission({
    map: open(),
    extract: { x: 0, y: 0, w: 1, h: 1 },
    survivors: [{ id: 'r', kind: 'hunter', x: 5, y: 10 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 12, y: 10 }],
    ...extra,
  });
}
const ray = (s: ReturnType<typeof mission>): Survivor => s.survivors.find((u) => u.id === 'r')!;

test('the bow matches DESIGN §5: range 8, 30 damage, silent, 1.5 s, 8 arrows each', () => {
  const w = weapon('bow');
  assert.equal(w.range, 8);
  assert.equal(w.damage, 30);
  assert.equal(w.noise, 0);
  assert.equal(w.cooldown, 1.5);
  assert.equal(w.act, 'bow_shot');
  assert.equal(chars.quiver, 8);
  const s = mission({ survivors: [{ id: 'r', kind: 'hunter', x: 5, y: 10 }, { id: 'j', kind: 'archer', x: 5, y: 12 }, { id: 'c', kind: 'fighter', x: 5, y: 14 }] });
  assert.deepEqual(s.survivors.map((u) => u.arrows), [8, 8, undefined]);
});

test('a bow shot hits at range 7, makes no noise, spends an arrow and leaves it on the target tile', () => {
  const s = mission();
  orderAttack(s, ['r'], 'z');
  stepMission(s);
  const z = s.enemies[0]!;
  assert.equal(z.hp, 60 - 30);
  assert.equal(ray(s).arrows, 7);
  assert.deepEqual(s.looseArrows.map((a) => [a.x, a.y, a.owner]), [[12, 10, 'r']]);
  assert.equal(ray(s).act?.kind, 'bow_shot');
  assert.deepEqual(ray(s).act?.at, [12, 10]);
  assert.ok(!s.noises.some((n) => n.kind === 'shot' && n.radius > 0), 'silent');
  for (let i = 0; i < 20; i++) stepMission(s);
  assert.equal(z.hp, 0, 'two hits kill a 60 HP zombie');
  assert.equal(ray(s).arrows, 6);
});

test('out of range (9 tiles) the archer walks closer before shooting', () => {
  const s = mission({ enemies: [{ id: 'z', kind: 'zombie', x: 14, y: 10 }] });
  orderAttack(s, ['r'], 'z');
  stepMission(s);
  assert.equal(s.enemies[0]!.hp, 60);
  assert.equal(ray(s).arrows, 8);
});

test('walking over an arrow puts it back in its owner\'s quiver; anyone can pick it up', () => {
  const s = mission({ survivors: [{ id: 'r', kind: 'hunter', x: 5, y: 10 }, { id: 'c', kind: 'fighter', x: 12, y: 14 }] });
  orderAttack(s, ['r'], 'z');
  for (let i = 0; i < 20; i++) stepMission(s);
  assert.equal(ray(s).arrows, 6);
  assert.equal(s.looseArrows.length, 2);
  for (const a of [...s.looseArrows]) {
    orderMove(s, ['c'], [a.x, a.y]);
    for (let i = 0; i < 40; i++) stepMission(s);
  }
  assert.equal(s.looseArrows.length, 0);
  assert.equal(ray(s).arrows, 8, 'Cass hands both back to Ray');
  assert.equal(s.survivors[1]!.arrows, undefined);
});

test('with no arrows the bow is greyed and the attack falls back to the next usable weapon', () => {
  const s = mission({ ammo: 0 });
  const r = ray(s);
  r.arrows = 0;
  assert.equal(activeWeapon(s, r), 'hatchet');
  assert.equal(selectWeapon(s, 'r', 'bow'), false);
  const bow = barButtons(s, r).find((b) => b.id === 'weapon:bow')!;
  assert.equal(bow.enabled, false);
  assert.equal(bow.label, 'Bow 0');
});

test('the Bow button is the first weapon, shows the arrow count and is bound to Weapon 1; Weapon 3 exists', () => {
  const s = mission();
  const ids = barButtons(s, ray(s)).filter((b) => b.id.startsWith('weapon:'));
  assert.deepEqual(ids.map((b) => [b.id, b.key]), [['weapon:bow', '1'], ['weapon:pistol', '2'], ['weapon:hatchet', '3']]);
  assert.equal(ids[0]!.label, 'Bow 8');
  assert.equal(buttonAction('weapon:hatchet', '3'), 'weapon3');
});

test('Hold shoots the bow at an enemy in the cone, silently, without Free fire', () => {
  const s = mission();
  orderHold(s, 'r', [12, 10]);
  stepMission(s);
  assert.equal(s.enemies[0]!.hp, 30);
  assert.equal(ray(s).act?.kind, 'bow_shot');
  assert.ok(!s.noises.some((n) => n.kind === 'shot' && n.radius > 0));
});

test('Hold with no arrows: melee when adjacent, the pistol only with Free fire', () => {
  const s = mission({ enemies: [{ id: 'z', kind: 'zombie', x: 9, y: 10 }] });
  const r = ray(s);
  r.arrows = 0;
  orderHold(s, 'r', [9, 10]);
  stepMission(s);
  assert.equal(s.enemies[0]!.hp, 60, 'not adjacent, no Free fire: waits');
  r.freeFire = true;
  stepMission(s);
  assert.equal(s.enemies[0]!.hp, 60 - 25, 'Free fire: the pistol');
  assert.equal(r.act?.kind, 'shot');
});

test('Quick draw: June draws again in 0.75 s, Ray in 1.5 s', () => {
  const bow = weapon('bow');
  const s = mission({ survivors: [{ id: 'r', kind: 'hunter', x: 5, y: 10 }, { id: 'j', kind: 'archer', x: 5, y: 11 }] });
  assert.equal(cooldownOf(s.survivors[0]!, bow), 1.5);
  assert.equal(cooldownOf(s.survivors[1]!, bow), 0.75);
  assert.equal(cooldownOf(s.survivors[1]!, weapon('pistol')), 1);
  orderAttack(s, ['j'], 'z');
  stepMission(s);
  assert.equal(s.survivors[1]!.cooldown, Math.round(0.75 * TICK_HZ));
});

test('Tracker marks every living zombie within 6 tiles of Ray, walls or not, and none without him', () => {
  const map = open();
  map[10] = '.'.repeat(8) + '#' + '.'.repeat(15); // a wall between Ray and z1
  const s = createMission({
    map,
    extract: { x: 0, y: 0, w: 1, h: 1 },
    survivors: [{ id: 'r', kind: 'hunter', x: 5, y: 10 }, { id: 'c', kind: 'fighter', x: 20, y: 20 }],
    enemies: [
      { id: 'z1', kind: 'zombie', x: 11, y: 10 }, // 6 tiles, behind the wall
      { id: 'z2', kind: 'zombie', x: 12, y: 10 }, // 7 tiles
      { id: 'z3', kind: 'zombie', x: 5, y: 5 }, // 5 tiles
    ],
  });
  assert.deepEqual(trackedEnemies(s).map((e) => e.id), ['z1', 'z3']);
  s.enemies[2]!.hp = 0;
  assert.deepEqual(trackedEnemies(s).map((e) => e.id), ['z1']);
  const noRay = mission({ survivors: [{ id: 'c', kind: 'fighter', x: 11, y: 10 }] });
  assert.deepEqual(trackedEnemies(noRay), []);
});

test('a new bow shot sends one arrow flying in the fx events', () => {
  const s = mission();
  const w = newWatch();
  observe(w, s);
  orderAttack(s, ['r'], 'z');
  stepMission(s);
  const arrows = observe(w, s).filter((e) => e.kind === 'arrow');
  assert.deepEqual(arrows, [{ kind: 'arrow', x: 5, y: 10, tx: 12, ty: 10 }]);
  assert.equal(observe(w, s).filter((e) => e.kind === 'arrow').length, 0, 'once per shot');
});

test('arrows survive a JSON round trip, and a Base checkpoint saved before the bow still loads', () => {
  const s = mission();
  orderAttack(s, ['r'], 'z');
  stepMission(s);
  const back = JSON.parse(JSON.stringify(s)) as typeof s;
  assert.equal(back.survivors[0]!.arrows, 7);
  assert.equal(back.looseArrows.length, 1);
  const b = createBase({ calm: true }) as unknown as Record<string, unknown>;
  b.herd = { ...(b.herd as object), warned: true };
  delete b.looseArrows;
  assert.ok(restoreBase(JSON.parse(JSON.stringify(b))), 'old checkpoint without looseArrows');
});
