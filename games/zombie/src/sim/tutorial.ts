// Intro tutorial rules (DESIGN §15): the improvised woods camp right after a fight, in four gated
// steps (move, knife, gun, hold). Each step waits for the player; finishing one asks the scene to
// play a dialogue (`say`), and the next step's zombie appears. Pure TypeScript on top of the mission
// state; the scene only draws it, plays the dialogue and sends orders.
import enemiesData from '../data/enemies.json';
import intro from '../data/intro.json';
import story from '../data/story.json';
import { newAi } from './ai';
import { COVER, TREE, type Grid, isBlocked, makeGrid, setTile } from './grid';
import { type DialogueLine } from './dialogue';
import { type Enemy, type MissionSpec, type MissionState, type SurvivorKind, createMission, stepMission } from './mission';
import { type Pt, findPath } from './path';
import { makeRng, rngNext } from './rng';

export type StepNeeds = 'fighter' | 'shot' | 'hold';

export interface ZombieSpawn {
  x: number;
  y: number;
  /** `wander` stands about until something draws it; `investigate` walks toward the survivors. */
  mode: 'wander' | 'investigate';
}

export interface StepSpec {
  id: string;
  goal: 'reach' | 'kill';
  at?: { x: number; y: number };
  radius?: number;
  zombie?: ZombieSpawn;
  /** What the player must have done by the time the zombie dies, or the step is not counted. */
  needs?: StepNeeds;
  /** Narrative ammo once the step is done (the dialogue names the count). */
  ammoAfter?: number;
  hint: string;
  retry?: string;
  /** Key of the dialogue in `story.dialogue.intro` played when the step is done. */
  after: string;
}

export const STEPS = intro.steps as unknown as readonly StepSpec[];

/** What the player has done in the current step. */
export interface Used {
  fighter: boolean; // the Fighter attacked
  shot: boolean; // a round was fired
  hold: boolean; // a survivor was on Hold
}

export interface IntroState extends MissionState {
  /** Index of the step being played; `STEPS.length` once all are done. */
  step: number;
  /** Id of the zombie the current step waits for, or null (a reach step, or all done). */
  zombieId: string | null;
  /** Dialogue key the scene must play now, then `ackSay`; the sim is frozen while it is set. */
  say: string | null;
  /** Set once the last dialogue has been acknowledged: the scene starts Mission 1. */
  done: boolean;
  /** A one-off hint that replaces the step's hint (shown after a retry). */
  note: string | null;
  used: Used;
  spawned: number;
  /** The shared ammo when the current step began (refunded when a kill is not counted). */
  stepAmmo: number;
}

const noUsed = (): Used => ({ fighter: false, shot: false, hold: false });

/** The woods clearing: an edge of trees, scattered trees outside the clearing, the tent and the fire. */
function buildGrid(): Grid {
  const n = intro.size;
  const grid = makeGrid(n);
  const rng = makeRng(intro.seed);
  const mid = n / 2;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - mid, y - mid);
      const edge = Math.min(x, y, n - 1 - x, n - 1 - y) < 2;
      const r = rngNext(rng); // always drawn, so the layout does not shift when the radius is tuned
      if (edge || (d > intro.clearingRadius && r < intro.treeChance)) setTile(grid, x, y, TREE);
    }
  }
  const t = intro.tent;
  for (let dy = 0; dy < t.h; dy++) for (let dx = 0; dx < t.w; dx++) setTile(grid, t.x + dx, t.y + dy, COVER);
  setTile(grid, intro.fire.x, intro.fire.y, COVER);
  return grid;
}

function rowsOf(g: Grid): string[] {
  const rows: string[] = [];
  for (let y = 0; y < g.size; y++) {
    let r = '';
    for (let x = 0; x < g.size; x++) {
      const k = g.tiles[y * g.size + x];
      r += k === TREE ? 'T' : k === COVER ? 'c' : '.';
    }
    rows.push(r);
  }
  return rows;
}

/** The dialogue lines for a key of `story.dialogue.intro` (empty for an unknown key). */
export function introLines(key: string): readonly DialogueLine[] {
  return (story.dialogue.intro as unknown as Record<string, DialogueLine[] | undefined>)[key] ?? [];
}

export function createIntro(): IntroState {
  const spec: MissionSpec = {
    seed: intro.seed + 1,
    map: rowsOf(buildGrid()),
    survivors: intro.survivors.map((s) => ({ id: s.id, kind: s.kind as SurvivorKind, x: s.x, y: s.y })),
    enemies: [],
  };
  return { ...createMission(spec), step: 0, zombieId: null, say: intro.start, done: false, note: null, used: noUsed(), spawned: 0, stepAmmo: 0 };
}

export const currentStep = (s: IntroState): StepSpec | null => STEPS[s.step] ?? null;

/** The step's text for the hud, or an empty string when the intro is over. */
export function hintOf(s: IntroState): string {
  return s.note ?? currentStep(s)?.hint ?? '';
}

