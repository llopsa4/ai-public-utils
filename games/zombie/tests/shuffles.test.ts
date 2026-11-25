import assert from 'node:assert/strict';
import { test } from 'node:test';
import base from '../src/data/base1.json';
import m01 from '../src/data/missions/m01.json';
import story from '../src/data/story.json';
import {
  BASE_LAYOUTS,
  HERD_EDGES,
  checkpointOf,
  createBase,
  edgePoint,
  herdArrow,
  herdCount,
  restoreBase,
  rollBase,
  stepBase,
} from '../src/sim/base';
import { DIFFICULTIES } from '../src/sim/difficulty';
import { isBlocked } from '../src/sim/grid';
import { type MissionSpec, createMission, layoutCount, rollLayout, stepMission, underRoof, withDifficulty, withLayout } from '../src/sim/mission';
import { findPath } from '../src/sim/path';
import { TICK_HZ } from '../src/sim/time';

// Z65 (DESIGN §12, §21): run shuffles for Mission 1 (zombie spots + crates) and Base 1 (roamer spawns), and the herd's edge.

const spec = m01 as unknown as MissionSpec;
const LAYOUTS = Array.from({ length: layoutCount(spec) }, (_, i) => i);
const inShed = (x: number, y: number): boolean => x >= 50 && x <= 55 && y >= 44 && y <= 48;
const bundle = (c: { food: number; scrap: number; ammo: number }): string => `${c.food}/${c.scrap}/${c.ammo}`;
const tile = (u: { x: number; y: number }): [number, number] => [Math.round(u.x), Math.round(u.y)];
/** Cycles through fixed values, for a predictable roll. */
const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length]!;
};

test('Mission 1 has 4 layouts; the roll reaches every one and withLayout leaves the spec alone', () => {
  assert.equal(layoutCount(spec), 4);
  assert.deepEqual(LAYOUTS.map((i) => rollLayout(spec, () => (i + 0.5) / 4)), LAYOUTS);
  assert.equal(rollLayout(spec, () => 0.999999), 3);
  const before = JSON.stringify(spec);
  withLayout(spec, 2);
  assert.equal(JSON.stringify(spec), before);
  assert.equal(withLayout(spec, 0), spec);
  assert.equal(withLayout(spec, 9), spec, 'out of range falls back to layout 0');
});

test('every Mission 1 layout: 10 zombies (2 in the house, 1 in the shed), the same 6 crate bundles (2 in the house, 1 in the shed)', () => {
  const bundles = createMission(spec).crates.map(bundle).sort();
  const spots = new Set<string>();
  for (const i of LAYOUTS) {
    const s = createMission(withLayout(spec, i));
    assert.equal(s.grid.size, 64, `layout ${i} is 64 × 64`);
    assert.equal(s.enemies.length, 10);
    assert.equal(s.enemies.filter((e) => underRoof(s, e.x, e.y)).length, 2, `layout ${i}: 2 zombies in the house`);
    assert.equal(s.enemies.filter((e) => inShed(e.x, e.y)).length, 1, `layout ${i}: 1 zombie in the shed`);
    assert.equal(s.crates.length, 6);
    assert.equal(s.crates.filter((c) => underRoof(s, c.x, c.y)).length, 2, `layout ${i}: 2 crates in the house`);
    assert.equal(s.crates.filter((c) => inShed(c.x, c.y)).length, 1, `layout ${i}: 1 crate in the shed`);
    assert.deepEqual(s.crates.map(bundle).sort(), bundles, `layout ${i}: same loot, shuffled`);
    spots.add(JSON.stringify([s.enemies.map(tile), s.crates.map(tile)]));
  }
  assert.equal(spots.size, LAYOUTS.length, 'no two layouts are the same');
});

