import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadChapter } from '../src/chapters';
import { applyDialogueEffects, resolveNode } from '../src/engine/dialogue';
import { DIALOGUES } from '../src/chapters/ch1/dialogue';
import { newGame } from '../src/engine/state';
import { equip } from '../src/engine/kit';
import type { Command } from '../src/engine/types';
import { enterStoryRoom, interactStory, runStoryCommands } from './support/story-driver';

test('dialogue effects grant flags, inventory and Oren equipment without re-equipping old rewards', () => {
  const s = newGame();
  const node = resolveNode(DIALOGUES.orenProtection, 'advice', s);
  assert.equal(s.kit.equipment.armor.id, 'patched-coat', 'resolving speech has no effects');
  assert.deepEqual(applyDialogueEffects(s, node), { inventoryChanged: false, gearReceived: true });
  assert.equal(s.flags.metOren, true);
  assert.equal(s.kit.equipment.armor.id, 'layered-armor');
  assert.ok(equip(s.kit, 'armor', 'patched-coat'));
  assert.deepEqual(applyDialogueEffects(s, node), { inventoryChanged: false, gearReceived: false });
  assert.equal(s.kit.equipment.armor.id, 'patched-coat');
  const farewell = resolveNode(DIALOGUES.nell, 'cold', s);
  assert.deepEqual(applyDialogueEffects(s, farewell), { inventoryChanged: true, gearReceived: false });
  assert.deepEqual(s.inventory, ['bread', 'scarf']);
  assert.deepEqual(applyDialogueEffects(s, farewell), { inventoryChanged: false, gearReceived: false });
});

test('a room transition runs entry commands and discards the rest of its original script', () => {
  const s = newGame();
  const trace = runStoryCommands(s, [
    { type: 'room', room: 'maraRoom', entry: 'fromTent' },
    { type: 'setFlag', flag: 'mustNotRun', value: true },
  ]);
  assert.equal(s.flags.wrenAsked, true);
  assert.equal(s.flags.mustNotRun, undefined);
  assert.deepEqual(trace.spoken, ['line.wrenCalls', 'line.maraToWren']);
  assert.equal(trace.stopped, 'room');
});

test('chapter transitions enter the new chapter and end terminates its original script', async () => {
  await loadChapter('ch2');
  const s = newGame();
  s.inventory = ['gauntlet', 'scarf'];
  const trace = runStoryCommands(s, [
    { type: 'chapter', id: 'ch2' }, { type: 'addItem', item: 'mustNotRun' },
  ]);
  assert.equal(s.chapter, 'ch2');
  assert.ok(!s.inventory.includes('mustNotRun'));
  assert.ok(trace.spoken.includes('line2.morning1'), 'new chapter entry runs automatically');
  assert.equal(trace.stopped, 'chapter');
  const end = runStoryCommands(s, [{ type: 'end' }, { type: 'setFlag', flag: 'mustNotRun', value: true }]);
  assert.equal(end.ended, true);
  assert.equal(s.flags.mustNotRun, undefined);
  const debug = newGame();
  runStoryCommands(debug, [{ type: 'end' }], { debug: true });
  assert.equal(debug.chapter, 'ch2', 'debug end advances to the next chapter');
});

test('initial entry and interactions use the state chapter rather than the global active chapter', async () => {
  await loadChapter('ch2');
  const s = newGame('ch2');
  const initial = enterStoryRoom(s);
  assert.ok(initial.spoken.includes('line2.morning2'));
  assert.deepEqual(enterStoryRoom(s).spoken, [], 'the chapter morning plays only once');
  const response = interactStory(s, 'use', 'pipeSeat');
  assert.ok(response.commands.length > 0);
  assert.ok(s.flags.sat);
});

test('fights and blocking screens require explicit outcomes, and unsupported commands fail', () => {
  const commands: Command[] = [
    { type: 'fight', id: 'hatchScavenger' },
    { type: 'creatureFight', pool: 'tunnel', from: { x: 0, y: 0 }, land: { x: 1, y: 1 } },
    { type: 'gear' }, { type: 'awaitGear' }, { type: 'shop' },
  ];
  for (const command of commands) {
    assert.throws(() => runStoryCommands(newGame(), [command]), /fixture.*required/i, command.type);
  }
  const s = newGame();
  const interrupted = runStoryCommands(s, [commands[0], { type: 'setFlag', flag: 'fought', value: true }], {
    fixtures: { fight: () => 'interrupted' },
  });
  assert.equal(interrupted.stopped, 'interrupted');
  assert.equal(s.flags.fought, undefined);
  runStoryCommands(s, [commands[0], { type: 'setFlag', flag: 'fought', value: true }], {
    fixtures: { fight: () => 'won' },
  });
  assert.equal(s.flags.fought, true);
  assert.throws(() => runStoryCommands(s, [{ type: 'unsupported' } as unknown as Command]), /unsupported/i);
  const arguing = newGame();
  arguing.flags.patchFailed = true;
  assert.throws(() => runStoryCommands(arguing, [{ type: 'dialogue', id: 'oren' }]), /choice fixture required/i);
  assert.throws(() => runStoryCommands(arguing, [{ type: 'dialogue', id: 'oren' }], {
    choose: () => 'not-a-choice',
  }), /choice/i);
});

test('blocking screens continue only after the fixture closes them; presentation waits have no effects', () => {
  for (const type of ['gear', 'awaitGear', 'shop'] as const) {
    const s = newGame();
    const commands: Command[] = [{ type }, { type: 'setFlag', flag: 'finishedScreen', value: true }];
    const interrupted = runStoryCommands(s, commands, { fixtures: { screen: () => 'interrupted' } });
    assert.equal(interrupted.stopped, 'interrupted');
    assert.equal(s.flags.finishedScreen, undefined);
    const closed = runStoryCommands(s, commands, { fixtures: { screen: () => 'closed' } });
    assert.equal(closed.stopped, null);
    assert.equal(s.flags.finishedScreen, true);
  }
  const s = newGame();
  const before = structuredClone(s);
  const waited = runStoryCommands(s, [{ type: 'wait', ms: 100000 }, { type: 'fade', to: 'black', ms: 100000 }]);
  assert.deepEqual(s, before);
  assert.deepEqual(waited.commands.map(c => c.type), ['wait', 'fade']);
});
