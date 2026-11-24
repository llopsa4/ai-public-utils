// Enemy AI (DESIGN §7): zombie and human-guard state machines, plus path walking shared by all units.
import enemies from '../data/enemies.json';
import { TICK_HZ } from './time';
import { face, fire, type Weapon } from './combat';
import { type Grid, isBlocked } from './grid';
import { type Noise, emitNoise, pickNoise } from './noise';
import { type Pt, findPath, nearestFree } from './path';
import { rngInt } from './rng';
import { type Mode, type Viewer, ADJACENT, dist, isLow, moveMode, seeSurvivor, seesPoint } from './vision';
import type { Enemy, MissionState, Survivor } from './mission';

export type AiMode = 'wander' | 'investigate' | 'chase' | 'patrol' | 'alert' | 'search' | 'body';

export interface AiState {
  mode: AiMode;
  target: string | null; // survivor id while chasing / alert
  goal: Pt | null; // investigate or body destination
  lastSeen: [number, number] | null;
  lastSeenTick: number;
  timer: number; // ticks: wander pause or search time left
  waypoint: number; // patrol index
  spot: Record<string, number>; // human far-half spotting, ticks per survivor
  alarmed: boolean; // human raised the alarm in this alert
  /** Zombie only, looks only: walking within `reachRadius` of what it goes for, so it reaches out (DESIGN §7). */
  near: boolean;
}

const Z = enemies.zombie;
const H = enemies.human;
/** Chasers recompute their route this often (ticks). */
export const REPATH = 5;
const BITE: Weapon = { range: ADJACENT, damage: Z.bite.damage, noise: 0, cooldown: Z.bite.cooldown, act: 'bite' };
const GUN: Weapon = { ...H.gun, act: 'shot' };

export function newAi(kind: 'zombie' | 'human'): AiState {
  return {
    mode: kind === 'zombie' ? 'wander' : 'patrol',
    target: null,
    goal: null,
    lastSeen: null,
    lastSeenTick: 0,
    timer: 0,
    waypoint: 0,
    spot: {},
    alarmed: false,
    near: false,
  };
}

/**
 * True when a zombie that is not chasing is within `reachRadius` tiles of one of `points` (its goal, a
 * survivor, a blocker it will chew). A chaser already lurches arms-out, so it is never "near" here.
 */
export function nearTarget(e: { x: number; y: number; ai: AiState }, points: readonly (readonly [number, number])[]): boolean {
  if (e.ai.mode === 'chase' || e.ai.mode === 'alert') return false;
  return points.some((p) => dist(e.x, e.y, p[0], p[1]) <= Z.reachRadius);
}

/** Walks along `u.path` for one tick at `speed` tiles/s; returns the distance moved. */
export function walkPath(
  g: Grid,
  u: { x: number; y: number; path: Pt[]; facing: [number, number] },
  speed: number,
  extraBlocked?: ReadonlySet<number>,
): number {
  let budget = speed / TICK_HZ;
  let moved = 0;
  while (budget > 1e-9 && u.path.length > 0) {
    const [wx, wy] = u.path[0]!;
    if (isBlocked(g, wx, wy) || (extraBlocked?.has(wy * g.size + wx) ?? false)) {
      u.path = [];
      break;
    }
    const dx = wx - u.x;
    const dy = wy - u.y;
    const d = Math.hypot(dx, dy);
    if (d > 1e-9) u.facing = [dx / d, dy / d];
    if (d <= budget) {
      u.x = wx;
      u.y = wy;
      u.path.shift();
      budget -= d;
      moved += d;
    } else {
      u.x += (dx / d) * budget;
      u.y += (dy / d) * budget;
      moved += budget;
      budget = 0;
    }
  }
  return moved;
}

/** A* route from a unit to a point; an unreachable goal gives an empty route. */
export function route(g: Grid, u: { x: number; y: number }, to: readonly [number, number]): Pt[] {
  let dest: Pt = [Math.round(to[0]), Math.round(to[1])];
  if (isBlocked(g, dest[0], dest[1])) dest = nearestFree(g, dest, new Set()) ?? dest;
  return findPath(g, [Math.round(u.x), Math.round(u.y)], dest) ?? [];
}

/**
 * What an enemy looks with. A human has a cone. A zombie has no cone (DESIGN §7): it senses all
 * round within `sight.radius` tiles, or `sight.crouchRadius` when the target is crouched or crawling.
 */