test('every Mission 1 layout × difficulty loads and is winnable: free tiles, all reachable, nobody near the start', () => {
  for (const i of LAYOUTS) {
    for (const d of DIFFICULTIES) {
      const s = createMission(withDifficulty(withLayout(spec, i), d));
      const start = tile(s.survivors[0]!);
      const taken = new Set<string>();
      for (const u of [...s.survivors, ...s.enemies, ...s.crates]) {
        const [x, y] = tile(u);
        assert.ok(!isBlocked(s.grid, x, y), `layout ${i}: ${u.id} on a free tile`);
        assert.ok(!taken.has(`${x},${y}`), `layout ${i}: ${u.id} shares a tile`);
        taken.add(`${x},${y}`);
        assert.ok(findPath(s.grid, start, [x, y]), `layout ${i}: ${u.id} reachable from the start`);
      }
      for (const e of s.enemies) {
        const near = Math.min(...s.survivors.map((u) => Math.hypot(u.x - e.x, u.y - e.y)));
        assert.ok(near >= 10, `layout ${i}: ${e.id} only ${near.toFixed(1)} tiles from the start`);
      }
      for (let t = 0; t < 300; t++) stepMission(s); // runs without throwing
      assert.equal(s.status, 'playing', `layout ${i} ${d}: nobody is caught while the squad waits 30 s`);
      for (const e of s.enemies) e.hp = 0; // the win rule itself: every zombie dead and every crate opened
      for (const c of s.crates) c.opened = true;
      stepMission(s);
      assert.equal(s.status, 'success', `layout ${i} ${d}: clearing it wins`);
    }
  }
});

test('Base 1: 4 roamer layouts; the roll reaches every layout and every edge', () => {
  assert.equal(BASE_LAYOUTS, 4);
  assert.equal(base.roamers.layouts.length, 3);
  const seen = new Set<string>();
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
    const r = rollBase(seq((a + 0.5) / 4, (b + 0.5) / 4));
    seen.add(`${r.layout}:${r.herdFrom}`);
  }
  assert.equal(seen.size, 16);
  assert.deepEqual(createBase({ calm: true }).herd.from, 'north', 'the default edge');
  assert.equal(createBase({ calm: true }).layout, 0);
  assert.equal(createBase({ calm: true, layout: 7 }).layout, 0, 'an unknown layout falls back to 0');
});

test('every Base 1 roamer spawn stands on a free tile with a way to the house door', () => {
  for (let l = 0; l < BASE_LAYOUTS; l++) {
    const s = createBase({ layout: l });
    const door = s.openings.find((o) => o.id === 'door')!;
    const spawns = [base.roamers.spawns, ...base.roamers.layouts][l]!;
    assert.equal(spawns.length, 7);
    for (const [x, y] of spawns) {
      assert.ok(!isBlocked(s.grid, x!, y!), `layout ${l}: spawn ${x},${y} free`);
      assert.ok(findPath(s.grid, [x!, y!], [door.x, door.y]), `layout ${l}: ${x},${y} reaches the door`);
    }
    const roamers = s.enemies.filter((e) => e.id.startsWith('r'));
    assert.equal(roamers.length, base.roamers.start);
    assert.deepEqual(roamers.map(tile), spawns.slice(0, base.roamers.start), `layout ${l}: roamers start on its spawns`);
  }
});

