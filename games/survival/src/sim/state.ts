// Game state: plain JSON-serialisable objects (PLAN.md *Fixed technical shape*). Pure TypeScript.
import buildingsData from '../data/buildings.json';
import mapConfig from '../data/map.json';
import jobsData from '../data/jobs.json';
import resourceData from '../data/resources.json';
import wavesData from '../data/waves.json';
import { generateMap, type GameMap, type MapConfig } from './map';
import { makeRng, type RngState } from './rng';
import type { Animal, Wild } from './animals';

export const TICKS_PER_SECOND = 10;
/** How long a death stays in `GameState.fallen`. */
export const FALLEN_TICKS = 100;
/** One in-game day (DESIGN-slice.md conventions). */
export const DAY_TICKS = 1200;

export type Res = 'food' | 'wood' | 'hides' | 'pemmican';
export type Age = 'adult' | 'elder' | 'child';
/** Picks the art model (art/SPEC.md section 4): man or woman, elder man or elder woman; children share one model. */
export type Sex = 'female' | 'male';
export type JobKind = 'gather' | 'hunt' | 'dry' | 'heal' | 'scout' | 'drill' | 'tend' | 'chop' | 'build' | 'haul' | 'fight';
export type Tile2 = [number, number];

export interface Task {
  step: 'idle' | 'walk' | 'work' | 'deliver' | 'flee';
  target: Tile2 | null;
  path: Tile2[];
  /** Idle: ticks to wait before deciding again. Deliver: ticks until the next retry. */
  timer: number;
  /** What to do on arrival at the end of a walk. */
  goal: 'work' | 'deliver' | 'idle' | 'pickup' | 'drop' | 'take' | null;
}

export interface Job {
  kind: JobKind;
  building: number | null;
  tile: Tile2 | null;
  /** A hunter's chosen animal or carcass (`animals.ts`), set by the hunt order or the hunter's own pick. */
  animal?: number | null;
}

export interface Person {
  id: number;
  name: string;
  family: number;
  age: Age;
  /** Set at spawn from the id (`sexForId`); a person saved before it existed reads it with `sexOf`. */
  sex: Sex;
  x: number;
  y: number;
  health: number;
  hunger: number;
  job: Job | null;
  task: Task;
  /** `hides` rides along with a hunter's load of meat (Food). */
  carry: { res: Res; amount: number; hides?: number };
  society: string | null;
  drafted: boolean;
  /** A drafted lancer on a horse (riders upgrade); the horse is part of `horses` and dies with them. */
  mounted: boolean;
  stance: Stance;
  attackTarget: number | null;
  /** The tile a drafted person holds and returns to after a fight. */
  post: Tile2 | null;
  home: number | null;
  cooldown: number;
}

export interface Enemy {
  id: number;
  kind: string;
  x: number;
  y: number;
  hp: number;
  cooldown: number;
  /** Below `fleeBelow` of its HP a wolf runs for the nearest map edge. */
  fleeing: boolean;
  /** Index of the wave it belongs to. */
  wave: number;
  /**
   * Barricade pathing (`combat.ts` `moveWolf`): the A* tiles still to walk, the goal tile they lead to and the
   * finished-barricade set they were planned for. Absent while no barricade stands in the way.
   */
  path?: Tile2[];
  goal?: Tile2;
  walls?: string;
  /** The barricade a wolf with no way round is breaking, or null. */
  siege?: number | null;
}

/** A called spirit warrior or guardian wolf (`allies.ts`): fights wolves for a while, then vanishes. Not saved on purpose. */
export interface Ally {
  id: number;
  kind: 'spirit' | 'guardian';
  x: number;
  y: number;
  hp: number;
  cooldown: number;
  /** The tick it vanishes. */
  expires: number;
}

/** A running bison herd or storm (`effects.ts`); not saved on purpose. */
export interface PowerEffect {
  id: number;
  kind: 'bison' | 'storm';
  /** Storm: its centre. Bison: where the herd is now. */
  x: number;
  y: number;
  /** Bison: the unit step direction (storms stand still). */
  dx: number;
  dy: number;
  /** The tick it ends. */
  expires: number;
  /** Bison: ids of the wolves already hurt, so each is hit once. */
  hit: number[];
}

export type Edge ='north' | 'east' | 'south';

/** Run-time progress of one wave from `waves.json`. */
export interface WaveRun {
  phase: 'pending' | 'warning' | 'active' | 'defeated';
  edge: Edge | null;
  /** Middle of the spawn segment along the chosen edge. */
  centre: number;
  /** A second edge and segment for waves that come from two sides at once (absent in older saves). */
  edge2?: Edge | null;
  centre2?: number;
  /** True when a staffed scouts' lodge gave the early warning, so the banner shows the count. */
  scouted: boolean;
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
  /** Ticks a horse corral has been tended since its last foal (`tend` job, `stepCorrals`). */
  tended: number;
  /**
   * The id of the first site of a dragged barricade line, on every segment of it: builders finishing one segment go
   * on to the next unfinished one (DESIGN-hunting.md `## Villager panel and building`). Not written to saves.
   */
  lineId?: number;
}

export type Stance = 'hold' | 'defend' | 'chase';

