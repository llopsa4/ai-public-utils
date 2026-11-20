// Combat (DESIGN-slice.md `## Combat`): drafted people fight by stance, wolves hunt the nearest person,
// everyone else flees to the fire. Pure TypeScript, no Phaser. Wolves walk in straight lines.
import buildingsData from '../data/buildings.json';
import enemyData from '../data/enemies.json';
import jobsData from '../data/jobs.json';
import upgradeData from '../data/upgrades.json';
import { removeBuilding, ringSpot } from './buildings';
import { ages, beginWalk, idleTask, movePerson, walkable } from './people';
import { rngNext } from './rng';
import { addMessage, type Enemy, type GameState, type Person, type Tile2 } from './state';
import { hasUpgrade } from './upgrades';

export interface Fighter {
  range: number;
  damage: number;
  cooldown: number;
  accuracy: number;
  sight: number;
}

interface EnemyDef {
  hp: number;
  range: number;
  damage: number;
  cooldown: number;
  accuracy: number;
  speed: number;
  sight: number;
  fleeBelow: number;
  fleeSpeed?: number;
}

const FIGHTERS = enemyData.fighters as Record<string, Fighter & { society?: string }>;
export const ENEMIES = enemyData.enemies as Record<string, EnemyDef>;
const STANCES = enemyData.stances;
const FLEE = jobsData.flee;
const FLEE_SPEED = 0.2;

/**
 * A drafted hunter or archer shoots a bow (the bows and dogs upgrades apply to both), a lancer thrusts a
 * lance, any other drafted adult swings a club.
 */
export function fighterOf(s: GameState, p: Person): Fighter {
  if (p.society === FIGHTERS.lancer.society) return FIGHTERS.lancer;
  const base = p.society === FIGHTERS.bow.society ? FIGHTERS.bow : p.society === FIGHTERS.archer.society ? FIGHTERS.archer : null;
  if (!base) return FIGHTERS.club;
  const bow = { ...base };
  if (hasUpgrade(s, 'bows')) {
    bow.range = upgradeData.upgrades.bows.bowRange;
    bow.damage = upgradeData.upgrades.bows.bowDamage;
  }
  if (hasUpgrade(s, 'dogs')) bow.accuracy += upgradeData.upgrades.dogs.bowAccuracy;
  return bow;
}

export function enemyById(s: GameState, id: number | null): Enemy | undefined {
  return id === null ? undefined : s.enemies.find((e) => e.id === id);
}

