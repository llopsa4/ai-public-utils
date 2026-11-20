import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pileSize, storeAt } from '../src/render/stores';
import { tileToWorld } from '../src/render/iso';
import { newGame } from '../src/sim/tick';
import { addBuilding } from '../src/sim/state';

test('pile size is ceil(4 x amount / capacity), 0 when empty, at most 4', () => {
  assert.equal(pileSize(0, 100), 0);
  assert.equal(pileSize(1, 100), 1);
  assert.equal(pileSize(25, 100), 1);
  assert.equal(pileSize(26, 100), 2);
  assert.equal(pileSize(50, 100), 2);
  assert.equal(pileSize(75, 100), 3);
  assert.equal(pileSize(100, 100), 4);
  assert.equal(pileSize(140, 100), 4);
  assert.equal(pileSize(5, 0), 0); // no store, no pile
});

test('storeAt finds a finished store by its floor or its roof, and ignores sites and other buildings', () => {
  const s = newGame(1);
  const store = addBuilding(s, 'store', 10, 10, true);
  const site = addBuilding(s, 'store', 20, 20, false);
  const tipi = addBuilding(s, 'tipi', 30, 30, true);
  const at = (x: number, y: number) => tileToWorld(x, y, s.map.size);
  const centre = at(10.5, 10.5);
  assert.equal(storeAt(s, centre.x, centre.y), store.id);
  assert.equal(storeAt(s, centre.x, centre.y - 14), store.id); // on the roof, above the floor
  assert.equal(storeAt(s, at(15, 15).x, at(15, 15).y), null);
  const s2 = at(20.5, 20.5);
  assert.equal(storeAt(s, s2.x, s2.y), null);
  const t = at(30.5, 30.5);
  assert.equal(storeAt(s, t.x, t.y), null);
  assert.ok(site.id !== tipi.id);
});
