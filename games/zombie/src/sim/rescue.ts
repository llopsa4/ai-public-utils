// The rescue (DESIGN §16 *The rescue*): the scripted beat between Mission 1's "all clear" and the Debrief.
// Six zombies walk out of the treeline toward Cass and Eli, arrows from off-screen kill them (June four,
// Ray two), then Ray and June walk in. Pure TypeScript; the scene plays the lines and draws it. Input is
// locked for the whole phase. The dialogue beats wait for the scene; every other beat runs on `stepRescue`.
import chars from '../data/characters.json';
import enemiesData from '../data/enemies.json';
import { newAi, route, walkPath } from './ai';
import { damage, face, pickUpArrows } from './combat';
import { TREE, inBounds } from './grid';
import { type Enemy, type MissionState, type Survivor, newSurvivor } from './mission';
import { type Pt, findPath, nearestFree } from './path';

/**
 * `ambush`: Eli's first line (scene). `walk`: the six come out and the camera follows them. `alarm`: the rest of
 * `m01Ambush` (scene). `arrows`: one kill every `SHOT_TICKS`. `walkIn`: Ray and June come to Cass and Eli.
 * `talk`: `m01Rescue` (scene). `done`: the Debrief may open.
 */
export type RescueBeat = 'ambush' | 'walk' | 'alarm' | 'arrows' | 'walkIn' | 'talk' | 'done';

export interface Rescue {
  beat: RescueBeat;
  ticks: number; // ticks spent in this beat
  zombies: string[];
  shots: number; // kills made so far
  from: Pt; // where the six came out of the trees (the camera's first target)
}

export const RESCUE_ZOMBIES = 6;
export const RAY = 'hunter';
export const JUNE = 'archer';
/** Who shoots each kill, in order: four for June, two for Ray (the first `m01Rescue` line). */
export const SHOOTERS = [JUNE, JUNE, RAY, JUNE, RAY, JUNE] as const;
const SPAWN_DIST = 10; // tiles from Cass and Eli to the treeline the six come out of
const ARCHER_DIST = 14; // tiles from Cass and Eli to Ray and June: out of the default view
const WALK_TICKS = 30; // the six walk this long before the alarm lines
const SHOT_TICKS = 6; // ticks between kills
const AFTER_TICKS = 10; // a breath after the last kill before Ray and June walk in
const WALK_IN_MAX = 200; // a walk-in that has not arrived by then is finished in place
const ZOMBIE_SPEED = enemiesData.zombie.speed.investigate;

