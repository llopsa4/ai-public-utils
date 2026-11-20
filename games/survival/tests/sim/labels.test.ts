import assert from 'node:assert/strict';
import { test } from 'node:test';
import upgradesData from '../../src/data/upgrades.json';
import { buildingDefs } from '../../src/sim/buildings';
import { displayLabel, englishLabel, labelText } from '../../src/sim/labels';

test('a label is "Dakota (English)" with a Dakota word and the English alone without one', () => {
  assert.equal(labelText('Trap', 'wihmuŋke'), 'wihmuŋke (Trap)');
  assert.equal(labelText('Trap', ''), 'Trap');
  assert.equal(labelText('Trap'), 'Trap');
  assert.equal(labelText('Trap', '  '), 'Trap');
});

test('every upgrade and building type has an English label and a dakota field', () => {
  for (const [id, u] of Object.entries(upgradesData.upgrades)) {
    assert.equal(typeof (u as { dakota?: unknown }).dakota, 'string', `${id} has a dakota field`);
    assert.ok(englishLabel(id).length > 0);
  }
  for (const [id, b] of Object.entries(buildingDefs)) {
    assert.equal(typeof b.dakota, 'string', `${id} has a dakota field`);
    assert.ok(englishLabel(id).length > 0);
  }
});

test('display labels read the data files; an empty word shows the English', () => {
  assert.equal(englishLabel('dogs'), 'Hunting dogs');
  assert.equal(englishLabel('healers_lodge'), "Healers' lodge");
  assert.equal(englishLabel('tipi'), 'Tipi');
  const dakotaOf = (id: string): string => ((upgradesData.upgrades as Record<string, { dakota: string }>)[id] ?? buildingDefs[id]).dakota!;
  for (const id of ['dogs', 'tipi', 'trap']) {
    assert.equal(displayLabel(id), labelText(englishLabel(id), dakotaOf(id)));
  }
});