/** Where the scene should point the player: the fire, or the zombie the step waits for. */
export function objectiveAt(s: IntroState): Pt | null {
  const step = currentStep(s);
  if (!step) return null;
  if (step.goal === 'reach' && step.at) return [step.at.x, step.at.y];
  const z = s.enemies.find((e) => e.id === s.zombieId && e.hp > 0);
  return z ? [z.x, z.y] : null;
}

/** Puts the step's zombie on the map. An `investigate` zombie walks toward the survivors at once. */
function spawnZombie(s: IntroState, spec: ZombieSpawn): void {
  s.spawned++;
  const id = `zombie${s.spawned}`;
  const living = s.survivors.filter((u) => u.hp > 0);
  const cx = living.reduce((a, u) => a + u.x, 0) / Math.max(living.length, 1);
  const cy = living.reduce((a, u) => a + u.y, 0) / Math.max(living.length, 1);
  const facing: [number, number] = [cx - spec.x, cy - spec.y];
  const d = Math.hypot(facing[0], facing[1]) || 1;
  const unitFacing: [number, number] = [facing[0] / d, facing[1] / d];
  const ai = newAi('zombie');
  const e: Enemy = {
    id,
    side: 'zombie',
    kind: 'zombie',
    x: spec.x,
    y: spec.y,
    hp: enemiesData.zombie.hp,
    maxHp: enemiesData.zombie.hp,
    facing: unitFacing,
    path: [],
    cooldown: 0,
    act: null,
    ai,
    patrol: [],
    post: { x: spec.x, y: spec.y, facing: [...unitFacing] },
  };
  if (spec.mode === 'investigate') {
    const goal: Pt = [Math.round(cx), Math.round(cy)];
    ai.mode = 'investigate';
    ai.goal = goal;
    e.path = findPath(s.grid, [spec.x, spec.y], goal) ?? [];
  }
  s.enemies.push(e);
  s.zombieId = id;
}

/** Begins step `s.step`: its zombie appears and what the player has done so far is forgotten. */
function beginStep(s: IntroState): void {
  s.used = noUsed();
  s.note = null;
  s.zombieId = null;
  s.stepAmmo = s.ammo;
  const step = currentStep(s);
  if (step?.zombie) spawnZombie(s, step.zombie);
}

/** Whether the step's requirement was met by the time its zombie died. */
function met(needs: StepNeeds | undefined, u: Used): boolean {
  return needs === undefined || u[needs];
}

function finishStep(s: IntroState, step: StepSpec): void {
  if (step.ammoAfter !== undefined) s.ammo = step.ammoAfter;
  s.say = step.after;
  s.step++;
  beginStep(s);
}

/** A kill that did not teach the step's lesson does not count: the ammo is refunded and another zombie comes. */
function retryStep(s: IntroState, step: StepSpec): void {
  if (step.needs !== 'shot') s.ammo = s.stepAmmo; // a wasted shot is not charged
  const spec = step.zombie;
  s.used = noUsed();
  s.zombieId = null;
  if (spec) spawnZombie(s, spec);
  s.note = step.retry ?? step.hint;
}

function reached(s: IntroState, step: StepSpec): boolean {
  const at = step.at;
  if (!at) return false;
  const r = step.radius ?? 2;
  return s.survivors.some((u) => u.hp > 0 && Math.hypot(u.x - at.x, u.y - at.y) <= r);
}

/** The dialogue has been shown (or skipped): the sim runs again; after the last one the intro is done. */
export function ackSay(s: IntroState): void {
  s.say = null;
  if (s.step >= STEPS.length) s.done = true;
}

/**
 * One 0.1 s tick. Frozen while a dialogue is waiting or once a survivor has died (`status` is
 * `failed`: the scene restarts the intro). Runs the mission tick, notes what the player did, then
 * checks the current step's gate: gates only open in order.
 */
export function stepIntro(s: IntroState): void {
  if (s.say !== null || s.done || s.status !== 'playing') return;
  const cooldowns = s.survivors.map((u) => u.cooldown);
  const ammo = s.ammo;
  stepMission(s);
  s.survivors.forEach((u, i) => {
    // A weapon was used this tick when the cooldown was set again after its usual one-tick drop.
    const fired = u.cooldown > Math.max(cooldowns[i]! - 1, 0);
    if (fired && u.kind === 'fighter') s.used.fighter = true;
  });
  if (s.ammo < ammo) s.used.shot = true;
  if (s.survivors.some((u) => u.hp > 0 && u.order?.type === 'hold')) s.used.hold = true;
  if (s.status !== 'playing') return;

  const step = currentStep(s);
  if (!step) return;
  if (step.goal === 'reach') {
    if (reached(s, step)) finishStep(s, step);
    return;
  }
  const z = s.enemies.find((e) => e.id === s.zombieId);
  if (z && z.hp <= 0) {
    if (met(step.needs, s.used)) finishStep(s, step);
    else retryStep(s, step);
  }
}

/** True when a position is a floor tile a survivor can walk to from the starting tile (for tests). */
export function reachable(s: IntroState, to: Pt): boolean {
  const from = s.survivors[0]!;
  return !isBlocked(s.grid, to[0], to[1]) && findPath(s.grid, [from.x, from.y], to) !== null;
}
