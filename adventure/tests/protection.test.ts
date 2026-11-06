import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newGame } from '../src/engine/state';
import { equip } from '../src/engine/kit';
import { interactStory } from './support/story-driver';
import { enterStoryRoom } from './support/story-driver';
import { parseSave, serializeSave } from '../src/engine/saveFile';

function readyForShutdown() {
  const s = newGame();
  s.room = 'gallery';
  s.flags = { hasGauntlet: true, hasNotebook: true, patchFailed: true, decided: true, procedureKnown: true };
  s.inventory = ['gauntlet', 'notebook'];
  return s;
}

test('Oren introduces and equips medium armour only in the preparation conversation after the notebook', () => {
  const early = newGame();
  early.room = 'gallery';
  interactStory(early, 'talk', 'oren');
  assert.equal(early.kit.owned.includes('layered-armor'), false, 'initial repair advice no longer gives armour');
  assert.equal(early.flags.gearUnlocked, undefined);

  const s = readyForShutdown();
  const advice = interactStory(s, 'talk', 'oren', undefined, { fixtures: { screen: () => 'closed' } });
  assert.equal(s.kit.equipment.armor.id, 'layered-armor');
  assert.equal(s.flags.gearUnlocked, true);
  assert.equal(s.flags.protectionPrepared, true);
  assert.equal(s.flags.gearChecked, undefined, 'post-fight rewards remain a separate step');
  assert.ok(advice.commands.some(c => c.type === 'awaitGear'));
});

test('shutdown waits for the guided visit; repeating preparation preserves the chosen outfit', () => {
  const s = readyForShutdown();
  const blocked = interactStory(s, 'use', 'regulator', 'gauntlet');
  assert.equal(s.flags.kilnCold, undefined);
  assert.equal(blocked.commands.some(c => c.type === 'fight'), false);
  const interrupted = interactStory(s, 'talk', 'oren', undefined, { fixtures: { screen: () => 'interrupted' } });
  assert.equal(interrupted.stopped, 'interrupted');
  assert.equal(s.flags.protectionPrepared, undefined);
  assert.equal(s.flags.gearUnlocked, true);
  assert.ok(equip(s.kit, 'armor', 'patched-coat'));
  interactStory(s, 'talk', 'oren', undefined, { fixtures: { screen: () => 'closed' } });
  assert.equal(s.flags.protectionPrepared, true);
  assert.equal(s.kit.equipment.armor.id, 'patched-coat', 'an already received reward does not force a new outfit');
  assert.equal(s.kit.owned.filter(id => id === 'layered-armor').length, 1);
  const repeated = interactStory(s, 'talk', 'oren');
  assert.equal(repeated.commands.some(c => c.type === 'awaitGear'), false);
  const release = interactStory(s, 'use', 'regulator', 'gauntlet', { fixtures: { fight: () => 'won' } });
  assert.equal(s.flags.kilnCold, true);
  assert.equal(s.flags.fought, true);
  assert.equal(s.flags.gearChecked, true);
  assert.equal(release.commands.some(c => c.type === 'awaitGear'), false, 'no second guided visit after the fight');
  assert.ok(release.spoken.includes('line.orenShelter'));
  assert.ok(s.kit.owned.includes('light-armor') && s.kit.owned.includes('quick-harness'), 'post-fight spares still arrive');
  assert.deepEqual(enterStoryRoom(s).commands, [], 're-entering after the send-off does not repeat it');
});

test('preparation waits for the notebook and makes Gear available before the blocking visit', () => {
  const s = readyForShutdown();
  delete s.flags.procedureKnown;
  const early = interactStory(s, 'talk', 'oren');
  assert.ok(!early.commands.some(c => c.type === 'awaitGear'));
  assert.equal(s.kit.owned.includes('layered-armor'), false);
  assert.equal(s.flags.gearUnlocked, undefined);
  s.flags.procedureKnown = true;
  s.npcs.oren!.pose = 'dead';
  interactStory(s, 'talk', 'oren', undefined, { fixtures: { screen: (state, command) => {
    assert.equal(command.type, 'awaitGear');
    assert.equal(state.flags.gearUnlocked, true);
    assert.equal(state.flags.protectionPrepared, undefined);
    assert.equal(state.npcs.oren!.pose, 'stand');
    assert.equal(state.kit.equipment.armor.id, 'layered-armor');
    return 'closed';
  } } });
  assert.equal(s.flags.protectionPrepared, true);
});

test('a save during the guided visit resumes preparation without replacing an owned outfit', () => {
  const s = readyForShutdown();
  interactStory(s, 'talk', 'oren', undefined, { fixtures: { screen: () => 'interrupted' } });
  assert.ok(equip(s.kit, 'armor', 'patched-coat'));
  const loaded = parseSave(serializeSave(s));
  assert.ok(loaded.ok);
  assert.equal(loaded.state.flags.gearUnlocked, true);
  assert.equal(loaded.state.flags.protectionPrepared, undefined);
  interactStory(loaded.state, 'talk', 'oren', undefined, { fixtures: { screen: () => 'closed' } });
  assert.equal(loaded.state.flags.protectionPrepared, true);
  assert.equal(loaded.state.kit.equipment.armor.id, 'patched-coat');
  assert.equal(loaded.state.kit.owned.filter(id => id === 'layered-armor').length, 1);
});
