import assert from 'node:assert/strict';
import { test } from 'node:test';
import keyData from '../src/data/keys.json';
import type { StorageLike } from '../src/sim/campaign';
import { ACTIONS, ACTION_IDS, BINDABLE, RESERVED, actionFor, bindKey, buttonAction, defaultBindings, keyLabel, keyNameOf, keysOf, refusal, resolveKeys } from '../src/sim/keymap';
import {
  DEFAULT_OPTIONS,
  OPTIONS_KEY,
  liveKeys,
  loadOptions,
  nextTextSize,
  options,
  rebindKey,
  resetKeys,
  parseOptions,
  resetOptionsCache,
  saveOptions,
  sliderValue,
  snapVolume,
  updateOptions,
} from '../src/sim/options';

/** An in-memory stand-in for localStorage. */
function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

test('nothing stored, damaged text and wrong shapes all give the defaults', () => {
  assert.deepEqual(parseOptions(null), DEFAULT_OPTIONS);
  assert.deepEqual(parseOptions(''), DEFAULT_OPTIONS);
  assert.deepEqual(parseOptions('{not json'), DEFAULT_OPTIONS);
  assert.deepEqual(parseOptions('[1,2]'), DEFAULT_OPTIONS);
  assert.deepEqual(parseOptions('42'), DEFAULT_OPTIONS);
});

test('a bad field falls back alone and the good ones are kept', () => {
  const o = parseOptions(JSON.stringify({ master: 0.3, effects: 'loud', mute: 'yes', edgeScroll: false, textSize: 110, cues: false, shake: 1 }));
  assert.equal(o.master, 0.3);
  assert.equal(o.effects, DEFAULT_OPTIONS.effects);
  assert.equal(o.mute, DEFAULT_OPTIONS.mute);
  assert.equal(o.edgeScroll, false);
  assert.equal(o.textSize, 100);
  assert.equal(o.cues, false);
  assert.equal(o.shake, true);
});

test('saved options read back the same', () => {
  const s = fakeStorage();
  const o = { master: 0.5, effects: 0.25, ambience: 0, mute: true, edgeScroll: false, textSize: 150 as const, cues: false, shake: false, keys: { crouch: 'H', hold: 'J' } };
  assert.equal(saveOptions(s, o), true);
  assert.ok(s.data.has(OPTIONS_KEY));
  assert.deepEqual(loadOptions(s), o);
});

test('missing or throwing storage never breaks loading or saving', () => {
  assert.deepEqual(loadOptions(undefined), DEFAULT_OPTIONS);
  assert.equal(saveOptions(undefined, DEFAULT_OPTIONS), false);
  const broken: StorageLike = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {},
  };
  assert.deepEqual(loadOptions(broken), DEFAULT_OPTIONS);
  assert.equal(saveOptions(broken, DEFAULT_OPTIONS), false);
});

test('volumes snap to 5% steps inside 0..1', () => {
  assert.equal(snapVolume(0.52), 0.5);
  assert.equal(snapVolume(0.53), 0.55);
  assert.equal(snapVolume(-3), 0);
  assert.equal(snapVolume(7), 1);
  assert.equal(snapVolume(NaN), 0);
  assert.equal(parseOptions(JSON.stringify({ master: 3 })).master, 1);
});

test('a slider click maps its x to a volume', () => {
  assert.equal(sliderValue(100, 100, 200), 0);
  assert.equal(sliderValue(200, 100, 200), 0.5);
  assert.equal(sliderValue(300, 100, 200), 1);
  assert.equal(sliderValue(50, 100, 200), 0);
  assert.equal(sliderValue(999, 100, 200), 1);
  assert.equal(sliderValue(150, 100, 0), 0);
});

test('text size cycles 100, 125, 150 and back', () => {
  assert.equal(nextTextSize(100), 125);
  assert.equal(nextTextSize(125), 150);
  assert.equal(nextTextSize(150), 100);
  assert.equal(nextTextSize(7), 100);
});

test('updateOptions changes the live copy and persists it', () => {
  resetOptionsCache();
  const s = fakeStorage();
  assert.deepEqual(options(s), DEFAULT_OPTIONS);
  const after = updateOptions({ shake: false, master: 0.4 }, s);
  assert.equal(after.shake, false);
  assert.equal(options(s).master, 0.4);
  resetOptionsCache();
  const reloaded = options(s); // a new session reads what was saved
  assert.equal(reloaded.shake, false);
  assert.equal(reloaded.master, 0.4);
  assert.equal(reloaded.edgeScroll, true);
  resetOptionsCache();
});

// ---- Key rebinding (Z37) ----

test('the action list matches data/keys.json and the defaults are all distinct and bindable', () => {
  assert.deepEqual([...ACTION_IDS], keyData.actions.map((a) => a.id));
  const d = defaultBindings();
  const all = ACTIONS.flatMap((a) => [d[a.id], ...(a.also ?? [])]);
  assert.equal(new Set(all).size, all.length);
  for (const a of ACTIONS) assert.ok(BINDABLE.includes(a.key), `${a.id} default ${a.key} is bindable`);
  for (const r of RESERVED) assert.ok(!BINDABLE.includes(r), `${r} is reserved`);
});

