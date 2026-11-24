import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TYPE_CPS, advance, currentLine, isTyping, skipDialogue, startDialogue, stepDialogue, visibleText } from '../src/sim/dialogue';
import { TICK_HZ } from '../src/sim/time';
import story from '../src/data/story.json';
import { HURT_BELOW, dialoguePortrait, isHurt, lineMood, speakerWho, squadPortrait, uiItem } from '../src/render/ui';

const lines = [
  { speaker: 'Scout', text: 'Is that it?' },
  { speaker: 'Fighter', text: 'That is the last one.' },
];

test('lines are typed letter by letter at TYPE_CPS', () => {
  const s = startDialogue(lines);
  assert.equal(visibleText(s), '');
  assert.ok(isTyping(s));
  stepDialogue(s, 1);
  assert.equal(visibleText(s), lines[0].text.slice(0, TYPE_CPS / TICK_HZ));
  stepDialogue(s, 100);
  assert.equal(visibleText(s), lines[0].text);
  assert.ok(!isTyping(s));
});

test('advance completes a line being typed, then goes to the next', () => {
  const s = startDialogue(lines);
  stepDialogue(s, 1);
  advance(s);
  assert.equal(visibleText(s), lines[0].text);
  assert.equal(s.index, 0);
  advance(s);
  assert.equal(s.index, 1);
  assert.equal(visibleText(s), '');
  assert.equal(currentLine(s)?.speaker, 'Fighter');
});

test('the dialogue finishes after the last line and then ignores input', () => {
  const s = startDialogue(lines);
  advance(s); // completes line 1
  advance(s); // next
  advance(s); // completes line 2
  assert.ok(!s.finished);
  advance(s);
  assert.ok(s.finished);
  assert.equal(currentLine(s), null);
  stepDialogue(s, 10);
  advance(s);
  assert.ok(s.finished);
  assert.equal(visibleText(s), '');
});

test('an empty dialogue is finished at once', () => {
  assert.ok(startDialogue([]).finished);
});

test('every line in story.json has a speaker and text', () => {
  for (const group of Object.values(story.dialogue)) {
    const sets = Array.isArray(group) ? [group] : Object.values(group);
    for (const set of sets) {
      assert.ok(set.length > 0);
      for (const l of set) {
        assert.ok(l.speaker && l.text);
      }
    }
  }
});

test('skipDialogue finishes the whole beat at once, even mid-line', () => {
  const s = startDialogue(lines);
  stepDialogue(s, 2);
  skipDialogue(s);
  assert.ok(s.finished);
  assert.equal(currentLine(s), null);
  assert.equal(visibleText(s), '');
  assert.ok(!isTyping(s));
});

function everyLine(): { speaker: string; mood?: string; text: string }[] {
  const out: { speaker: string; mood?: string; text: string }[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) {
      for (const x of v) {
        if (x && typeof x === 'object' && 'speaker' in x) out.push(x as { speaker: string; mood?: string; text: string });
        else walk(x);
      }
    } else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x);
  };
  walk(story.dialogue);
  return out;
}

test('every story line has a speaker with a portrait and a mood that gives a manifest item', () => {
  const lines = everyLine();
  assert.equal(lines.length, 36);
  for (const l of lines) {
    assert.ok(speakerWho(l.speaker), l.speaker);
    assert.ok(['neutral', 'afraid', 'determined'].includes(l.mood ?? ''), `${l.text} mood ${l.mood}`);
    assert.ok(uiItem(dialoguePortrait(l.speaker, l.mood)!), l.text);
  }
});

test('a line shows its mood; an unknown or missing mood reads as neutral', () => {
  assert.equal(dialoguePortrait('Scout', 'afraid'), 'portrait_scout_afraid');
  assert.equal(dialoguePortrait('Fighter', 'determined'), 'portrait_fighter_determined');
  assert.equal(dialoguePortrait('Fighter', undefined), 'portrait_fighter_neutral');
  assert.equal(dialoguePortrait('Fighter', 'sulky'), 'portrait_fighter_neutral');
  assert.equal(lineMood('hurt'), 'neutral'); // hurt is applied by HP, never by a line
});

test('under 35% HP the portrait is hurt whatever the line says', () => {
  assert.equal(HURT_BELOW, 0.35);
  assert.equal(dialoguePortrait('Scout', 'afraid', { hp: 34, maxHp: 100 }), 'portrait_scout_hurt');
  assert.equal(dialoguePortrait('Fighter', 'determined', { hp: 0, maxHp: 100 }), 'portrait_fighter_hurt');
  assert.equal(dialoguePortrait('Scout', 'afraid', { hp: 35, maxHp: 100 }), 'portrait_scout_afraid'); // exactly 35% is not under it
  assert.equal(dialoguePortrait('Scout', 'afraid', { hp: 100, maxHp: 100 }), 'portrait_scout_afraid');
  assert.ok(!isHurt(5, 0), 'unknown max HP is not hurt');
});

test('another speaker has no portrait; the squad card head is neutral or hurt', () => {
  assert.equal(speakerWho('Narrator'), null);
  assert.equal(dialoguePortrait('Narrator', 'afraid'), null);
  assert.equal(squadPortrait('Fighter', 100, 100), 'portrait_small_fighter_neutral');
  assert.equal(squadPortrait('Fighter', 34, 100), 'portrait_small_fighter_hurt');
  assert.equal(squadPortrait('Scout', 0, 100), 'portrait_small_scout_hurt');
  assert.equal(squadPortrait('Narrator', 100, 100), null);
});
