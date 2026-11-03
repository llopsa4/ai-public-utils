import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CROWDS, EXTRAS, crowdKeys } from '../src/chapters/ch1/crowd';
import { routineFor } from '../src/engine/crowd';
import { ROOMS } from '../src/chapters/ch1/rooms';
import { Schedule, seeded, tooClose, type Routine } from '../src/engine/crowd';
import { TABLES } from '../src/engine/i18n';
import '../src/chapters'; // registers chapter 1's strings
import { FLAGS, MET_FLAGS } from '../src/chapters/ch1/flags';
import { WalkArea } from '../src/engine/pathfinding';

const HALL = CROWDS.maraRoom;

test('crowds are in the kiln hall (four workers), the firing house (two kids) and the ashways (the peddler)', () => {
  assert.deepEqual(Object.keys(CROWDS).sort(), ['ashways', 'firingHouse', 'maraRoom']);
  assert.equal(CROWDS.ashways.extras.length, 1);
  assert.ok(CROWDS.ashways.extras[0].shop);
  assert.equal(CROWDS.maraRoom.extras.length, 4);
  assert.equal(CROWDS.firingHouse.extras.length, 2);
  assert.equal(new Set(EXTRAS.map(e => e.id)).size, EXTRAS.length, 'nobody is in two rooms');
});

for (const [roomId, crowd] of Object.entries(CROWDS)) {
  const room = ROOMS[roomId];
  const area = new WalkArea(room.walkable.outer, room.walkable.holes);

  test(`${roomId}: every station, exit and the wander box are on the floor`, () => {
    for (const s of Object.values(crowd.stations)) assert.ok(area.contains(s), `station ${s.id} is off the floor`);
    for (const e of Object.values(crowd.exits)) assert.ok(area.contains(e), `exit ${e.id} is off the floor`);
    const w = crowd.wander;
    for (const [x, y] of [[w.x, w.y], [w.x + w.w, w.y + w.h]]) assert.ok(area.contains({ x, y }), 'the wander box stays on the floor');
  });

  test(`${roomId}: stations keep clear of every spot Mara walks to, of the story characters and of each other`, () => {
    const marasSpots = [...room.hotspots.flatMap(h => (h.walkTo ? [h.walkTo] : [])), ...Object.values(room.entries)];
    assert.deepEqual(tooClose(Object.values(crowd.stations), marasSpots, 24), []);
    assert.deepEqual(tooClose(Object.values(crowd.stations), room.actors, 24), []);
    const stations = Object.values(crowd.stations);
    for (const a of stations) for (const b of stations) {
      if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 18, `${a.id} and ${b.id} overlap`);
    }
  });

  test(`${roomId}: routines name real stations and exits`, () => {
    for (const e of crowd.extras) {
      for (const r of Object.values(e.routines)) {
        for (const id of r.stations) assert.ok(crowd.stations[id], `${e.id}: unknown station ${id}`);
        if (r.leave) assert.ok(crowd.exits[r.leave.exit], `${e.id}: unknown exit ${r.leave.exit}`);
      }
      if (e.leavesWhenCold) assert.ok(e.routines.cold.leave, `${e.id} leaves when cold, so its cold routine needs an exit`);
      if (e.carryBetween) for (const id of [e.carryBetween.pick, ...e.carryBetween.drop]) assert.ok(e.routines.warm.stations.includes(id));
    }
  });
}

test('every crowd line exists', () => {
  for (const key of crowdKeys()) assert.ok(TABLES.en[key], `missing string: ${key}`);
});

test('half the kiln hall leaves for good when the kiln goes cold; the kids stay', () => {
  assert.equal(HALL.extras.filter(e => e.leavesWhenCold).length, HALL.extras.length / 2);
  assert.ok(CROWDS.firingHouse.extras.every(e => !e.leavesWhenCold));
});

test('during the alarm the kids go to Nell; the kiln hall carries on as usual', () => {
  const nell = ROOMS.firingHouse.actors.find(a => a.id === 'nell')!;
  for (const kid of CROWDS.firingHouse.extras) {
    for (const id of routineFor(kid, 'alarm').stations) {
      const s = CROWDS.firingHouse.stations[id];
      assert.ok(Math.hypot(s.x - nell.x, s.y - nell.y) < 40, `${kid.id} stays close to Nell`);
    }
  }
  for (const worker of HALL.extras) assert.equal(routineFor(worker, 'alarm'), worker.routines.warm);
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
  const schedule = new Schedule(routine, HALL.stations, HALL.exits, HALL.wander, seeded(7));
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
      assert.ok(step.to.x >= HALL.wander.x && step.to.x <= HALL.wander.x + HALL.wander.w);
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
  const hauler = HALL.extras.find(e => e.id === 'extra-hauler')!;
  const schedule = new Schedule(hauler.routines.warm, HALL.stations, HALL.exits, HALL.wander, seeded(3));
  schedule.change(hauler.routines.cold, true);
  const step = schedule.next();
  assert.equal(step.kind, 'leave');
  assert.ok(step.kind === 'leave' && step.forever && step.exit.id === 'curtain');

  const stoker = HALL.extras.find(e => e.id === 'extra-stoker')!;
  const stays = new Schedule(stoker.routines.warm, HALL.stations, HALL.exits, HALL.wander, seeded(5));
  stays.change(stoker.routines.cold);
  for (let i = 0; i < 50; i++) {
    const s = stays.next();
    assert.notEqual(s.kind, 'leave');
    if (s.kind === 'go') assert.ok(stoker.routines.cold.stations.includes(s.station.id));
  }
});

test('each background person has their own "met" flag, counted in the notebook and accepted by saves', () => {
  assert.deepEqual(EXTRAS.map(e => e.met).filter(Boolean).sort(), [...MET_FLAGS].sort());
  for (const f of MET_FLAGS) assert.ok((FLAGS as readonly string[]).includes(f));
  for (const key of ['ui.met', 'ui.metFound']) assert.ok(TABLES.en[key]);
});