/** Orders applied at the start of the next tick (`orders.ts`). */
export type Order =
  | { type: 'move'; ids: number[]; to: Tile2 }
  | { type: 'attack'; ids: number[]; enemy: number }
  | { type: 'hunt'; ids: number[]; animal: number }
  | { type: 'assign'; ids: number[]; job: 'gather' | 'chop'; tile: Tile2 }
  | { type: 'assign'; ids: number[]; building: number }
  | { type: 'draft'; ids: number[]; on: boolean }
  | { type: 'stance'; ids: number[]; stance: Stance }
  /**
   * `builders`: the selection when the card was picked; up to 3 able ones build the (first) site at once.
   * `line`: further segments of a dragged line after `at`, placed in order and linked by `lineId`.
   */
  | { type: 'place'; building: string; at: Tile2; builders?: number[]; line?: Tile2[] }
  | { type: 'cancel'; building: number }
  | { type: 'speed'; value: 1 | 2 | 4 }
  | { type: 'pause'; on: boolean }
  | { type: 'buy'; upgrade: string }
  | { type: 'cast'; power: string; at?: Tile2 };

export interface GameState {
  seed: number;
  tick: number;
  rng: RngState;
  map: GameMap;
  /** Bumped when a map tile changes type (a forest tile cut down), so the view can redraw it. */
  mapVersion: number;
  people: Person[];
  buildings: Building[];
  enemies: Enemy[];
  /** Called allies; absent in a file saved before they existed, so read it with `alliesOf`. */
  allies: Ally[];
  /** Running bison herds and storms; absent in an older file, so read it with `effectsOf`. */
  effects: PowerEffect[];
  waves: WaveRun[];
  /** Wild game and carcasses (DESIGN-hunting.md `## Wild game`); absent in an older state, so read it with `animalsOf`. */
  animals?: Animal[];
  /** The herds' random stream and ids; absent in an older state, so read it with `wildOf`. */
  wild?: Wild;
  /**
   * People who died in the last `FALLEN_TICKS` ticks, so the view can play their death (art/SPEC.md section 4) and
   * tell it from leaving the camp. Absent in an older state; not written to saves.
   */
  fallen?: { id: number; tick: number }[];
  /** Set once the run ends; the tick loop stops advancing. */
  result: 'won' | 'lost' | null;
  /** Tiles covered by a building footprint, indexed like `map.tiles`. */
  blocked: boolean[];
  store: Record<Res, number>;
  /** The camp's unity meter, 0..100 (`## Wotakuye`). */
  wotakuye: number;
  /** Gift value, earned daily from Wotakuye and spent on upgrades (`DESIGN-upgrades.md`). */
  gift: number;
  /** Ids of the bought upgrades (`upgrades.ts`). */
  upgrades: string[];
  /** Horses in the camp (DESIGN-upgrades-3.md `## Horses and riders`): no store, capped by the corrals. */
  horses: number;
  /** Power upgrade ids cast since the last wave warning started (`upgrades.ts` `castPower`). */
  powersUsed: string[];
  orders: Order[];
  /** Playback, set by the `speed` and `pause` orders; the Game scene decides how many ticks to run. */
  speed: 1 | 2 | 4;
  paused: boolean;
  /** The last 5 toast messages. */
  messages: { tick: number; text: string }[];
  nextPersonId: number;
  nextBuildingId: number;
  nextEnemyId: number;
}

export const START_STORE: Record<Res, number> = {
  food: resourceData.resources.food.start,
  wood: resourceData.resources.wood.start,
  hides: resourceData.resources.hides.start,
  pemmican: resourceData.resources.pemmican.start,
};
const TYPES = buildingsData.types as unknown as Record<string, { size: Tile2; hp?: number; houses?: number; caps?: Record<Res, number> }>;
export const TIPI_BEDS = TYPES.tipi.houses!;

/** Tiles of a footprint placed by its top-left tile: 2x2 unless `size` says otherwise (traps and pits are 1x1). */
export function footprint(x: number, y: number, size: Tile2 = [2, 2]): Tile2[] {
  const out: Tile2[] = [];
  for (let dy = 0; dy < size[1]; dy++) for (let dx = 0; dx < size[0]; dx++) out.push([x + dx, y + dy]);
  return out;
}

/** The footprint of a building type placed at its top-left tile. */
export const footprintOf = (type: string, x: number, y: number): Tile2[] => footprint(x, y, TYPES[type]?.size);

export function addBuilding(s: GameState, type: string, x: number, y: number, done: boolean): Building {
  const b: Building = {
    id: s.nextBuildingId++, type, x, y, done, built: 0, delivered: {}, workers: [], residents: [],
    tended: 0, hp: TYPES[type]?.hp ?? null,
  };
  s.buildings.push(b);
  for (const [tx, ty] of footprintOf(type, x, y)) s.blocked[ty * s.map.size + tx] = true;
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
    enemies: [],
    allies: [],
    effects: [],
    waves: wavesData.waves.map(() => ({ phase: 'pending' as const, edge: null, centre: 0, scouted: false })),
    result: null,
    blocked: new Array(map.size * map.size).fill(false),
    store: { ...START_STORE },
    wotakuye: resourceData.wotakuye.start,
    gift: 0,
    upgrades: [],
    horses: 0,
    powersUsed: [],
    orders: [],
    speed: 1,
    paused: false,
    messages: [],
    nextPersonId: 1,
    nextBuildingId: 1,
    nextEnemyId: 1,
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

/** Horses nobody is riding: the herd minus the mounted lancers. */
export function freeHorses(s: Pick<GameState, 'horses' | 'people'>): number {
  return s.horses - s.people.filter((p) => p.mounted).length;
}

/** How many horses the corrals hold at most: 6 for each finished corral. */
export function horseCap(s: Pick<GameState, 'buildings'>): number {
  return s.buildings.filter((b) => b.type === 'horse_corral' && b.done).length * jobsData.jobs.tend.capPerCorral;
}
