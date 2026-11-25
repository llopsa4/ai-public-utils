import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type BaseState, addZombie, baseButtons, createBase, orderMove, placeBarricade, stepBase } from '../src/sim/base';
import { type TrapKind, REARM_TICKS, TRAP_TICKS, orderRearm, orderTrap, trapAt } from '../src/sim/traps';

const run = (s: BaseState, ticks: number): void => {
  for (let i = 0; i < ticks; i++) stepBase(s);
};
const fighter = (s: BaseState) => s.survivors[0]!;
const scout = (s: BaseState) => s.survivors[1]!;
const put = (u: { x: number; y: number; path: unknown[] }, x: number, y: number): void => {
  [u.x, u.y, u.path] = [x, y, []];
};
/** Both survivors in the far north-east corner, away from the zombies the tests place. */
const far = (s: BaseState): void => {
  put(fighter(s), 28, 2);
  put(scout(s), 29, 2);
};
const zombie = (s: BaseState, x: number, y: number) => {
  const id = addZombie(s, x, y);
  return s.enemies.find((e) => e.id === id)!;
};
const addTrap = (s: BaseState, kind: TrapKind, x: number, y: number): void => {
  s.traps.push({ id: `t${s.traps.length + 1}`, kind, x, y, armed: true, cooldown: 0 });
};

test('build: the survivor walks up, works 2 s, then the scrap is spent and the trap stands armed', () => {
  const s = createBase({ calm: true });
  assert.equal(orderTrap(s, 'fighter', 'spike', 15, 27), 'ok');
  run(s, 5);
  assert.equal(s.scrap, 4, 'no scrap is spent before the work is done');
  assert.equal(s.traps.length, 0);
  run(s, 100 + TRAP_TICKS.spike);
  assert.equal(s.scrap, 2, 'a spike pit costs 2');
  assert.deepEqual(s.traps.map((t) => [t.kind, t.x, t.y, t.armed]), [['spike', 15, 27, true]]);
  assert.equal(fighter(s).order, null, 'the worker is free again');

  assert.equal(orderTrap(s, 'scout', 'can', 17, 27), 'ok');
  run(s, 100 + TRAP_TICKS.can);
  assert.equal(s.scrap, 1, 'a noise can costs 1');
  assert.equal(s.traps.length, 2);
});

test('build is refused on a gap, wall, tree, barricade or trap tile, and when scrap is short', () => {
  const s = createBase({ calm: true });
  assert.equal(orderTrap(s, 'fighter', 'spike', 28, 35), 'blocked', 'the broken door gap');
  assert.equal(orderTrap(s, 'fighter', 'spike', 25, 26), 'blocked', 'a wall');
  assert.equal(orderTrap(s, 'fighter', 'spike', 0, 0), 'blocked', 'a tree');
  assert.equal(orderTrap(s, 'fighter', 'spike', s.stove.x, s.stove.y), 'blocked', 'the stove');
  assert.equal(placeBarricade(s, 15, 27), 'ok');
  assert.equal(orderTrap(s, 'fighter', 'can', 15, 27), 'blocked', 'a barricade');
  addTrap(s, 'can', 16, 27);
  assert.equal(orderTrap(s, 'fighter', 'spike', 16, 27), 'blocked', 'another trap');
  assert.equal(placeBarricade(s, 16, 27), 'blocked', 'a barricade cannot go on a trap');
  s.scrap = 1;
  assert.equal(orderTrap(s, 'fighter', 'spike', 20, 27), 'scrap');
  assert.equal(orderTrap(s, 'fighter', 'can', 20, 27), 'ok');
  assert.equal(orderTrap(s, 'nobody', 'can', 20, 27), 'invalid');
});

test('moving the survivor away cancels the build: nothing is built or paid', () => {
  const s = createBase({ calm: true });
  assert.equal(orderTrap(s, 'fighter', 'spike', 15, 27), 'ok');
  run(s, 3);
  orderMove(s, ['fighter'], [14, 29]);
  run(s, 200);
  assert.equal(s.traps.length, 0);
  assert.equal(s.scrap, 4);
});

test('spike pit: the first zombie to step on it takes 60 damage; the spent pit hurts nobody', () => {
  const s = createBase({ calm: true });
  far(s);
  addTrap(s, 'spike', 10, 25);
  const a = zombie(s, 10, 25);
  a.hp = a.maxHp = 100;
  run(s, 1);
  assert.equal(a.hp, 40, '60 damage');
  assert.equal(trapAt(s, 10, 25)!.armed, false);
  const b = zombie(s, 10, 25);
  run(s, 1);
  assert.equal(b.hp, b.maxHp, 'a spent pit does nothing');
});

