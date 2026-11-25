// Which environment key a tile, wall or decal is drawn with (art/STYLE.md *Environment art*, Z63).
// Pure and stable: the same tile always gets the same picture, so a reload or a rebuild never shuffles the woods.
import { type Grid, WALL } from '../sim/grid';

export const GROUND_KEYS = ['ground_moss', 'ground_dirt', 'ground_leaves'] as const;
export const PATH_KEY = 'ground_path';
export const TREE_KEYS = ['tree_a', 'tree_b', 'tree_c'] as const;
export const BUSH_KEYS = ['bush_a', 'bush_b'] as const;
export const BLOOD_KEYS = ['blood_a', 'blood_b', 'blood_c'] as const;

/** A 32-bit hash of a tile (and a salt), uniform enough for picking variants. */
export function tileHash(x: number, y: number, salt = 0): number {
  let h = (Math.imul(x | 0, 0x1b873593) ^ Math.imul(y | 0, 0x85ebca6b) ^ Math.imul(salt | 0, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** `tileHash` as a number in [0, 1). */
export const hash01 = (x: number, y: number, salt = 0): number => tileHash(x, y, salt) / 4294967296;

/** The path tiles (`,` in a map row) as a set of `y * size + x`. Path is ground only: it blocks nothing. */
export function pathTiles(map: readonly string[]): Set<number> {
  const out = new Set<number>();
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === ',') out.add(y * map.length + x);
  });
  return out;
}

/** Path tiles given as `[x, y]` pairs (the Intro's map is generated, so its path is a list). */
export function pathTilesOf(list: readonly (readonly number[])[], size: number): Set<number> {
  return new Set(list.map(([x, y]) => y! * size + x!));
}

/**
 * The ground key of a tile: a hand-marked path tile, else moss with patches of dirt and leaf litter. A coarse 4 x 4
 * patch hash decides where dirt and leaves gather; a per-tile hash scatters them inside (a few stray ones outside).
 */
export function groundKey(x: number, y: number, size: number, path?: ReadonlySet<number>): string {
  if (path?.has(y * size + x)) return PATH_KEY;
  const patch = hash01(x >> 2, y >> 2, 1);
  const r = hash01(x, y, 2);
  const dirt = patch < 0.2 ? 0.6 : 0.04;
  const leaves = patch >= 0.2 && patch < 0.42 ? 0.6 : 0.05;
  if (r < dirt) return 'ground_dirt';
  if (r < dirt + leaves) return 'ground_leaves';
  return 'ground_moss';
}

export const treeKey = (x: number, y: number): string => TREE_KEYS[tileHash(x, y, 3) % TREE_KEYS.length]!;
export const bushKey = (x: number, y: number): string => BUSH_KEYS[tileHash(x, y, 4) % BUSH_KEYS.length]!;
export const bloodKey = (x: number, y: number): string => BLOOD_KEYS[tileHash(x, y, 5) % BLOOD_KEYS.length]!;

/** The direction a wall run goes on screen: `se` along the tile x axis (down-right), `sw` along y (down-left). */
export type WallRun = 'se' | 'sw';

const isWall = (g: Grid, x: number, y: number): boolean => x >= 0 && y >= 0 && x < g.size && y < g.size && g.tiles[y * g.size + x] === WALL;

/** Which way the wall through (x, y), or the gap in it, runs: by its wall neighbours; a corner or a lone post reads as `se`. */
export function wallRun(g: Grid, x: number, y: number): WallRun {
  const along = isWall(g, x - 1, y) || isWall(g, x + 1, y);
  const across = isWall(g, x, y - 1) || isWall(g, x, y + 1);
  return across && !along ? 'sw' : 'se';
}

export type OpeningKind = 'door' | 'window';

/** The key of a door or window piece in a wall running `run`, broken or fixed. */
export const openingKey = (kind: OpeningKind, run: WallRun, fixed: boolean): string => `${kind}_${run}_${fixed ? 'fixed' : 'broken'}`;
export const wallKey = (run: WallRun): string => `wall_${run}`;
