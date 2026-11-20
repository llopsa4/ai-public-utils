import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assignWorkers, placeBuilding, placementError } from '../../src/sim/buildings';
import { fighterOf } from '../../src/sim/combat';
import { workRate } from '../../src/sim/jobs';
import { loadState, parseSave, serialize } from '../../src/sim/save';
import { walkable } from '../../src/sim/people';
import type { Enemy, GameState } from '../../src/sim/state';
import { buildSpeed, buyUpgrade, missingRequirement, UPGRADE_IDS } from '../../src/sim/upgrades';
import { newGame, step } from '../../src/sim/tick';
import { addHuntingLodge } from './helpers';
import { scoutsStaffed, waveBanner } from '../../src/sim/waves';

const TIER2 = [
  ['scouts', 'dogs'], ['warriors', 'bows'], ['builders', 'healers'], ['tools', 'bows'],
] as const;

test('tier 2 has four upgrades, each named for its tier 1 requirement', () => {
  assert.deepEqual(UPGRADE_IDS, ['dogs', 'bows', 'healers', 'scouts', 'warriors', 'builders', 'barricades', 'horses', 'riders', 'tools',
    'spirits', 'spirit_warriors', 'guardian_wolves', 'bison_charge', 'storm_caller']);
  const s = newGame(1);
  for (const [id, req] of TIER2) assert.equal(missingRequirement(s, id), req);
  assert.equal(missingRequirement(s, 'dogs'), null, 'tier 1 needs nothing');
});

test('buying a tier 2 upgrade is refused without its tier 1 upgrade and allowed with it', () => {
  for (const [id, req] of TIER2) {
    const s = newGame(1);
    addHuntingLodge(s);
    s.gift = 50;
    s.store.wood = 100;
    s.store.hides = 50;
    assert.equal(buyUpgrade(s, id), false, `${id} without ${req}`);
    assert.equal(s.gift, 50, 'nothing was taken');
    s.upgrades.push(req);
    assert.equal(missingRequirement(s, id), null);
    assert.equal(buyUpgrade(s, id), true, `${id} with ${req}`);
    assert.ok(s.upgrades.includes(id));
  }
});

test('tier 2 costs are taken from the gift and the store', () => {
  const s = newGame(1);
  addHuntingLodge(s);
  s.upgrades.push('dogs');
  s.gift = 10;
  s.store.wood = 30;
  s.store.hides = 6;
  assert.equal(buyUpgrade(s, 'scouts'), true);
  assert.deepEqual([s.gift, s.store.wood, s.store.hides], [2, 20, 1]);
  assert.equal(s.messages.at(-1)?.text, 'The scouts can build a lodge.');
});

test('tools make every worker add 1.5 times the build points; nothing else changes', () => {
  const s = newGame(1);
  const p = s.people.find((q) => q.age === 'adult')!;
  assert.equal(buildSpeed(s), 1);
  const before = workRate(s, p, 'build');
  const chopBefore = workRate(s, p, 'chop');
  s.upgrades.push('tools');
  assert.equal(buildSpeed(s), 1.5);
  assert.ok(Math.abs(workRate(s, p, 'build') - before * 1.5) < 1e-12);
  assert.equal(workRate(s, p, 'chop'), chopBefore);
});

test('a site finishes sooner with tools', () => {
  const finishedAt = (tools: boolean): number => {
    const s = newGame(1);
    s.store.wood = 100;
    s.store.hides = 20;
    s.store.food = 1000;
    if (tools) s.upgrades.push('tools');
    const site = placeBuilding(s, 'gathering_spot', 28, 26).building!;
    site.delivered = { wood: 10 };
    for (let i = 0; i < 4000; i++) {
      step(s, 1);
      s.store.food = 1000;
      if (site.done) return s.tick;
    }
    return Infinity;
  };
  const slow = finishedAt(false);
  const fast = finishedAt(true);
  assert.ok(Number.isFinite(slow) && Number.isFinite(fast), 'both finish');
  assert.ok(fast < slow, `with tools ${fast} < without ${slow}`);
});

/** A camp with a finished scouts' lodge; `staffed` puts one scout on its ring. */
function campWithScouts(staffed: boolean): GameState {
  const s = newGame(1);
  s.upgrades.push('dogs', 'scouts');
  s.store.wood = 100;
  s.store.hides = 20;
  s.store.food = 5000;
  const lodge = placeBuilding(s, 'scouts_lodge', 28, 26).building!;
  lodge.done = true;
  if (staffed) {
    const scout = s.people.find((p) => p.age === 'adult')!;
    assert.equal(assignWorkers(s, [scout.id], lodge.id), 1);
    assert.equal(scout.society, 'scouts');
    Object.assign(scout, { x: 27, y: 26 }); // a ring tile
  }
  return s;
}

