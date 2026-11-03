import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadChapter } from '../src/chapters';
import { conditionsHold } from '../src/engine/geometry';
import { newGame } from '../src/engine/state';
import type { Command, GameState } from '../src/engine/types';

const CH2 = await loadChapter('ch2');

const at = (room: string, inventory: string[], flags: Record<string, boolean> = {}): GameState => ({ ...newGame('ch2'), room, inventory, flags });
const types = (commands: Command[]) => commands.map(c => c.type);
const sets = (commands: Command[], flag: string) => commands.some(c => c.type === 'setFlag' && c.flag === flag);

test("the cistern's hot chain needs Tobi's scarf, or the rag from the rubble without it", () => {
  const withScarf = at('tunnelCistern', ['gauntlet', 'notebook', 'regulator', 'scarf'], { tunnel2Clear: true });
  // Neither hands nor the gauntlet will do.
  assert.ok(!sets(CH2.interact(withScarf, 'use', 'chain'), 'bridgeDown'));
  assert.ok(!sets(CH2.interact(withScarf, 'use', 'chain', 'gauntlet'), 'bridgeDown'));
  // The scarf drops the bridge, wakes a creature, and is kept.
  const scarf = CH2.interact(withScarf, 'use', 'chain', 'scarf');
  assert.ok(sets(scarf, 'bridgeDown') && sets(scarf, 'tunnel3Clear'));
  assert.ok(types(scarf).includes('creatureFight'));
  assert.ok(!scarf.some(c => c.type === 'removeItem'));
  // The rag does the same and is used up.
  const rag = CH2.interact(at('tunnelCistern', ['gauntlet', 'rag']), 'use', 'cleat', 'rag');
  assert.ok(sets(rag, 'bridgeDown'));
  assert.ok(rag.some(c => c.type === 'removeItem' && c.item === 'rag'));
});

test('the rag lies in the rubble only for a Mara without the scarf', () => {
  const room = CH2.rooms.tunnelCollapse;
  const rag = room.hotspots.find(h => h.id === 'rag')!;
  const ragObj = room.objects.find(o => o.id === 'ragObj')!;
  for (const [inventory, flags, shown] of [[['gauntlet'], {}, true], [['gauntlet', 'scarf'], {}, false], [['gauntlet', 'rag'], { foundRag: true }, false]] as const) {
    const s = at('tunnelCollapse', [...inventory], { ...flags });
    assert.equal(conditionsHold(s, rag.visibleIf), shown);
    assert.equal(conditionsHold(s, ragObj.visibleIf), shown);
  }
});
