// Game state: plain JSON-serialisable objects (PLAN.md *Fixed technical shape*). Pure TypeScript.
import buildingsData from '../data/buildings.json';
import mapConfig from '../data/map.json';
import resourceData from '../data/resources.json';
import { generateMap, type GameMap, type MapConfig } from './map';
import { makeRng, type RngState } from './rng';

export const TICKS_PER_SECOND = 10;
/** One in-game day (DESIGN-slice.md conventions). */
export const DAY_TICKS = 1200;

export type Res = 'food' | 'wood' | 'hides';
export type Age = 'adult' | 'elder' | 'child';
export type JobKind = 'gather' | 'hunt' | 'chop' | 'build' | 'haul' | 'fight';
export type Tile2 = [number, number];

export interface Task {
  step: 'idle' | 'walk' | 'work' | 'deliver';
  target: Tile2 | null;
  path: Tile2[];
  /** Idle: ticks to wait before deciding again. Deliver: ticks until the next retry. */
  timer: number;
  /** What to do on arrival at the end of a walk. */
  goal: 'work' | 'deliver' | 'idle' | 'pickup' | 'drop' | null;
}

export interface Job {
  kind: JobKind;
  building: number | null;
  tile: Tile2 | null;
}

export interface Person {
  id: number;
  name: string;
  family: number;
  age: Age;
  x: number;
  y: number;
  health: number;
  hunger: number;
  job: Job | null;
  task: Task;
  /** `hides` rides along with a successful hunt's food. */
  carry: { res: Res; amount: number; hides?: number };
  society: string | null;
  drafted: boolean;
  stance: Stance;
  attackTarget: number | null;
  home: number | null;
  cooldown: number;
}

export interface Building {
  id: number;
  type: string;
  x: number;
  y: number;
  done: boolean;
  built: number;
  delivered: Partial<Record<Res, number>>;
  workers: number[];
  residents: number[];
  hp: number | null;
}

export type Stance = 'hold' | 'defend' | 'chase';

/** Orders applied at the start of the next tick (`orders.ts`). `attack` arrives with combat (C6). */
export type Order =
  | { type: 'move'; ids: number[]; to: Tile2 }
  | { type: 'assign'; ids: number[]; job: 'gather' | 'chop'; tile: Tile2 }
  | { type: 'assign'; ids: number[]; building: number }
  | { type: 'draft'; ids: number[]; on: boolean }
  | { type: 'stance'; ids: number[]; stance: Stance }
  | { type: 'place'; building: string; at: Tile2 }
  | { type: 'cancel'; building: number }
  | { type: 'speed'; value: 1 | 2 | 4 }
  | { type: 'pause'; on: boolean };

export interface GameState {
  seed: number;
  tick: number;
  rng: RngState;
  map: GameMap;
  /** Bumped when a map tile changes type (a forest tile cut down), so the view can redraw it. */
  mapVersion: number;
  people: Person[];
  buildings: Building[];
  /** Tiles covered by a building footprint, indexed like `map.tiles`. */
  blocked: boolean[];
  store: Record<Res, number>;
  /** The camp's unity meter, 0..100 (`## Wotakuye`). */
  wotakuye: number;
  orders: Order[];
  /** Playback, set by the `speed` and `pause` orders; the Game scene decides how many ticks to run. */
  speed: 1 | 2 | 4;
  paused: boolean;
  /** The last 5 toast messages. */
  messages: { tick: number; text: string }[];
  nextPersonId: number;
  nextBuildingId: number;
}

export const START_STORE: Record<Res, number> = {
  food: resourceData.resources.food.start,
  wood: resourceData.resources.wood.start,
  hides: resourceData.resources.hides.start,
};
const TYPES = buildingsData.types as unknown as Record<string, { hp?: number; houses?: number; caps?: Record<Res, number> }>;
export const TIPI_BEDS = TYPES.tipi.houses!;

/** Tiles of a 2x2 footprint placed by its top-left tile. */
export function footprint(x: number, y: number): Tile2[] {
  return [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
}

export function addBuilding(s: GameState, type: string, x: number, y: number, done: boolean): Building {
  const b: Building = {
    id: s.nextBuildingId++, type, x, y, done, built: 0, delivered: {}, workers: [], residents: [],
    hp: TYPES[type]?.hp ?? null,
  };
  s.buildings.push(b);
  for (const [tx, ty] of footprint(x, y)) s.blocked[ty * s.map.size + tx] = true;
  return b;
}

/** A state with the map, the fire and the prebuilt buildings but nobody in it yet. */
export function createState(seed: number): GameState {
  const map = generateMap(seed, mapConfig as MapConfig);
  const s: GameState = {
    seed,
    tick: 0,
    rng: makeRng((seed ^ 0x9e3779b9) >>> 0),
    map,
    mapVersion: 0,
    people: [],
    buildings: [],
    blocked: new Array(map.size * map.size).fill(false),
    store: { ...START_STORE },
    wotakuye: resourceData.wotakuye.start,
    orders: [],
    speed: 1,
    paused: false,
    messages: [],
    nextPersonId: 1,
    nextBuildingId: 1,
  };
  addBuilding(s, 'fire', map.fire[0], map.fire[1], true);
  for (const b of map.prebuilt) addBuilding(s, b.type, b.at[0], b.at[1], true);
  return s;
}

export function addMessage(s: GameState, text: string): void {
  s.messages.push({ tick: s.tick, text });
  if (s.messages.length > 5) s.messages.shift();
}

/** Total store capacity of a resource: the sum over completed stores. */
export function storeCap(s: GameState, res: Res): number {
  return s.buildings.filter((b) => b.type === 'store' && b.done).length * TYPES.store.caps![res];
}