test('the scouts lodge needs the scouts upgrade, and an unstaffed one does not count', () => {
  const s = newGame(1);
  s.store.wood = 100;
  s.store.hides = 20;
  assert.equal(placementError(s, 'scouts_lodge', 28, 26), 'Needs the Akicita scouts.');
  const bare = campWithScouts(false);
  assert.equal(scoutsStaffed(bare), false);
  assert.equal(scoutsStaffed(campWithScouts(true)), true);
});

test('a scout at the lodge brings the warning 600 ticks ahead with the wolf count; an empty lodge keeps 300', () => {
  const staffed = campWithScouts(true);
  staffed.tick = 2995;
  step(staffed, 5); // tick 3000 = 3600 - 600
  assert.equal(staffed.waves[0].phase, 'warning');
  assert.equal(staffed.waves[0].scouted, true);
  assert.deepEqual(waveBanner(staffed), {
    text: `Wolves from the ${staffed.waves[0].edge}: 1`, seconds: 60,
  });
  assert.match(staffed.messages.at(-1)!.text, /^Scouts: wolves coming from the \w+: 1\.$/);

  const empty = campWithScouts(false);
  empty.tick = 2995;
  step(empty, 5);
  assert.equal(empty.waves[0].phase, 'pending', 'nothing at 600 ticks ahead');
  step(empty, 300);
  assert.equal(empty.waves[0].scouted, false);
  assert.equal(waveBanner(empty)?.text, `Scouts: wolves coming from the ${empty.waves[0].edge}`);
});

test('the banner counts a later wave as "9 and a leader" and keeps scouted through a save', () => {
  const s = campWithScouts(true);
  for (let i = 0; i < 4; i++) s.waves[i].phase = 'defeated';
  s.tick = 17395;
  step(s, 5); // tick 17400 = 18000 - 600
  assert.equal(s.waves[4].scouted, true);
  assert.equal(waveBanner(s)!.text, `Wolves from the ${s.waves[4].edge}: 9 and a leader`);
  const parsed = parseSave(serialize(s));
  assert.ok(parsed.ok);
  const b = loadState((parsed as { ok: true; save: Parameters<typeof loadState>[0] }).save);
  assert.equal(b.waves[4].scouted, true);
  assert.equal(waveBanner(b)!.text, waveBanner(s)!.text);
});

test('a scout walks to the lodge and stays; the lodge holds two', () => {
  const s = campWithScouts(false);
  const lodge = s.buildings.find((b) => b.type === 'scouts_lodge')!;
  const [a, b, c] = s.people.filter((p) => p.age === 'adult');
  assert.equal(assignWorkers(s, [a.id, b.id, c.id], lodge.id), 2, 'room for two');
  step(s, 600);
  assert.equal(scoutsStaffed(s), true, 'they arrived');
  const before = JSON.stringify(s.store);
  assert.ok(Math.abs(Math.round(a.x) - 28) <= 2 && Math.abs(Math.round(a.y) - 26) <= 2);
  assert.equal(a.job?.kind, 'scout');
  assert.ok(before.length > 0);
});

/** A camp with the builders' upgrade and plenty of goods. */
function campWithBuilders(): GameState {
  const s = newGame(1);
  s.upgrades.push('healers', 'builders');
  s.store.wood = 200;
  s.store.hides = 50;
  s.store.food = 5000;
  return s;
}

/** The first tile in the north of the camp where `type` can be placed. */
function northSpot(s: GameState, type: string): [number, number] {
  for (let y = 10; y <= 13; y++) {
    for (let x = 14; x <= 34; x++) {
      if (placementError(s, type, x, y) === null && placementError(s, type, x + 6, y) === null) return [x, y];
    }
  }
  throw new Error(`no ${type} spot`);
}

const wolf = (id: number, x: number, y: number): Enemy => ({ id, kind: 'wolf', x, y, hp: 40, cooldown: 0, fleeing: false, wave: 0 });