test('key codes name letters, digits, F-keys and the few named keys', () => {
  assert.equal(keyNameOf(87), 'W');
  assert.equal(keyNameOf(49), 'ONE');
  assert.equal(keyNameOf(48), 'ZERO');
  assert.equal(keyNameOf(112), 'F1');
  assert.equal(keyNameOf(9), 'TAB');
  assert.equal(keyNameOf(32), 'SPACE');
  assert.equal(keyNameOf(27), 'ESC');
  assert.equal(keyNameOf(38), 'UP');
  assert.equal(keyNameOf(16), null); // Shift
  assert.equal(keyNameOf(186), null); // punctuation
  assert.equal(keyLabel('ONE'), '1');
  assert.equal(keyLabel('TAB'), 'Tab');
  assert.equal(keyLabel('SPACE'), 'Space');
  assert.equal(keyLabel('C'), 'C');
});

test('rebinding moves an action to a free key; the old key is free again', () => {
  const r = bindKey({}, 'crouch', 'H');
  assert.ok(r.ok);
  assert.deepEqual(r.ok && r.overrides, { crouch: 'H' });
  const b = resolveKeys(r.ok ? r.overrides : {});
  assert.equal(b.crouch, 'H');
  assert.equal(actionFor(b, 'H'), 'crouch');
  assert.equal(actionFor(b, 'C'), null); // the old key does nothing now
  const again = bindKey(r.ok ? r.overrides : {}, 'hold', 'C'); // and can be taken by another action
  assert.ok(again.ok);
});

test('a key that serves another action is refused and nothing changes', () => {
  const r = bindKey({}, 'crouch', 'V'); // V is Hold
  assert.ok(!r.ok && r.reason === 'taken' && r.by === 'hold');
  assert.match(refusal(r as Extract<typeof r, { ok: false }>), /Hold/);
  assert.ok(!bindKey({}, 'crouch', 'UP').ok); // the pan arrows are always taken
  assert.ok(!bindKey({}, 'crouch', 'R').ok); // restart
  assert.ok(!bindKey({}, 'crouch', 'ESC').ok);
  assert.ok(!bindKey({}, 'crouch', 'ENTER').ok);
  assert.ok(!bindKey({}, 'crouch', 'F5').ok); // the browser's reload
  assert.ok(bindKey({}, 'crouch', 'C').ok); // its own key is fine
});

test('binding an action back to its default drops the override', () => {
  const first = bindKey({}, 'crouch', 'H');
  assert.ok(first.ok);
  const back = bindKey(first.ok ? first.overrides : {}, 'crouch', 'C');
  assert.deepEqual(back.ok && back.overrides, {});
});

test('the fixed arrow keys still pan after WASD is rebound', () => {
  const r = bindKey({}, 'panUp', 'I');
  const b = resolveKeys(r.ok ? r.overrides : {});
  assert.deepEqual(keysOf(b, 'panUp'), ['I', 'UP']);
  assert.equal(actionFor(b, 'UP'), 'panUp');
  assert.equal(actionFor(b, 'W'), null);
});

test('a bar button knows which action (and so which bound key) it shows', () => {
  assert.equal(buttonAction('weapon:pistol', '2'), 'weapon2');
  assert.equal(buttonAction('weapon:knife', '1'), 'weapon1');
  assert.equal(buttonAction('spike', 'T'), 'trap');
  assert.equal(buttonAction('can', 'T'), 'trap');
  assert.equal(buttonAction('takedown', 'F'), 'takedown');
  assert.equal(buttonAction('freefire', 'Z'), 'freefire');
  assert.equal(buttonAction('weapon:x', '9'), null);
});

test('damaged stored keys fall back: unusable ones are ignored, a doubled key resets all', () => {
  const ok = parseOptions(JSON.stringify({ keys: { crouch: 'H', hold: 'ESC', nonsense: 'Q', fix: 5 } }));
  assert.deepEqual(ok.keys, { crouch: 'H' });
  const doubled = parseOptions(JSON.stringify({ keys: { crouch: 'H', hold: 'H' } }));
  assert.deepEqual(doubled.keys, {});
  assert.deepEqual(parseOptions(JSON.stringify({ keys: 'x' })).keys, {});
  assert.deepEqual(parseOptions(JSON.stringify({ keys: { crouch: 'C' } })).keys, {}); // equal to the default: not stored
});

test('a swap made through a free key survives a reload', () => {
  resetOptionsCache();
  const s = fakeStorage();
  assert.ok(rebindKey('crouch', 'H', s).ok); // C -> H
  assert.ok(rebindKey('hold', 'C', s).ok); // V -> C (free now)
  assert.ok(rebindKey('crouch', 'V', s).ok); // H -> V (free now): crouch and hold swapped
  resetOptionsCache();
  assert.deepEqual(options(s).keys, { crouch: 'V', hold: 'C' });
  assert.equal(liveKeys().crouch, 'V');
  assert.equal(liveKeys().hold, 'C');
  resetOptionsCache();
});

test('a refused rebind saves nothing; reset puts every default back', () => {
  resetOptionsCache();
  const s = fakeStorage();
  assert.ok(!rebindKey('crouch', 'V', s).ok);
  assert.equal(s.data.has(OPTIONS_KEY), false);
  assert.ok(rebindKey('fix', 'H', s).ok);
  assert.equal(liveKeys().fix, 'H');
  resetKeys(s);
  assert.deepEqual(options(s).keys, {});
  assert.deepEqual({ ...liveKeys() }, defaultBindings());
  resetOptionsCache();
});
