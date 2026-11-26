// Which environment key a tile, wall or decal is drawn with (art/STYLE.md *Environment art*, Z63).
// Pure and stable: the same tile always gets the same picture, so a reload or a rebuild never shuffles the woods.
import manifest from '../../art/manifest.json';
import { type Grid, TREE, WALL } from '../sim/grid';
import { TILE_H, TILE_W } from './iso';

export const GROUND_KEY = 'ground_moss';
export const PATH_KEY = 'ground_path';
/** Flat patch decals on the moss, larger than a tile (art/STYLE.md *Visual pass*). */
export const PATCH_KEYS = ['patch_dirt_a', 'patch_dirt_b', 'patch_dirt_c', 'patch_leaves_a', 'patch_leaves_b', 'patch_leaves_c'] as const;
/** Small decorative pieces: they block nothing and hide no one. */
export const SCATTER_KEYS = ['scatter_tuft_a', 'scatter_tuft_b', 'scatter_fern_a', 'scatter_fern_b', 'scatter_rocks', 'scatter_branch', 'scatter_mushrooms', 'scatter_stump'] as const;
export const TREE_KEYS = ['tree_a', 'tree_b', 'tree_c'] as const;
export const BUSH_KEYS = ['bush_a', 'bush_b'] as const;
/** Tall trees and the dead snag (art/STYLE.md *Visual pass*); `TREE_KEYS` stay as undergrowth and young trees. */
export const TALL_KEYS = ['tree_pine_a', 'tree_pine_b', 'tree_birch', 'tree_snag'] as const;
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

/** The ground key of a tile: a hand-marked path tile, else moss. Variety comes from `groundDressing`. */
export function groundKey(x: number, y: number, size: number, path?: ReadonlySet<number>): string {
  return path?.has(y * size + x) ? PATH_KEY : GROUND_KEY;
}

/** One patch or scatter piece: the tile it belongs to and its offset from the tile centre in world px. */
export interface Dressing {
  key: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface DressingZones {
  /** Nothing touches these tiles (paths, floors, interactables). */
  keepOut: (x: number, y: number) => boolean;
  /** Further tiles that take no scatter piece; patches may still lie there (a tree can stand on dirt). */
  noScatter?: (x: number, y: number) => boolean;
  /** The house yard, where there is less of both. */
  yard?: (x: number, y: number) => boolean;
}

const PATCH_CELL = 4; // tiles: at most one patch per cell
const PATCH_CHANCE = 0.6;
const PATCH_YARD_CHANCE = 0.2;
const SCATTER_CHANCE = 0.07; // per tile
const SCATTER_YARD_CHANCE = 0.02;
const sizes = manifest.keys as unknown as Record<string, { size: number[]; scale?: number }>;

/** True when a patch of `key` centred on tile (x, y) lies wholly on tiles inside the map that are not kept out. */
function patchFits(key: string, x: number, y: number, n: number, keepOut: DressingZones['keepOut']): boolean {
  const { size, scale = 1 } = sizes[key]!;
  const rx = size[0]! / scale / 2 + TILE_W / 4;
  const ry = size[1]! / scale / 2 + TILE_H / 4;
  const reach = Math.ceil(rx / (TILE_W / 2));
  for (let oy = -reach; oy <= reach; oy++) {
    for (let ox = -reach; ox <= reach; ox++) {
      const u = ((ox - oy) * TILE_W) / 2 / rx;
      const v = ((ox + oy) * TILE_H) / 2 / ry;
      if (u * u + v * v >= 1) continue;
      const tx = x + ox;
      const ty = y + oy;
      if (tx < 0 || ty < 0 || tx >= n || ty >= n || keepOut(tx, ty)) return false;
    }
  }
  return true;
}

/**
 * The patches and scatter of an `n` x `n` map, in drawing order (all patches, then scatter from back to front).
 * Hashed, so a reload shows the same ground.
 */
export function groundDressing(n: number, zones: DressingZones): Dressing[] {
  const { keepOut, noScatter, yard } = zones;
  const patches: Dressing[] = [];
  for (let cy = 0; cy * PATCH_CELL < n; cy++) {
    for (let cx = 0; cx * PATCH_CELL < n; cx++) {
      const h = tileHash(cx, cy, 10);
      const x = cx * PATCH_CELL + (h % PATCH_CELL);
      const y = cy * PATCH_CELL + ((h >>> 8) % PATCH_CELL);
      if (hash01(cx, cy, 11) >= (yard?.(x, y) ? PATCH_YARD_CHANCE : PATCH_CHANCE)) continue;
      const key = PATCH_KEYS[tileHash(cx, cy, 12) % PATCH_KEYS.length]!;
      if (patchFits(key, x, y, n, keepOut)) patches.push({ key, x, y, dx: 0, dy: 0 });
    }
  }
  const scatter: Dressing[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (hash01(x, y, 13) >= (yard?.(x, y) ? SCATTER_YARD_CHANCE : SCATTER_CHANCE)) continue;
      if (keepOut(x, y) || noScatter?.(x, y)) continue;
      const h = tileHash(x, y, 14);
      // the offsets stay well inside the tile's own diamond
      scatter.push({ key: SCATTER_KEYS[h % SCATTER_KEYS.length]!, x, y, dx: ((h >>> 8) % 21) - 10, dy: ((h >>> 16) % 9) - 4 });
    }
  }
  const depth = (d: Dressing) => ((d.x + d.y) * TILE_H) / 2 + d.dy;
  scatter.sort((a, b) => depth(a) - depth(b));
  return [...patches, ...scatter];
}

