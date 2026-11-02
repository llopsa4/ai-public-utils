import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIALOGUES } from '../src/content/dialogue';
import { INTERACTION_KEYS } from '../src/content/interactions';
import { ROOMS } from '../src/content/rooms';
import { dialogueKeys } from '../src/engine/dialogue';
import { LANGUAGES, TABLES, detectLanguage } from '../src/engine/i18n';
import { MAX_SAVE_BYTES, parseSave, serializeSave } from '../src/engine/saveFile';
import { ITEMS, newGame } from '../src/engine/state';
import { VERBS } from '../src/engine/types';

test('a save round-trips exactly', () => {
  const s = newGame();
  s.flags.hasGauntlet = true;
  s.flags.kilnCold = true;
  s.inventory.push('gauntlet', 'regulator');
  s.hero.pose = 'crouch';
  s.npcs.nell.pose = 'dead';
  s.npcs.oren.face = 'right';
  const result = parseSave(serializeSave(s));
  assert.ok(result.ok);
  assert.deepEqual(result.state, s);
});

test('invalid saves are rejected with a reason', () => {
  const good = JSON.parse(serializeSave(newGame()));
  const variant = (change: (d: any) => void) => { const d = structuredClone(good); change(d); return JSON.stringify(d); };
  const cases: [string, string][] = [
    ['not json', 'save.error.notJson'],
    [JSON.stringify({ hello: 1 }), 'save.error.notSave'],
    [variant(d => { d.version = 99; }), 'save.error.version'],
    [variant(d => { d.state.room = 'moon'; }), 'save.error.invalid'],
    [variant(d => { d.state.room = '__proto__'; }), 'save.error.invalid'],
    [variant(d => { d.state.hero.x = 'left'; }), 'save.error.invalid'],
    [variant(d => { d.state.hero.y = 9999; }), 'save.error.invalid'],
    [variant(d => { d.state.hero.pose = 'flying'; }), 'save.error.invalid'],
    [variant(d => { d.state.flags.godMode = true; }), 'save.error.invalid'],
    [variant(d => { d.state.flags.doorOpen = 'yes'; }), 'save.error.invalid'],
    [variant(d => { d.state.inventory = ['gauntlet', 'gauntlet']; }), 'save.error.invalid'],
    [variant(d => { d.version = 1; }), 'save.error.version'],
    [variant(d => { d.state.npcs.stranger = { pose: 'stand', face: 'left' }; }), 'save.error.invalid'],
    [variant(d => { delete d.state.npcs.nell; }), 'save.error.invalid'],
    [variant(d => { d.state.npcs.nell.pose = 'sleeping'; }), 'save.error.invalid'],
    [variant(d => { d.state.inventory = ['crown']; }), 'save.error.invalid'],
    ['x'.repeat(MAX_SAVE_BYTES + 1), 'save.error.tooLarge'],
  ];
  for (const [text, error] of cases) {
    const result = parseSave(text);
    assert.equal(result.ok, false, text.slice(0, 80));
    if (!result.ok) assert.equal(result.error, error, text.slice(0, 80));
  }
});

test('false flags are dropped on import', () => {
  const s = newGame();
  const text = serializeSave(s).replace('"flags": {}', '"flags": {"kilnCold": false}');
  const result = parseSave(text);
  assert.ok(result.ok);
  assert.deepEqual(result.state.flags, {});
});

test('all languages define exactly the same keys, with no empty text', () => {
  const english = Object.keys(TABLES.en).sort();
  for (const lang of LANGUAGES) {
    assert.deepEqual(Object.keys(TABLES[lang]).sort(), english, `${lang} keys differ from en`);
    for (const [key, text] of Object.entries(TABLES[lang])) {
      assert.ok(text.trim().length > 0, `${lang}.${key} is empty`);
      const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      assert.deepEqual(placeholders(text), placeholders(TABLES.en[key]), `${lang}.${key} placeholders`);
    }
  }
});

test('every key used by the content exists', () => {
  const used = [
    ...INTERACTION_KEYS,
    ...Object.values(DIALOGUES).flatMap(dialogueKeys),
    ...Object.values(ROOMS).flatMap(r => r.hotspots.map(h => h.name)),
    ...VERBS.map(v => `verb.${v}`),
    ...Object.values(ROOMS).filter(r => r.sign).map(r => `room.${r.id}`),
    'name.hero', 'name.oren', 'name.nell', ...ITEMS.map(i => `name.${i}`),
    'intro.1', 'intro.2', 'intro.3', 'intro.4',
    'ui.endTag', 'ui.endTitle', 'ui.endText', 'speaker.hero', 'speaker.oren', 'speaker.nell',
    'save.error.tooLarge', 'save.error.notJson', 'save.error.notSave', 'save.error.version', 'save.error.invalid',
  ];
  for (const key of used) assert.ok(TABLES.en[key], `missing string: ${key}`);
});

test('language detection falls back to English', () => {
  assert.equal(detectLanguage('en', ['ca-ES']), 'en');
  assert.equal(detectLanguage(null, ['de-DE']), 'en');
  assert.equal(detectLanguage('xx', []), 'en');
});
