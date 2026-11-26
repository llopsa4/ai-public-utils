import assert from 'node:assert/strict';
import { test } from 'node:test';
import manifest from '../art/manifest.json';
import intro from '../src/data/intro.json';
import base1 from '../src/data/base1.json';
import m01 from '../src/data/missions/m01.json';
import { FLAT_FURNITURE, houseDressing, housePieces, introDressing, porchSteps } from '../src/render/dressing';
import { easeAlpha, FADE_ALPHA, Occlusion, overlaps, spriteRect } from '../src/render/occlude';
import { tileToWorld } from '../src/render/iso';
import {
  BLOOD_KEYS, BUSH_KEYS, GROUND_KEY, PATCH_KEYS, PATH_KEY, SCATTER_KEYS, TREE_KEYS, BORDER, TALL_KEYS, forestBorder, forestFog, mapTreeKey, roofPieces, tallChance, wallVariantKey, bloodKey, bushKey, groundDressing, groundKey, hash01, openingKey, pathTiles, pathTilesOf, tileHash, treeKey, wallKey, wallRun,
} from '../src/render/terrain';
import { TREE, WALL, makeGrid, setTile } from '../src/sim/grid';
import { createIntro } from '../src/sim/tutorial';
import { createMission, type MissionSpec } from '../src/sim/mission';

const keys = manifest.keys as unknown as Record<string, { group?: string; scale?: number; size: [number, number]; anchor: [number, number]; placeholder?: { shape: string } }>;
const envKeys = Object.entries(keys).filter(([, k]) => k.group === 'env').map(([k]) => k);

