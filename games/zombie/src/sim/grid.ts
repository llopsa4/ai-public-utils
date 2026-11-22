// Tile grid (DESIGN §10): pure data, JSON-serialisable. Kinds are small ints in a flat array.
export const FLOOR = 0;
export const WALL = 1;
export const TREE = 2;
export const COVER = 3;
export const BUSH = 4;
export type Kind = typeof FLOOR | typeof WALL | typeof TREE | typeof COVER | typeof BUSH;

export interface Grid {
  size: number;
  tiles: number[];
}

export function makeGrid(size: number): Grid {
  return { size, tiles: new Array<number>(size * size).fill(FLOOR) };
}

export function inBounds(g: Grid, x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < g.size && y < g.size;
}

export function getTile(g: Grid, x: number, y: number): number {
  return inBounds(g, x, y) ? (g.tiles[y * g.size + x] ?? WALL) : WALL;
}

export function setTile(g: Grid, x: number, y: number, kind: Kind): void {
  if (inBounds(g, x, y)) g.tiles[y * g.size + x] = kind;
}

/** Walls, trees and cover block movement; bushes and floor do not (vision rules come in Z3). */
export function isBlocked(g: Grid, x: number, y: number): boolean {
  const k = getTile(g, x, y);
  return k === WALL || k === TREE || k === COVER;
}
