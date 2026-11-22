import { campCentre } from '../../src/sim/map';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findPath, removePerson, sexOf, walkable } from '../../src/sim/people';
import { animFor, animLength, facingFrom, frameAt, personFrame, personKey, playable, tintOf } from '../../src/render/personArt';
import { canWork, workRate } from '../../src/sim/jobs';
import { addMessage, storeCap, type GameState, type Order, type Tile2 } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';
import { stepFed } from './helpers';

/** The tile of a type nearest the fire. */
function nearest(s: GameState, type: string): Tile2 {
  let best: Tile2 = [0, 0];
  let bestD = Infinity;
  s.map.tiles.forEach((t, i) => {
    if (t !== type) return;
    const x = i % s.map.size;
    const y = Math.floor(i / s.map.size);
    const [cx, cy] = campCentre(s.map);
    const d = Math.hypot(x - cx, y - cy);
    if (d < bestD) {
      bestD = d;
      best = [x, y];
    }
  });
  return best;
}

function adults(s: GameState) {
  return s.people.filter((p) => p.age === 'adult');
}

function demoOrders(s: GameState): Order[] {
  const a = adults(s);
  const berry = nearest(s, 'berry');
  const forest = nearest(s, 'forest');
  return [
    { type: 'assign', ids: [a[0].id, a[1].id, a[2].id], job: 'gather', tile: berry },
    { type: 'assign', ids: [a[3].id, a[4].id], job: 'chop', tile: forest },
    { type: 'move', ids: [a[5].id], to: [campCentre(s.map)[0] + 6, campCentre(s.map)[1] + 6] },
  ];
}

test('the same seed gives an identical state after step(100), however it is stepped', () => {
  const run = (chunks: number[]) => {
    const s = newGame(1);
    queueOrders(s, demoOrders(s));
    for (const c of chunks) step(s, c);
    return JSON.stringify(s);
  };
  assert.equal(run([100]), run([100]));
  assert.equal(run([100]), run(new Array(100).fill(1)));
  assert.notEqual(run([100]), run([101]));
});

test('20 people start: 12 adults, 4 elders, 4 children, 2 families, all on free tiles', () => {
  const s = newGame(1);
  assert.equal(s.people.length, 20);
  assert.equal(adults(s).length, 12);
  assert.equal(s.people.filter((p) => p.age === 'elder').length, 4);
  assert.equal(s.people.filter((p) => p.age === 'child').length, 4);
  assert.equal(s.people.filter((p) => p.family === 0).length, 10);
  assert.equal(new Set(s.people.map((p) => p.id)).size, 20);
  assert.equal(new Set(s.people.map((p) => `${p.x},${p.y}`)).size, 20);
  for (const p of s.people) assert.ok(walkable(s, p.x, p.y), `${p.name} stands on a free tile`);
  assert.equal(s.people[0].name, 'Wren');
  assert.equal(s.people[19].name, 'Sage');
  assert.equal(new Set(s.people.map((p) => p.name)).size, 20, 'every start name is different');
});

test('the start houses 10 of 20, five per tipi, each family in its own tipi', () => {
  const s = newGame(1);
  const tipis = s.buildings.filter((b) => b.type === 'tipi');
  assert.equal(tipis.length, 2);
  assert.deepEqual(tipis.map((t) => t.residents.length), [5, 5]);
  assert.equal(s.people.filter((p) => p.home !== null).length, 10);
  for (const t of tipis) {
    const fams = new Set(t.residents.map((id) => s.people.find((p) => p.id === id)!.family));
    assert.equal(fams.size, 1);
  }
});

