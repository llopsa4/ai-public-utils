import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { loadAllChapters } from '../src/chapters';

const GAME: Record<string, string> = JSON.parse(readFileSync(new URL('../src/content/strings/en.json', import.meta.url), 'utf8'));
const CHAPTERS = await loadAllChapters();

// Every chapter's strings join one table when it loads: a key reused with other text would replace
// the game's or another chapter's line (the intro's intro.1 once replaced Mara's opening).
test("no chapter's strings replace the game's or another chapter's", () => {
  const seen = new Map<string, { owner: string; text: string }>(Object.entries(GAME).map(([k, text]) => [k, { owner: 'game', text }]));
  for (const c of CHAPTERS) {
    for (const [k, text] of Object.entries(c.strings)) {
      const before = seen.get(k);
      assert.ok(!before || before.text === text, `${c.id} redefines ${k} (already ${before?.owner}'s)`);
      if (!before) seen.set(k, { owner: c.id, text });
    }
  }
});

// Hovering a person shows their name (name.<id>): every person a chapter puts in a room has one.
test("every person in a chapter's rooms has a name", () => {
  const names = { ...GAME, ...Object.assign({}, ...CHAPTERS.map(c => c.strings)) };
  for (const c of CHAPTERS) {
    for (const room of Object.values(c.rooms)) for (const a of room.actors) assert.ok(names[`name.${a.id}`], `${c.id}/${room.id}: name.${a.id} is missing`);
  }
});
