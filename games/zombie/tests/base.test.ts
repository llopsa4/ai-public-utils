import assert from 'node:assert/strict';
import { test } from 'node:test';
import base from '../src/data/base1.json';
import {
  type BaseState,
  FIX_TICKS,
  HUNGER_TICKS,
  addZombie,
  checkpointOf,
  cloneBase,
  restoreBase,
  herdCleared,
  herdLeft,
  herdSeconds,
  objectiveText,
  baseButtons,
  createBase,
  eat,
  give,
  hungerLevel,
  orderCook,
  orderFix,
  orderMove,
  placeBarricade,
  stepBase,
} from '../src/sim/base';
import { COVER, FLOOR, WALL, getTile, isBlocked } from '../src/sim/grid';
import { findPath } from '../src/sim/path';

const run = (s: BaseState, ticks: number): void => {
  for (let i = 0; i < ticks; i++) stepBase(s);
};
const fighter = (s: BaseState) => s.survivors[0]!;
const scout = (s: BaseState) => s.survivors[1]!;
const put = (u: { x: number; y: number; path: unknown[] }, x: number, y: number): void => {
  [u.x, u.y, u.path] = [x, y, []];
};
/** Fixes every opening at once (the rule under test is blocking, not the work). */
function sealAll(s: BaseState): void {
  for (const o of s.openings) {
    o.fixed = true;
    o.hp = 100;
    s.grid.tiles[o.y * s.grid.size + o.x] = COVER;
  }
}

test('the base: the m01 house with 3 broken openings, the back door walled up, a stove, no zombies yet', () => {
  const s = createBase({ calm: true });
  assert.equal(s.grid.size, 32);
  assert.equal(s.enemies.length, 0);
  assert.deepEqual([s.food, s.scrap, s.ammo], [5, 4, 5]);
  assert.deepEqual(s.openings.map((o) => [o.kind, o.fixed]), [['door', false], ['window', false], ['window', false]]);
  for (const o of s.openings) assert.equal(getTile(s.grid, o.x, o.y), FLOOR, `${o.id} is a gap`);
  assert.equal(getTile(s.grid, 19, 9), WALL, 'the back door is walled up');
  assert.ok(isBlocked(s.grid, s.stove.x, s.stove.y));
  assert.equal(s.roof, null);
  assert.equal(s.status, 'playing');
  for (const u of s.survivors) assert.equal(s.hunger[u.id]!.left, HUNGER_TICKS);
});

test('every broken opening lets the survivors in; with all three fixed the house is sealed', () => {
  const s = createBase({ calm: true });
  const from: [number, number] = [14, 29];
  for (const o of s.openings) assert.ok(findPath(s.grid, from, [o.x, o.y]), `${o.id} reachable`);
  assert.ok(findPath(s.grid, from, [11, 12]), 'room 1 reachable');
  assert.ok(findPath(s.grid, from, [s.stove.x - 1, s.stove.y]), 'the stove is reachable');
  sealAll(s);
  assert.equal(findPath(s.grid, from, [11, 12]), null);
  assert.equal(findPath(s.grid, from, [18, 14]), null);
});

test('fix: the survivor walks up, works 3 s, then 1 scrap is spent and the gap is blocked', () => {
  const s = createBase({ calm: true });
  assert.equal(orderFix(s, 'fighter', 'door'), 'ok');
  run(s, 60);
  assert.equal(s.scrap, 4, 'no scrap is spent before the work is done');
  run(s, 200);
  const door = s.openings[0]!;
  assert.equal(door.fixed, true);
  assert.equal(s.scrap, 3);
  assert.equal(getTile(s.grid, door.x, door.y), COVER);
  assert.equal(fighter(s).order, null);
  assert.ok(FIX_TICKS === 30);
});

test('fix is refused with no scrap, for a fixed opening, an unknown one or a dead survivor', () => {
  const s = createBase({ calm: true });
  s.scrap = 0;
  assert.equal(orderFix(s, 'fighter', 'door'), 'scrap');
  s.scrap = 1;
  assert.equal(orderFix(s, 'fighter', 'nope'), 'invalid');
  s.openings[0]!.fixed = true;
  assert.equal(orderFix(s, 'fighter', 'door'), 'invalid');
  scout(s).hp = 0;
  assert.equal(orderFix(s, 'scout', 'window1'), 'invalid');
});

