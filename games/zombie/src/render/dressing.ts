// Where patches and scatter may go on each map (art/STYLE.md *Visual pass*). Pure; looks only.
import base1 from '../data/base1.json';
import intro from '../data/intro.json';
import m01 from '../data/missions/m01.json';
import { type Grid } from '../sim/grid';
import { type Dressing, groundDressing, pathTiles, pathTilesOf } from './terrain';

const YARD = 5; // tiles around the house

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
const inBox = (b: Box, x: number, y: number, pad = 0): boolean => x >= b.x - pad && y >= b.y - pad && x < b.x + b.w + pad && y < b.y + b.h + pad;

/** A map with a house (Mission 1 and Base 1, Mission 2): what the dressing and the house pieces read from its data. */
export interface HouseMap {
  map: string[];
  roof: Box;
  frontDoor: { x: number; y: number };
  furniture: { key: string; x: number; y: number }[];
  shed?: Box; // Mission 1's shed
  buildings?: Box[]; // Mission 2's garage and generator shed
  fence?: Box; // Mission 2's estate fence: its yard keeps the house-yard dressing
  crates?: { x: number; y: number }[];
  layouts?: { crates?: { x: number; y: number }[] }[];
}

const M01 = m01 as unknown as HouseMap;

/**
 * The ground dressing of a house map; Mission 1's by default, which Base 1 shares. The crate spots of every layout and
 * the Base 1 stove are kept clear in both scenes, so the ground looks the same whichever layout is dealt and when the
 * house becomes the base.
 */
export function houseDressing(grid: Grid, extract?: Box, h: HouseMap = M01): Dressing[] {
  const n = grid.size;
  const path = pathTiles(h.map);
  const spots = [...(h.crates ?? []), ...(h.layouts ?? []).flatMap((l) => l.crates ?? [])];
  const used = new Set<number>([...(h === M01 ? [base1.stove] : []), ...spots].map((p) => p.y * n + p.x));
  const blocks = [...(h.shed ? [h.shed] : []), ...(h.buildings ?? [])];
  const dressing = groundDressing(n, {
    keepOut: (x, y) => {
      const i = y * n + x;
      return path.has(i) || used.has(i) || h.map[y]?.[x] === 'q' || inBox(h.roof, x, y) || blocks.some((b) => inBox(b, x, y)) || (extract !== undefined && inBox(extract, x, y));
    },
    noScatter: (x, y) => grid.tiles[y * n + x] !== 0,
    yard: clearingOf(h),
  });
  // flat furniture (the rug) lies on the wood floor, so it is baked in with the ground
  const flat = h.furniture.filter((f) => FLAT_FURNITURE.has(f.key)).map((f) => ({ key: f.key, x: f.x, y: f.y, dx: 0, dy: 0 }));
  return [...dressing, ...flat];
}

/** Furniture that lies flat on the floor; the rest stands upright. */
export const FLAT_FURNITURE: ReadonlySet<string> = new Set(['furn_rug']);

/** An upright house piece at a tile position (fractional for the steps). */
export interface HousePiece {
  key: string;
  x: number;
  y: number;
}

/** How far out of the doorway the steps sit, in tiles: against the wall face, on the outside tile. */
const STEP_OUT = 0.7;
/** How far an upright piece of furniture stands from its tile centre toward its wall, in tiles. */
const TO_WALL = 0.3;

/** The porch steps: just outside the front door, on the side away from the house. */
export function porchSteps(door: { x: number; y: number }, roof: Box): HousePiece {
  const out = [[0, 1], [1, 0], [0, -1], [-1, 0]].find(([dx, dy]) => !inBox(roof, door.x + dx!, door.y + dy!)) ?? [0, 1];
  return { key: 'house_steps', x: door.x + out[0]! * STEP_OUT, y: door.y + out[1]! * STEP_OUT };
}

/** The upright pieces of a house (Mission 1's by default; Base 1 shares it): furniture from the map data and the porch steps. Looks only. */
export function housePieces(h: HouseMap = M01): HousePiece[] {
  const wall = (x: number, y: number) => h.map[y]?.[x] === '#';
  const furniture = h.furniture
    .filter((f) => !FLAT_FURNITURE.has(f.key))
    .map((f) => {
      // the far walls first (-x, -y): a piece seen against them is never hidden behind a wall
      const [dx, dy] = [[-1, 0], [0, -1], [1, 0], [0, 1]].find(([dx, dy]) => wall(f.x + dx!, f.y + dy!)) ?? [0, 0];
      return { key: f.key, x: f.x + dx! * TO_WALL, y: f.y + dy! * TO_WALL };
    });
  return [...furniture, porchSteps(h.frontDoor, h.roof)];
}

/** Where a house map's trees stay small: the house yard, and on an estate everything inside the fence. */
export function clearingOf(h: HouseMap): (x: number, y: number) => boolean {
  return (x, y) => inBox(h.roof, x, y, YARD) || (h.fence !== undefined && inBox(h.fence, x, y, 1));
}

/** Where Mission 1 and Base 1 trees stay small: the house yard. */
export const houseClearing = clearingOf(M01);

/** Where Intro trees stay small: the camp clearing and a step beyond it. */
export const introClearing = (x: number, y: number): boolean => Math.hypot(x - intro.size / 2, y - intro.size / 2) <= intro.clearingRadius + 1;

/** The Intro camp: clear of the path, the tent and the ring around the fire. */
export function introDressing(grid: Grid): Dressing[] {
  const n = grid.size;
  const path = pathTilesOf(intro.path, n);
  const fire = { x: intro.fire.x, y: intro.fire.y, w: 1, h: 1 };
  return groundDressing(n, {
    keepOut: (x, y) => path.has(y * n + x) || inBox(intro.tent, x, y) || inBox(fire, x, y, 1),
    noScatter: (x, y) => grid.tiles[y * n + x] !== 0,
  });
}
