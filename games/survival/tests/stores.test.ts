import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_ITEMS, itemCount, itemSlot, storeAt } from '../src/render/stores';
import { tileToWorld } from '../src/render/iso';
import { newGame } from '../src/sim/tick';
import { addBuilding } from '../src/sim/state';

test('item count is ceil(40 x amount / capacity), 0 when empty, at most 40', () => {
  assert.equal(itemCount(0, 800), 0);
  assert.equal(itemCount(1, 800), 1);
  assert.equal(itemCount(20, 800), 1); // one basket is 20 food
  assert.equal(itemCount(21, 800), 2);
  assert.equal(itemCount(400, 800), 20);
  assert.equal(itemCount(800, 800), 40);
  assert.equal(itemCount(900, 800), 40);
  assert.equal(itemCount(15, 600), 1); // one log is 15 wood
  assert.equal(itemCount(4, 160), 1); // one bundle is 4 hides
  assert.equal(itemCount(10, 400), 1); // one bag is 10 pemmican
  assert.equal(itemCount(100, 1600), 3); // a second store makes each item worth more
  assert.equal(itemCount(5, 0), 0); // no store, no items
});

test('every item slot lies on the store floor, no two resources share a spot, and the second layer sits higher', () => {
  for (const res of ['food', 'wood', 'hides', 'pemmican'] as const) {
    for (let i = 0; i < MAX_ITEMS; i++) {
      const { dx, dy, depth } = itemSlot(res, i);
      assert.ok(Math.abs(dx) / 100 + Math.abs(dy + (i >= 20 ? 6 : 0)) / 50 <= 1, `${res} ${i} is on the floor`);
      if (i >= 20) {
        const below = itemSlot(res, i - 20);
        assert.equal(dx, below.dx);
        assert.equal(dy, below.dy - 6);
        assert.ok(depth > below.depth, 'a stacked item draws over the one under it');
      }
    }
  }
  // Floor positions (layer 0) never coincide between resources.
  const spots = new Set<string>();
  for (const res of ['food', 'wood', 'hides', 'pemmican'] as const) {
    for (let i = 0; i < 20; i++) {
      const { dx, dy } = itemSlot(res, i);
      const k = `${Math.round(dx * 10)}:${Math.round(dy * 10)}`;
      assert.ok(!spots.has(k), `${res} ${i} has its own spot`);
      spots.add(k);
    }
  }
  // Nearer the viewer draws later: the front corner of the pemmican quarter is above the back corner of the food quarter.
  assert.ok(itemSlot('pemmican', 19).depth > itemSlot('food', 0).depth);
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