test('two workers on the same opening pay only once; a later move order ends the work', () => {
  const s = createBase({ calm: true });
  put(fighter(s), 12, 20);
  put(scout(s), 13, 20);
  orderFix(s, 'fighter', 'door');
  orderFix(s, 'scout', 'door');
  run(s, 60);
  assert.equal(s.scrap, 3);
  assert.equal(s.openings[0]!.fixed, true);
  assert.equal(scout(s).order, null);

  const t = createBase({ calm: true });
  put(fighter(t), 12, 20);
  orderFix(t, 'fighter', 'door');
  run(t, 10);
  orderMove(t, ['fighter'], [14, 25]);
  run(t, 100);
  assert.equal(t.openings[0]!.fixed, false);
  assert.equal(t.scrap, 4);
});

test('a worker standing in the gap is moved off it so nobody is walled into a tile', () => {
  const s = createBase({ calm: true });
  const door = s.openings[0]!;
  put(fighter(s), door.x, door.y);
  orderFix(s, 'fighter', 'door');
  run(s, 40);
  assert.equal(door.fixed, true);
  assert.ok(!isBlocked(s.grid, Math.round(fighter(s).x), Math.round(fighter(s).y)), 'the Fighter is on a free tile');
});

test('barricades stay for the yard: refused on a window or door gap and on the stove', () => {
  const s = createBase({ calm: true });
  assert.equal(placeBarricade(s, 12, 19), 'blocked');
  assert.equal(placeBarricade(s, 9, 16), 'blocked');
  assert.equal(placeBarricade(s, s.stove.x, s.stove.y), 'blocked');
  assert.equal(placeBarricade(s, 14, 22), 'ok');
  assert.equal(s.scrap, 3);
});

test('an open window lets a zombie in; a fixed one makes it chew, and only after ~7 s does it break', () => {
  const open = createBase({ calm: true });
  put(fighter(open), 10, 16);
  addZombie(open, 8, 16);
  run(open, 100);
  assert.ok(fighter(open).hp < 100, 'through the gap and biting');

  const s = createBase({ calm: true });
  sealAll(s);
  put(fighter(s), 10, 16);
  const z = addZombie(s, 8, 16);
  const win = s.openings[1]!;
  run(s, 60);
  assert.equal(s.enemies.find((e) => e.id === z)!.ai.mode, 'chase');
  assert.ok(win.hp < 100 && win.fixed, 'the window is being chewed');
  assert.equal(fighter(s).hp, 100);
  run(s, 400);
  assert.equal(win.fixed, false, 'the window broke');
  assert.equal(getTile(s.grid, win.x, win.y), FLOOR);
  assert.equal(win.hp, 100, 'ready to be fixed again');
  assert.ok(fighter(s).hp < 100, 'the zombie got in and bit');
});

test('a broken opening can be fixed again', () => {
  const s = createBase({ calm: true });
  sealAll(s);
  const win = s.openings[2]!;
  win.hp = 1;
  put(fighter(s), 21, 12);
  addZombie(s, 23, 12);
  run(s, 30);
  assert.equal(win.fixed, false);
  s.enemies.length = 0;
  assert.equal(orderFix(s, 'fighter', 'window2'), 'ok');
  run(s, 100);
  assert.equal(win.fixed, true);
});

test('cook: walk to the stove, 5 s, then 1 food becomes 1 meal in the cook\'s hands; a second one is refused', () => {
  const s = createBase({ calm: true });
  put(fighter(s), 20, 16);
  assert.equal(orderCook(s, 'fighter'), 'ok');
  run(s, 40);
  assert.equal(s.hunger.fighter!.meal, false);
  assert.equal(s.food, 5);
  run(s, 20);
  assert.equal(s.hunger.fighter!.meal, true);
  assert.equal(s.food, 4);
  assert.equal(fighter(s).order, null);
  assert.equal(orderCook(s, 'fighter'), 'meal');
  assert.equal(s.hunger.scout!.meal, false, 'only the cook holds it');
});

test('cook is refused with no food', () => {
  const s = createBase({ calm: true });
  s.food = 0;
  assert.equal(orderCook(s, 'fighter'), 'food');
});