test('the environment kit: every key is a 2x key with a placeholder, an even source size and a sane anchor', () => {
  assert.ok(envKeys.length >= 75 && envKeys.length <= 90, `${envKeys.length} env keys (the kit plus the visual-pass ground, trees and house, and the Mission 2 estate)`);
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
    GROUND_KEY, PATH_KEY, ...PATCH_KEYS, ...SCATTER_KEYS, ...TREE_KEYS, ...TALL_KEYS, ...BUSH_KEYS, ...BLOOD_KEYS, wallKey('se'), wallKey('sw'),
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

test('groundKey: moss everywhere but the marked path', () => {
  const path = new Set([3 * 32 + 4]);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) assert.equal(groundKey(x, y, 32, path), x === 4 && y === 3 ? PATH_KEY : GROUND_KEY);
});

test('groundDressing: stable, every key used, patches first, nothing kept out, thinner in the yard', () => {
  const n = 64;
  const open = { keepOut: () => false };
  const all = groundDressing(n, open);
  assert.deepEqual(groundDressing(n, open), all);
  assert.equal(new Set(all.map((d) => d.key)).size, PATCH_KEYS.length + SCATTER_KEYS.length);
  const isPatch = (k: string) => (PATCH_KEYS as readonly string[]).includes(k);
  const firstScatter = all.findIndex((d) => !isPatch(d.key));
  assert.ok(all.slice(firstScatter).every((d) => !isPatch(d.key)), 'patches lie under the scatter');
  const left = groundDressing(n, { keepOut: (x) => x >= 32 });
  assert.ok(left.length > 0 && left.every((d) => d.x < 32));
  assert.ok(left.filter((d) => isPatch(d.key)).every((d) => d.x < 31), 'a patch does not hang over a kept-out tile');
  assert.ok(groundDressing(n, { ...open, yard: () => true }).length < all.length / 2);
  assert.ok(groundDressing(n, { ...open, noScatter: () => true }).every((d) => isPatch(d.key)));
});

test('the maps keep paths, the house, the camp and crates clear; scatter only on open tiles', () => {
  const spec = m01 as unknown as MissionSpec;
  const mission = createMission(spec);
  const tutorial = createIntro();
  const cases = [
    { grid: mission.grid, list: houseDressing(mission.grid, mission.extract), clear: [...pathTiles(spec.map), ...mission.crates.map((c) => c.y * 64 + c.x)] },
    { grid: tutorial.grid, list: introDressing(tutorial.grid), clear: [...pathTilesOf(intro.path, intro.size), intro.fire.y * 64 + intro.fire.x] },
  ];
  for (const { grid, list, clear } of cases) {
    const n = grid.size;
    assert.ok(list.length > 100, `${list.length} pieces`);
    const taken = new Set(clear);
    for (const d of list) {
      assert.ok(!taken.has(d.y * n + d.x), `${d.key} at ${d.x},${d.y}`);
      if (d.key.startsWith('scatter_')) assert.equal(grid.tiles[d.y * n + d.x], 0);
    }
  }
  const r = m01.roof;
  const inside = cases[0]!.list.filter((d) => d.x >= r.x && d.x < r.x + r.w && d.y >= r.y && d.y < r.y + r.h);
  assert.deepEqual(inside.map((d) => d.key), ['furn_rug'], 'no ground dressing in the house, only the flat furniture');
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

test('tall trees: stable, mostly on the treeline, never in a clearing', () => {
  const g = makeGrid(32);
  for (let i = 0; i < 32; i++) for (const [x, y] of [[i, 0], [i, 1], [16, i]] as const) setTile(g, x, y, TREE);
  setTile(g, 8, 16, TREE);
  assert.ok(tallChance(g, 5, 0) > tallChance(g, 8, 16), 'the edge is taller than a lone tree');
  let tall = 0;
  for (let x = 0; x < 32; x++) {
    const k = mapTreeKey(g, x, 0);
    assert.equal(mapTreeKey(g, x, 0), k);
    assert.ok((TALL_KEYS as readonly string[]).includes(k) || (TREE_KEYS as readonly string[]).includes(k), k);
    if ((TALL_KEYS as readonly string[]).includes(k)) tall++;
    assert.ok((TREE_KEYS as readonly string[]).includes(mapTreeKey(g, x, 0, () => true)), 'small in a clearing');
  }
  assert.ok(tall > 20, `${tall} of 32 edge trees are tall`);
  assert.ok(tallChance(g, 31, 5) < tallChance(g, 0, 5), 'the near edges stay low');
});

test('the forest border lies wholly outside the map, fades with distance and covers every side', () => {
  const n = 64;
  const list = forestBorder(n);
  assert.deepEqual(forestBorder(n), list);
  assert.equal(new Set(list.filter((b) => TALL_KEYS.includes(b.key as never)).map((b) => b.key)).size, TALL_KEYS.length);
  for (const b of list) {
    assert.ok(b.x < 0 || b.y < 0 || b.x >= n || b.y >= n, 'outside');
    assert.ok(Math.min(b.x, b.y) >= -BORDER && Math.max(b.x, b.y) < n + BORDER);
    assert.ok(b.alpha > 0 && b.alpha <= 1);
    assert.equal(b.back, b.x < n && b.y < n);
    if (!b.back && TALL_KEYS.includes(b.key as never)) assert.ok(Math.max(b.x - (n - 1), b.y - (n - 1), -b.x, -b.y) >= 5, 'tall near trees stand well outside');
  }
  for (const side of [list.filter((b) => b.x < 0), list.filter((b) => b.y < 0), list.filter((b) => b.x >= n), list.filter((b) => b.y >= n)]) assert.ok(side.length > 100, `${side.length}`);
  assert.equal(forestFog(0), 0);
  assert.equal(forestFog(BORDER), 1);
});

test('occlusion: a tall tree several tiles in front fades, also one outside the map', () => {
  const n = 16;
  let alpha = 1;
  const occ = new Occlusion(n, BORDER);
  const foot = tileToWorld(n + 2, n + 2, n);
  occ.add(n + 2, n + 2, { setAlpha: (a: number) => (alpha = a) }, spriteRect(foot.x, foot.y, 64, 176, 0.5, 0.93));
  assert.deepEqual(occ.update([{ x: n - 2, y: n - 2 }], 1000), [true]);
  assert.equal(alpha, FADE_ALPHA);
});

test('wall variants: plain walls stay the most, both variants show, and every pick is a real key of the same run', () => {
  for (const run of ['se', 'sw'] as const) {
    const count = new Map<string, number>();
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      const k = wallVariantKey(run, x, y);
      assert.ok(keys[k], k);
      assert.ok(k.startsWith(`wall_${run}`), k);
      assert.deepEqual(keys[k]!.size, keys[wallKey(run)]!.size, `${k} lines up with ${wallKey(run)}`);
      assert.deepEqual(keys[k]!.anchor, keys[wallKey(run)]!.anchor, k);
      count.set(k, (count.get(k) ?? 0) + 1);
    }
    assert.equal(count.size, 3, run);
    assert.ok(count.get(wallKey(run))! > 1000, 'plain walls stay the most');
    assert.equal(wallVariantKey(run, 7, 9), wallVariantKey(run, 7, 9), 'stable');
  }
});

test('the roof: a ridge along the long side through the middle, trim on every edge tile', () => {
  const r = m01.roof;
  const { ridge, trim } = roofPieces(r);
  assert.equal(ridge.length, r.w);
  assert.ok(ridge.every((p) => p.run === 'se' && p.y === r.y + (r.h - 1) / 2));
  assert.equal(trim.length, 2 * (r.w + r.h));
  const tall = roofPieces({ x: 0, y: 0, w: 3, h: 6 });
  assert.ok(tall.ridge.length === 6 && tall.ridge.every((p) => p.run === 'sw' && p.x === 1));
  for (const k of ['roof_ridge', 'roof_trim', 'roof_chimney']) assert.ok(keys[k], k);
  assert.ok(m01.chimney.x >= r.x && m01.chimney.x < r.x + r.w && m01.chimney.y >= r.y && m01.chimney.y < r.y + r.h, 'the chimney is on the roof');
});

test('the house pieces: steps outside the front door; furniture on wall-side floor tiles that nothing else uses', () => {
  const spec = m01 as unknown as MissionSpec;
  const mission = createMission(spec);
  const n = mission.grid.size;
  const r = m01.roof;
  const steps = porchSteps(m01.frontDoor, r);
  assert.equal(mission.grid.tiles[m01.frontDoor.y * n + m01.frontDoor.x], 0, 'the front door is a gap in the wall');
  assert.deepEqual([steps.x, steps.y], [m01.frontDoor.x, m01.frontDoor.y + 0.7], 'just outside, away from the house');
  assert.deepEqual(porchSteps({ x: 4, y: 2 }, { x: 0, y: 0, w: 5, h: 5 }), { key: 'house_steps', x: 4.7, y: 2 });
  // never on a crate spot of any layout, the stove, a start tile, or the tile in front of an opening or doorway
  const used = new Set([...m01.crates, ...m01.layouts.flatMap((l) => l.crates), base1.stove, ...m01.enemies, ...m01.survivors].map((p) => p.y * n + p.x));
  const openings = [...base1.openings, ...base1.sealed.map(([x, y]) => ({ x: x!, y: y! }))];
  const doorways: { x: number; y: number }[] = [...openings];
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
    const wallSide = [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dx, dy]) => mission.grid.tiles[(y + dy!) * n + x + dx!] === WALL);
    if (mission.grid.tiles[y * n + x] === 0 && wallSide && (x === r.x || y === r.y || x === r.x + r.w - 1 || y === r.y + r.h - 1)) doorways.push({ x, y });
    // an inner doorway: a floor tile between two walls in a line
    if (mission.grid.tiles[y * n + x] === 0 && ((mission.grid.tiles[y * n + x - 1] === WALL && mission.grid.tiles[y * n + x + 1] === WALL) || (mission.grid.tiles[(y - 1) * n + x] === WALL && mission.grid.tiles[(y + 1) * n + x] === WALL))) doorways.push({ x, y });
  }
  const fronts = new Set(doorways.flatMap((d) => [[0, 1], [1, 0], [0, -1], [-1, 0], [0, 0]].map(([dx, dy]) => (d.y + dy!) * n + d.x + dx!)));
  assert.equal(m01.furniture.length, 6);
  for (const f of m01.furniture) {
    const i = f.y * n + f.x;
    assert.ok(keys[f.key], f.key);
    assert.ok(f.x > r.x && f.y > r.y && f.x < r.x + r.w - 1 && f.y < r.y + r.h - 1, `${f.key} inside the house`);
    assert.equal(mission.grid.tiles[i], 0, `${f.key} on floor`);
    assert.ok(!used.has(i), `${f.key} on a crate, stove or start tile`);
    assert.ok(!fronts.has(i), `${f.key} in a doorway or in front of an opening`);
    if (!FLAT_FURNITURE.has(f.key)) assert.ok([[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dx, dy]) => mission.grid.tiles[(f.y + dy!) * n + f.x + dx!] === WALL), `${f.key} against a wall`);
  }
  assert.equal(new Set(m01.furniture.map((f) => f.key)).size, 6, 'six different pieces');
  const upright = housePieces();
  assert.equal(upright.length, 6, 'five upright pieces and the steps');
  for (const f of upright.slice(0, 5)) assert.ok(Math.abs(f.x - Math.round(f.x)) + Math.abs(f.y - Math.round(f.y)) > 0.2, `${f.key} pushed toward its wall`);
});
