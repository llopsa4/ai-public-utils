import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { newGame } from '../src/engine/state';
import { loadChapter } from '../src/chapters';
import { regulatorStage } from '../src/chapters/ch1/progression';
import { prepareRegulatorDebugState, openDebugRegulator } from '../src/ui/debugRegulator';
import type { Session } from '../src/game/session';
import { interactStory } from './support/story-driver';
import { parseSave, serializeSave } from '../src/engine/saveFile';

test('debug regulator resets a completed gallery to a valid two-screw puzzle without mutating its input', () => {
  const before = newGame();
  Object.assign(before.flags, { kilnCold: true, fought: true, gearChecked: true, galleryQuiet: true,
    boltLeft: true, boltRight: true, pressureBled: true, ringReleased: true, secretRail: true });
  before.inventory.push('regulator');
  const state = prepareRegulatorDebugState(before);
  assert.equal(before.flags.kilnCold, true);
  assert.equal(state.room, 'gallery');
  assert.equal(regulatorStage(state.flags), 'bolts');
  for (const flag of ['boltLeft', 'boltRight', 'kilnCold', 'fought', 'galleryQuiet', 'gearChecked']) assert.ok(!state.flags[flag], flag);
  assert.ok(state.flags.secretRail);
  assert.ok(state.flags.hasGauntlet && state.flags.protectionPrepared && state.flags.procedureKnown);
  assert.ok(state.inventory.includes('gauntlet') && state.inventory.includes('notebook'));
  assert.ok(!state.inventory.includes('regulator'));
  assert.ok(parseSave(serializeSave(state)).ok, 'prepared state remains a valid save');
  const cancel = interactStory(state, 'use', 'regulator', 'gauntlet', { fixtures: { puzzle: () => 'interrupted' } });
  assert.equal(cancel.stopped, 'interrupted');
  assert.ok(!state.flags.kilnCold && !state.inventory.includes('regulator'));
  interactStory(state, 'use', 'regulator', 'gauntlet', { fixtures: { puzzle: () => 'completed', fight: () => 'won' } });
  assert.ok(state.flags.kilnCold && state.flags.fought && state.flags.galleryQuiet);
  assert.equal(state.inventory.filter(item => item === 'regulator').length, 1);
  assert.equal(regulatorStage(prepareRegulatorDebugState(state).flags), 'bolts');
});

test('debug regulator starts from another hero without importing foreign flags, equipment or items', async () => {
  await loadChapter('intro');
  const before = newGame('intro');
  const state = prepareRegulatorDebugState(before);
  assert.equal(state.chapter, 'ch1');
  assert.ok(state.reached.includes('intro') && state.reached.includes('ch1'));
  assert.equal(state.kit.equipment.armor.id, 'layered-armor');
  assert.deepEqual(state.inventory, ['gauntlet', 'notebook']);
  const trace = interactStory(state, 'use', 'regulator', 'gauntlet', { fixtures: { puzzle: () => 'interrupted' } });
  assert.ok(trace.commands.some(command => command.type === 'regulatorPuzzle'));
});

function mockSession() {
  const events = new EventEmitter();
  let runs = 0, replacements = 0, busy = false;
  const scene = { events, sys: { isActive: () => true }, isBusy: () => busy,
    runScript: async () => { runs++; } };
  const session = { state: newGame(), onTitle: false, scene,
    ui: { anyDialogOpen: () => false, toast: () => {} },
    replaceState(state: ReturnType<typeof newGame>) { this.state = state; replacements++; } };
  return { session: session as unknown as Session, events, scene,
    counts: () => ({ runs, replacements }), setBusy: (value: boolean) => { busy = value; } };
}

test('debug shortcut waits for the new scene, rejects duplicate launches and supports replay', async () => {
  const mock = mockSession();
  const first = openDebugRegulator(mock.session);
  assert.equal(await openDebugRegulator(mock.session), false);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(mock.counts(), { runs: 0, replacements: 1 });
  mock.events.emit('create');
  assert.equal(await first, true);
  assert.equal(mock.counts().runs, 1);
  const second = openDebugRegulator(mock.session);
  await new Promise(resolve => setImmediate(resolve));
  mock.events.emit('create');
  assert.equal(await second, true);
  assert.deepEqual(mock.counts(), { runs: 2, replacements: 2 });
});

test('debug shortcut cannot interrupt a busy scene or run against a superseded state', async () => {
  const mock = mockSession();
  mock.setBusy(true);
  assert.equal(await openDebugRegulator(mock.session), false);
  assert.equal(mock.counts().replacements, 0);
  mock.setBusy(false);
  const pending = openDebugRegulator(mock.session);
  await new Promise(resolve => setImmediate(resolve));
  mock.session.state = newGame();
  mock.events.emit('create');
  assert.equal(await pending, false);
  assert.equal(mock.counts().runs, 0);
});

test('debug shortcut leaves modal screens intact and releases its guard after replacement fails', async () => {
  const mock = mockSession();
  mock.session.ui.anyDialogOpen = () => true;
  assert.equal(await openDebugRegulator(mock.session), false);
  assert.equal(mock.counts().replacements, 0);
  mock.session.ui.anyDialogOpen = () => false;
  mock.session.replaceState = () => { throw new Error('replacement failed'); };
  await assert.rejects(openDebugRegulator(mock.session), /replacement failed/);
  assert.equal(mock.events.listenerCount('create'), 0);
  await assert.rejects(openDebugRegulator(mock.session), /replacement failed/);
});
