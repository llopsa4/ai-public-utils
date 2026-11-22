import assert from 'node:assert/strict';
import { test } from 'node:test';
import mapConfig from '../src/data/map.json';
import { expectedFrames } from '../scripts/art/lib.mjs';
import { manifest } from '../src/render/manifest';
import {
  bankArt, bankMask, bushKey, EDGE_BIT, groundArt, nearWater, pick, propOf, seasonFrame, spillsOf, treeKey, treeVariant,
  type TileGrid,
} from '../src/render/terrain';
import type { TileType } from '../src/sim/map';
import { generateMap, type MapConfig } from '../src/sim/map';

/** A grid from rows of letters: g grass, r river, f ford, t forest, b berry. */
function grid(rows: string[]): TileGrid {
  const letter: Record<string, TileType> = { g: 'grass', r: 'river', f: 'ford', t: 'forest', b: 'berry' };
  return { size: rows.length, tiles: rows.flatMap((r) => [...r].map((c) => letter[c])) };
}

test('bank mask: NE (x, y-1) = 1, SE (x+1, y) = 2, SW (x, y+1) = 4, NW (x-1, y) = 8', () => {
  assert.deepEqual(EDGE_BIT, { ne: 1, se: 2, sw: 4, nw: 8 });
  const g = grid([
    'ggggg',
    'ggrgg',
    'grgrg',
    'ggrgg',
    'ggggg',
  ]);
  assert.equal(bankMask(g, 2, 2), 1 + 2 + 4 + 8); // grass with water on all four edges
  assert.equal(bankMask(g, 2, 1), 0); // river itself draws no bank
  assert.equal(bankMask(g, 1, 1), 2 + 4); // river at (2, 1) east and (1, 2) south
  assert.equal(bankMask(g, 2, 0), 4); // river at (2, 1) south only
  assert.equal(bankMask(g, 3, 1), 4 + 8); // river at (3, 2) south and (2, 1) west
  assert.equal(bankMask(g, 0, 0), 0); // no water beside it
  assert.equal(bankMask(g, 1, 3), 1 + 2); // river at (1, 2) north, (2, 3) east
});

test('a tile with water on all four edges has mask 15', () => {
  const g = grid([
    'grg',
    'rgr',
    'grg',
  ]);
  assert.equal(bankMask(g, 1, 1), 15);
});

test('diagonal-only water and the map edge give no bank', () => {
  const g = grid([
    'rgg',
    'ggg',
    'ggg',
  ]);
  assert.equal(bankMask(g, 1, 1), 0);
  assert.equal(bankMask(g, 2, 2), 0);
  assert.equal(bankMask(g, 0, 1), 1); // river at (0, 0) is north-east of... the NE edge is (x, y-1)
});

test('a ford counts as water for banks', () => {
  const g = grid(['ggg', 'gfg', 'ggg']);
  assert.equal(bankMask(g, 0, 1), 2);
  assert.equal(bankMask(g, 2, 1), 8);
});

test('banks go on grass only, and a frame name follows SPEC pattern C', () => {
  const g = grid([
    'grt',
    'ggg',
  ]);
  assert.equal(bankArt(g, 0, 0, 'winter')?.frame, 'bank_river/winter/2');
  assert.equal(bankArt(g, 2, 0, 'winter'), null); // forest floor keeps its own tile
  assert.equal(bankArt(g, 0, 1, 'winter'), null); // no water edge
  assert.equal(bankArt(g, 1, 0, 'winter'), null); // water itself
});

test('every bank frame and ground frame the picks can name is a frame the delivery would contain', () => {
  const names = (key: string) => new Set(expectedFrames(key, manifest[key]).map((f) => f.name));
  const bank = names('bank_river');
  const g = grid([
    'grg',
    'rgr',
    'grg',
  ]);
  for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
    for (let mask = 1; mask <= 15; mask++) assert.ok(bank.has(seasonFrame('bank_river', season, mask)), `${season} ${mask}`);
    assert.ok(names('tile_grass').has(groundArt(g, 7, 1, 1, season).frame));
  }
  const spill = names('spill_forest');
  for (const edge of ['ne', 'se', 'sw', 'nw']) assert.ok(spill.has(seasonFrame('spill_forest', 'autumn', edge)));
});