test('eat: hunger back to 8 min and the meal heal (base1.json) for the eater only, capped at max', () => {
  const s = createBase({ calm: true });
  assert.equal(eat(s, 'fighter'), false, 'no meal, no eating');
  s.hunger.fighter!.meal = true;
  s.hunger.fighter!.left = 100;
  fighter(s).hp = 30;
  scout(s).hp = 50;
  assert.equal(eat(s, 'fighter'), true);
  assert.equal(fighter(s).hp, 30 + base.hunger.mealHeal);
  assert.equal(scout(s).hp, 50);
  assert.equal(s.hunger.fighter!.left, HUNGER_TICKS);
  assert.equal(s.hunger.fighter!.meal, false);
  s.hunger.fighter!.meal = true;
  fighter(s).hp = 90;
  eat(s, 'fighter');
  assert.equal(fighter(s).hp, 100);
});

test('give: a meal goes to an adjacent survivor who has none, not to a far one or one who has a meal', () => {
  const s = createBase({ calm: true });
  put(fighter(s), 14, 29);
  put(scout(s), 20, 29);
  s.hunger.fighter!.meal = true;
  assert.equal(give(s, 'fighter'), false, 'too far');
  put(scout(s), 15, 29);
  s.hunger.scout!.meal = true;
  assert.equal(give(s, 'fighter'), false, 'already has one');
  s.hunger.scout!.meal = false;
  assert.equal(give(s, 'fighter'), true);
  assert.deepEqual([s.hunger.fighter!.meal, s.hunger.scout!.meal], [false, true]);
  assert.equal(give(s, 'fighter'), false, 'nothing left to give');
});

test('hunger: 8 min, warns once at 2 min, critical at 30 s, no damage before 0', () => {
  const s = createBase({ calm: true });
  run(s, HUNGER_TICKS - 1201);
  assert.equal(s.said.length, 0);
  assert.equal(hungerLevel(s, 'fighter'), 'ok');
  run(s, 1);
  assert.deepEqual(s.said.map((m) => [m.id, m.text]), [['fighter', 'I need to eat something.'], ['scout', 'I need to eat something.']]);
  assert.equal(hungerLevel(s, 'fighter'), 'low');
  run(s, 900 - 1);
  assert.equal(hungerLevel(s, 'fighter'), 'low');
  run(s, 1);
  assert.equal(hungerLevel(s, 'fighter'), 'critical');
  assert.equal(s.said.length, 2, 'warned once');
  run(s, 299);
  assert.equal(fighter(s).hp, 100);
  assert.equal(hungerLevel(s, 'fighter'), 'critical');
  run(s, 1);
  assert.equal(hungerLevel(s, 'fighter'), 'starving');
});

test('starving: -1 HP every 3 s and speed x0.7 until fed; eating ends it and the warning can come again', () => {
  const s = createBase({ calm: true });
  s.hunger.fighter!.left = 1;
  run(s, 30);
  assert.equal(hungerLevel(s, 'fighter'), 'starving');
  assert.equal(fighter(s).hp, 99);
  assert.equal(fighter(s).speedMul, 0.7);
  run(s, 60);
  assert.equal(fighter(s).hp, 97);
  assert.equal(scout(s).hp, 100, 'the fed one is fine');
  assert.equal(scout(s).speedMul ?? 1, 1);
  s.hunger.fighter!.meal = true;
  eat(s, 'fighter');
  run(s, 1);
  assert.equal(fighter(s).speedMul, 1);
  assert.equal(hungerLevel(s, 'fighter'), 'ok');
  s.hunger.fighter!.left = secs2(119);
  run(s, 20);
  assert.equal(s.said.filter((m) => m.id === 'fighter').length, 2, 'the warning came again after eating');
});
const secs2 = (n: number): number => n * 10;

test('a starving survivor is slower: the same walk covers 30% less ground', () => {
  const a = createBase({ calm: true });
  const b = createBase({ calm: true });
  b.hunger.fighter!.left = 0;
  orderMove(a, ['fighter'], [14, 20]);
  orderMove(b, ['fighter'], [14, 20]);
  run(a, 20);
  run(b, 20);
  const da = 29 - a.survivors[0]!.y;
  const db = 29 - b.survivors[0]!.y;
  assert.ok(Math.abs(db / da - 0.7) < 0.05, `ratio ${db / da}`);
});

test('starving to death fails the base: the state freezes', () => {
  const s = createBase({ calm: true });
  s.hunger.scout!.left = 0;
  scout(s).hp = 1;
  run(s, 31);
  assert.equal(scout(s).hp, 0);
  assert.equal(s.status, 'failed');
  const tick = s.tick;
  run(s, 10);
  assert.equal(s.tick, tick);
});

