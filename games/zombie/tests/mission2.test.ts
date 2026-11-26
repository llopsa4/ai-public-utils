import assert from 'node:assert/strict';
import { test } from 'node:test';
import m02 from '../src/data/missions/m02.json';
import story from '../src/data/story.json';
import { enemyViewer } from '../src/sim/ai';
import { bioTabs, progressOfMission } from '../src/sim/bios';
import { type BunkerSpec, THEO, doorLinesDone, doorWaits, newDoorScene, stepDoor } from '../src/sim/bunker';
import { FLOOR, WALL } from '../src/sim/grid';
import { highlightAvailable } from '../src/sim/highlight';
import { type MissionSpec, type MissionState, createMission, inZone, stepMission, underRoof } from '../src/sim/mission';
import { findPath } from '../src/sim/path';
import { SPEAKER_BEATS, toZone } from '../src/sim/speaker';
import { missionResult } from '../src/sim/stats';
import { TICK_HZ } from '../src/sim/time';
import { seesPoint } from '../src/sim/vision';

// Z93: Mission 2, Theo's house (DESIGN §26): the estate map, Theo's speaker beats, the squatter win rule and the door scene.

const spec = m02 as unknown as MissionSpec & { fence: { x: number; y: number; w: number; h: number }; roof: { x: number; y: number; w: number; h: number }; bunker: BunkerSpec; cache: { ammo: number; scrap: number } };
const fresh = (): MissionState => createMission(spec);
const humans = (s: MissionState) => s.enemies.filter((e) => e.kind === 'human');

test('the estate map: 80 x 80, 12 squatters (6 inside, 6 outside), 6 zombies in the woods, four at the south edge unseen, no crates', () => {
  const s = fresh();
  assert.equal(s.grid.size, 80);
  assert.equal(s.mission, 'm02');
  assert.equal(s.win, 'squatters');
  assert.equal(s.crates.length, 0);
  assert.equal(spec.roof.w * spec.roof.h, 22 * 16, 'a 22 x 16 house');
  const h = humans(s);
  assert.equal(h.length, 12);
  assert.equal(h.filter((e) => underRoof(s, e.x, e.y)).length, 6, 'six inside the house');
  assert.ok(h.filter((e) => !underRoof(s, e.x, e.y)).every((e) => inZone(spec.fence, e.x, e.y)), 'the other six inside the fence');
  assert.ok(h.filter((e) => e.patrol.length > 0).length >= 4, 'several patrol');
  const zombies = s.enemies.filter((e) => e.kind === 'zombie');
  assert.equal(zombies.length, 6);
  assert.ok(zombies.every((z) => !inZone(spec.fence, z.x, z.y)), 'no zombie inside the estate');
  assert.deepEqual(s.survivors.map((u) => u.kind), ['fighter', 'scout', 'hunter', 'archer']);
  for (const u of s.survivors) {
    assert.ok(u.y >= 70, `${u.id} at the south edge`);
    assert.ok(toZone(spec.fence, u.x, u.y) > spec.speaker!.callRange, `${u.id} starts out of Theo's call range`);
    for (const e of h) assert.ok(!seesPoint(s.grid, enemyViewer(e, undefined, s.difficulty), u.x, u.y), `${e.id} sees ${u.id} at the start`);
  }
});

test('the estate map: every squatter, post and patrol point can be reached from the start; the bunker is sealed until its door opens', () => {
  const s = fresh();
  const start: [number, number] = [s.survivors[0]!.x, s.survivors[0]!.y];
  for (const e of s.enemies) {
    assert.ok(findPath(s.grid, start, [e.x, e.y]), `${e.id} unreachable`);
    for (const p of e.patrol) assert.ok(findPath(s.grid, start, p), `${e.id} patrol ${p}`);
  }
  const b = spec.bunker;
  const n = s.grid.size;
  assert.equal(s.grid.tiles[b.door.y * n + b.door.x], WALL, 'the door is shut');
  assert.equal(findPath(s.grid, start, [b.inside.x, b.inside.y]), null, 'nobody walks into the bunker');
  assert.ok(findPath(s.grid, start, [b.room.x + 1, b.room.y + 1]), 'the concrete room is reachable');
  assert.ok(humans(s).some((e) => Math.hypot(e.x - b.door.x, e.y - b.door.y) <= 1.5), 'one squatter at the bunker door');
});

