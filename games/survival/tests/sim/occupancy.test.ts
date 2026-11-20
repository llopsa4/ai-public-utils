// No shared standing tile (DESIGN-hunting.md `## No shared standing tile`, PLAN.md G7).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildingDefs } from '../../src/sim/buildings';
import { ENEMIES } from '../../src/sim/combat';
import { campCentre } from '../../src/sim/map';
import { spreadTargets } from '../../src/sim/orders';
import { idleTask, walkable } from '../../src/sim/people';
import { serialize } from '../../src/sim/save';
import { addBuilding, type GameState, type Person, type Tile2 } from '../../src/sim/state';
import { newGame, queueOrders, step } from '../../src/sim/tick';
import { stepFed } from './helpers';

const adults = (s: GameState) => s.people.filter((p) => p.age === 'adult');
const tileOf = (p: Person) => `${Math.round(p.x)},${Math.round(p.y)}`;
const distinct = (keys: string[]) => new Set(keys).size === keys.length;

/** A grass tile at least `min` tiles from the camp centre whose 3x3 block is all walkable. */
function openTile(s: GameState, min = 7): Tile2 {
  const [cx, cy] = campCentre(s.map);
  for (let r = min; r < 20; r++) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (s.map.tiles[y * s.map.size + x] !== 'grass') continue;
        let ok = true;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) ok &&= walkable(s, x + dx, y + dy);
        if (ok) return [x, y];
      }
    }
  }
  throw new Error('no open tile');
}

/** A 1x1 trap site with all its materials, so builders go straight to work. */
function trapSite(s: GameState) {
  const [x, y] = openTile(s);
  const site = addBuilding(s, 'trap', x, y, false);
  site.delivered = { ...(buildingDefs.trap.cost ?? {}) };
  return site;
}

/** Parks a person on a tile for a long time (they neither work nor wander). */
function park(p: Person, t: Tile2): void {
  p.x = t[0];
  p.y = t[1];
  p.job = null;
  p.task = idleTask(1_000_000);
}

test('three builders on one site stand on distinct ring tiles', () => {
  const s = newGame(1);
  const site = trapSite(s);
  const ids = adults(s).slice(0, 3).map((p) => p.id);
  queueOrders(s, [{ type: 'assign', ids, building: site.id }]);
  step(s, 1);
  const goals = s.people.filter((p) => ids.includes(p.id)).map((p) => p.task.target!.join(','));
  assert.ok(distinct(goals), `walk goals ${goals}`);
  for (let i = 0; i < 200 && !site.done; i++) {
    step(s, 1);
    const working = s.people.filter((p) => ids.includes(p.id) && p.task.step === 'work');
    assert.ok(distinct(working.map(tileOf)), `builders share a tile at tick ${s.tick}`);
  }
});

test('four people delivering to one store pick distinct ring tiles', () => {
  const s = newGame(1);
  const four = adults(s).slice(0, 4);
  for (const p of four) {
    p.carry = { res: 'wood', amount: 5, hides: 0 };
    p.job = null;
    p.task = idleTask();
  }
  step(s, 1);
  const goals = four.map((p) => p.task.target?.join(','));
  assert.ok(goals.every((g) => g), 'all four walk');
  assert.ok(distinct(goals as string[]), `walk goals ${goals}`);
});

test('a full ring keeps the builder waiting nearby with the job, then lets them in', () => {
  const s = newGame(1);
  const site = trapSite(s);
  const [builder, ...rest] = adults(s);
  const ring: Tile2[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) ring.push([site.x + dx, site.y + dy]);
  ring.forEach((t, i) => park(rest[i], t));
  queueOrders(s, [{ type: 'assign', ids: [builder.id], building: site.id }]);
  step(s, 100);
  assert.equal(builder.job?.kind, 'build', 'the job is kept');
  assert.ok(!ring.some((t) => t.join(',') === tileOf(builder)), 'not on the full ring');
  assert.ok(!rest.slice(0, 8).some((q) => tileOf(q) === tileOf(builder)), 'on a tile of their own');

  rest[0].task = idleTask(); // one ring tile frees up
  rest[0].x = site.x + 6;
  stepFed(s, 300);
  assert.ok(site.built > 0 || site.done, 'the builder got onto the ring and built');
});

