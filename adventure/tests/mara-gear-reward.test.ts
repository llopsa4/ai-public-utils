import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIALOGUES } from '../src/chapters/ch1/dialogue';
import { applyDialogueGear, resolveNode } from '../src/engine/dialogue';
import { equip } from '../src/engine/kit';
import { parseSave, serializeSave } from '../src/engine/saveFile';
import { applyCommand, newGame } from '../src/engine/state';

test('Oren grants and equips medium armour after his protection advice, never his initial repair advice', () => {
  const state = newGame();
  const initial = resolveNode(DIALOGUES.oren, DIALOGUES.oren.start, state);
  assert.equal(initial.id, 'before');
  assert.ok(initial.lines.some(line => line.text === 'dlg.oren.before2'));
  assert.equal(initial.gear, undefined);
  const node = resolveNode(DIALOGUES.orenProtection, DIALOGUES.orenProtection.start, state);
  assert.equal(node.id, 'advice');
  assert.deepEqual(node.gear, { give: ['layered-armor'], equip: 'layered-armor' }, 'the reward declaration grants only the intended armour');
  assert.ok(node.lines.some(line => line.text === 'dlg.oren.protection2'));
  assert.ok(!state.kit.owned.includes('layered-armor'), 'resolving speech does not grant equipment');
  assert.equal(state.kit.equipment.armor.id, 'patched-coat');
  for (const [flag, value] of Object.entries(node.set)) applyCommand(state, { type: 'setFlag', flag, value });
  assert.equal(applyDialogueGear(state.kit, node.gear), true);
  assert.equal(state.flags.metOren, true);
  assert.equal(state.kit.equipment.armor.id, 'layered-armor');
  assert.equal(state.kit.owned.filter(id => id === 'layered-armor').length, 1);
});

test('repeating Oren advice does not duplicate medium armour or undo the chosen outfit', () => {
  const state = newGame();
  const node = resolveNode(DIALOGUES.orenProtection, 'advice', state);
  applyDialogueGear(state.kit, node.gear);
  assert.ok(equip(state.kit, 'armor', 'patched-coat'));
  const before = structuredClone(state.kit);
  assert.equal(applyDialogueGear(state.kit, node.gear), false);
  assert.deepEqual(state.kit, before);
  assert.equal(applyDialogueGear(state.kit, undefined), false);
});

test('Oren medium-armour ownership and equipped state survive save reload without new fields', () => {
  const state = newGame();
  const node = resolveNode(DIALOGUES.orenProtection, 'advice', state);
  for (const [flag, value] of Object.entries(node.set)) applyCommand(state, { type: 'setFlag', flag, value });
  applyDialogueGear(state.kit, node.gear);
  const loaded = parseSave(serializeSave(state));
  assert.ok(loaded.ok);
  assert.equal(loaded.state.kit.equipment.armor.id, 'layered-armor');
  assert.equal(loaded.state.kit.owned.filter(id => id === 'layered-armor').length, 1);
  assert.equal(loaded.state.flags.metOren, true);
});