test('the speaker: Theo calls when a survivor first nears the fence (the highlight turns on), the guard tip follows, then the house and half-way beats', () => {
  const s = fresh();
  for (let i = 0; i < 5; i++) stepMission(s);
  assert.deepEqual(s.speaker!.said, []);
  assert.ok(!highlightAvailable(s));
  const u = s.survivors[0]!;
  u.y = spec.fence.y + spec.fence.h - 1 + spec.speaker!.callRange - 1; // within the call range, south of the fence
  stepMission(s);
  assert.deepEqual(s.speaker!.said, ['call']);
  assert.ok(s.theoOnAir && highlightAvailable(s), 'the enemy highlight works from his first line');
  for (let i = 0; i < spec.speaker!.tipDelay * TICK_HZ; i++) stepMission(s);
  assert.deepEqual(s.speaker!.said, ['call', 'guards']);
  s.roofOpen = true;
  stepMission(s);
  assert.deepEqual(s.speaker!.said, ['call', 'guards', 'inside']);
  const h = humans(s);
  for (const e of h.slice(0, 5)) e.hp = 0;
  stepMission(s);
  assert.equal(s.speaker!.said.length, 3, 'five of twelve is not half');
  h[5]!.hp = 0;
  stepMission(s);
  assert.deepEqual(s.speaker!.said, ['call', 'guards', 'inside', 'half']);
  for (let i = 0; i < 30; i++) stepMission(s);
  assert.equal(s.speaker!.said.length, 4, 'each beat fires once');
  for (const beat of SPEAKER_BEATS) assert.ok((story as unknown as { speaker: Record<string, string[]> }).speaker[beat]!.length > 0, `lines for ${beat}`);
});

test('win: every squatter down, with zombies still walking; a survivor down fails it', () => {
  const s = fresh();
  for (const e of humans(s)) e.hp = 0;
  stepMission(s);
  assert.equal(s.status, 'success');
  assert.ok(s.enemies.some((e) => e.kind === 'zombie' && e.hp > 0));
  const f = fresh();
  for (const e of humans(f)) e.hp = 0;
  f.survivors[1]!.hp = 0;
  stepMission(f);
  assert.equal(f.status, 'failed');
});

test('the door scene: the squad gathers, the door opens, Theo walks out and joins, the cache goes to the pools', () => {
  const s = fresh();
  for (const e of humans(s)) e.hp = 0;
  stepMission(s);
  const ammo = s.ammo;
  const b = spec.bunker;
  assert.equal(s.roofOpen, false);
  const d = newDoorScene(s, b);
  assert.ok(s.roofOpen, 'the roof lifts for the door scene');
  const seen: string[] = [];
  for (let i = 0; i < 3000 && d.beat !== 'done'; i++) {
    if (seen[seen.length - 1] !== d.beat) seen.push(d.beat);
    if (doorWaits(d)) doorLinesDone(s, d, b, spec.cache);
    else stepDoor(s, d, b);
  }
  seen.push(d.beat);
  assert.deepEqual(seen, ['gather', 'power', 'open', 'talk', 'done']);
  const n = s.grid.size;
  assert.equal(s.grid.tiles[b.door.y * n + b.door.x], FLOOR, 'the door is open');
  const theo = s.survivors.find((u) => u.id === THEO)!;
  assert.equal(theo.kind, 'tinkerer');
  assert.ok(theo.y > b.door.y - 0.01, 'he has stepped out of the bunker');
  for (const u of s.survivors.filter((v) => v.id !== THEO)) assert.ok(inZone(b.room, u.x, u.y), `${u.id} in the concrete room`);
  assert.equal(s.ammo, ammo + spec.cache.ammo);
  assert.deepEqual([s.loot.ammo, s.loot.scrap, s.loot.food], [spec.cache.ammo, spec.cache.scrap, 0], 'ammo and scrap, no food');
  const r = missionResult(s);
  assert.equal(r.scene, 'mission2');
  assert.deepEqual(r.rows[r.rows.length - 1], ['Squatters down', '12 of 12']);
});

test('Bios in Mission 2: Theo has no tab until the bunker door opens', () => {
  const s = fresh();
  const kinds = () => bioTabs(progressOfMission(s)).map((t) => t.kind);
  assert.deepEqual(kinds(), ['fighter', 'scout', 'hunter', 'archer']);
  for (const e of humans(s)) e.hp = 0;
  const d = newDoorScene(s, spec.bunker);
  while (d.beat === 'gather') stepDoor(s, d, spec.bunker);
  doorLinesDone(s, d, spec.bunker, spec.cache);
  assert.deepEqual(kinds(), ['fighter', 'scout', 'hunter', 'archer', 'tinkerer']);
  assert.deepEqual(bioTabs(progressOfMission()).map((t) => t.kind), ['fighter', 'scout'], 'Mission 1 unchanged');
});