export function enemyViewer(e: Enemy, target?: Mode): Viewer {
  if (e.side === 'zombie') {
    const range = target !== undefined && isLow(target) ? Z.sight.crouchRadius : Z.sight.radius;
    return { x: e.x, y: e.y, facing: e.facing, range, angle: 360 };
  }
  return { x: e.x, y: e.y, facing: e.facing, range: H.vision.range, angle: H.vision.angle };
}

const farTicks = (): number => Math.round(H.farSpot * TICK_HZ);

/** Whether an enemy currently sees a survivor (no side effects; for takedown checks). */
export function enemySees(s: MissionState, e: Enemy, u: Survivor): boolean {
  if (e.hp <= 0 || u.hp <= 0) return false;
  const human = e.side === 'human';
  const mode = moveMode(u);
  const z = seeSurvivor(s.grid, enemyViewer(e, mode), { x: u.x, y: u.y, mode }, human);
  if (z === 'none') return false;
  if (z === 'near' || !human) return true;
  return (e.ai.mode === 'alert' && e.ai.target === u.id) || (e.ai.spot[u.id] ?? 0) >= farTicks();
}

/** Nearest survivor this enemy sees this tick; humans build up far-half spotting time here. */
function perceive(s: MissionState, e: Enemy): Survivor | null {
  const human = e.side === 'human';
  let best: Survivor | null = null;
  let bd = Infinity;
  for (const u of s.survivors) {
    if (u.hp <= 0) continue;
    const mode = moveMode(u);
    const z = seeSurvivor(s.grid, enemyViewer(e, mode), { x: u.x, y: u.y, mode }, human);
    if (z === 'none') {
      e.ai.spot[u.id] = 0;
      continue;
    }
    if (human && z === 'far' && !(e.ai.mode === 'alert' && e.ai.target === u.id)) {
      e.ai.spot[u.id] = (e.ai.spot[u.id] ?? 0) + 1;
      if (e.ai.spot[u.id]! < farTicks()) continue;
    }
    const d = dist(e.x, e.y, u.x, u.y);
    if (d < bd) {
      bd = d;
      best = u;
    }
  }
  return best;
}

function sameTile(a: Pt | null, b: Pt): boolean {
  return !!a && a[0] === b[0] && a[1] === b[1];
}

function repathTo(s: MissionState, e: Enemy, to: readonly [number, number]): void {
  if (e.path.length === 0 || s.tick % REPATH === 0) e.path = route(s.grid, e, to);
}

function investigate(s: MissionState, e: Enemy, n: Noise): void {
  const goal: Pt = [Math.round(n.x), Math.round(n.y)];
  if (e.ai.mode === 'investigate' && sameTile(e.ai.goal, goal)) return;
  e.ai.mode = 'investigate';
  e.ai.goal = goal;
  e.path = route(s.grid, e, goal);
}

function survivorById(s: MissionState, id: string | null): Survivor | undefined {
  return s.survivors.find((u) => u.id === id);
}

export function stepEnemy(s: MissionState, e: Enemy, heard: readonly Noise[]): void {
  if (e.hp <= 0) return;
  if (e.cooldown > 0) e.cooldown--;
  if (e.side === 'zombie') {
    stepZombie(s, e, heard);
    const points: (readonly [number, number])[] = s.survivors.filter((u) => u.hp > 0).map((u) => [u.x, u.y]);
    if (e.ai.goal) points.push(e.ai.goal);
    e.ai.near = nearTarget(e, points);
  } else stepHuman(s, e, heard);
}

// Zombie: wanders; walks to any noise it hears; chases a survivor it sees; bites when adjacent;
// loses track after `loseTrack` seconds out of sight. Ignores bodies.
function stepZombie(s: MissionState, e: Enemy, heard: readonly Noise[]): void {
  const ai = e.ai;
  const seen = perceive(s, e);
  if (seen) {
    ai.mode = 'chase';
    ai.target = seen.id;
    ai.lastSeen = [seen.x, seen.y];
    ai.lastSeenTick = s.tick;
  }
  if (ai.mode === 'chase') {
    const t = survivorById(s, ai.target);
    if (!t || t.hp <= 0 || s.tick - ai.lastSeenTick > Z.loseTrack * TICK_HZ) {
      ai.mode = 'wander';
      ai.target = null;
      ai.timer = 0;
      e.path = [];
    } else {
      if (seen === t && dist(e.x, e.y, t.x, t.y) <= ADJACENT) {
        e.path = [];
        face(e, t.x, t.y);
        fire(s, e, BITE, t);
        return;
      }
      repathTo(s, e, seen === t ? [t.x, t.y] : ai.lastSeen!);
      walkPath(s.grid, e, Z.speed.chase);
      return;
    }
  }
  const n = pickNoise(heard, e.id, e.x, e.y, Z.hears);
  if (n) investigate(s, e, n);
  if (ai.mode === 'investigate') {
    walkPath(s.grid, e, Z.speed.investigate);
    if (e.path.length === 0) {
      ai.mode = 'wander';
      ai.goal = null;
      ai.timer = Z.wanderPause * TICK_HZ;
    }
    return;
  }
  if (e.path.length === 0) {
    if (ai.timer > 0) ai.timer--;
    else {
      const r = Z.wanderRadius;
      const to: Pt = [Math.round(e.x) + rngInt(s.rng, -r, r), Math.round(e.y) + rngInt(s.rng, -r, r)];
      e.path = route(s.grid, e, [Math.min(Math.max(to[0], 0), s.grid.size - 1), Math.min(Math.max(to[1], 0), s.grid.size - 1)]);
      ai.timer = Z.wanderPause * TICK_HZ;
    }
  }
  walkPath(s.grid, e, Z.speed.wander);
}

