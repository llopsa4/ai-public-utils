import assert from 'node:assert/strict';
import { test } from 'node:test';
import chars from '../src/data/characters.json';
import { pickFrame } from '../src/render/figure';
import { barButtons, finisherFor, orderFinish } from '../src/sim/abilities';
import { baseButtons, createBase } from '../src/sim/base';
import { damage } from '../src/sim/combat';
import { type MissionSpec, type MissionState, createMission, orderMove, risenId, stepMission } from '../src/sim/mission';
import { TICK_HZ } from '../src/sim/time';
import { moveMode } from '../src/sim/vision';

// Z106: Finish (DESIGN §26): a squatter's body about to rise stays a body. Archers spend an arrow from range;
// everyone else holds 2 s next to it, crouched.

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));
const HOLD = Math.round(chars.finishTime * TICK_HZ);
/** A second squatter far off, facing away, so the mission does not end with the first one dead. */
const spare = { id: 'h9', kind: 'human' as const, x: 38, y: 2, facing: [1, 0] as [number, number] };

/** A squatter at (10, 10) already killed by a zombie, so its body is due to rise. */
function fallen(survivors: MissionSpec['survivors'], map = open(40)): MissionState {
  const s = createMission({ map, win: 'squatters', survivors, enemies: [{ id: 'h1', kind: 'human', x: 10, y: 10 }, spare] });
  damage(s, s.enemies.find((e) => e.id === 'h1')!, 999, 'zombie');
  return s;
}
function run(s: MissionState, ticks: number): void {
  for (let i = 0; i < ticks; i++) stepMission(s);
}
const unit = (s: MissionState, id: string) => s.survivors.find((u) => u.id === id)!;
const body = (s: MissionState) => s.bodies.find((b) => b.id === 'h1');
const cass = (x: number, y: number) => ({ id: 'cass', kind: 'fighter' as const, x, y });
const ray = (x: number, y: number) => ({ id: 'ray', kind: 'hunter' as const, x, y });

test('by hand: 2 s next to the body, crouched, and it never rises', () => {
  const s = fallen([cass(11, 10)]);
  assert.ok(orderFinish(s, 'cass', 'h1'));
  run(s, HOLD - 1);
  const u = unit(s, 'cass');
  assert.ok(body(s)!.riseAt !== undefined, 'not done yet');
  assert.equal(moveMode(u), 'crouch', 'seen as crouched');
  assert.equal(u.stance, 'walk', 'the chosen stance is kept');
  assert.equal(pickFrame(u, { crouch: 4, idle: 1 }, s.tick, 0, 0, 0).anim, 'crouch');
  run(s, 1);
  assert.equal(body(s)!.riseAt, undefined);
  assert.equal(u.order, null);
  assert.equal(moveMode(u), 'walk');
  run(s, 40 * TICK_HZ);
  assert.ok(body(s), 'still a body');
  assert.ok(!s.enemies.some((e) => e.id === risenId('h1')));
});

test('by hand from farther off: walks up first; a new order starts the 2 s over', () => {
  const s = fallen([cass(16, 10)]);
  orderFinish(s, 'cass', 'h1');
  run(s, HOLD);
  assert.ok(body(s)!.riseAt !== undefined, 'still walking');
  run(s, 10 * TICK_HZ);
  assert.equal(body(s)!.riseAt, undefined);

  const t = fallen([cass(11, 10)]);
  orderFinish(t, 'cass', 'h1');
  run(t, HOLD - 2);
  orderMove(t, ['cass'], [11, 10]);
  run(t, 2);
  orderFinish(t, 'cass', 'h1');
  run(t, HOLD - 1);
  assert.ok(body(t)!.riseAt !== undefined);
  run(t, 1);
  assert.equal(body(t)!.riseAt, undefined);
});