test('work rate: elders x0.5, children cannot work, hungry x0.75', () => {
  const s = newGame(1);
  const adult = adults(s)[0];
  const elder = s.people.find((p) => p.age === 'elder')!;
  const child = s.people.find((p) => p.age === 'child')!;
  assert.equal(workRate(s, adult, 'gather'), 0.01);
  assert.equal(workRate(s, adult, 'chop'), 0.015);
  assert.equal(workRate(s, elder, 'gather'), 0.005);
  assert.equal(workRate(s, elder, 'chop'), 0);
  assert.equal(workRate(s, child, 'gather'), 0);
  adult.hunger = 70;
  assert.ok(Math.abs(workRate(s, adult, 'gather') - 0.0075) < 1e-12);
  assert.ok(canWork(adult, 'chop') && !canWork(elder, 'chop') && canWork(elder, 'gather'));
});

test('pathfinding: avoids the river, crosses by a ford, fails for water and blocked tiles', () => {
  const s = newGame(1);
  const n = s.map.size;
  const [cx, cy] = campCentre(s.map);
  const path = findPath(s, [0, cy], [n - 1, cy]);
  assert.ok(path && path.length >= n - 1);
  for (const [x, y] of path!) assert.ok(walkable(s, x, y));
  assert.ok(path!.some(([x, y]) => s.map.tiles[y * n + x] === 'ford'));
  const river = s.map.tiles.indexOf('river');
  assert.equal(findPath(s, [cx, cy + 6], [river % n, Math.floor(river / n)]), null);
  assert.equal(findPath(s, [cx, cy + 6], [s.map.fire[0] + 1, s.map.fire[1] + 1]), null, 'the fire blocks its tiles');
  assert.deepEqual(findPath(s, [cx + 6.2, cy + 6.1], [cx + 6, cy + 6]), [[cx + 6, cy + 6]]);
});

test('a gatherer walks to the berries, works, and delivers food to the store', () => {
  const s = newGame(1);
  const [gatherer] = adults(s);
  const berry = nearest(s, 'berry');
  const before = s.store.food;
  queueOrders(s, [{ type: 'assign', ids: [gatherer.id], job: 'gather', tile: berry }]);
  let worked = false;
  for (let i = 0; i < 4000 && s.store.food === before; i++) {
    stepFed(s, 1);
    if (gatherer.task.step === 'work') {
      worked = true;
      assert.deepEqual([Math.round(gatherer.x), Math.round(gatherer.y)], berry);
    }
  }
  assert.ok(worked, 'reached the berry tile and worked');
  assert.ok(Math.abs(s.store.food - (before + 5)) < 1e-6, `delivered 5 food, store ${s.store.food}`);
  assert.equal(gatherer.carry.amount, 0);
  assert.ok(s.map.amount[berry[1] * s.map.size + berry[0]] < 40, 'the berry tile lost food');
});

test('a woodcutter fells a tile, which turns to grass, and moves to the next tree', () => {
  const s = newGame(1);
  const [cutter] = adults(s);
  const forest = nearest(s, 'forest');
  const i = forest[1] * s.map.size + forest[0];
  s.map.amount[i] = 0.3; // nearly bare: one short visit empties it
  queueOrders(s, [{ type: 'assign', ids: [cutter.id], job: 'chop', tile: forest }]);
  step(s, 2500);
  assert.equal(s.map.tiles[i], 'grass');
  assert.ok(s.mapVersion >= 1);
  assert.ok(s.store.wood > 40, `wood delivered, store ${s.store.wood}`);
  assert.ok(cutter.job === null || cutter.job.tile![0] !== forest[0] || cutter.job.tile![1] !== forest[1]);
});

test('a full store keeps the load: nothing is lost and nothing is added', () => {
  const s = newGame(1);
  const [gatherer] = adults(s);
  const cap = storeCap(s, 'food');
  s.store.food = cap;
  queueOrders(s, [{ type: 'assign', ids: [gatherer.id], job: 'gather', tile: nearest(s, 'berry') }]);
  stepFed(s, 2500);
  assert.equal(s.store.food, cap);
  assert.ok(Math.abs(gatherer.carry.amount - 5) < 1e-6, `still carrying ${gatherer.carry.amount}`);
  s.store.food = cap - 10;
  // The gatherer waits by the bush, not at the store (DESIGN-hunting.md `## Full store`), so they walk back first.
  for (let i = 0; i < 1000 && gatherer.carry.amount >= 5 - 1e-6; i++) stepFed(s, 1);
  assert.ok(Math.abs(s.store.food - (cap - 5)) < 1e-6, `store ${s.store.food}`);
  assert.ok(gatherer.carry.amount < 5, `the load was delivered (now carrying ${gatherer.carry.amount})`);
});