test('a calm base (no roamers, no herd) neither wins nor fails by itself', () => {
  const s = createBase({ calm: true });
  run(s, 50);
  assert.equal(s.status, 'playing');
});

test('action bar: weapons, Hold, Free fire (with a gun), Crouch, Eat, Give, Fix, Cook, Barricade, Spike pit, Noise can; no mission tools', () => {
  const s = createBase({ calm: true });
  const ids = (u: BaseState['survivors'][number]) => baseButtons(s, u).map((b) => b.id);
  assert.deepEqual(ids(fighter(s)), ['weapon:knife', 'hold', 'crouch', 'eat', 'give', 'fix', 'cook', 'build', 'spike', 'can']);
  assert.deepEqual(ids(scout(s)), ['weapon:pistol', 'weapon:club', 'hold', 'freefire', 'crouch', 'eat', 'give', 'fix', 'cook', 'build', 'spike', 'can']);
  const on = (id: string) => baseButtons(s, fighter(s)).find((b) => b.id === id)!.enabled;
  assert.deepEqual([on('eat'), on('give'), on('fix'), on('cook'), on('build')], [false, false, true, true, true]);
  s.scrap = 0;
  s.food = 0;
  assert.deepEqual([on('fix'), on('cook'), on('build')], [false, false, false]);
  s.hunger.fighter!.meal = true;
  put(scout(s), 15, 29);
  assert.deepEqual([on('eat'), on('give')], [true, true]);
  put(scout(s), 25, 29);
  assert.equal(on('give'), false);
  assert.equal(baseButtons(s, fighter(s), 'build').find((b) => b.id === 'build')!.active, true);
});

// ---- Roamers and the herd (DESIGN §12) ----

const TICKS = (sec: number): number => sec * 10;
/** Survivors that cannot die or starve, so a long run tests the schedule, not the fight. */
function tough(s: BaseState): void {
  for (const u of s.survivors) {
    u.hp = u.maxHp = 100000;
    s.hunger[u.id]!.left = 10_000_000;
  }
}
const herdOf = (s: BaseState) => s.enemies.filter((e) => e.id.startsWith('h'));
const roamersOf = (s: BaseState) => s.enemies.filter((e) => e.id.startsWith('r') && e.hp > 0);

test('the base starts with 3 roamers on open floor, far from the survivors, and no herd yet', () => {
  const s = createBase();
  assert.deepEqual(roamersOf(s).map((e) => e.id), ['r1', 'r2', 'r3']);
  for (const e of s.enemies) {
    assert.ok(!isBlocked(s.grid, e.x, e.y), `${e.id} stands on open floor`);
    for (const u of s.survivors) assert.ok(Math.hypot(e.x - u.x, e.y - u.y) > 10, `${e.id} starts far away`);
  }
  assert.equal(herdOf(s).length, 0);
  assert.equal(herdSeconds(s), 420);
});

test('a calm base has no roamers and spawns nothing', () => {
  const s = createBase({ calm: true });
  tough(s);
  run(s, TICKS(500));
  assert.equal(s.enemies.length, 0);
  assert.equal(s.events.length, 0);
});

test('one more roamer every 90 s, never more than 4 alive; killing one lets the next in', () => {
  const s = createBase();
  tough(s);
  run(s, TICKS(89));
  assert.equal(roamersOf(s).length, 3);
  run(s, TICKS(2));
  assert.equal(roamersOf(s).length, 4, 'the fourth at 90 s');
  run(s, TICKS(90));
  assert.equal(roamersOf(s).length, 4, 'capped at 4');
  roamersOf(s)[0]!.hp = 0;
  assert.equal(roamersOf(s).length, 3);
  run(s, TICKS(90));
  assert.equal(roamersOf(s).length, 4, 'a replacement came at 270 s');
});

test('the Scout warns at 5:00 and the herd stays away until 7:00', () => {
  const s = createBase();
  tough(s);
  run(s, TICKS(299));
  assert.equal(s.events.length, 0);
  run(s, TICKS(2));
  assert.deepEqual(s.events.map((e) => e.kind), ['herdWarning']);
  assert.ok(s.events[0]!.tick >= TICKS(300) && s.events[0]!.tick <= TICKS(301));
  assert.equal(herdOf(s).length, 0);
  assert.equal(herdSeconds(s), 120 - 1);
});

