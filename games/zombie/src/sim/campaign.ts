// Campaign progress and the save slot (DESIGN §2, §11): New Game -> Camp -> mission -> Debrief ->
// Camp, one `localStorage` slot. Pure TypeScript: no Phaser, storage is passed in so tests can fake it.
import camp from '../data/camp.json';
import story from '../data/story.json';

export const SAVE_KEY = 'deadwoods.save';
const VERSION = 1;

export interface StoryMission {
  id: string;
  title: string;
  briefing: string;
}

export interface SavedBarricade {
  x: number;
  y: number;
  hp: number;
}

/** Everything the campaign keeps between scenes. JSON-serialisable. */
export interface Campaign {
  version: number;
  food: number;
  scrap: number;
  missionsDone: number;
  barricades: SavedBarricade[];
}

export type Loot = { food: number; scrap: number };
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const MISSIONS: readonly StoryMission[] = story.missions;
export const ENDING: string = story.ending;

export function newCampaign(): Campaign {
  return { version: VERSION, food: camp.start.food, scrap: camp.start.scrap, missionsDone: 0, barricades: [] };
}

/** The mission the camp offers next, or null once the story has run out. */
export function nextMission(c: Campaign): StoryMission | null {
  return MISSIONS[c.missionsDone] ?? null;
}

export function finished(c: Campaign): boolean {
  return nextMission(c) === null;
}

/** Adds a mission's loot, counts the mission as done and returns the new campaign (the old one is not changed). */
export function applyDebrief(c: Campaign, loot: Loot): Campaign {
  return {
    ...c,
    food: c.food + loot.food,
    scrap: c.scrap + loot.scrap,
    missionsDone: Math.min(c.missionsDone + 1, MISSIONS.length),
    barricades: c.barricades.map((b) => ({ ...b })),
  };
}

/** The camp's current resources and fences, taken before leaving the camp scene. */
export function withCamp(c: Campaign, food: number, scrap: number, barricades: readonly SavedBarricade[]): Campaign {
  return { ...c, food, scrap, barricades: barricades.map((b) => ({ x: b.x, y: b.y, hp: b.hp })) };
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
  if (r.version !== VERSION || !count(r.food) || !count(r.scrap) || !count(r.missionsDone) || r.missionsDone > MISSIONS.length) return null;
  if (!Array.isArray(r.barricades)) return null;
  const barricades: SavedBarricade[] = [];
  for (const b of r.barricades as unknown[]) {
    if (typeof b !== 'object' || b === null) return null;
    const { x, y, hp } = b as Record<string, unknown>;
    if (!count(x) || !count(y) || typeof hp !== 'number' || !Number.isFinite(hp) || hp <= 0) return null;
    barricades.push({ x, y, hp });
  }
  return { version: VERSION, food: r.food, scrap: r.scrap, missionsDone: r.missionsDone, barricades };
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

export function loadCampaign(storage: StorageLike | undefined): Campaign | null {
  try {
    return parseSave(storage?.getItem(SAVE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function clearSave(storage: StorageLike | undefined): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // nothing to clear
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
