import assert from 'node:assert/strict';
import { test } from 'node:test';
import manifest from '../art/manifest.json';
import intro from '../src/data/intro.json';
import m01 from '../src/data/missions/m01.json';
import { easeAlpha, FADE_ALPHA, Occlusion, overlaps, spriteRect } from '../src/render/occlude';
import { tileToWorld } from '../src/render/iso';
import {
  BLOOD_KEYS, BUSH_KEYS, GROUND_KEYS, PATH_KEY, TREE_KEYS, bloodKey, bushKey, groundKey, hash01, openingKey, pathTiles, pathTilesOf, tileHash, treeKey, wallKey, wallRun,
} from '../src/render/terrain';
import { WALL, makeGrid, setTile } from '../src/sim/grid';
import { createIntro } from '../src/sim/tutorial';
import { createMission, type MissionSpec } from '../src/sim/mission';

const keys = manifest.keys as unknown as Record<string, { group?: string; scale?: number; size: [number, number]; anchor: [number, number]; placeholder?: { shape: string } }>;
const envKeys = Object.entries(keys).filter(([, k]) => k.group === 'env').map(([k]) => k);

test('the environment kit: every key is a 2x key with a placeholder, an even source size and a sane anchor', () => {
  assert.ok(envKeys.length >= 35 && envKeys.length <= 40, `${envKeys.length} env keys (the kit is ~35-40 sprites)`);
  for (const k of envKeys) {
    const e = keys[k]!;
    assert.equal(e.scale, 2, k);
    assert.ok(e.placeholder, `${k} has a stand-in`);
    assert.ok(e.size.every((v) => v % 2 === 0), `${k}: a 2x key has an even size`);
    assert.ok(e.anchor.every((v) => v >= 0 && v <= 1), k);
  }
  for (const k of ['ground_moss', 'ground_dirt', 'ground_leaves', 'ground_path']) assert.deepEqual(keys[k]!.size, [128, 64], `${k}: a ground tile is 128 x 64 source`);
});

test('every key the terrain code can return is in the manifest', () => {
  const named = [
    ...GROUND_KEYS, PATH_KEY, ...TREE_KEYS, ...BUSH_KEYS, ...BLOOD_KEYS, wallKey('se'), wallKey('sw'),
    'floor_wood', 'roof_top', 'stove', 'campfire', 'crate_closed', 'crate_open', 'spike_armed', 'spike_spent', 'noise_can', 'barricade', 'tent', 'body', 'cover',
  ];
  for (const kind of ['door', 'window'] as const) for (const run of ['se', 'sw'] as const) for (const fixed of [true, false]) named.push(openingKey(kind, run, fixed));
  for (const k of named) assert.ok(envKeys.includes(k), `${k} is an env key`);
  for (const k of ['tile_hover', 'tile_extract']) assert.ok(keys[k] && keys[k]!.group !== 'env', `${k} stays a 1x functional key`);
});

test('tileHash is stable, spreads over its range and depends on the salt', () => {
  assert.equal(tileHash(5, 9, 1), tileHash(5, 9, 1));
  assert.notEqual(tileHash(5, 9, 1), tileHash(5, 9, 2));
  assert.notEqual(tileHash(5, 9), tileHash(9, 5));
  let lo = 0;
  for (let i = 0; i < 1000; i++) if (hash01(i, i * 7 + 3) < 0.5) lo++;
  assert.ok(lo > 400 && lo < 600, `half of 1000 hashes below 0.5, got ${lo}`);
});

test('groundKey: moss mostly, patches of dirt and leaf litter, the path where it is marked, always the same answer', () => {
  const n = 32;
  const count: Record<string, number> = {};
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const k = groundKey(x, y, n);
      assert.equal(groundKey(x, y, n), k);
      count[k] = (count[k] ?? 0) + 1;
    }
  }
  assert.ok(Object.keys(count).every((k) => (GROUND_KEYS as readonly string[]).includes(k)), 'no path without a path set');
  const total = n * n;
  assert.ok(count.ground_moss! > total * 0.5, 'moss is the base');
  assert.ok(count.ground_dirt! > total * 0.04 && count.ground_leaves! > total * 0.04, 'dirt and leaves both appear');
  // a marked path tile overrides the scatter
  const path = new Set([3 * n + 4]);
  assert.equal(groundKey(4, 3, n, path), PATH_KEY);
  assert.notEqual(groundKey(5, 3, n, path), PATH_KEY);
});

test('variant keys are hashed per tile and always real keys', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    seen.add(treeKey(i, 2 * i));
    assert.ok((TREE_KEYS as readonly string[]).includes(treeKey(i, 3)));
    assert.ok((BUSH_KEYS as readonly string[]).includes(bushKey(i, 3)));
    assert.ok((BLOOD_KEYS as readonly string[]).includes(bloodKey(i, 3)));
  }
  assert.equal(seen.size, TREE_KEYS.length, 'all three trees get used');
  assert.equal(treeKey(7, 8), treeKey(7, 8));
});

test('pathTiles reads `,` from map rows; pathTilesOf reads a list', () => {
  const p = pathTiles(['....', '.,..', '..,.', '....']);
  assert.deepEqual([...p].sort((a, b) => a - b), [1 * 4 + 1, 2 * 4 + 2]);
  assert.deepEqual([...pathTilesOf([[1, 1], [2, 2]], 4)].sort((a, b) => a - b), [1 * 4 + 1, 2 * 4 + 2]);
});