test('the herd: herd.count zombies enter from the north over 60 s, on the north row, one tile each', () => {
  const s = createBase();
  tough(s);
  s.tick = TICKS(420);
  s.herd.warned = true;
  run(s, 1);
  assert.deepEqual(s.events.map((e) => e.kind), ['herdArrives']);
  assert.equal(herdOf(s).length, 1);
  run(s, TICKS(30));
  const half = herdOf(s).length;
  assert.ok(Math.abs(half - base.herd.count / 2) <= 1, `about half after 30 s: ${half}`);
  run(s, TICKS(31));
  assert.equal(herdOf(s).length, base.herd.count);
  assert.equal(s.herd.spawned, base.herd.count);
  assert.equal(new Set(herdOf(s).map((e) => `${e.x},${e.y}`)).size, base.herd.count, 'no two start on one tile');
  for (const e of herdOf(s)) assert.ok(!isBlocked(s.grid, 3 + ((Number(e.id.slice(1)) - 1) * 7) % 26, 1));
  assert.equal(s.events.filter((e) => e.kind === 'herdArrives').length, 1, 'announced once');
});

test('the herd marches south on the survivors', () => {
  const s = createBase();
  tough(s);
  s.tick = TICKS(420) - 1;
  run(s, TICKS(20));
  const ys = herdOf(s).map((e) => e.y);
  assert.ok(ys.some((y) => y > 6), `the first ones have come down: ${ys.join(',')}`);
});

test('a sealed house: the herd walks to it and chews the fixed openings', () => {
  const s = createBase();
  tough(s);
  sealAll(s);
  put(fighter(s), 12, 12);
  put(scout(s), 14, 13);
  s.tick = TICKS(420) - 1;
  run(s, TICKS(120));
  const worn = s.openings.some((o) => !o.fixed || o.hp < 100);
  assert.ok(worn, 'the herd damaged or broke an opening');
});

test('the base is won when the whole herd is dead; roamers alive do not matter', () => {
  const s = createBase();
  tough(s);
  s.herd.spawned = base.herd.count;
  assert.equal(herdCleared(s), true);
  addZombie(s, 3, 1, [0, 1], 'h3');
  assert.equal(herdCleared(s), false);
  run(s, 1);
  assert.equal(s.status, 'playing');
  herdOf(s)[0]!.hp = 0;
  assert.ok(roamersOf(s).length > 0, 'roamers are still about');
  run(s, 1);
  assert.equal(s.status, 'success');
  assert.equal(s.events.at(-1)!.kind, 'win');
  const tick = s.tick;
  run(s, 10);
  assert.equal(s.tick, tick, 'frozen after the win');
});

test('the herd is not "dead" before it has all entered', () => {
  const s = createBase();
  tough(s);
  s.herd.spawned = base.herd.count - 1;
  run(s, 1);
  assert.equal(s.status, 'playing');
});

test('the objective reads "Prepare the house" until the warning, then counts the herd down', () => {
  const s = createBase();
  tough(s);
  assert.equal(objectiveText(s), 'Prepare the house');
  run(s, TICKS(301));
  assert.equal(s.herd.warned, true);
  assert.equal(objectiveText(s), `Survive the herd: ${base.herd.count} left`, 'the whole herd counts before it enters');
  run(s, TICKS(140)); // past 7:00: part of the herd has entered
  assert.ok(s.herd.spawned > 0);
  assert.equal(herdLeft(s), base.herd.count, 'none dead yet, so the whole herd is still to kill');
  const alive = herdOf(s).find((e) => e.hp > 0)!;
  const before = herdLeft(s);
  alive.hp = 0;
  assert.equal(herdLeft(s), before - 1, 'a kill counts at once');
});

test('any survivor dying fails the base, even in the middle of the herd', () => {
  const s = createBase();
  s.tick = TICKS(430);
  s.herd.spawned = 3;
  scout(s).hp = 0;
  run(s, 1);
  assert.equal(s.status, 'failed');
});

test('Base 1 starts the Fighter with the knife only, and with the Gun once the beat is saved (Z47)', () => {
  const fresh = createBase({ calm: true });
  assert.deepEqual(fresh.survivors.find((u) => u.id === 'fighter')!.weapons, ['knife']);
  const back = createBase({ calm: true, cassGun: true, ammo: 4 });
  assert.deepEqual(back.survivors.find((u) => u.id === 'fighter')!.weapons, ['knife', 'pistol']);
  assert.equal(baseButtons(back, back.survivors.find((u) => u.id === 'fighter')!).some((b) => b.id === 'weapon:pistol' && b.label === 'Gun 4'), true);
  assert.equal(baseButtons(fresh, fresh.survivors.find((u) => u.id === 'fighter')!).some((b) => b.id === 'weapon:pistol'), false);
});

