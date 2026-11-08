import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OBJECTIVE_KEYS, objectives } from '../src/chapters/ch1/objectives';
import { TABLES } from '../src/engine/i18n';
import { defaultSettings, lineDuration, parseSettings } from '../src/engine/settings';
import { newGame } from '../src/engine/state';

test('the notebook shows finished goals plus the current one, never later ones', () => {
  const s = newGame();
  assert.deepEqual(objectives(s).map(o => [o.key, o.done]), [['obj.wren', false]]);
  s.flags.hoistHelped = true;
  assert.deepEqual(objectives(s).map(o => [o.key, o.done]), [['obj.wren', true], ['obj.bread', false]]);
  Object.assign(s.flags, { nellFed: true, dressed: true });
  assert.deepEqual(objectives(s).map(o => [o.key, o.done]).slice(-2), [['obj.dress', true], ['obj.cell', false]]);
  s.flags.hasGauntlet = true;
  assert.deepEqual(objectives(s).map(o => [o.key, o.done]).slice(-2), [['obj.cell', true], ['obj.notebook', false]]);
  Object.assign(s.flags, { hasNotebook: true, latchFixed: true, alarm:true, patchFailed: true, decided: true, procedureKnown: true });
  assert.deepEqual(objectives(s).slice(-1).map(o => [o.key, o.done]), [['obj.protection', false]]);
  s.flags.protectionPrepared = true;
  assert.deepEqual(objectives(s).slice(-2).map(o => [o.key, o.done]), [['obj.protection', true], ['obj.release', false]]);
  s.flags.kilnCold = true;
  const afterShutdown = objectives(s);
  assert.deepEqual(afterShutdown.slice(-2).map(o => [o.key, o.done, o.optional]), [['obj.goodbye', false, true], ['obj.leave', false, false]],
    'the optional goodbye shows alongside the next required goal');
  s.room = 'ashways';
  s.flags.valveVented = true;
  assert.equal(objectives(s).find(o=>!o.done&&!o.optional)?.key,'obj.ashwaysBoss');
  s.flags.ashwaysWon=true;
  assert.ok(objectives(s).filter(o => !o.optional).every(o => o.done));
  for (const key of OBJECTIVE_KEYS) assert.ok(TABLES.en[key], `missing text for ${key}`);
});

test('settings accept only valid values', () => {
  const d = defaultSettings();
  assert.deepEqual(parseSettings(null, d), d);
  assert.deepEqual(parseSettings({ textSpeed: 'warp', volume: 9, muted: 'yes', autoAdvance: false }, d),
    { ...d, volume: 1, autoAdvance: false });
  assert.equal(parseSettings({ volume: -2 }, d).volume, 0);
  assert.equal(defaultSettings(true).reducedMotion, true);
});

test('line duration follows text length and speed', () => {
  const line = 'x'.repeat(60);
  assert.ok(lineDuration(line, 'slow') > lineDuration(line, 'normal'));
  assert.ok(lineDuration(line, 'fast') < lineDuration(line, 'normal'));
  assert.ok(lineDuration('Hi', 'fast') >= 900);
});