test('every Base 1 layout × herd edge × difficulty: the herd enters on its edge, on free tiles, with a way to the house', () => {
  for (const herdFrom of HERD_EDGES) {
    for (let layout = 0; layout < BASE_LAYOUTS; layout++) {
      for (const difficulty of DIFFICULTIES) {
        const s = createBase({ layout, herdFrom, difficulty });
        const door = s.openings.find((o) => o.id === 'door')!;
        const n = s.grid.size;
        const firstSeen = new Map<string, [number, number]>();
        let stacked = false;
        const until = (base.herd.arriveAt + base.herd.over + 1) * TICK_HZ;
        for (const u of s.survivors) u.hp = u.maxHp = 1e9;
        while (s.tick < until) {
          stepBase(s);
          for (let i = s.enemies.length - 1; i >= 0; i--) if (s.enemies[i]!.id.startsWith('r')) s.enemies.splice(i, 1);
          for (const e of s.enemies) {
            if (!e.id.startsWith('h') || firstSeen.has(e.id)) continue;
            firstSeen.set(e.id, tile(e));
            stacked ||= s.enemies.some((o) => o !== e && o.hp > 0 && tile(o).join() === tile(e).join());
          }
        }
        const where = `${herdFrom} layout ${layout} ${difficulty}`;
        assert.equal(firstSeen.size, herdCount(s), `${where}: the whole herd entered`);
        assert.equal(stacked, false, `${where}: nobody enters on another zombie's tile`);
        for (const [id, [x, y]] of firstSeen) {
          const depth = herdFrom === 'north' ? y : herdFrom === 'south' ? n - 1 - y : herdFrom === 'west' ? x : n - 1 - x;
          assert.ok(depth <= 3, `${where}: ${id} at ${x},${y} is ${depth} tiles in from its edge`);
          assert.ok(!isBlocked(s.grid, x, y), `${where}: ${id} on a free tile`);
          assert.ok(findPath(s.grid, [x, y], [door.x, door.y]), `${where}: ${id} has a way to the door`);
        }
        assert.equal(s.herd.from, herdFrom);
      }
    }
  }
});

test('the red arrow sits on the herd edge and points out of the map', () => {
  const n = 64;
  for (const from of HERD_EDGES) {
    const arrow = herdArrow(from, n);
    assert.equal(arrow.length, 7);
    const depth = ([x, y]: [number, number]): number => (from === 'north' ? y : from === 'south' ? n - 1 - y : from === 'west' ? x : n - 1 - x);
    const tip = arrow[0]!;
    assert.equal(depth(tip), 0.5, `${from}: the tip is at the edge`);
    for (const p of arrow.slice(1)) assert.ok(depth(p) > depth(tip), `${from}: everything else lies inside the tip`);
    for (const [x, y] of arrow) assert.ok(x >= 0 && y >= 0 && x <= n - 1 && y <= n - 1, `${from}: on the map`);
  }
  assert.deepEqual(herdArrow('north', n)[0], [32, 0.5], 'north matches the old fixed arrow');
  assert.deepEqual(edgePoint('east', n, 4), [59, 32]);
  assert.deepEqual(edgePoint('south', n, 4), [32, 59]);
  assert.deepEqual(edgePoint('west', n, 4), [4, 32]);
});

test('4 herd warnings, one per edge: the same beat, and the edge is named', () => {
  const w = story.dialogue.herdWarning as Record<string, { speaker: string; text: string }[]>;
  assert.deepEqual(Object.keys(w).sort(), [...HERD_EDGES].sort());
  const shape = (k: string) => w[k]!.map((l) => l.speaker).join();
  for (const e of HERD_EDGES) {
    assert.equal(shape(e), shape('north'), `${e}: same speakers`);
    assert.ok(w[e]!.some((l) => l.text.includes(e)), `${e}: a line names the ${e}`);
  }
  assert.equal(new Set(HERD_EDGES.map((e) => w[e]![2]!.text)).size, 4, 'four different lines');
});

test('the herd checkpoint keeps its layout and edge; an older checkpoint loads as layout 0 from the north', () => {
  const s = createBase({ layout: 2, herdFrom: 'west' });
  for (const u of s.survivors) u.hp = u.maxHp = 1e9;
  while (!s.herd.warned) stepBase(s);
  const cp = restoreBase(JSON.parse(JSON.stringify(checkpointOf(s))))!;
  assert.equal(cp.layout, 2);
  assert.equal(cp.herd.from, 'west');
  const old = JSON.parse(JSON.stringify(checkpointOf(s))) as Record<string, any>;
  delete old.layout;
  delete old.herd.from;
  const back = restoreBase(old)!;
  assert.ok(back, 'an older checkpoint still loads');
  assert.equal(back.layout, 0);
  assert.equal(back.herd.from, 'north');
  const bad = JSON.parse(JSON.stringify(checkpointOf(s))) as Record<string, any>;
  bad.herd.from = 'up';
  assert.equal(restoreBase(bad), null);
  bad.herd.from = 'west';
  bad.layout = 9;
  assert.equal(restoreBase(bad), null);
});
