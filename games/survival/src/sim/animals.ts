// Wild game (DESIGN-hunting.md `## Wild game`): deer and bison herds that wander, flee when shot, die into
// carcasses and respawn at the map edge. They never attack, and wolves, allies and powers ignore them.
// Pure TypeScript, no Phaser. Herds draw from their own random stream so the camp's rolls stay as they were.
import data from '../data/animals.json';
import upgradeData from '../data/upgrades.json';
import { campCentre } from './map';
import { findGridPath, walkable } from './people';
import { makeRng, rngNext, type RngState } from './rng';
import { seasonal, seasonOf } from './seasons';
import { DAY_TICKS, type GameState, type Tile2 } from './state';
import { hasUpgrade } from './upgrades';

export type AnimalKind = 'deer' | 'bison';

export interface Animal {
  id: number;
  kind: AnimalKind;
  /** Animals of one herd wander together and flee together. */
  herd: number;
  x: number;
  y: number;
  hp: number;
  /** A carcass: dead, holding what is left of its meat and hides. */
  dead: boolean;
  meat: number;
  hides: number;
  /** Ticks of flight left after a shot (0 = calm). */
  fleeing: number;
  /** Tiles still to walk. */
  path: Tile2[];
}

/** The herds' own state: absent in an older state, so read it with `wildOf`. */
export interface Wild {
  rng: RngState;
  nextId: number;
  nextHerd: number;
}

export const ANIMALS = data.kinds as Record<AnimalKind, { hp: number; meat: number; hides: number; wanderSpeed: number; fleeSpeed: number; herd: number }>;
export const ANIMAL_DATA = data;

/** The animals and carcasses; a state from before wild game has none. */
export function animalsOf(s: GameState): Animal[] {
  if (!s.animals) s.animals = [];
  return s.animals;
}

export function wildOf(s: GameState): Wild {
  if (!s.wild) s.wild = { rng: makeRng((s.seed ^ 0x5bd1e995) >>> 0), nextId: 1, nextHerd: 1 };
  return s.wild;
}

export const liveAnimals = (s: GameState): Animal[] => animalsOf(s).filter((a) => !a.dead);
export const carcasses = (s: GameState): Animal[] => animalsOf(s).filter((a) => a.dead && (a.meat > 1e-9 || a.hides > 0));

export function animalById(s: GameState, id: number | null | undefined): Animal | undefined {
  return id == null ? undefined : animalsOf(s).find((a) => a.id === id);
}

/** How far from the fire hunters spot game: 22 tiles, 26 with Hunting dogs. */
export function spottingDistance(s: GameState): number {
  return hasUpgrade(s, 'dogs') ? upgradeData.upgrades.dogs.spotting : data.spotting;
}

const tileOf = (a: { x: number; y: number }): Tile2 => [Math.round(a.x), Math.round(a.y)];

/** Up to `n` distinct walkable tiles round a centre, nearest first. */
function herdTiles(s: GameState, c: Tile2, n: number): Tile2[] {
  const out: Tile2[] = [];
  for (let r = 0; r <= 4 && out.length < n; r++) {
    for (let y = c[1] - r; y <= c[1] + r && out.length < n; y++) {
      for (let x = c[0] - r; x <= c[0] + r && out.length < n; x++) {
        if (Math.max(Math.abs(x - c[0]), Math.abs(y - c[1])) === r && walkable(s, x, y)) out.push([x, y]);
      }
    }
  }
  return out;
}

/** Adds a herd of `kind` round a centre tile; returns how many animals were placed. */
export function addHerd(s: GameState, kind: AnimalKind, centre: Tile2): number {
  const w = wildOf(s);
  const def = ANIMALS[kind];
  const herd = w.nextHerd++;
  const tiles = herdTiles(s, centre, def.herd);
  for (const [x, y] of tiles) {
    animalsOf(s).push({ id: w.nextId++, kind, herd, x, y, hp: def.hp, dead: false, meat: def.meat, hides: def.hides, fleeing: 0, path: [] });
  }
  return tiles.length;
}

/** A random walkable tile matching `ok`, or null after a bounded number of draws. */
function randomTile(s: GameState, ok: (x: number, y: number) => boolean): Tile2 | null {
  const n = s.map.size;
  const r = wildOf(s).rng;
  for (let tries = 0; tries < 400; tries++) {
    const x = Math.floor(rngNext(r) * n);
    const y = Math.floor(rngNext(r) * n);
    if (walkable(s, x, y) && ok(x, y)) return [x, y];
  }
  return null;
}

/** The start herds: 2 of deer and 1 of bison 14-22 tiles from the fire, then 9 more 23-44 tiles out. */
export function spawnStartHerds(s: GameState): void {
  const [cx, cy] = campCentre(s.map);
  const rings: [AnimalKind[], number[]][] = [
    [data.startHerds as AnimalKind[], data.startDist],
    [data.outerHerds as AnimalKind[], data.outerDist],
  ];
  for (const [kinds, [lo, hi]] of rings) {
    for (const kind of kinds) {
      const c = randomTile(s, (x, y) => {
        const d = Math.hypot(x - cx, y - cy);
        return d >= lo && d <= hi;
      });
      if (c) addHerd(s, kind, c);
    }
  }
}

/** A map-edge tile for a new herd. */
function edgeTile(s: GameState): Tile2 | null {
  const n = s.map.size;
  return randomTile(s, (x, y) => x <= 1 || y <= 1 || x >= n - 2 || y >= n - 2);
}