test('traps and fire pits need the builders upgrade and are 1x1 sites that workers finish', () => {
  const plain = newGame(1);
  plain.store.wood = 100;
  plain.store.hides = 20;
  assert.equal(placementError(plain, 'trap', 28, 28), "Needs the Builders' society.");
  assert.equal(placementError(plain, 'fire_pit', 28, 28), "Needs the Builders' society.");

  const s = campWithBuilders();
  const trap = placeBuilding(s, 'trap', 28, 28).building!;
  assert.deepEqual([s.store.wood, s.store.hides], [197, 49]);
  assert.equal(s.blocked[28 * s.map.size + 28], true);
  assert.equal(s.blocked[28 * s.map.size + 29], false, 'only one tile');
  assert.equal(placementError(s, 'fire_pit', 28, 28), 'Something is in the way.');
  const pit = placeBuilding(s, 'fire_pit', 30, 28).building!;
  assert.equal(s.store.wood, 192);
  for (let i = 0; i < 3000 && !(trap.done && pit.done); i++) step(s, 1);
  assert.ok(trap.done && pit.done, 'both finished');
  assert.equal(assignWorkers(s, [s.people[0].id], trap.id), 0, 'nobody works in a trap');
});

test('a trap hurts one wolf once for 25 and disappears', () => {
  const s = campWithBuilders();
  const [x, y] = northSpot(s, 'trap');
  const trap = placeBuilding(s, 'trap', x, y).building!;
  trap.done = true;
  s.enemies.push(wolf(1, x + 0.3, y), wolf(2, x - 0.3, y), wolf(3, x + 0.9, y));
  s.nextEnemyId = 4;
  step(s, 1);
  assert.equal(s.buildings.some((b) => b.type === 'trap'), false, 'removed');
  assert.equal(s.blocked[y * s.map.size + x], false, 'its tile is free again');
  assert.equal(s.enemies.find((e) => e.id === 1)!.hp, 15);
  assert.equal(s.enemies.find((e) => e.id === 2)!.hp, 40, 'only the first wolf');
  assert.equal(s.enemies.find((e) => e.id === 3)!.hp, 40, 'outside 0.6 tile');
  assert.equal(walkable(s, x, y), true);
  step(s, 3);
  assert.equal(s.enemies.find((e) => e.id === 2)!.hp, 40, 'the trap is gone: no second hit');
});

test('a trap kills a wolf that is down to 25 hp or less', () => {
  const s = campWithBuilders();
  const [x, y] = northSpot(s, 'trap');
  placeBuilding(s, 'trap', x, y).building!.done = true;
  s.enemies.push({ ...wolf(1, x, y), hp: 20 });
  s.nextEnemyId = 2;
  step(s, 1);
  assert.equal(s.enemies.length, 0);
});

test('an unfinished trap does nothing', () => {
  const s = campWithBuilders();
  const [x, y] = northSpot(s, 'trap');
  placeBuilding(s, 'trap', x, y);
  s.enemies.push(wolf(1, x, y));
  s.nextEnemyId = 2;
  step(s, 1);
  assert.equal(s.enemies[0].hp, 40);
});

test('a fire pit halves wolf speed within 3 tiles and not outside; pits do not stack', () => {
  const run = (pits: number): { near: number; far: number } => {
    const s = campWithBuilders();
    const [x, y] = northSpot(s, 'fire_pit');
    for (let k = 0; k < pits; k++) placeBuilding(s, 'fire_pit', x + 6 * k, y).building!.done = true;
    s.enemies.push(wolf(1, x + 2, y), wolf(2, x + 3.5, y));
    s.nextEnemyId = 3;
    const start = s.enemies.map((e) => [e.x, e.y]);
    step(s, 1);
    const moved = (i: number): number => Math.hypot(s.enemies[i].x - start[i][0], s.enemies[i].y - start[i][1]);
    return { near: moved(0), far: moved(1) };
  };
  const none = run(0);
  assert.ok(Math.abs(none.near - 0.16) < 1e-9 && Math.abs(none.far - 0.16) < 1e-9, 'no pit: full speed');
  const one = run(1);
  assert.ok(Math.abs(one.near - 0.08) < 1e-9, `inside 3 tiles: half speed, got ${one.near}`);
  assert.ok(Math.abs(one.far - 0.16) < 1e-9, 'outside 3 tiles: full speed');
  const two = run(2);
  assert.ok(Math.abs(two.near - 0.08) < 1e-9, 'two pits do not stack');
});

test('a trap never harms people', () => {
  const s = campWithBuilders();
  const [x, y] = northSpot(s, 'trap');
  placeBuilding(s, 'trap', x, y).building!.done = true;
  const person = s.people.find((p) => p.age === 'adult')!;
  Object.assign(person, { x, y });
  const health = person.health;
  step(s, 5);
  assert.ok(person.health >= health, 'not hurt');
  assert.ok(s.buildings.some((b) => b.type === 'trap'), 'still set');
});

