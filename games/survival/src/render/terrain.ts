// Terrain art picks (art/SPEC.md sections 6 and 7): which ground frame, bank mask, spill edges, tree species and
// prop each tile gets. Pure (no Phaser), so tests can check the maths. Nothing here touches the sim's random stream:
// picks are hashes of the map seed and the tile.
import type { TileType } from '../sim/map';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** The four tile edges, in the order of the spec's masks: NE = (x, y-1), SE = (x+1, y), SW = (x, y+1), NW = (x-1, y). */
export const EDGES = ['ne', 'se', 'sw', 'nw'] as const;
export type Edge = (typeof EDGES)[number];

const OFFSET: Record<Edge, [number, number]> = { ne: [0, -1], se: [1, 0], sw: [0, 1], nw: [-1, 0] };
/** The bit of an edge in a bank mask (the same numbers as the barricade masks). */
export const EDGE_BIT: Record<Edge, number> = { ne: 1, se: 2, sw: 4, nw: 8 };

export interface TileGrid {
  size: number;
  tiles: readonly TileType[];
}

/** Small deterministic hash in [0, 1) so tiles vary without touching the sim RNG. */
export function hash01(x: number, y: number, k: number): number {
  let h = Math.imul(x * 374761393 + y * 668265263 + k * 2246822519, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** An integer in [0, n) from the map seed, the tile and a salt (a different salt gives an independent pick). */
export function pick(seed: number, x: number, y: number, salt: number, n: number): number {
  return Math.floor(hash01(x, y, salt + (Math.abs(seed) % 100003) * 31) * n);
}

export const isWater = (t: TileType | null): boolean => t === 'river' || t === 'ford';

/** The tile type at (x, y), or null off the map. */
export function tileAt(grid: TileGrid, x: number, y: number): TileType | null {
  if (x < 0 || y < 0 || x >= grid.size || y >= grid.size) return null;
  return grid.tiles[y * grid.size + x];
}

/** The tile across an edge. */
export function across(edge: Edge, x: number, y: number): [number, number] {
  return [x + OFFSET[edge][0], y + OFFSET[edge][1]];
}

/**
 * The bank mask of a tile: the sum of the edge bits whose neighbour is water (river or ford). 0 for a water tile and for
 * a tile with no water neighbour (it draws the plain ground tile). Diagonal-only water is ignored (SPEC section 6).
 */
export function bankMask(grid: TileGrid, x: number, y: number): number {
  if (isWater(tileAt(grid, x, y))) return 0;
  let mask = 0;
  for (const e of EDGES) {
    const [nx, ny] = across(e, x, y);
    if (isWater(tileAt(grid, nx, ny))) mask |= EDGE_BIT[e];
  }
  return mask;
}

export interface Spill {
  key: 'spill_forest' | 'spill_berry';
  edge: Edge;
}

/** The spill overlays a grass tile draws: one per edge whose neighbour is a forest or berry tile. */
export function spillsOf(grid: TileGrid, x: number, y: number): Spill[] {
  if (tileAt(grid, x, y) !== 'grass') return [];
  const out: Spill[] = [];
  for (const edge of EDGES) {
    const [nx, ny] = across(edge, x, y);
    const t = tileAt(grid, nx, ny);
    if (t === 'forest') out.push({ key: 'spill_forest', edge });
    else if (t === 'berry') out.push({ key: 'spill_berry', edge });
  }
  return out;
}

/** The atlas frame of a seasonal still (SPEC section 8 pattern C): `<key>/<season>/<index>`. */
export const seasonFrame = (key: string, season: Season, index: number | string): string => `${key}/${season}/${index}`;

export interface TileArt {
  key: string;
  frame: string;
}

/** The plain ground a tile draws: its type's tile in one of 4 variants picked from the map seed (the bank is `bankArt`). */
export function groundArt(grid: TileGrid, seed: number, x: number, y: number, season: Season): TileArt {
  const type = tileAt(grid, x, y) ?? 'grass';
  const key = `tile_${type}`;
  return { key, frame: seasonFrame(key, season, pick(seed, x, y, 11, 4)) };
}

/** The bank frame of a grass tile beside water, or null (no mask, or not grass: forest and berry floors keep their own). */
export function bankArt(grid: TileGrid, x: number, y: number, season: Season): TileArt | null {
  if (tileAt(grid, x, y) !== 'grass') return null;
  const mask = bankMask(grid, x, y);
  return mask === 0 ? null : { key: 'bank_river', frame: seasonFrame('bank_river', season, mask) };
}

/** True when water lies within `r` tiles (Chebyshev), the test for the cottonwood and willow. */
export function nearWater(grid: TileGrid, x: number, y: number, r = 2): boolean {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (isWater(tileAt(grid, x + dx, y + dy))) return true;
  return false;
}

/** The tree on a forest tile: bur oak or basswood, or cottonwood or willow within 2 tiles of water; by the map seed. */
export function treeKey(grid: TileGrid, seed: number, x: number, y: number): string {
  const pair = nearWater(grid, x, y) ? ['tree_cottonwood', 'tree_willow'] : ['tree_bur_oak', 'tree_basswood'];
  return pair[pick(seed, x, y, 21, 2)];
}

/** Which of the tree's 2 variants this tile shows. */
export const treeVariant = (seed: number, x: number, y: number): number => pick(seed, x, y, 22, 2);

/** The bush standing on a berry tile (its first frame variant is `bushVariant`). */
export const bushKey = (seed: number, x: number, y: number): string => (pick(seed, x, y, 31, 2) === 0 ? 'bush_chokecherry' : 'bush_plum');
export const bushVariant = (seed: number, x: number, y: number): number => pick(seed, x, y, 32, 2);

export interface Prop {
  key: 'rock_boulder' | 'tuft_grass';
  variant: number;
}

/** Share of free grass tiles that carry a boulder or a tuft. */
export const ROCK_SHARE = 0.012;
export const TUFT_SHARE = 0.09;

/** A rock or a tuft on a plain grass tile (no bank, no spill neighbours), or null. */
export function propOf(grid: TileGrid, seed: number, x: number, y: number): Prop | null {
  if (tileAt(grid, x, y) !== 'grass' || bankMask(grid, x, y) !== 0 || spillsOf(grid, x, y).length > 0) return null;
  const r = hash01(x, y, 41 + (Math.abs(seed) % 100003) * 31);
  if (r < ROCK_SHARE) return { key: 'rock_boulder', variant: pick(seed, x, y, 42, 3) };
  if (r < ROCK_SHARE + TUFT_SHARE) return { key: 'tuft_grass', variant: pick(seed, x, y, 43, 3) };
  return null;
}
