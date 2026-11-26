import assert from 'node:assert/strict';
import { test } from 'node:test';
import m01 from '../src/data/missions/m01.json';
import { barButtons } from '../src/sim/abilities';
import { baseButtons, createBase } from '../src/sim/base';
import { highlightAvailable, highlighted } from '../src/sim/highlight';
import { actionFor, buttonAction, defaultBindings } from '../src/sim/keymap';
import { createMission, type MissionSpec, type Survivor } from '../src/sim/mission';

// Z98: Theo's enemy highlight (DESIGN §5).

const mission = () => createMission(m01 as unknown as MissionSpec);
const theo = (u: Survivor): Survivor => ({ ...u, id: 'theo', kind: 'tinkerer' });
const hasButton = (list: { id: string }[]) => list.some((b) => b.id === 'highlight');

test('without Theo there is no highlight button and nothing is marked', () => {
  const s = mission();
  assert.equal(highlightAvailable(s), false);
  assert.deepEqual(highlighted(s), []);
  for (const u of s.survivors) assert.equal(hasButton(barButtons(s, u)), false);
});

test('from Theo on the speaker every living enemy is marked and every bar has the button', () => {
  const s = mission();
  s.theoOnAir = true;
  s.enemies[0]!.hp = 0;
  assert.deepEqual(highlighted(s).map((e) => e.id), s.enemies.slice(1).map((e) => e.id));
  for (const u of s.survivors) assert.equal(hasButton(barButtons(s, u)), true);
});

test('Theo in the squad gives the highlight while he is alive', () => {
  const s = mission();
  const u = theo(s.survivors[0]!);
  s.survivors.push(u);
  assert.equal(highlightAvailable(s), true);
  u.hp = 0;
  assert.equal(highlightAvailable(s), false);
});

test('Base keeps the button on its bar', () => {
  const s = createBase();
  const u = s.survivors[0]!;
  assert.equal(hasButton(baseButtons(s, u)), false);
  s.theoOnAir = true;
  assert.equal(hasButton(baseButtons(s, u)), true);
});

test('M toggles it and the button shows that key', () => {
  assert.equal(actionFor(defaultBindings(), 'M'), 'highlight');
  assert.equal(buttonAction('highlight', 'M'), 'highlight');
});