test('orders that do not fit are dropped with a message', () => {
  const s = newGame(1);
  const elder = s.people.find((p) => p.age === 'elder')!;
  const child = s.people.find((p) => p.age === 'child')!;
  const [adult] = adults(s);
  queueOrders(s, [
    { type: 'assign', ids: [elder.id], job: 'chop', tile: nearest(s, 'forest') },
    { type: 'assign', ids: [child.id], job: 'gather', tile: nearest(s, 'berry') },
    { type: 'assign', ids: [adult.id], job: 'gather', tile: nearest(s, 'forest') },
  ]);
  step(s, 1);
  assert.equal(elder.job, null);
  assert.equal(child.job, null);
  assert.equal(adult.job, null);
  assert.equal(s.messages.length, 3);
  for (let i = 0; i < 10; i++) addMessage(s, 'x');
  assert.equal(s.messages.length, 5);
});

test('elders and children stay within 3 tiles of their tipi or the fire', () => {
  const s = newGame(1);
  step(s, 1500);
  for (const p of s.people.filter((q) => q.age !== 'adult')) {
    const home = s.buildings.find((b) => b.id === p.home);
    const [hx, hy] = home ? [home.x + 0.5, home.y + 0.5] : campCentre(s.map);
    assert.ok(Math.hypot(p.x - hx, p.y - hy) <= 4.5, `${p.name} strayed`);
  }
});

// AC4: the sex field and the people-art picks (art/SPEC.md section 4, art/STYLE.md section 5).

test('the same seed gives the same sexes; each family starts with 3 men, 3 women, an elder man and an elder woman', () => {
  const sexes = (seed: number) => newGame(seed).people.map((p) => `${p.id}:${p.sex}`).join(',');
  assert.equal(sexes(1), sexes(1));
  assert.equal(sexes(1), sexes(7)); // from the id, so the seed does not change it
  const s = newGame(1);
  for (const f of [0, 1]) {
    const of = (age: string, sex: string) => s.people.filter((p) => p.family === f && p.age === age && p.sex === sex).length;
    assert.deepEqual([of('adult', 'male'), of('adult', 'female'), of('elder', 'male'), of('elder', 'female')], [3, 3, 1, 1]);
  }
  assert.equal(sexOf({ id: 3 }), 'female'); // a person from a save made before the field existed
  assert.equal(sexOf({ id: 4 }), 'male');
});

test('the model key follows age and sex; children share one model', () => {
  assert.equal(personKey({ id: 1, age: 'adult', sex: 'female' }), 'person_woman');
  assert.equal(personKey({ id: 1, age: 'adult', sex: 'male' }), 'person_man');
  assert.equal(personKey({ id: 1, age: 'elder', sex: 'female' }), 'person_elder_woman');
  assert.equal(personKey({ id: 2, age: 'elder', sex: 'male' }), 'person_elder_man');
  assert.equal(personKey({ id: 2, age: 'child', sex: 'male' }), 'person_child');
});

