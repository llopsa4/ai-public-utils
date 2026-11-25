import assert from 'node:assert/strict';
import { test } from 'node:test';
import m01 from '../src/data/missions/m01.json';
import { createBase } from '../src/sim/base';
import { newCampaign, toBase1 } from '../src/sim/campaign';
import { type MissionSpec, type MissionState, createMission, withLayout } from '../src/sim/mission';
import { JUNE, RAY, RESCUE_ZOMBIES, type Rescue, SHOOTERS, linesDone, newRescue, startAmbush, stepRescue, waitsForLines } from '../src/sim/rescue';

// Z82: the rescue after Mission 1 (DESIGN §16 *The rescue*) runs into Base 1 with four survivors.

/** Mission 1 won: every zombie dead, every crate open, Cass and Eli where layout `i` leaves them (their start). */
function won(i = 0): MissionState {
  const s = createMission(withLayout(m01 as unknown as MissionSpec, i));
  for (const e of s.enemies) e.hp = 0;
  for (const c of s.crates) c.opened = true;
  s.status = 'success';
  return s;
}

/** Plays the rescue to the end; every line beat is "read" at once (as Esc skipping each line would). Returns the beats seen. */
function play(s: MissionState, r: Rescue): string[] {
  const seen: string[] = [];
  for (let i = 0; i < 2000 && r.beat !== 'done'; i++) {
    if (seen[seen.length - 1] !== r.beat) seen.push(r.beat);
    if (r.beat === 'ambush') startAmbush(s, r);
    else if (waitsForLines(r)) linesDone(r);
    else stepRescue(s, r);
  }
  seen.push(r.beat);
  return seen;
}

test('the rescue: six zombies, June kills four and Ray two, both walk in, then the talk; nobody is hurt', () => {
  for (let layout = 0; layout < 4; layout++) {
    const s = won(layout);
    const r = newRescue();
    assert.equal(r.beat, 'ambush');
    const beats = play(s, r);
    assert.deepEqual(beats, ['ambush', 'walk', 'alarm', 'arrows', 'walkIn', 'talk', 'done']);
    const six = s.enemies.filter((e) => r.zombies.includes(e.id));
    assert.equal(six.length, RESCUE_ZOMBIES);
    assert.ok(six.every((e) => e.hp <= 0));
    const by = (k: string) => six.filter((e) => e.killedBy === k).length;
    assert.equal(by('archer'), SHOOTERS.filter((x) => x === JUNE).length);
    assert.equal(by('archer'), 4);
    assert.equal(by('hunter'), 2);
    assert.equal(s.survivors.length, 4);
    assert.ok(s.survivors.every((u) => u.hp === u.maxHp), 'the arrows come before any bite');
    const cass = s.survivors.find((u) => u.id === 'fighter')!;
    for (const id of [RAY, JUNE]) {
      const u = s.survivors.find((v) => v.id === id)!;
      assert.ok(Math.hypot(u.x - cass.x, u.y - cass.y) < 5, `${id} walked in to Cass`);
    }
  }
});

test('the six come out of the treeline far from Cass and Eli; Ray and June start farther, out of view', () => {
  const s = won();
  const r = newRescue();
  startAmbush(s, r);
  const cass = s.survivors.find((u) => u.id === 'fighter')!;
  for (const e of s.enemies.filter((e) => r.zombies.includes(e.id))) assert.ok(Math.hypot(e.x - cass.x, e.y - cass.y) > 7);
  for (const id of [RAY, JUNE]) {
    const u = s.survivors.find((v) => v.id === id)!;
    assert.ok(Math.hypot(u.x - cass.x, u.y - cass.y) > 11, id);
  }
});

test('the line beats wait for the scene: no tick passes while lines play', () => {
  const s = won();
  const r = newRescue();
  const t = s.tick;
  stepRescue(s, r); // ambush: Eli's line is up
  assert.equal(s.tick, t);
  startAmbush(s, r);
  for (let i = 0; i < 100 && r.beat === 'walk'; i++) stepRescue(s, r);
  assert.equal(r.beat, 'alarm');
  const at = s.tick;
  stepRescue(s, r);
  assert.equal(s.tick, at);
  assert.ok(s.enemies.filter((e) => r.zombies.includes(e.id)).every((e) => e.hp > 0), 'no kill before the alarm lines end');
});

test('Base 1 starts with the four where the rescue left them', () => {
  const s = won();
  play(s, newRescue());
  const start = s.survivors.map((u) => ({ id: u.id, x: Math.round(u.x), y: Math.round(u.y), facing: [u.facing[0], u.facing[1]] as [number, number] }));
  const c = toBase1(newCampaign(), { food: 0, scrap: 0, ammo: s.ammo, start });
  const b = createBase({ calm: true, start: c.start });
  assert.equal(b.survivors.length, 4);
  for (const id of ['fighter', 'scout', RAY, JUNE]) {
    const u = b.survivors.find((v) => v.id === id)!;
    const p = start.find((q) => q.id === id)!;
    assert.ok(Math.hypot(u.x - p.x, u.y - p.y) <= 2, `${id} starts near its rescue tile`);
  }
});

test('the rescue plays wherever Cass and Eli end: inside the house, by the shed, near the far trees', () => {
  for (const [x, y] of [[30, 30], [52, 50], [3, 3], [56, 57]] as const) {
    const s = won();
    const free = (dx: number) => {
      const u = s.survivors[dx]!;
      u.x = x + dx;
      u.y = y;
    };
    free(0);
    free(1);
    const r = newRescue();
    assert.equal(play(s, r).at(-1), 'done', `${x},${y}`);
    assert.equal(s.survivors.length, 4, `${x},${y}`);
    assert.ok(s.enemies.filter((e) => r.zombies.includes(e.id)).every((e) => e.hp <= 0), `${x},${y}`);
    assert.ok(s.survivors.every((u) => u.hp === u.maxHp), `${x},${y}`);
  }
});
