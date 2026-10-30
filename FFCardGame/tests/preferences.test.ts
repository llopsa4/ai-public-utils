import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tutorialComplete, completeTutorial, TUTORIAL_KEY } from '../client/src/persistence/preferences.ts';

test('only tutorial completion is persisted and restored', () => {
  const values = new Map<string, string>();
  const storage = () => ({ getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
  assert.equal(tutorialComplete(storage), false);
  completeTutorial(storage);
  assert.equal(tutorialComplete(storage), true);
  assert.deepEqual([...values], [[TUTORIAL_KEY, 'true']]);
});

test('blocked storage, missing storage, quota errors, and unexpected values do not interrupt play', () => {
  const blocked = () => { throw new Error('SecurityError'); };
  assert.equal(tutorialComplete(blocked), false);
  assert.doesNotThrow(() => completeTutorial(blocked));
  assert.equal(tutorialComplete(() => undefined), false);
  assert.doesNotThrow(() => completeTutorial(() => undefined));
  const denied = () => ({ getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } });
  assert.equal(tutorialComplete(denied), false);
  assert.doesNotThrow(() => completeTutorial(denied));
  assert.equal(tutorialComplete(() => ({ getItem: () => 'unexpected', setItem() {} })), false);
});
