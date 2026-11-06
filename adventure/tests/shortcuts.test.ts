import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gearAvailable, screenShortcut, type ShortcutContext } from '../src/ui/shortcuts';

const exploration: ShortcutContext = {
  editing: false, blocked: false, busy: false, dialogs: [],
  gearAvailable: true, gearPending: false, forcingGear: false, gearButtonFocused: false,
};

test('G, N and M open their screens in exploration, regardless of case', () => {
  for (const [key, panel] of [['g', 'gear'], ['n', 'notebook'], ['m', 'menu']] as const) {
    for (const value of [key, key.toUpperCase()]) assert.deepEqual(screenShortcut({ key: value }, exploration), { type: 'open', panel });
  }
});

test('a screen key closes only its own sole dialog, including gear while a script awaits it', () => {
  for (const [key, panel] of [['g', 'gear'], ['n', 'notebook'], ['m', 'menu']] as const) {
    assert.deepEqual(screenShortcut({ key }, { ...exploration, dialogs: [panel], busy: true }), { type: 'close', panel });
    for (const other of ['gear', 'notebook', 'menu', 'shop']) {
      if (other !== panel) assert.equal(screenShortcut({ key }, { ...exploration, dialogs: [other] }), null);
    }
    assert.equal(screenShortcut({ key }, { ...exploration, dialogs: [panel, 'confirm'] }), null, 'do not close a parent behind a child dialog');
  }
});

test('screen shortcuts ignore repeats, modifiers, editing and blocked game states', () => {
  for (const key of ['g', 'n', 'm']) {
    for (const modifier of ['repeat', 'ctrlKey', 'altKey', 'metaKey'] as const) {
      assert.equal(screenShortcut({ key, [modifier]: true }, exploration), null);
    }
    for (const blocker of ['editing', 'blocked', 'busy', 'gearPending'] as const) {
      assert.equal(screenShortcut({ key }, { ...exploration, [blocker]: true }), null);
    }
    assert.equal(screenShortcut({ key }, { ...exploration, dialogs: ['settings'] }), null);
  }
});

test('gear unlock is explicit in chapter one and automatic in later chapters', () => {
  assert.equal(gearAvailable({ chapter: 'ch1', flags: { metOren: true, fought: true } }), false);
  assert.equal(gearAvailable({ chapter: 'ch1', flags: { gearUnlocked: true } }), true);
  assert.equal(gearAvailable({ chapter: 'ch2', flags: {} }), true);
  assert.equal(screenShortcut({ key: 'g' }, { ...exploration, gearAvailable: false }), null);
  assert.deepEqual(screenShortcut({ key: 'n' }, { ...exploration, gearAvailable: false }), { type: 'open', panel: 'notebook' });
});

test('the guided gear prompt accepts G and focused Enter/Space while blocking other screens', () => {
  const guided = { ...exploration, forcingGear: true, busy: true, gearAvailable: false };
  for (const key of ['g', 'G']) assert.deepEqual(screenShortcut({ key }, guided), { type: 'guide', panel: 'gear' });
  for (const key of ['Enter', ' ']) {
    assert.equal(screenShortcut({ key }, guided), null);
    assert.deepEqual(screenShortcut({ key }, { ...guided, gearButtonFocused: true }), { type: 'guide', panel: 'gear' });
  }
  for (const key of ['n', 'm']) assert.equal(screenShortcut({ key }, guided), null);
  assert.equal(screenShortcut({ key: 'g', repeat: true }, guided), null);
  assert.equal(screenShortcut({ key: 'g' }, { ...guided, editing: true }), null);
  assert.equal(screenShortcut({ key: 'g' }, { ...guided, blocked: true }), null);
});

test('pending gear imports block all screen shortcuts, including a second G', () => {
  for (const key of ['g', 'n', 'm']) assert.equal(screenShortcut({ key }, { ...exploration, gearPending: true }), null);
});