test('an archer: one silent arrow from range, spent like any shot, lying where it hit', () => {
  const s = fallen([ray(16, 10)]);
  const u = unit(s, 'ray');
  orderFinish(s, 'ray', 'h1');
  run(s, 1);
  assert.equal(body(s)!.riseAt, undefined, 'at once, from 6 tiles');
  assert.deepEqual([u.x, u.y], [16, 10]);
  assert.equal(u.arrows, chars.quiver - 1);
  assert.deepEqual(s.looseArrows.map((a) => [a.x, a.y, a.owner]), [[10, 10, 'ray']]);
  assert.deepEqual(u.act?.at, [10, 10]);
  assert.equal(u.cooldown > 0, true);
  assert.ok(!s.noises.some((n) => n.kind === 'shot'), 'the bow is silent');
});

test('an archer behind a wall walks to a clear shot; one out of arrows does it by hand', () => {
  const map = open(40);
  for (const y of [8, 9, 10, 11, 12]) map[y] = map[y]!.slice(0, 13) + '#' + map[y]!.slice(14);
  const s = fallen([ray(16, 10)], map);
  orderFinish(s, 'ray', 'h1');
  run(s, 1);
  assert.ok(body(s)!.riseAt !== undefined, 'no line of sight yet');
  run(s, 10 * TICK_HZ);
  assert.equal(body(s)!.riseAt, undefined);

  const t = fallen([ray(11, 10)]);
  unit(t, 'ray').arrows = 0;
  orderFinish(t, 'ray', 'h1');
  run(t, HOLD - 1);
  assert.ok(body(t)!.riseAt !== undefined);
  run(t, 1);
  assert.equal(body(t)!.riseAt, undefined);
  assert.equal(t.looseArrows.length, 0);
});

test('an invalid target is refused: no such body, a body that will never rise, one already finished or risen', () => {
  const s = createMission({ map: open(40), win: 'squatters', survivors: [cass(11, 10)], enemies: [{ id: 'h1', kind: 'human', x: 10, y: 10 }, spare] });
  assert.equal(orderFinish(s, 'cass', 'h1'), false, 'still standing');
  damage(s, s.enemies[0]!, 999, 'fighter');
  assert.equal(orderFinish(s, 'cass', 'h1'), false, 'killed by a survivor: stays down anyway');
  assert.equal(orderFinish(s, 'cass', 'nobody'), false);
  assert.equal(finisherFor(s, s.survivors, 'h1'), undefined);
  assert.equal(unit(s, 'cass').order, null);

  const t = fallen([cass(11, 10)]);
  orderFinish(t, 'cass', 'h1');
  run(t, HOLD);
  assert.equal(orderFinish(t, 'cass', 'h1'), false, 'already finished');
});

test('a body that rises during the walk ends the order', () => {
  const s = fallen([cass(30, 30)]);
  orderFinish(s, 'cass', 'h1');
  body(s)!.riseAt = s.tick + 2;
  run(s, 2);
  assert.equal(body(s), undefined);
  run(s, 1);
  assert.equal(unit(s, 'cass').order, null);
});

test('with several selected: an archer with arrows goes first, else the nearest', () => {
  const s = fallen([cass(11, 10), ray(16, 10), { id: 'eli', kind: 'scout', x: 20, y: 10 }]);
  assert.equal(finisherFor(s, s.survivors, 'h1')!.id, 'ray');
  unit(s, 'ray').arrows = 0;
  assert.equal(finisherFor(s, s.survivors, 'h1')!.id, 'cass');
});

test('the button: on every bar where there are squatters, not in a zombie-only mission or Base 1', () => {
  const has = (s: MissionState, id: string) => barButtons(s, unit(s, id)).some((b) => b.id === 'finish');
  const s = fallen([cass(11, 10), ray(16, 10)]);
  assert.ok(has(s, 'cass') && has(s, 'ray'));
  const zombies = createMission({ map: open(20), survivors: [cass(1, 1)], enemies: [{ id: 'z1', kind: 'zombie', x: 9, y: 9 }] });
  assert.ok(!has(zombies, 'cass'));
  const b = createBase();
  assert.ok(!baseButtons(b, b.survivors[0]!).some((x) => x.id === 'finish'));
});