test('people fleeing to the fire stand on distinct tiles', () => {
  const s = newGame(1);
  const [cx, cy] = campCentre(s.map);
  s.enemies.push({ id: s.nextEnemyId++, kind: 'wolf', x: cx + 3, y: cy, hp: ENEMIES.wolf.hp, cooldown: 0, fleeing: false, wave: 0 });
  step(s, 1);
  const fleeing = s.people.filter((p) => p.task.step === 'flee');
  assert.ok(fleeing.length >= 4, `${fleeing.length} fleeing`);
  const goals = fleeing.map((p) => p.task.target!.join(','));
  assert.ok(distinct(goals), `flee goals ${goals}`);
});

test('a group move of 6 and two people drafted on one tile end on distinct tiles', () => {
  const s = newGame(1);
  const [a, b, ...others] = adults(s);
  const six = others.slice(0, 6).map((p) => p.id);
  const at = openTile(s);
  queueOrders(s, [{ type: 'move', ids: six, to: at }]);
  stepFed(s, 400);
  const movers = s.people.filter((p) => six.includes(p.id));
  assert.ok(movers.every((p) => p.task.step !== 'walk'), 'all arrived');
  assert.ok(distinct(movers.map(tileOf)), `movers ${movers.map(tileOf)}`);

  b.x = a.x;
  b.y = a.y;
  queueOrders(s, [{ type: 'draft', ids: [a.id, b.id], on: true }]);
  step(s, 100);
  assert.notDeepEqual(a.post, b.post);
  assert.notEqual(tileOf(a), tileOf(b));
});

test('two woodcutters on one tree stand on different tiles and both bring wood', () => {
  const s = newGame(1);
  const [cx, cy] = campCentre(s.map);
  let tree: Tile2 = [0, 0];
  let best = Infinity;
  s.map.tiles.forEach((t, i) => {
    const x = i % s.map.size;
    const y = Math.floor(i / s.map.size);
    const d = Math.hypot(x - cx, y - cy);
    if (t === 'forest' && d < best) {
      best = d;
      tree = [x, y];
    }
  });
  const two = adults(s).slice(0, 2);
  queueOrders(s, [{ type: 'assign', ids: two.map((p) => p.id), job: 'chop', tile: tree }]);
  let apart = false;
  const before = s.store.wood;
  for (let i = 0; i < 1500; i++) {
    stepFed(s, 1);
    if (two.every((p) => p.task.step === 'work')) {
      assert.notEqual(tileOf(two[0]), tileOf(two[1]));
      apart = true;
    }
  }
  assert.ok(apart, 'both worked at once');
  assert.ok(s.store.wood > before, 'wood reached the store');
});

test('spreadTargets gives n distinct free tiles, more than the old reach held', () => {
  const s = newGame(1);
  const ts = spreadTargets(s, openTile(s), 60);
  assert.equal(ts.length, 60);
  assert.ok(distinct(ts.map((t) => t.join(','))));
});

test('no two people stand still on one tile over a long run; the same seed repeats exactly', () => {
  const run = () => {
    const s = newGame(3);
    for (let i = 0; i < 3000; i++) {
      stepFed(s, 1);
      if (i % 10) continue;
      const still = s.people.filter((p) => !p.drafted && p.task.step !== 'walk' && p.task.path.length === 0);
      const keys = still.map(tileOf);
      assert.ok(distinct(keys), `shared tile at tick ${s.tick}: ${keys.filter((k, j) => keys.indexOf(k) !== j)}`);
    }
    return serialize(s, new Date(0));
  };
  assert.equal(run(), run());
});
