// Story flow and the save slot (DESIGN §15, §18): New Game -> Intro -> Mission 1 -> Base 1 -> end.
// One `localStorage` slot, written at the start of each scene, so Continue resumes there. Pure
// TypeScript: no Phaser, storage is passed in so tests can fake it.
import story from '../data/story.json';
import { type BaseState, restoreBase } from './base';

export const SAVE_KEY = 'deadwoods.save';
const VERSION = 2; // 1 was the slice; those saves are discarded

/** The scenes of the story, in order. The save always names the one that is about to start. */
export const STAGES = ['intro', 'mission1', 'base1', 'done'] as const;
export type Stage = (typeof STAGES)[number];

/** Where a survivor stood and which way they faced when Mission 1 was won; Base 1 starts them there (DESIGN §12). */
export interface StartPose {
  id: string;
  x: number;
  y: number;
  facing: [number, number];
}

/** Everything the story keeps between scenes. JSON-serialisable. */
export interface Campaign {
  version: number;
  stage: Stage;
  food: number;
  scrap: number;
  ammo: number;
  /** Cass has taken back her pistol (Base 1 arrival beat, DESIGN §5). Absent in older v2 saves: false. */
  cassGun: boolean;
  /** Base 1 as it was when the herd warning came (DESIGN §12, §18): the fail screen's Retry and Continue resume there. Null until then. */
  checkpoint: BaseState | null;
  /** Mission 1's end tiles and facings, for Base 1's start (DESIGN §12). Null before Mission 1 is won and in older v2 saves. */
  start: StartPose[] | null;
}

/** What Mission 1 hands to Base 1. */
export type Carry = { food: number; scrap: number; ammo: number; start?: readonly StartPose[] };
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const TITLES: Readonly<Record<Stage, string>> = story.stages;
export const ENDING: string = story.ending;

/** The Phaser scene that plays each stage; `done` has none (the menu shows "To be continued..." instead). */
export const SCENES: Readonly<Record<Stage, 'Intro' | 'Mission' | 'Base' | null>> = { intro: 'Intro', mission1: 'Mission', base1: 'Base', done: null };

/** A new game starts at the Intro with nothing carried (the Intro and Mission 1 set their own start stock). */
export function newCampaign(): Campaign {
  return { version: VERSION, stage: 'intro', food: 0, scrap: 0, ammo: 0, cassGun: false, checkpoint: null, start: null };
}

/** The Intro is over: Mission 1 starts with the ammo the Intro left. The old campaign is not changed. */
export function toMission1(c: Campaign, ammo: number): Campaign {
  return { ...c, stage: 'mission1', ammo, checkpoint: null, start: null };
}

/** Mission 1 is won: Base 1 starts with what the crates gave plus the ammo still unspent. */
export function toBase1(c: Campaign, carry: Carry): Campaign {
  return { ...c, stage: 'base1', food: carry.food, scrap: carry.scrap, ammo: carry.ammo, checkpoint: null, start: carry.start ? carry.start.map(copyPose) : null };
}

/** Base 1 is won: the save keeps what Base 1 started with, so Replay Base 1 starts from the same stock. */
export function toDone(c: Campaign): Campaign {
  return { ...c, stage: 'done', checkpoint: null };
}

/** Replay Base 1 from the end screen: same stock, Cass keeps her gun, no checkpoint. The old campaign is not changed. */
export function replayBase1(c: Campaign): Campaign {
  return { ...c, stage: 'base1', checkpoint: null };
}

/** Keeps (or, with null, drops) the herd checkpoint. The old campaign is not changed. */
export function withCheckpoint(c: Campaign, checkpoint: BaseState | null): Campaign {
  return { ...c, checkpoint };
}

/** The Base 1 arrival beat has played: Cass keeps her pistol from now on. The old campaign is not changed. */
export function withCassGun(c: Campaign): Campaign {
  return { ...c, cassGun: true };
}

const copyPose = (p: StartPose): StartPose => ({ id: p.id, x: p.x, y: p.y, facing: [p.facing[0], p.facing[1]] });

/** Saved poses, or null when missing or malformed; one bad entry drops the lot (Base 1 then starts at the usual tiles). */
function parseStart(raw: unknown): StartPose[] | null {
  if (!Array.isArray(raw)) return null;
  const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  const out: StartPose[] = [];
  for (const p of raw as unknown[]) {
    const r = p as Record<string, unknown> | null;
    const f = r?.facing;
    if (typeof r !== 'object' || r === null || typeof r.id !== 'string' || !fin(r.x) || !fin(r.y)) return null;
    if (!Array.isArray(f) || f.length !== 2 || !fin(f[0]) || !fin(f[1])) return null;
    out.push({ id: r.id, x: r.x, y: r.y, facing: [f[0], f[1]] });
  }
  return out;
}

const count = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Parses a saved slot. Returns null for anything missing, malformed or from another version. */
export function parseSave(text: string | null): Campaign | null {
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const stage = STAGES.find((s) => s === r.stage);
  if (r.version !== VERSION || !stage || !count(r.food) || !count(r.scrap) || !count(r.ammo)) return null;
  // A checkpoint that does not fit this build is dropped alone; the rest of the save still loads.
  const checkpoint = stage === 'base1' ? restoreBase(r.checkpoint) : null;
  return { version: VERSION, stage, food: r.food, scrap: r.scrap, ammo: r.ammo, cassGun: r.cassGun === true, checkpoint, start: stage === 'base1' || stage === 'done' ? parseStart(r.start) : null };
}

/** Storage can be missing or throw (private window, blocked site data): saving then quietly fails. */
export function saveCampaign(storage: StorageLike | undefined, c: Campaign): boolean {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(c));
    return storage !== undefined;
  } catch {
    return false;
  }
}

export function clearSave(storage: StorageLike | undefined): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // nothing to clear
  }
}

/** The saved campaign, or null. A slot that is there but unusable (the slice's v1 save, damage) is ignored and kept. */
export function loadCampaign(storage: StorageLike | undefined): Campaign | null {
  try {
    return parseSave(storage?.getItem(SAVE_KEY) ?? null);
  } catch {
    return null;
  }
}

/** True when the slot holds anything at all, readable or not: New Game must ask before replacing it. */
export function hasSlot(storage: StorageLike | undefined): boolean {
  try {
    return (storage?.getItem(SAVE_KEY) ?? null) !== null;
  } catch {
    return false;
  }
}

/** The browser's storage, or undefined when even touching it throws. */
export function browserStorage(): StorageLike | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
