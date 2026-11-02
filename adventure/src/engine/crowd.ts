import type { Facing, Point } from './types';

/** What a background person does at a station (each maps to a sheet tag and an effect). */
export type Task = 'stand' | 'work' | 'carry' | 'reach' | 'sit' | 'sweep' | 'tap';

/** A place in the room where someone does something for a while. */
export interface Station {
  id: string;
  x: number;
  y: number;
  face: Facing;
  task: Task;
  /** Milliseconds spent there, picked at random in [min, max]. */
  wait: [number, number];
}

/** A doorway out of the room: walk to (x, y), then on to `out`, and vanish. */
export interface Exit { id: string; x: number; y: number; out: Point }

export interface Routine {
  /** Stations visited in order, looping. */
  stations: string[];
  /** Chance (0..1) of a short wander before the next station. */
  detour?: number;
  /** Sometimes leaves through a doorway and comes back after `away` ms. */
  leave?: { exit: string; chance: number; away: [number, number] };
}

export type Step =
  | { kind: 'go'; station: Station; wait: number }
  | { kind: 'detour'; to: Point; wait: number }
  | { kind: 'leave'; exit: Exit; away: number; forever: boolean };

/** Rectangle detours are picked from (the scene clamps the point to the walkable floor). */
export interface WanderBox { x: number; y: number; w: number; h: number }

export type Rng = () => number;

/** Small deterministic generator for tests (mulberry32). */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rng: Rng, [min, max]: [number, number]) => Math.round(min + (max - min) * rng());

/**
 * One person's routine: an endless loop of stations with random waits, occasional wanders and,
 * for some, trips out of the room. Pure: the scene asks for the next step and carries it out.
 */
export class Schedule {
  private index: number;
  private routine: Routine;
  private leaveForever = false;
  private justDetoured = false;

  constructor(
    routine: Routine,
    private readonly stations: Record<string, Station>,
    private readonly exits: Record<string, Exit>,
    private readonly wander: WanderBox,
    private readonly rng: Rng,
  ) {
    this.routine = routine;
    // Start somewhere in the loop, so a room entered twice doesn't look rewound.
    this.index = Math.floor(rng() * routine.stations.length);
  }

  /** The station the routine is at (or heading to) now. */
  get current(): Station {
    return this.stations[this.routine.stations[this.index % this.routine.stations.length]];
  }

  /** Switches to another routine (the kiln went cold). `leave` sends the person out for good. */
  change(routine: Routine, leave = false): void {
    this.routine = routine;
    this.index = Math.floor(this.rng() * routine.stations.length);
    this.leaveForever = leave;
  }

  next(): Step {
    const r = this.routine;
    if (this.leaveForever && r.leave) return { kind: 'leave', exit: this.exits[r.leave.exit], away: Infinity, forever: true };
    if (r.leave && this.rng() < r.leave.chance) {
      this.justDetoured = false;
      return { kind: 'leave', exit: this.exits[r.leave.exit], away: between(this.rng, r.leave.away), forever: false };
    }
    if (!this.justDetoured && r.detour && this.rng() < r.detour) {
      this.justDetoured = true;
      const b = this.wander;
      return { kind: 'detour', to: { x: Math.round(b.x + b.w * this.rng()), y: Math.round(b.y + b.h * this.rng()) }, wait: between(this.rng, [600, 1800]) };
    }
    this.justDetoured = false;
    this.index = (this.index + 1) % r.stations.length;
    const station = this.current;
    return { kind: 'go', station, wait: between(this.rng, station.wait) };
  }
}

/** Stations closer than `radius` to any of the points (the places Mara walks to). */
export function tooClose(stations: Station[], points: Point[], radius: number): { station: string; point: Point }[] {
  const out: { station: string; point: Point }[] = [];
  for (const s of stations) for (const p of points) if (Math.hypot(s.x - p.x, s.y - p.y) < radius) out.push({ station: s.id, point: p });
  return out;
}