test('spills: one overlay per edge whose neighbour is forest or berry, on grass tiles only', () => {
  const g = grid([
    'gtg',
    'bgg',
    'ggg',
  ]);
  // (1, 1): forest at (1, 0) = NE edge, berry at (0, 1) = NW edge.
  assert.deepEqual(spillsOf(g, 1, 1), [
    { key: 'spill_forest', edge: 'ne' },
    { key: 'spill_berry', edge: 'nw' },
  ]);
  assert.deepEqual(spillsOf(g, 1, 0), []); // a forest tile draws none
  assert.deepEqual(spillsOf(g, 2, 2), []);
});

test('felling a tree: the felled tile gains spills, its neighbours lose them', () => {
  const before = grid(['ggg', 'gtg', 'ggg']);
  assert.equal(spillsOf(before, 0, 1).length, 1); // the forest tile is the grass tile's SE neighbour
  const after = grid(['ggg', 'ggg', 'ggg']); // felled
  assert.equal(spillsOf(after, 0, 1).length, 0);
  assert.equal(spillsOf(grid(['ggg', 'tgt', 'ggg']), 1, 1).length, 2);
});

test('trees: cottonwood or willow within 2 tiles of water, bur oak or basswood elsewhere', () => {
  const g = grid([
    'rgggggg',
    'ggggggg',
    'ggggggg',
    'ggggggg',
    'ggggggg',
  ]);
  assert.equal(nearWater(g, 2, 2), true);
  assert.equal(nearWater(g, 3, 2), false);
  const near = new Set<string>();
  const far = new Set<string>();
  for (let seed = 1; seed <= 60; seed++) {
    near.add(treeKey(g, seed, 2, 2));
    far.add(treeKey(g, seed, 5, 4));
  }
  assert.deepEqual([...near].sort(), ['tree_cottonwood', 'tree_willow']);
  assert.deepEqual([...far].sort(), ['tree_basswood', 'tree_bur_oak']);
});

test('picks are deterministic, in range and spread over the choices', () => {
  assert.equal(pick(5, 10, 20, 1, 4), pick(5, 10, 20, 1, 4));
  const seen = new Set<number>();
  for (let x = 0; x < 40; x++) {
    const v = pick(9, x, 3, 11, 4);
    assert.ok(v >= 0 && v < 4);
    seen.add(v);
  }
  assert.equal(seen.size, 4);
  assert.ok([0, 1].includes(treeVariant(3, 4, 5)));
  assert.ok(['bush_chokecherry', 'bush_plum'].includes(bushKey(3, 4, 5)));
  // A different map seed picks differently somewhere.
  let differs = false;
  for (let x = 0; x < 40 && !differs; x++) differs = pick(1, x, 0, 11, 4) !== pick(2, x, 0, 11, 4);
  assert.ok(differs);
});

test('props: rocks and tufts sit on plain grass only, about a tenth of it', () => {
  const g = grid([
    'ggggggggg',
    'ggggggggg',
    'rggtggggg',
    'ggggggggg',
  ]);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 9; x++) {
      const prop = propOf(g, 1, x, y);
      if (prop && (bankMask(g, x, y) !== 0 || spillsOf(g, x, y).length > 0)) assert.fail(`prop on a bank or spill tile ${x},${y}`);
    }
  }
  const map = generateMap(mapConfig.start.seed, mapConfig as unknown as MapConfig);
  let rocks = 0;
  let tufts = 0;
  let grass = 0;
  for (let y = 0; y < map.size; y++) {
    for (let x = 0; x < map.size; x++) {
      if (map.tiles[y * map.size + x] === 'grass') grass++;
      const prop = propOf(map, map.seed, x, y);
      if (prop?.key === 'rock_boulder') rocks++;
      if (prop?.key === 'tuft_grass') tufts++;
    }
  }
  assert.ok(tufts > grass * 0.04 && tufts < grass * 0.12, `tufts ${tufts} of ${grass}`);
  assert.ok(rocks > 0 && rocks < grass * 0.03, `rocks ${rocks} of ${grass}`);
});

test('the real map has banks along the river and spills round the forests', () => {
  const map = generateMap(mapConfig.start.seed, mapConfig as unknown as MapConfig);
  let banks = 0;
  let spills = 0;
  for (let y = 0; y < map.size; y++) {
    for (let x = 0; x < map.size; x++) {
      if (bankArt(map, x, y, 'summer')) banks++;
      spills += spillsOf(map, x, y).length;
    }
  }
  assert.ok(banks > 150, `banks ${banks}`); // about two edges of a 96-row river
  assert.ok(spills > 100, `spills ${spills}`);
});