test('the hand-marked paths lie on open ground: Mission 1 and the Intro', () => {
  const spec = m01 as unknown as MissionSpec;
  const mission = createMission(spec);
  const p = pathTiles(spec.map);
  assert.ok(p.size >= 8, 'Mission 1 has a path');
  const n = mission.grid.size;
  for (const i of p) assert.equal(mission.grid.tiles[i], 0, `path tile ${i % n},${Math.floor(i / n)} is floor`);
  const tutorial = createIntro();
  const q = pathTilesOf(intro.path, intro.size);
  assert.ok(q.size >= 6, 'the Intro has a path');
  for (const i of q) assert.equal(tutorial.grid.tiles[i], 0, `intro path tile ${i % intro.size},${Math.floor(i / intro.size)} is floor`);
});

test('wallRun: a horizontal run is se, a vertical run is sw, a gap follows the wall it sits in', () => {
  const g = makeGrid(8);
  for (let x = 1; x <= 6; x++) setTile(g, x, 2, WALL); // along x
  for (let y = 3; y <= 6; y++) setTile(g, 1, y, WALL); // along y, hanging off the corner
  setTile(g, 4, 2, 0); // a door gap in the horizontal run
  setTile(g, 1, 5, 0); // a window gap in the vertical run
  assert.equal(wallRun(g, 3, 2), 'se');
  assert.equal(wallRun(g, 4, 2), 'se');
  assert.equal(wallRun(g, 1, 4), 'sw');
  assert.equal(wallRun(g, 1, 5), 'sw');
  assert.equal(wallRun(g, 1, 2), 'se', 'the corner reads as se');
  assert.equal(wallRun(g, 6, 2), 'se', 'the end of a run');
});

test('openingKey and wallKey build keys of the manifest', () => {
  assert.equal(openingKey('door', 'sw', false), 'door_sw_broken');
  assert.equal(openingKey('window', 'se', true), 'window_se_fixed');
  assert.equal(wallKey('sw'), 'wall_sw');
});

// ---- Seeing through walls and trees ----

const N = 16;
const box = (tx: number, ty: number, w = 64, h = 80) => {
  const p = tileToWorld(tx, ty, N);
  return spriteRect(p.x, p.y, w, h, 0.5, 0.9);
};

test('overlaps and spriteRect', () => {
  assert.ok(overlaps({ x0: 0, y0: 0, x1: 10, y1: 10 }, { x0: 5, y0: 5, x1: 15, y1: 15 }));
  assert.ok(!overlaps({ x0: 0, y0: 0, x1: 10, y1: 10 }, { x0: 10, y0: 0, x1: 20, y1: 10 }), 'touching edges do not overlap');
  assert.deepEqual(spriteRect(100, 200, 40, 80, 0.5, 0.75), { x0: 80, x1: 120, y0: 140, y1: 220 });
});

test('easeAlpha moves toward 0.4 or 1 and stops there', () => {
  assert.equal(easeAlpha(1, true, 1000), FADE_ALPHA);
  assert.equal(easeAlpha(FADE_ALPHA, false, 1000), 1);
  const half = easeAlpha(1, true, 80);
  assert.ok(half < 1 && half > FADE_ALPHA, `partway: ${half}`);
});

test('a wall or tree in front of a figure fades to 40%, behind it or off to the side it does not', () => {
  const fades = new Map<string, number>();
  const sprite = (id: string) => ({ setAlpha: (a: number) => void fades.set(id, a) });
  const occ = new Occlusion<{ setAlpha(a: number): unknown }>(N);
  occ.add(6, 6, sprite('front'), box(6, 6)); // one tile down-right of the figure: drawn over it
  occ.add(4, 4, sprite('behind'), box(4, 4)); // up-left: drawn under it
  occ.add(9, 3, sprite('aside'), box(9, 3)); // far to the right on screen
  const figs = [{ x: 5, y: 5 }];
  let covered = occ.update(figs, 16);
  assert.deepEqual(covered, [true]);
  assert.ok(fades.get('front')! < 1, 'the front one starts fading');
  assert.equal(fades.has('behind'), false);
  assert.equal(fades.has('aside'), false);
  covered = occ.update(figs, 1000);
  assert.equal(fades.get('front'), FADE_ALPHA);
  assert.equal(occ.fading, 1);
  // the figure walks away: the wall comes back to full and leaves the active set
  covered = occ.update([{ x: 5, y: 12 }], 1000);
  assert.deepEqual(covered, [false]);
  assert.equal(fades.get('front'), 1);
  assert.equal(occ.fading, 0);
});

test('several figures: the wall stays faded while any of them is behind it; each is reported on its own', () => {
  const alphas: number[] = [];
  const occ = new Occlusion<{ setAlpha(a: number): unknown }>(N);
  occ.add(6, 6, { setAlpha: (a) => void alphas.push(a) }, box(6, 6));
  const covered = occ.update([{ x: 5, y: 5 }, { x: 12, y: 2 }, { x: 5.4, y: 5.2 }], 1000);
  assert.deepEqual(covered, [true, false, true]);
  assert.equal(alphas.at(-1), FADE_ALPHA);
  occ.update([{ x: 12, y: 2 }, { x: 5.2, y: 5.1 }], 1000);
  assert.equal(alphas.at(-1), FADE_ALPHA, 'still one figure behind it');
});