function fireCentre(s: GameState): Tile2 {
  return [s.map.fire[0] + 1, s.map.fire[1] + 1];
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** Walks straight toward a point, one tile of speed per tick at most; stays put when the way is shut. */
function stepStraight(s: GameState, p: Person, x: number, y: number): void {
  const d = dist(p, { x, y });
  if (d < 1e-9) return;
  const k = Math.min(1, ages[p.age].speed / d);
  const nx = p.x + (x - p.x) * k;
  const ny = p.y + (y - p.y) * k;
  if (walkable(s, Math.round(nx), Math.round(ny))) {
    p.x = nx;
    p.y = ny;
  }
}

/** The enemy a drafted person should fight now: an explicit order first, else by stance. */
function pickTarget(s: GameState, p: Person, f: Fighter): Enemy | null {
  const ordered = enemyById(s, p.attackTarget);
  if (ordered) return ordered;
  p.attackTarget = null;
  const fire = fireCentre(s);
  let best: Enemy | null = null;
  let bestD = Infinity;
  for (const e of s.enemies) {
    const d = dist(p, e);
    // A wolf already running away is only worth a shot when it is within reach.
    if (e.fleeing && d > f.range) continue;
    const ok =
      p.stance === 'hold' ? d <= f.range
      : p.stance === 'defend' ? dist(e, { x: fire[0], y: fire[1] }) <= STANCES.defendRadius
      : d <= STANCES.chaseSight;
    if (ok && d < bestD) {
      best = e;
      bestD = d;
    }
  }
  return best;
}

function sameTile(a: Tile2 | null, b: Tile2): boolean {
  return !!a && a[0] === b[0] && a[1] === b[1];
}

/**
 * A drafted person's turn. Returns true when they fought or closed in this tick; false lets the
 * normal walk/idle code run (walking to a `move` order, or back to their post).
 */
export function stepFighter(s: GameState, p: Person): boolean {
  const f = fighterOf(s, p);
  const target = pickTarget(s, p, f);
  if (!target) {
    const post = p.post;
    if (post && dist(p, { x: post[0], y: post[1] }) > 0.6 && !(p.task.step === 'walk' && sameTile(p.task.target, post))) {
      beginWalk(s, p, post, 'idle');
    }
    return false;
  }
  const d = dist(p, target);
  if (d <= f.range) {
    if (p.task.step === 'walk') p.task = idleTask();
    if (p.cooldown <= 0) {
      if (rngNext(s.rng) < f.accuracy) target.hp -= f.damage;
      p.cooldown = f.cooldown;
    }
    return true;
  }
  if (p.stance === 'hold' && p.attackTarget === null) return false;
  const tile: Tile2 = [Math.round(target.x), Math.round(target.y)];
  const near = p.task.step === 'walk' && p.task.target && Math.hypot(p.task.target[0] - tile[0], p.task.target[1] - tile[1]) <= 2;
  if (!near && !beginWalk(s, p, tile, 'idle')) {
    stepStraight(s, p, target.x, target.y);
    return true;
  }
  if (movePerson(s, p) === 'blocked') p.task = idleTask();
  return true;
}

/** The nearest map edge point from a position. */
function edgePoint(size: number, e: Enemy): Tile2 {
  const n = size - 1;
  const opts: [number, Tile2][] = [
    [e.x, [0, e.y]], [n - e.x, [n, e.y]], [e.y, [e.x, 0]], [n - e.y, [e.x, n]],
  ];
  return opts.reduce((a, b) => (b[0] < a[0] ? b : a))[1];
}

function enemyStep(e: Enemy, speed: number, x: number, y: number): void {
  const d = Math.hypot(x - e.x, y - e.y);
  if (d <= speed) {
    e.x = x;
    e.y = y;
  } else {
    e.x += ((x - e.x) / d) * speed;
    e.y += ((y - e.y) / d) * speed;
  }
}

const DEFENCE = buildingsData.types as unknown as Record<string, { defence?: Record<string, number> }>;

/** A finished trap takes the first wolf standing on it: 25 damage, then the trap is gone (DESIGN-upgrades-2.md). */
function springTraps(s: GameState): void {
  const { trapRadius, trapDamage } = DEFENCE.trap.defence!;
  for (const trap of s.buildings.filter((b) => b.type === 'trap' && b.done)) {
    const victim = s.enemies.find((e) => e.hp > 0 && Math.hypot(e.x - trap.x, e.y - trap.y) <= trapRadius);
    if (!victim) continue;
    victim.hp -= trapDamage;
    removeBuilding(s, trap.id);
    addMessage(s, 'A trap sprang on a wolf.');
  }
}

/** 0.5 for a wolf within 3 tiles of any finished fire pit (pits do not stack), else 1. */
function pitSlow(s: GameState, e: Enemy): number {
  const { slowRadius, slow } = DEFENCE.fire_pit.defence!;
  return s.buildings.some((b) => b.type === 'fire_pit' && b.done && Math.hypot(e.x - b.x, e.y - b.y) <= slowRadius) ? slow : 1;
}

/** One tick for every wolf: flee, bite the nearest person in sight, or head for the fire. */
export function stepEnemies(s: GameState): void {
  const gone = new Set<number>();
  s.enemies = s.enemies.filter((e) => e.hp > 0); // shot dead earlier this tick
  springTraps(s);
  s.enemies = s.enemies.filter((e) => e.hp > 0); // a trap may have killed one
  for (const e of s.enemies) {
    const def = ENEMIES[e.kind];
    const slow = pitSlow(s, e);
    if (e.cooldown > 0) e.cooldown--;
    if (!e.fleeing && e.hp < def.hp * def.fleeBelow) e.fleeing = true;
    if (e.fleeing) {
      const [ex, ey] = edgePoint(s.map.size, e);
      enemyStep(e, (def.fleeSpeed ?? FLEE_SPEED) * slow, ex, ey);
      if (e.x <= 0 || e.y <= 0 || e.x >= s.map.size - 1 || e.y >= s.map.size - 1) gone.add(e.id);
      continue;
    }
    let target: Person | null = null;
    let best = Infinity;
    for (const p of s.people) {
      const d = dist(p, e);
      if (d <= def.sight && d < best) {
        target = p;
        best = d;
      }
    }
    if (!target) {
      const [fx, fy] = fireCentre(s);
      if (Math.hypot(fx - e.x, fy - e.y) > 2) enemyStep(e, def.speed * slow, fx, fy);
      continue;
    }
    if (best <= def.range) {
      if (e.cooldown <= 0) {
        if (rngNext(s.rng) < def.accuracy) target.health -= def.damage;
        e.cooldown = def.cooldown;
      }
    } else {
      enemyStep(e, def.speed * slow, target.x, target.y);
    }
  }
  s.enemies = s.enemies.filter((e) => e.hp > 0 && !gone.has(e.id));
}

function nearestEnemyDist(s: GameState, p: Person): number {
  let best = Infinity;
  for (const e of s.enemies) best = Math.min(best, dist(p, e));
  return best;
}

/**
 * Undrafted people run to the fire when a wolf comes within `triggerDist`, and go back to work
 * `resumeTicks` after no wolf is within `safeDist`. Returns true while they are fleeing.
 */
export function stepFlee(s: GameState, p: Person): boolean {
  const near = nearestEnemyDist(s, p);
  if (p.task.step !== 'flee') {
    if (near > FLEE.triggerDist) return false;
    const fire = s.buildings.find((b) => b.type === 'fire');
    const spot = fire && ringSpot(s, p, fire);
    if (!spot || !beginWalk(s, p, spot, 'idle')) return false;
    p.task.step = 'flee';
    p.task.timer = FLEE.resumeTicks;
    return true;
  }
  if (near <= FLEE.safeDist) p.task.timer = FLEE.resumeTicks;
  else if (--p.task.timer <= 0) {
    p.task = idleTask();
    return false;
  }
  if (p.task.path.length > 0 && movePerson(s, p) !== 'moving') p.task.path = [];
  return true;
}
