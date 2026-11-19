import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadAllChapters } from '../src/chapters';
import { roomFlags } from '../src/engine/roomFlags';

const CHAPTERS = await loadAllChapters();

// The debug panel lists the flags of the room shown. Every story flag must belong to some room:
// found in its data, rules, conversations or scripts, or tied to it in Chapter.flagRooms (flags set
// by game code: puzzles, fights, set pieces).
test('every story flag belongs to at least one room', () => {
  for (const c of CHAPTERS) {
    const seen = new Set(Object.keys(c.rooms).flatMap(r => roomFlags(c, r)));
    assert.deepEqual(c.flags.filter(f => !seen.has(f)), [], `${c.id}: flags in no room (add them to flagRooms)`);
    for (const [f, r] of Object.entries(c.flagRooms ?? {})) {
      assert.ok(c.flags.includes(f) && c.rooms[r], `${c.id}: flagRooms ${f} → ${r} names a real flag and room`);
    }
  }
});

test("a room's flags are its own: the dark cell's, not the guardroom's", () => {
  const intro = CHAPTERS.find(c => c.id === 'intro')!;
  const cell = roomFlags(intro, 'cell'), guardroom = roomFlags(intro, 'guardroom');
  assert.ok(cell.includes('cellLit') && cell.includes('readGuard') && cell.includes('gSus1'));
  // (Benn is in both rooms, so his own flags are in both lists; the plate is the cell's alone.)
  assert.ok(!cell.includes('wardenBusy') && guardroom.includes('wardenBusy') && !guardroom.includes('tookPlate'));
});