const DIRS: Pt[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

function midpoint(us: readonly { x: number; y: number }[]): Pt {
  const live = us.length ? us : [{ x: 0, y: 0 }];
  return [Math.round(live.reduce((a, u) => a + u.x, 0) / live.length), Math.round(live.reduce((a, u) => a + u.y, 0) / live.length)];
}

function along(g: MissionState['grid'], m: Pt, d: Pt, dist: number): Pt {
  const len = Math.hypot(d[0], d[1]);
  const clamp = (v: number): number => Math.max(1, Math.min(g.size - 2, v));
  return [clamp(Math.round(m[0] + (d[0] / len) * dist)), clamp(Math.round(m[1] + (d[1] / len) * dist))];
}

function treesNear(g: MissionState['grid'], p: Pt, r: number): number {
  let n = 0;
  for (let y = p[1] - r; y <= p[1] + r; y++) for (let x = p[0] - r; x <= p[0] + r; x++) if (inBounds(g, x, y) && g.tiles[y * g.size + x] === TREE) n++;
  return n;
}

/** A free tile near `p` that can walk to `m`, or null. */
function reachable(s: MissionState, p: Pt, m: Pt, taken: Set<number>): Pt | null {
  const t = nearestFree(s.grid, p, taken);
  return t && findPath(s.grid, t, m) ? t : null;
}

/** The survivors still standing whose ids are Cass's and Eli's (not Ray and June). */
function pair(s: MissionState): Survivor[] {
  return s.survivors.filter((u) => u.hp > 0 && u.id !== RAY && u.id !== JUNE);
}

/** The phase before anything moves: Eli's first line plays first. */
export function newRescue(): Rescue {
  return { beat: 'ambush', ticks: 0, zombies: [], shots: 0, from: [0, 0] };
}

/**
 * After Eli's first line: six zombies at the edge of the treeline that is most wooded about `SPAWN_DIST` tiles from Cass
 * and Eli, all walking at them; Ray and June stand `ARCHER_DIST` tiles off to the side, out of view.
 */
export function startAmbush(s: MissionState, r: Rescue): void {
  const m = midpoint(pair(s));
  const taken = new Set<number>(s.survivors.map((u) => Math.round(u.y) * s.grid.size + Math.round(u.x)));
  let best = -1;
  let dir = 0;
  DIRS.forEach((d, i) => {
    const p = along(s.grid, m, d, SPAWN_DIST);
    const score = treesNear(s.grid, p, 3);
    if (score > best && reachable(s, p, m, taken)) {
      best = score;
      dir = i;
    }
  });
  const from = along(s.grid, m, DIRS[dir]!, SPAWN_DIST);
  r.from = from;
  for (let i = 0; i < RESCUE_ZOMBIES; i++) {
    const t = reachable(s, from, m, taken) ?? nearestFree(s.grid, from, taken) ?? from;
    taken.add(t[1] * s.grid.size + t[0]);
    const id = `amb${i + 1}`;
    const e: Enemy = {
      id,
      side: 'zombie',
      kind: 'zombie',
      x: t[0],
      y: t[1],
      hp: enemiesData.zombie.hp,
      maxHp: enemiesData.zombie.hp,
      facing: [0, 1],
      path: [],
      cooldown: 0,
      act: null,
      ai: { ...newAi('zombie'), mode: 'chase' },
      patrol: [],
      post: { x: t[0], y: t[1], facing: [0, 1] },
    };
    face(e, m[0], m[1]);
    s.enemies.push(e);
    r.zombies.push(id);
  }
  // Ray and June: a quarter turn from the treeline, first one way and then the other, then behind Cass and Eli; if
  // none of those can reach them, beside Cass and Eli (they still appear and take their shots).
  for (const k of [2, 6, 4, -1]) {
    const spot = k < 0 ? (nearestFree(s.grid, m, taken) ?? m) : reachable(s, along(s.grid, m, DIRS[(dir + k) % 8]!, ARCHER_DIST), m, taken);
    if (!spot) continue;
    const ray = newSurvivor(RAY, 'hunter', spot[0], spot[1]);
    taken.add(spot[1] * s.grid.size + spot[0]);
    const js = nearestFree(s.grid, spot, taken) ?? spot;
    const june = newSurvivor(JUNE, 'archer', js[0], js[1]);
    for (const u of [ray, june]) face(u, from[0], from[1]);
    s.survivors.push(ray, june);
    break;
  }
  for (const u of pair(s)) {
    u.order = null;
    u.path = [];
    u.running = false;
    face(u, from[0], from[1]);
  }
  r.beat = 'walk';
  r.ticks = 0;
}

/** The scene calls this when a beat's lines are over: `alarm` → `arrows`, `talk` → `done`. */
export function linesDone(r: Rescue): void {
  if (r.beat === 'alarm') r.beat = 'arrows';
  else if (r.beat === 'talk') r.beat = 'done';
  r.ticks = 0;
}

/** True while the scene must play lines before the rescue goes on. */
export function waitsForLines(r: Rescue): boolean {
  return r.beat === 'ambush' || r.beat === 'alarm' || r.beat === 'talk';
}

function walkers(s: MissionState, r: Rescue): Enemy[] {
  return s.enemies.filter((e) => r.zombies.includes(e.id) && e.hp > 0);
}

/** The six close in on the nearer of Cass and Eli; they stop a tile short (they never bite: the arrows come first). */
function stepZombies(s: MissionState, r: Rescue): void {
  const targets = pair(s);
  for (const e of walkers(s, r)) {
    let t = targets[0];
    for (const u of targets) if (Math.hypot(u.x - e.x, u.y - e.y) < Math.hypot(t!.x - e.x, t!.y - e.y)) t = u;
    if (!t) continue;
    if (Math.hypot(t.x - e.x, t.y - e.y) <= 1.5) {
      e.path = [];
      face(e, t.x, t.y);
      continue;
    }
    if (e.path.length === 0 || s.tick % 5 === 0) e.path = route(s.grid, e, [t.x, t.y]);
    walkPath(s.grid, e, ZOMBIE_SPEED);
  }
}

/** One arrow, one kill: the nearest zombie to Cass and Eli drops, the arrow lies on its tile (DESIGN §5 *Bow*). */
function shoot(s: MissionState, r: Rescue): void {
  const who = s.survivors.find((u) => u.id === SHOOTERS[r.shots]);
  const m = midpoint(pair(s));
  const left = walkers(s, r).sort((a, b) => Math.hypot(a.x - m[0], a.y - m[1]) - Math.hypot(b.x - m[0], b.y - m[1]));
  const t = left[0];
  r.shots++;
  if (!t) return;
  if (who) {
    face(who, t.x, t.y);
    who.act = { kind: 'bow_shot', tick: s.tick, at: [t.x, t.y] };
    who.arrows = Math.max(0, (who.arrows ?? chars.quiver) - 1);
    s.looseArrows.push({ x: Math.round(t.x), y: Math.round(t.y), owner: who.id, tick: s.tick });
  }
  damage(s, t, t.hp, who?.kind ?? 'hunter');
}

/** Ray and June walk to the tiles beside Cass and Eli, picking up any arrow they walk over. */
function startWalkIn(s: MissionState): void {
  const m = midpoint(pair(s));
  const taken = new Set<number>(pair(s).map((u) => Math.round(u.y) * s.grid.size + Math.round(u.x)));
  for (const id of [RAY, JUNE]) {
    const u = s.survivors.find((v) => v.id === id);
    if (!u) continue;
    const near = nearestFree(s.grid, [m[0] + 1, m[1] + 1], taken) ?? m;
    taken.add(near[1] * s.grid.size + near[0]);
    u.path = route(s.grid, u, near);
    u.order = { type: 'move' };
  }
}

/** Everyone faces the group's middle for the talk. */
function gather(s: MissionState): void {
  const m = midpoint(s.survivors.filter((u) => u.hp > 0));
  for (const u of s.survivors) if (u.hp > 0 && Math.hypot(u.x - m[0], u.y - m[1]) > 0.3) face(u, m[0], m[1]);
  for (const u of s.survivors) {
    u.order = null;
    u.path = [];
  }
}

/** One 0.1 s tick of the moving beats; the line beats wait for `linesDone`. */
export function stepRescue(s: MissionState, r: Rescue): void {
  if (waitsForLines(r) || r.beat === 'done') return;
  s.tick++;
  r.ticks++;
  if (r.beat === 'walk') {
    stepZombies(s, r);
    if (r.ticks >= WALK_TICKS) {
      r.beat = 'alarm';
      r.ticks = 0;
    }
  } else if (r.beat === 'arrows') {
    stepZombies(s, r);
    if (r.shots < SHOOTERS.length && r.ticks % SHOT_TICKS === 0) shoot(s, r);
    if (r.shots >= SHOOTERS.length && r.ticks >= SHOOTERS.length * SHOT_TICKS + AFTER_TICKS) {
      r.beat = 'walkIn';
      r.ticks = 0;
      startWalkIn(s);
    }
  } else if (r.beat === 'walkIn') {
    let moving = false;
    for (const id of [RAY, JUNE]) {
      const u = s.survivors.find((v) => v.id === id);
      if (!u || u.path.length === 0) continue;
      moving = walkPath(s.grid, u, chars[u.kind].speed.walk) > 0 || moving;
      pickUpArrows(s, u);
    }
    if (!moving || r.ticks >= WALK_IN_MAX) {
      gather(s);
      r.beat = 'talk';
      r.ticks = 0;
    }
  }
}

/** Where the camera looks (tile coordinates): the six while they walk; Cass and Eli while Ray and June walk in; all four for the talk. */
export function rescueFocus(s: MissionState, r: Rescue): Pt {
  const w = walkers(s, r);
  if (w.length && (r.beat === 'walk' || r.beat === 'alarm' || r.beat === 'arrows')) return midpoint(w);
  return midpoint(r.beat === 'talk' || r.beat === 'done' ? s.survivors.filter((u) => u.hp > 0) : pair(s));
}

