import assert from 'node:assert/strict';
import { test } from 'node:test';
import chars from '../src/data/characters.json';
import m01 from '../src/data/missions/m01.json';
import { type MissionState, createMission, orderMove, stepMission } from '../src/sim/mission';
import { moveNoiseOf, traitLine } from '../src/sim/traits';

const open = Array.from({ length: 30 }, () => '.'.repeat(30));
const both = { survivors: [{ id: 'c', kind: 'fighter' as const, x: 2, y: 2 }, { id: 'e', kind: 'scout' as const, x: 2, y: 6 }], enemies: [] };
const mission = (): MissionState => createMission({ map: open, extract: { x: 0, y: 0, w: 1, h: 1 }, ...both });

test('Cass runs silently: run noise 0, the other modes unchanged; Eli keeps the shared noise', () => {
  assert.equal(moveNoiseOf('fighter', 'run'), 0);
  assert.equal(moveNoiseOf('fighter', 'walk'), chars.moveNoise.walk);
  assert.equal(moveNoiseOf('scout', 'run'), chars.moveNoise.run);
  assert.equal(moveNoiseOf('scout', 'crouch'), 0);
});

test('Eli runs at 6.5 tiles/s, faster than Cass (5); other speeds are unchanged', () => {
  assert.equal(chars.scout.speed.run, 6.5);
  assert.equal(chars.fighter.speed.run, 5);
  assert.ok(chars.scout.speed.run > chars.fighter.speed.run);
});

test('in play: running Cass makes no step noise, running Eli does, and Eli covers more ground', () => {
  const s = mission();
  assert.ok(orderMove(s, ['c'], [20, 2], true).length);
  assert.ok(orderMove(s, ['e'], [20, 6], true).length);
  const noises: { from: string; radius: number }[] = [];
  for (let i = 0; i < 20; i++) {
    stepMission(s);
    for (const n of s.noises) if (n.kind === 'step') noises.push({ from: n.from, radius: n.radius });
  }
  assert.ok(noises.some((n) => n.from === 'e' && n.radius === chars.moveNoise.run));
  assert.ok(!noises.some((n) => n.from === 'c'));
  const x = (id: string): number => s.survivors.find((u) => u.id === id)!.x;
  assert.ok(x('e') - 2 > x('c') - 2, 'Eli ran further');
});

test('the trait lines name both survivors with their numbers; others have none', () => {
  assert.match(traitLine('Cass'), /silently/);
  assert.match(traitLine('Eli'), /6\.5/);
  assert.equal(traitLine('Narrator'), '');
  assert.ok(m01.hints.some((h) => h.includes('Cass runs silently') && h.includes(String(chars.scout.speed.run))));
});