// ---- Herd checkpoint (Z41, DESIGN §12, §18) ----

/** A full Base 1 (roamers and herd on) played up to the warning tick, with some orders so the state is not idle. */
function atWarning(): BaseState {
  const s = createBase({ cassGun: true });
  for (const u of s.survivors) u.hp = u.maxHp = 100000; // roamers must not end the run before the warning
  orderMove(s, ['fighter'], [12, 14]);
  run(s, 20);
  placeBarricade(s, 14, 20);
  for (let i = 0; i < TICKS(310) && !s.herd.warned; i++) stepBase(s);
  assert.equal(s.herd.warned, true);
  return s;
}

test('there is no checkpoint before the warning, and none once the run is over', () => {
  const s = createBase();
  run(s, 50);
  assert.equal(checkpointOf(s), null);
  const w = atWarning();
  assert.ok(checkpointOf(w));
  scout(w).hp = 0;
  stepBase(w);
  assert.equal(w.status, 'failed');
  assert.equal(checkpointOf(w), null);
});

test('a checkpoint is a copy: later play does not change it, and the copy is the same state', () => {
  const s = atWarning();
  const cp = checkpointOf(s)!;
  assert.deepEqual(cp, s);
  const frozen = JSON.stringify(cp);
  run(s, 200);
  assert.equal(JSON.stringify(cp), frozen);
  assert.notEqual(JSON.stringify(s), frozen);
});

test('a state restored from a saved checkpoint steps exactly like the original, through the whole herd', () => {
  const s = atWarning();
  const saved = JSON.parse(JSON.stringify(checkpointOf(s))) as unknown; // what the save slot holds
  const back = restoreBase(saved)!;
  assert.ok(back);
  assert.deepEqual(back, s);
  // Past the herd's arrival (7:00 = tick 4200) and into the fight; both carry the same orders.
  for (const x of [s, back]) orderMove(x, ['scout'], [20, 12]);
  run(s, 1500);
  run(back, 1500);
  assert.ok(s.herd.spawned > 0, 'the herd came in');
  assert.equal(JSON.stringify(back), JSON.stringify(s));
});

test('retrying again and again from one checkpoint gives the same run each time', () => {
  const cp = checkpointOf(atWarning())!;
  const a = cloneBase(cp);
  const b = cloneBase(cp);
  run(a, 400);
  run(b, 400);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(cp.tick, atWarning().tick); // the checkpoint itself was not stepped
});

test('a damaged or foreign checkpoint is refused, not half-loaded', () => {
  const good = checkpointOf(atWarning())!;
  assert.ok(restoreBase(JSON.parse(JSON.stringify(good))));
  const bad = (edit: (c: Record<string, any>) => void): unknown => {
    const c = JSON.parse(JSON.stringify(good)) as Record<string, any>;
    edit(c);
    return restoreBase(c);
  };
  assert.equal(restoreBase(null), null);
  assert.equal(restoreBase('state'), null);
  assert.equal(restoreBase({}), null);
  assert.equal(bad((c) => delete c.survivors), null);
  assert.equal(bad((c) => (c.herd = null)), null);
  assert.equal(bad((c) => (c.herd.warned = false)), null); // before the warning is not a checkpoint
  assert.equal(bad((c) => (c.status = 'failed')), null);
  assert.equal(bad((c) => (c.survivors[0].hp = 0)), null);
  assert.equal(bad((c) => (c.survivors[0].x = null)), null);
  assert.equal(bad((c) => c.survivors.pop()), null);
  assert.equal(bad((c) => (c.grid.tiles.length = 10)), null);
  assert.equal(bad((c) => (c.grid.tiles[5] = 9)), null);
  assert.equal(bad((c) => (c.openings[0].id = 'nope')), null);
  assert.equal(bad((c) => (c.enemies[0].ai = null)), null);
  assert.equal(bad((c) => delete c.hunger.scout), null);
  assert.equal(bad((c) => (c.tick = -1)), null);
  assert.equal(bad((c) => (c.rng = { s: 'x' })), null);
});