test('facing: 8 sectors from screen-space movement, s down and e right; a tiny move keeps the facing', () => {
  const cases: [number, number, string][] = [
    [0, 1, 's'], [-1, 1, 'sw'], [-1, 0, 'w'], [-1, -1, 'nw'], [0, -1, 'n'], [1, -1, 'ne'], [1, 0, 'e'], [1, 1, 'se'],
    [2, 0.7, 'e'], [2, 1.0, 'se'], [-0.3, -2, 'n'], [0.9, -1, 'ne'],
  ];
  for (const [dx, dy, f] of cases) assert.equal(facingFrom(dx * 5, dy * 5), f, `${dx},${dy}`);
  // An isometric walk one tile along +x goes down-right on screen.
  assert.equal(facingFrom(32, 16), 'se');
  assert.equal(facingFrom(0.01, 0.01, 'nw'), 'nw');
});

test('animations: state and job pick the animation; a model without it idles; flee walks at 1.5x', () => {
  const s = newGame(1);
  const p = s.people.find((q) => q.age === 'adult')!;
  const pick = () => animFor(p, s.buildings).anim;
  p.task = { step: 'walk', target: [1, 1], path: [[1, 1]], timer: 0, goal: 'work' };
  assert.equal(pick(), 'walk');
  p.carry = { res: 'wood', amount: 2 };
  assert.equal(pick(), 'carry_walk');
  p.carry = { res: 'wood', amount: 0 };
  p.task = { ...p.task, step: 'flee' };
  assert.deepEqual(animFor(p, s.buildings), { anim: 'walk', rate: 1.5 });
  p.task = { step: 'work', target: null, path: [], timer: 0, goal: null };
  const jobs: [string, string][] = [['chop', 'chop'], ['gather', 'gather'], ['dry', 'scrape'], ['heal', 'tend'], ['tend', 'tend'], ['scout', 'idle']];
  for (const [kind, anim] of jobs) {
    p.job = { kind: kind as never, building: null, tile: null };
    assert.equal(pick(), anim, kind);
  }
  p.job = { kind: 'build', building: -1, tile: null };
  assert.equal(pick(), 'idle'); // no site with its materials: wait
  // Fighting: a drafted person whose weapon has just fired.
  p.job = null;
  p.task = { step: 'idle', target: null, path: [], timer: 0, goal: null };
  p.drafted = true;
  p.cooldown = 5;
  for (const [society, anim] of [[null, 'strike'], ['hunters', 'shoot'], ['archers', 'shoot'], ['lancers', 'thrust']] as const) {
    p.society = society;
    assert.equal(pick(), anim, String(society));
  }
  p.cooldown = 0;
  assert.equal(pick(), 'idle');
  // Elders and children lack chop and the fights; they idle instead.
  assert.equal(playable('person_elder_woman', 'chop'), 'idle');
  assert.equal(playable('person_child', 'strike'), 'idle');
  assert.equal(playable('person_child', 'gather'), 'gather');
  assert.equal(playable('person_man', 'thrust'), 'thrust');
});

test('frames: loops wrap, die holds its last frame, and frame names follow pattern A', () => {
  assert.equal(frameAt('person_man', 'walk', 0), 0);
  assert.equal(frameAt('person_man', 'walk', 1000), 12 % 8); // 8 frames at 12 fps
  assert.equal(frameAt('person_man', 'walk', 1000, 1.5), 18 % 8);
  assert.equal(frameAt('person_man', 'die', 5000), 5);
  assert.equal(animLength('person_man', 'die'), 500);
  assert.equal(personFrame('person_woman', 'cloth', 'walk', 'ne', 5), 'person_woman/cloth/walk/ne/05');
  assert.equal(tintOf('#7fa8d8'), 0x7fa8d8);
});

test('a death is noted in fallen so the view can play it; leaving the camp is not', () => {
  const s = newGame(1);
  const [a, b] = s.people;
  a.health = 0;
  removePerson(s, a.id);
  removePerson(s, b.id);
  assert.deepEqual(s.fallen, [{ id: a.id, tick: s.tick }]);
  s.tick += 200;
  const c = s.people[0];
  c.health = -1;
  removePerson(s, c.id);
  assert.deepEqual(s.fallen, [{ id: c.id, tick: s.tick }]); // old deaths are dropped
});
