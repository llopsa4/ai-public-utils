import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StrainGauge } from '../client/src/components/Resources';
import { newBattle } from '../client/src/game/combat';

test('strain display conveys heat without visible digits and preserves accessible exact values', () => {
  for (const [strain, label] of [[0, 'STEADY'], [4, 'WARMING'], [6, 'HEATED'], [8, 'HEATED'], [9, 'CRITICAL']] as const) {
    const html = renderToStaticMarkup(createElement(StrainGauge, { state: { ...newBattle(1), strain } }));
    assert.match(html, new RegExp(label));
    assert.match(html, new RegExp(`aria-valuenow="${strain}"`));
    assert.doesNotMatch(html.replace(/<[^>]+>/g, ''), /\d/);
    assert.match(html, /role="meter"/);
    assert.match(html, /Strain persists between turns/);
  }
});

test('overload feedback represents the resolved release even after strain has reset', () => {
  const state = { ...newBattle(1), strain: 4 };
  const overload = renderToStaticMarkup(createElement(StrainGauge, { state, overloaded: true }));
  assert.match(overload, /OVERLOAD/);
  assert.match(overload, /Pressure released/);
  assert.match(overload, /Overload released: lost 6 HP, reset to 4 strain/);
  const after = renderToStaticMarkup(createElement(StrainGauge, { state, overloaded: false }));
  assert.match(after, /WARMING/);
  assert.doesNotMatch(after.replace(/<[^>]+>/g, ''), /OVERLOAD/);
});