/**
 * At a day start: every 2 days (4 in winter), while fewer than `cap` animals live, a new herd comes in at a map edge
 * with the season's `huntSuccess` as its chance (capped at 1).
 */
function respawn(s: GameState): void {
  if (s.tick === 0 || s.tick % DAY_TICKS !== 0) return;
  const day = s.tick / DAY_TICKS;
  const every = seasonOf(s) === 'winter' ? data.winterRespawnDays : data.respawnDays;
  if (day % every !== 0 || liveAnimals(s).length >= data.cap) return;
  const r = wildOf(s).rng;
  if (rngNext(r) >= Math.min(1, seasonal(s, 'huntSuccess'))) return;
  const kind: AnimalKind = rngNext(r) < data.bisonChance ? 'bison' : 'deer';
  const at = edgeTile(s);
  if (at) addHerd(s, kind, at);
}

function pathTo(s: GameState, a: Animal, to: Tile2): void {
  a.path = findGridPath(s.map.size, (x, y) => walkable(s, x, y), () => 1, [a.x, a.y], to, 2000) ?? [];
}

/** The nearest walkable tile to a point (a flight or wander target off the map or in the river). */
function nearestWalkable(s: GameState, x: number, y: number): Tile2 | null {
  const n = s.map.size;
  const cx = Math.min(n - 1, Math.max(0, Math.round(x)));
  const cy = Math.min(n - 1, Math.max(0, Math.round(y)));
  for (let r = 0; r <= 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && walkable(s, cx + dx, cy + dy)) return [cx + dx, cy + dy];
      }
    }
  }
  return null;
}

/** The herd of a shot animal runs away from the shooter for a while. */
export function startle(s: GameState, a: Animal, from: { x: number; y: number }): void {
  const herd = animalsOf(s).filter((b) => !b.dead && b.herd === a.herd);
  let dx = a.x - from.x;
  let dy = a.y - from.y;
  const d = Math.hypot(dx, dy) || 1;
  dx /= d;
  dy /= d;
  for (const b of herd) {
    b.fleeing = data.fleeTicks;
    const t = nearestWalkable(s, b.x + dx * data.fleeDist, b.y + dy * data.fleeDist);
    if (t) pathTo(s, b, t);
  }
}

/** A shot at an animal: damage, and the herd takes flight; a dead animal becomes a carcass. */
export function hurtAnimal(s: GameState, a: Animal, damage: number, from: { x: number; y: number }): void {
  if (a.dead) return;
  a.hp -= damage;
  if (a.hp <= 0) {
    a.hp = 0;
    a.dead = true;
    a.fleeing = 0;
    a.path = [];
    a.x = Math.round(a.x);
    a.y = Math.round(a.y);
  }
  startle(s, a, from);
}

/** A calm herd picks a new spot within 4 tiles of where it stands, each animal a tile of its own. */
function wander(s: GameState, herd: Animal[]): void {
  const cx = herd.reduce((n, a) => n + a.x, 0) / herd.length;
  const cy = herd.reduce((n, a) => n + a.y, 0) / herd.length;
  const r = wildOf(s).rng;
  const R = data.wanderRadius;
  const c = nearestWalkable(s, cx + (rngNext(r) * 2 - 1) * R, cy + (rngNext(r) * 2 - 1) * R);
  if (!c) return;
  const tiles = herdTiles(s, c, herd.length);
  herd.forEach((a, i) => {
    if (tiles[i]) pathTo(s, a, tiles[i]);
  });
}

function move(s: GameState, a: Animal): void {
  const def = ANIMALS[a.kind];
  let budget = a.fleeing > 0 ? def.fleeSpeed : def.wanderSpeed;
  while (budget > 1e-9 && a.path.length > 0) {
    const [wx, wy] = a.path[0];
    if (!walkable(s, wx, wy)) {
      // A building went up in the way: stop here; the next wander picks a new path.
      a.path = [];
      return;
    }
    const dx = wx - a.x;
    const dy = wy - a.y;
    const d = Math.hypot(dx, dy);
    if (d <= budget) {
      a.x = wx;
      a.y = wy;
      budget -= d;
      a.path.shift();
    } else {
      a.x += (dx / d) * budget;
      a.y += (dy / d) * budget;
      budget = 0;
    }
  }
}

/** One tick of wild game: respawn, wandering, flight, and empty carcasses removed. */
export function stepAnimals(s: GameState): void {
  respawn(s);
  const list = animalsOf(s);
  const herds = new Map<number, Animal[]>();
  for (const a of list) {
    if (a.dead) continue;
    if (!herds.has(a.herd)) herds.set(a.herd, []);
    herds.get(a.herd)!.push(a);
  }
  for (const [id, herd] of herds) {
    const calm = herd.every((a) => a.fleeing === 0 && a.path.length === 0);
    if (calm && (s.tick + id * 53) % data.wanderEvery === 0) wander(s, herd);
  }
  for (const a of list) {
    if (a.dead) continue;
    move(s, a);
    if (a.fleeing > 0) a.fleeing--;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const a = list[i];
    if (a.dead && a.meat <= 1e-9 && a.hides <= 0) list.splice(i, 1);
  }
}

/** Takes the next load off a carcass: up to 10 meat, and all the hides with the first load. */
export function takeLoad(a: Animal): { meat: number; hides: number } {
  const meat = Math.min(data.load, a.meat);
  const hides = a.hides;
  a.meat -= meat;
  a.hides = 0;
  if (a.meat < 1e-9) a.meat = 0;
  return { meat, hides };
}

export { tileOf as animalTile };