test('the warriors lodges need the warriors upgrade; assignment gives the society', () => {
  const plain = newGame(1);
  plain.store.wood = 100;
  plain.store.hides = 20;
  assert.equal(placementError(plain, 'lancers_lodge', 28, 26), 'Needs the Akicita warriors.');
  assert.equal(placementError(plain, 'archers_lodge', 28, 26), 'Needs the Akicita warriors.');

  const s = newGame(1);
  s.upgrades.push('bows', 'warriors');
  s.store.wood = 100;
  s.store.hides = 20;
  const lancers = placeBuilding(s, 'lancers_lodge', 28, 26).building!;
  const archers = placeBuilding(s, 'archers_lodge', 28, 30).building!;
  lancers.done = true;
  archers.done = true;
  const [a, b, c, d, e] = s.people.filter((p) => p.age === 'adult');
  assert.equal(assignWorkers(s, [a.id, b.id], lancers.id), 2);
  assert.equal(assignWorkers(s, [c.id, d.id, e.id], archers.id), 3);
  assert.deepEqual([a.society, b.society, c.society], ['lancers', 'lancers', 'archers']);
  assert.equal(a.job?.kind, 'drill');
  const store = { ...s.store };
  step(s, 300);
  assert.equal(a.job?.kind, 'drill', 'they keep drilling');
  assert.deepEqual(s.store.wood, store.wood, 'drilling makes nothing');
  // Unassigned, they keep the society.
  a.job = null;
  assert.equal(a.society, 'lancers');
});

test('a lodge holds four drillers', () => {
  const s = newGame(1);
  s.upgrades.push('warriors');
  s.store.wood = 100;
  s.store.hides = 20;
  const lodge = placeBuilding(s, 'lancers_lodge', 28, 26).building!;
  lodge.done = true;
  const ids = s.people.filter((p) => p.age === 'adult').slice(0, 6).map((p) => p.id);
  assert.equal(assignWorkers(s, ids, lodge.id), 4);
});

test('fighter stats by society: lancer, archer, hunter and club', () => {
  const s = newGame(1);
  const p = s.people.find((q) => q.age === 'adult')!;
  const stats = (): number[] => {
    const f = fighterOf(s, p);
    return [f.range, f.damage, f.cooldown, f.accuracy, f.sight];
  };
  p.society = null;
  assert.deepEqual(stats(), [0.8, 8, 12, 0.8, 10]);
  p.society = 'lancers';
  assert.deepEqual(stats(), [1.6, 14, 14, 0.8, 10]);
  p.society = 'hunters';
  const hunter = stats();
  assert.deepEqual(hunter, [4, 12, 15, 0.75, 10]);
  p.society = 'archers';
  assert.deepEqual(stats(), hunter, 'an archer fires like a hunter');
  s.upgrades.push('bows', 'dogs');
  const upgraded = stats();
  p.society = 'hunters';
  assert.deepEqual(upgraded, stats(), 'bows and dogs apply to archers too');
  assert.deepEqual([upgraded[0], upgraded[1]], [5, 15]);
  p.society = 'lancers';
  assert.deepEqual(stats(), [1.6, 14, 14, 0.8, 10], 'the lance is not changed by bows or dogs');
});

test('a lancer outdamages a club fighter in a duel', () => {
  const damage = (society: string | null): number => {
    let total = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const s = newGame(seed);
      const p = s.people.find((q) => q.age === 'adult')!;
      s.people = [p];
      Object.assign(p, { x: 24, y: 28, drafted: true, post: [24, 28], stance: 'hold', society });
      s.enemies.push({ id: 1, kind: 'wolf', x: 24.0, y: 28.6, hp: 1000, cooldown: 0, fleeing: false, wave: 0 });
      s.nextEnemyId = 2;
      step(s, 80);
      total += 1000 - s.enemies[0].hp;
    }
    return total;
  };
  const club = damage(null);
  const lance = damage('lancers');
  assert.ok(club > 0, 'the club hits too');
  assert.ok(lance > club, `lance ${lance} > club ${club}`);
});

test('an archer drafted next to a wolf 4 tiles away fires, like a hunter', () => {
  const fired = (society: string): boolean => {
    const s = newGame(2);
    const p = s.people.find((q) => q.age === 'adult')!;
    s.people = [p];
    Object.assign(p, { x: 24, y: 28, drafted: true, post: [24, 28], stance: 'hold', society });
    s.enemies.push({ id: 1, kind: 'wolf', x: 24, y: 24, hp: 40, cooldown: 0, fleeing: false, wave: 0 });
    s.nextEnemyId = 2;
    step(s, 1);
    return p.cooldown > 0;
  };
  assert.equal(fired('hunters'), true);
  assert.equal(fired('archers'), true);
  assert.equal(fired('lancers'), false, 'range 1.6 is too short');
});
