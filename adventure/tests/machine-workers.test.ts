import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { CROWDS } from '../src/chapters/ch1/crowd';
import { MET_FLAGS } from '../src/chapters/ch1/flags';
import { actorGeometry } from '../src/game/actorGeometry';
import { newGame } from '../src/engine/state';
import { parseSave, serializeSave } from '../src/engine/saveFile';
import { Schedule, routineFor, seeded, lookKey } from '../src/engine/crowd';
import { TABLES } from '../src/engine/i18n';
import { enterStoryRoom } from './support/story-driver';
import '../src/chapters';

const hall = CROWDS.maraRoom;
const machines = hall.extras.filter(e => e.machine);

test('two low machines work alongside the people without adding acquaintance flags', () => {
  assert.equal(machines.length, 2);
  for (const machine of machines) {
    assert.equal(machine.met, undefined);
    assert.ok(machine.machine!.w > machine.machine!.h);
    assert.ok(!machine.leavesWhenCold && !machine.curious && !machine.shop);
    assert.equal(machine.routines.warm.detour, undefined);
    assert.equal(machine.routines.warm.leave, undefined);
  }
  assert.equal(MET_FLAGS.length, 6);
  assert.deepEqual(machines[0].routines.warm.stations, ['collectAsh', 'emptyAsh']);
  assert.deepEqual(machines[1].routines.warm.stations, ['sortShards']);
});

test('cold machines park without resuming work, including a fresh cold-room load', () => {
  for (const machine of machines) {
    for (const fresh of [false, true]) {
      const schedule = new Schedule(routineFor(machine, fresh ? 'cold' : 'warm'), hall.stations, hall.exits, hall.wander, seeded(7));
      if (!fresh) schedule.change(machine.routines.cold);
      for (let i = 0; i < 20; i++) {
        const step = schedule.next();
        assert.equal(step.kind, 'go');
        if (step.kind === 'go') {
          assert.equal(step.station.task, 'park');
          assert.ok(step.station.y <= 290, 'the parked machine remains above the phone dialogue panel');
        }
      }
    }
  }
});

test('Look descriptions exist during Wren’s errand as well as warm, alarm and cold moods', () => {
  for (const machine of machines) for (const mood of ['warm', 'errand', 'alarm', 'cold'] as const) {
    assert.ok(TABLES.en[lookKey(machine, mood)], `${machine.id}: missing Look description in ${mood}`);
  }
});

test('machine geometry is low and wide while every human pose keeps its original dimensions', () => {
  assert.deepEqual(actorGeometry('stand'), { w: 62, h: 116, shadowH: 11 });
  assert.deepEqual(actorGeometry('crouch'), { w: 70, h: 96, shadowH: 11 });
  assert.deepEqual(actorGeometry('dead'), { w: 116, h: 64, shadowH: 16 });
  assert.deepEqual(actorGeometry('stand', .5), { w: 31, h: 58, shadowH: 5.5 });
  for (const machine of machines) {
    const body = actorGeometry('stand', machine.body, machine.machine);
    assert.ok(body.h <= 36 && body.w >= 50 && body.shadowH === 6);
    assert.ok(body.h + 8 < actorGeometry('stand').h, 'speech sits above a machine, not an adult head');
  }
});

test('refusal is shown once on a cold hall entry and survives save/load without changing progress', () => {
  const state = newGame();
  state.room = 'maraRoom';
  state.flags.kilnCold = true;
  const progress = structuredClone(state.kit);
  const inventory = [...state.inventory];
  const first = enterStoryRoom(state);
  assert.deepEqual(first.spoken, ['line.machines.hollisAsk', 'line.machines.collectorRefuse', 'line.machines.hollisEnough', 'line.machines.sorterRefuse']);
  assert.equal(state.flags.machineRefusalSeen, true);
  assert.deepEqual(state.kit, progress);
  assert.deepEqual(state.inventory, inventory);
  const result = parseSave(serializeSave(state));
  assert.ok(result.ok);
  assert.deepEqual(enterStoryRoom(result.state).spoken, []);
});

test('an older cold save without the new flag gets the scene; warm entries do not', () => {
  const warm = newGame();
  warm.room = 'maraRoom';
  enterStoryRoom(warm);
  assert.equal(warm.flags.machineRefusalSeen, undefined);
  warm.flags.kilnCold = true;
  const result = parseSave(serializeSave(warm));
  assert.ok(result.ok);
  assert.equal(result.state.flags.machineRefusalSeen, undefined);
  assert.equal(enterStoryRoom(result.state).spoken.length, 4);
});

test('machine sheets have grounded frame sizes, directional movement and distinct work/refusal states', () => {
  for (const machine of machines) {
    const json = JSON.parse(readFileSync(new URL(`../art/src/characters/${machine.sheet}.json`, import.meta.url), 'utf8'));
    const tags = new Map<string, { from: number; to: number }>(json.meta.frameTags.map((tag: { name: string; from: number; to: number }) => [tag.name, tag]));
    for (const tag of ['walk_side', 'walk_up', 'walk_down', 'work', 'reach']) assert.ok(tags.get(tag)!.to > tags.get(tag)!.from);
    assert.notEqual(tags.get('park')!.from, tags.get('work')!.from);
    for (const frame of json.frames) assert.deepEqual(frame.sourceSize, { w: 256, h: 256 });
    assert.ok(json.meta.walk.distancePerFrame > 0);
  }
});
