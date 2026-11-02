import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { EXTRAS, HALL_EXITS, HALL_STATIONS, HALL_WANDER, crowdKeys } from '../src/content/crowd';
import { ROOMS } from '../src/content/rooms';
import { Schedule, seeded, tooClose, type Routine } from '../src/engine/crowd';
import { TABLES } from '../src/engine/i18n';
import { WalkArea } from '../src/engine/pathfinding';

const hall = ROOMS.maraRoom;
const area = new WalkArea(hall.walkable.outer, hall.walkable.holes);

test('the kiln hall has a crowd and every station and exit is on the floor', () => {
  assert.ok(hall.crowd);
  for (const s of Object.values(HALL_STATIONS)) assert.ok(area.contains(s), `station ${s.id} is off the floor`);
  for (const e of Object.values(HALL_EXITS)) assert.ok(area.contains(e), `exit ${e.id} is off the floor`);
  for (const [x, y] of [[HALL_WANDER.x, HALL_WANDER.y], [HALL_WANDER.x + HALL_WANDER.w, HALL_WANDER.y + HALL_WANDER.h]]) {
    assert.ok(area.contains({ x, y }), 'the wander box stays on the floor');
  }
});

test('stations keep clear of every spot Mara walks to and of each other', () => {
  const marasSpots = [
    ...hall.hotspots.flatMap(h => (h.walkTo ? [h.walkTo] : [])),
    ...Object.values(hall.entries),
  ];
  assert.deepEqual(tooClose(Object.values(HALL_STATIONS), marasSpots, 24), []);
  const stations = Object.values(HALL_STATIONS);
  for (const a of stations) for (const b of stations) {
    if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 18, `${a.id} and ${b.id} overlap`);
  }
});

test('routines name real stations and exits, and every line exists', () => {
  for (const e of EXTRAS) {
    for (const r of [e.warm, e.cold]) {
      for (const id of r.stations) assert.ok(HALL_STATIONS[id], `${e.id}: unknown station ${id}`);
      if (r.leave) assert.ok(HALL_EXITS[r.leave.exit], `${e.id}: unknown exit ${r.leave.exit}`);
    }
    if (e.leavesWhenCold) assert.ok(e.cold.leave, `${e.id} leaves when cold, so its cold routine needs an exit`);
    if (e.carryBetween) for (const id of [e.carryBetween.pick, ...e.carryBetween.drop]) assert.ok(e.warm.stations.includes(id));
  }
  for (const key of crowdKeys()) assert.ok(TABLES.en[key], `missing string: ${key}`);
});

test('half the crowd leaves for good when the kiln goes cold', () => {
  assert.equal(EXTRAS.filter(e => e.leavesWhenCold).length, EXTRAS.length / 2);
});

test('every background sheet has the tags the crowd plays', () => {
  for (const e of EXTRAS) {
    const json = JSON.parse(readFileSync(new URL(`../art/src/characters/${e.sheet}.json`, import.meta.url), 'utf8'));
    const tags = new Set(json.meta.frameTags.map((t: { name: string }) => t.name));
    for (const tag of ['stand_down', 'stand_side', 'stand_up', 'blink_down', 'blink_side', 'walk_down', 'walk_side', 'walk_up', 'crouch', 'work', 'carry', 'reach', 'sit']) {
      assert.ok(tags.has(tag), `${e.sheet} has no ${tag}`);
    }
  }
});

test('a schedule loops through its stations, wanders now and then, and leaves and comes back', () => {
  const routine: Routine = { stations: ['mouthA', 'mouthB', 'clayPile'], detour: 0.3, leave: { exit: 'curtain', chance: 0.1, away: [1000, 2000] } };
  const schedule = new Schedule(routine, HALL_STATIONS, HALL_EXITS, HALL_WANDER, seeded(7));
  const kinds = new Map<string, number>();
  const visited = new Set<string>();
  let lastWasDetour = false;
  for (let i = 0; i < 400; i++) {
    const step = schedule.next();
    kinds.set(step.kind, (kinds.get(step.kind) ?? 0) + 1);
    if (step.kind === 'go') {
      visited.add(step.station.id);
      assert.ok(step.wait >= step.station.wait[0] && step.wait <= step.station.wait[1]);
    }
    if (step.kind === 'detour') {
      assert.ok(!lastWasDetour, 'never two wanders in a row');
      assert.ok(step.to.x >= HALL_WANDER.x && step.to.x <= HALL_WANDER.x + HALL_WANDER.w);
    }
    if (step.kind === 'leave') {
      assert.equal(step.forever, false);
      assert.ok(step.away >= 1000 && step.away <= 2000);
    }
    lastWasDetour = step.kind === 'detour';
  }
  assert.deepEqual([...visited].sort(), ['clayPile', 'mouthA', 'mouthB']);
  assert.ok((kinds.get('detour') ?? 0) > 20);
  assert.ok((kinds.get('leave') ?? 0) > 10);
});

test('a schedule switches routine when the kiln goes cold, and can leave for good', () => {
  const runner = EXTRAS.find(e => e.id === 'extra-runner')!;
  const schedule = new Schedule(runner.warm, HALL_STATIONS, HALL_EXITS, HALL_WANDER, seeded(3));
  schedule.change(runner.cold, true);
  const step = schedule.next();
  assert.equal(step.kind, 'leave');
  assert.ok(step.kind === 'leave' && step.forever && step.exit.id === 'curtain');

  const stoker = EXTRAS.find(e => e.id === 'extra-stoker')!;
  const stays = new Schedule(stoker.warm, HALL_STATIONS, HALL_EXITS, HALL_WANDER, seeded(5));
  stays.change(stoker.cold);
  for (let i = 0; i < 50; i++) {
    const s = stays.next();
    assert.notEqual(s.kind, 'leave');
    if (s.kind === 'go') assert.ok(stoker.cold.stations.includes(s.station.id));
  }
});