function startSearch(e: Enemy): void {
  e.ai.mode = 'search';
  e.ai.timer = H.search * TICK_HZ;
  e.ai.target = null;
  e.ai.goal = null;
  e.path = [];
}

// Human guard: patrols; near half of the cone sees anyone, far half only standing survivors after
// `farSpot` s. Seeing a survivor → alert: raise the alarm once and shoot. Hears shots and alarms →
// goes to look. Sees a dead human → walks to the body and searches.
function stepHuman(s: MissionState, e: Enemy, heard: readonly Noise[]): void {
  const ai = e.ai;
  const seen = perceive(s, e);
  if (seen) {
    ai.mode = 'alert';
    ai.target = seen.id;
    ai.lastSeen = [seen.x, seen.y];
    ai.lastSeenTick = s.tick;
    if (!ai.alarmed) {
      emitNoise(s, e.x, e.y, H.alarm, 'alarm', e.id);
      ai.alarmed = true;
    }
  }
  if (ai.mode === 'alert') {
    const t = survivorById(s, ai.target);
    if (!t || t.hp <= 0 || s.tick - ai.lastSeenTick > H.loseTrack * TICK_HZ) startSearch(e);
    else if (seen === t && dist(e.x, e.y, t.x, t.y) <= GUN.range) {
      e.path = [];
      face(e, t.x, t.y);
      fire(s, e, GUN, t);
      return;
    } else {
      repathTo(s, e, seen === t ? [t.x, t.y] : ai.lastSeen!);
      walkPath(s.grid, e, H.speed.alert);
      return;
    }
  }

  if (ai.mode !== 'body') {
    const v = enemyViewer(e);
    const b = s.bodies.find((b) => b.side === 'human' && !b.found && b.carriedBy === null && seesPoint(s.grid, v, b.x, b.y));
    if (b) {
      b.found = true;
      ai.mode = 'body';
      ai.goal = [b.x, b.y];
      e.path = route(s.grid, e, ai.goal);
    }
  }
  if (ai.mode === 'patrol' || ai.mode === 'search' || ai.mode === 'investigate') {
    const n = pickNoise(heard, e.id, e.x, e.y, H.hears);
    if (n) investigate(s, e, n);
  }

  switch (ai.mode) {
    case 'investigate':
    case 'body':
      walkPath(s.grid, e, H.speed.alert);
      if (e.path.length === 0) startSearch(e);
      return;
    case 'search': {
      ai.timer--;
      if (ai.timer > 0 && ai.timer % (H.searchTurn * TICK_HZ) === 0) e.facing = [-e.facing[1], e.facing[0]];
      if (ai.timer <= 0) {
        ai.mode = 'patrol';
        ai.alarmed = false;
      }
      return;
    }
    default:
      patrol(s, e);
  }
}

function patrol(s: MissionState, e: Enemy): void {
  if (e.patrol.length > 0) {
    if (e.path.length === 0) {
      let wp = e.patrol[e.ai.waypoint % e.patrol.length]!;
      if (dist(e.x, e.y, wp[0], wp[1]) < 1e-6) {
        e.ai.waypoint = (e.ai.waypoint + 1) % e.patrol.length;
        wp = e.patrol[e.ai.waypoint]!;
      }
      e.path = route(s.grid, e, wp);
    }
    walkPath(s.grid, e, H.speed.patrol);
    return;
  }
  if (dist(e.x, e.y, e.post.x, e.post.y) > 1e-6) {
    if (e.path.length === 0) e.path = route(s.grid, e, [e.post.x, e.post.y]);
    walkPath(s.grid, e, H.speed.patrol);
  } else e.facing = [...e.post.facing];
}