test('spike pit: a normal 60 HP zombie dies on it', () => {
  const s = createBase({ calm: true });
  far(s);
  addTrap(s, 'spike', 10, 25);
  const z = zombie(s, 10, 25);
  run(s, 1);
  assert.equal(z.hp, 0);
  assert.equal(s.bodies.some((b) => b.id === z.id), true);
});

test('re-arm: click a spent pit, work 1 s, 1 scrap; refused when armed, without scrap, or on a can', () => {
  const s = createBase({ calm: true });
  put(fighter(s), 10, 26);
  put(scout(s), 29, 2);
  addTrap(s, 'spike', 10, 25);
  addTrap(s, 'can', 12, 25);
  assert.equal(orderRearm(s, 'fighter', 't1'), 'invalid', 'already armed');
  assert.equal(orderRearm(s, 'fighter', 't2'), 'invalid', 'a can is not re-armed');
  assert.equal(orderRearm(s, 'fighter', 't9'), 'invalid', 'no such trap');
  trapAt(s, 10, 25)!.armed = false;
  s.scrap = 0;
  assert.equal(orderRearm(s, 'fighter', 't1'), 'scrap');
  s.scrap = 3;
  assert.equal(orderRearm(s, 'fighter', 't1'), 'ok');
  run(s, 3);
  assert.equal(trapAt(s, 10, 25)!.armed, false);
  assert.equal(s.scrap, 3, 'paid when the work is done');
  run(s, REARM_TICKS + 5);
  assert.equal(trapAt(s, 10, 25)!.armed, true);
  assert.equal(s.scrap, 2, 're-arming costs 1');
});

test('survivors never trigger traps', () => {
  const s = createBase({ calm: true });
  put(fighter(s), 10, 25);
  put(scout(s), 12, 25);
  addTrap(s, 'spike', 10, 25);
  addTrap(s, 'can', 12, 25);
  const hp = [fighter(s).hp, scout(s).hp];
  run(s, 5);
  assert.deepEqual([fighter(s).hp, scout(s).hp], hp);
  assert.equal(trapAt(s, 10, 25)!.armed, true);
  assert.equal(trapAt(s, 12, 25)!.cooldown, 0);
  assert.equal(s.rings.some((r) => r.kind === 'can'), false);
});

test('noise can: a zombie walking through rings radius 6; others in range come, those beyond do not', () => {
  const s = createBase({ calm: true });
  far(s);
  addTrap(s, 'can', 10, 25);
  const a = zombie(s, 10, 25);
  const near = zombie(s, 14, 25); // 4 tiles
  const away = zombie(s, 3, 25); // 7 tiles
  run(s, 1);
  const ring = s.rings.find((r) => r.kind === 'can');
  assert.ok(ring, 'a can ring is drawn');
  assert.equal(ring!.radius, 6);
  assert.deepEqual([ring!.x, ring!.y], [10, 25]);
  run(s, 1);
  assert.equal(near.ai.mode, 'investigate');
  assert.deepEqual(near.ai.goal, [10, 25]);
  assert.notEqual(a.ai.mode, 'investigate', 'the zombie that rang it ignores its own noise');
  assert.notEqual(away.ai.mode, 'investigate', 'beyond radius 6');
});

test('noise can: it rests between rings, then rings again', () => {
  const s = createBase({ calm: true });
  far(s);
  addTrap(s, 'can', 10, 25);
  const z = zombie(s, 10, 25);
  run(s, 1);
  const t = trapAt(s, 10, 25)!;
  assert.equal(t.cooldown, 50);
  const ringed = (): number => s.noises.filter((n) => n.kind === 'can').length;
  put(z, 10, 25);
  run(s, 1);
  assert.equal(ringed(), 0, 'resting');
  t.cooldown = 0;
  put(z, 10, 25);
  run(s, 1);
  assert.equal(ringed(), 1, 'rings again');
});

test('the bar offers Spike pit and Noise can, greyed without scrap', () => {
  const s = createBase({ calm: true });
  const on = baseButtons(s, fighter(s));
  assert.deepEqual(on.filter((b) => b.id === 'spike' || b.id === 'can').map((b) => [b.id, b.enabled]), [['spike', true], ['can', true]]);
  s.scrap = 1;
  assert.deepEqual(baseButtons(s, fighter(s)).filter((b) => b.id === 'spike' || b.id === 'can').map((b) => [b.id, b.enabled]), [['spike', false], ['can', true]]);
  assert.equal(baseButtons(s, fighter(s), 'can').find((b) => b.id === 'can')!.active, true);
});