export const treeKey = (x: number, y: number): string => TREE_KEYS[tileHash(x, y, 3) % TREE_KEYS.length]!;
/** A tall tree for a tile: pines and birch in equal parts, the dead snag rarer. */
export const tallKey = (x: number, y: number): string => TALL_KEYS[Math.floor((tileHash(x, y, 21) % 7) / 2)]!;

const isTree = (g: Grid, x: number, y: number): boolean => x < 0 || y < 0 || x >= g.size || y >= g.size || g.tiles[y * g.size + x] === TREE;

/**
 * The chance that the tree on (x, y) is tall: mostly on the treeline and in thick woods, rarely where it stands apart.
 * Rarely on the two near edges too (high x or y): there it would stand between the camera and the map.
 */
export function tallChance(g: Grid, x: number, y: number): number {
  if (Math.max(x, y) >= g.size - 2) return 0.15;
  if (Math.min(x, y) <= 1) return 0.85;
  let trees = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (isTree(g, x + dx, y + dy)) trees++;
  return trees >= 9 ? 0.6 : 0.2;
}

/** The picture of a `T` tile, looks only: tall or small. Inside a `clearing` (the camp, the house yard) always small. */
export function mapTreeKey(g: Grid, x: number, y: number, clearing?: (x: number, y: number) => boolean): string {
  return !clearing?.(x, y) && hash01(x, y, 20) < tallChance(g, x, y) ? tallKey(x, y) : treeKey(x, y);
}

/** Tiles of decorative forest outside every side of the map. */
export const BORDER = 10;
/** On the near sides a tall tree stands at least this far out, so it never hides the map. */
const NEAR_TALL_AT = 5;
/** The mist the border fades into; also the camera's background, so nothing past it is black. */
export const FOREST_FOG = 0x666d69;

/** How deep in the mist a point `e` tiles outside the map edge is: 0 clear, 1 gone. */
export function forestFog(e: number): number {
  const t = Math.max(0, Math.min(1, e / (BORDER - 1)));
  return t * t * (3 - 2 * t);
}

export interface BorderPiece {
  key: string;
  x: number;
  y: number;
  /** How much of the piece shows through the mist (its alpha). */
  alpha: number;
  /** True when it stands behind the whole map, so it can be baked into the ground. */
  back: boolean;
}

/** The decorative trees and undergrowth outside an `n` x `n` map, back to front. Not walkable: they are only pictures. */
export function forestBorder(n: number): BorderPiece[] {
  const out: BorderPiece[] = [];
  for (let y = -BORDER; y < n + BORDER; y++) {
    for (let x = -BORDER; x < n + BORDER; x++) {
      const d = Math.max(-x, x - (n - 1), -y, y - (n - 1));
      if (d < 1 || d > BORDER - 2) continue; // inside the map, or so deep in the mist it would not show
      const r = hash01(x, y, 22);
      if (r >= 0.72) continue;
      const back = x < n && y < n;
      const tall = r < 0.4 && (back || d >= NEAR_TALL_AT);
      const key = tall ? tallKey(x, y) : r < 0.6 ? treeKey(x, y) : bushKey(x, y);
      out.push({ key, x, y, alpha: 1 - forestFog(d - 0.5), back });
    }
  }
  return out.sort((a, b) => a.x + a.y - (b.x + b.y));
}

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

/** The share of wall tiles drawn with a vertical beam, and with a boarded patch (art/STYLE.md *Visual pass*). */
const BEAM_SHARE = 0.15;
const BOARD_SHARE = 0.12;

/** The picture of the wall on (x, y), looks only: plain, with a beam, or boarded, by a stable hash. */
export function wallVariantKey(run: WallRun, x: number, y: number): string {
  const r = hash01(x, y, 30);
  return r < BEAM_SHARE ? `wall_${run}_beam` : r < BEAM_SHARE + BOARD_SHARE ? `wall_${run}_boarded` : wallKey(run);
}

/** A rectangle of tiles: a roof footprint, walls included. */
export interface Footprint {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One roof piece at a fractional tile position; `run` is the way it goes on screen (an `sw` piece is the `se` art flipped). */
export interface RoofPiece {
  x: number;
  y: number;
  run: WallRun;
}

/**
 * The gable over a footprint: the ridge along its longer side through the middle, one piece per tile, and trim along
 * all four edges, one piece per tile edge. Pure, so the house always gets the same roof.
 */
export function roofPieces(r: Footprint): { ridge: RoofPiece[]; trim: RoofPiece[] } {
  const ridge: RoofPiece[] = [];
  if (r.w >= r.h) for (let x = r.x; x < r.x + r.w; x++) ridge.push({ x, y: r.y + (r.h - 1) / 2, run: 'se' });
  else for (let y = r.y; y < r.y + r.h; y++) ridge.push({ x: r.x + (r.w - 1) / 2, y, run: 'sw' });
  const trim: RoofPiece[] = [];
  for (let x = r.x; x < r.x + r.w; x++) for (const y of [r.y - 0.5, r.y + r.h - 0.5]) trim.push({ x, y, run: 'se' });
  for (let y = r.y; y < r.y + r.h; y++) for (const x of [r.x - 0.5, r.x + r.w - 0.5]) trim.push({ x, y, run: 'sw' });
  return { ridge, trim };
}
