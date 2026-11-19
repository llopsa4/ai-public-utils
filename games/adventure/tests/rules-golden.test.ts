import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { goldenAnswers } from './golden';

// What every click does, at every stage of the story, must not change when the content rules are
// reorganised (scripts/golden-interactions.ts recorded it from the original switch).
test('every target, verb and item answers exactly as recorded', () => {
  const recorded: Record<string, string> = JSON.parse(readFileSync(new URL('./fixtures/interactions-golden.json', import.meta.url), 'utf8'));
  const now = goldenAnswers();
  const differ = Object.keys(recorded).filter(k => recorded[k] !== now[k]);
  const missing = Object.keys(now).filter(k => !(k in recorded));
  assert.deepEqual(differ.slice(0, 10), [], `${differ.length} answers changed, e.g. ${differ[0]}: ${recorded[differ[0]]} → ${now[differ[0]]}`);
  assert.deepEqual(missing.slice(0, 10), [], `${missing.length} new questions not in the recording`);
});
