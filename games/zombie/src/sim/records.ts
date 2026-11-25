import { BADGES, DIFFICULTIES, type Difficulty, GRADES, type Result, type Scene } from './stats';
import type { StorageLike } from './campaign';

// Records (DESIGN §21): the best grade and best time per scene and difficulty, and the badges earned. Their own
// `localStorage` key, separate from the save, so New Game keeps them. Pure TypeScript, storage passed in.

export const RECORDS_KEY = 'deadwoods.records';
const VERSION = 1;
export const SCENES: readonly Scene[] = ['mission1', 'base1'];
export const SCENE_NAME: Readonly<Record<Scene, string>> = { mission1: 'Mission 1', base1: 'Base 1' };
export { DIFFICULTY_NAME } from './difficulty';

/** The best of one scene on one difficulty. */
export interface Best {
  grade: string;
  seconds: number;
}

export interface Records {
  version: number;
  best: Record<Scene, Partial<Record<Difficulty, Best>>>;
  /** Badge id → the difficulties it was earned on (the badge shows them). */
  badges: Record<Scene, Record<string, Difficulty[]>>;
}

export const newRecords = (): Records => ({ version: VERSION, best: { mission1: {}, base1: {} }, badges: { mission1: {}, base1: {} } });

/** What filing a run changed, for the debrief's "new best" marks. */
export interface Filed {
  records: Records;
  newGrade: boolean;
  newTime: boolean;
  newBadges: string[]; // badge ids not earned before on this difficulty
}

const rank = (scene: Scene, grade: string): number => GRADES[scene].indexOf(grade);

/** Files a won run under its scene and difficulty. The old records are not changed. */
export function fileRun(old: Records, r: Result, difficulty: Difficulty): Filed {
  const records: Records = JSON.parse(JSON.stringify(old)) as Records;
  const before = records.best[r.scene][difficulty];
  const newGrade = !before || rank(r.scene, r.grade) > rank(r.scene, before.grade);
  const newTime = !before || r.seconds < before.seconds;
  records.best[r.scene][difficulty] = {
    grade: newGrade ? r.grade : before!.grade,
    seconds: newTime ? r.seconds : before!.seconds,
  };
  const newBadges: string[] = [];
  for (const id of r.badges) {
    const list = (records.badges[r.scene][id] ??= []);
    if (!list.includes(difficulty)) {
      list.push(difficulty);
      list.sort((a, b) => DIFFICULTIES.indexOf(a) - DIFFICULTIES.indexOf(b));
      newBadges.push(id);
    }
  }
  return { records, newGrade, newTime, newBadges };
}

/** Parses a stored slot. Anything missing, malformed or from another version gives null; a bad entry is dropped alone. */
export function parseRecords(text: string | null): Records | null {
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null || (raw as { version?: unknown }).version !== VERSION) return null;
  const r = raw as { best?: unknown; badges?: unknown };
  const out = newRecords();
  for (const scene of SCENES) {
    const best = (r.best as Record<string, unknown> | undefined)?.[scene];
    for (const d of DIFFICULTIES) {
      const b = (best as Record<string, unknown> | undefined)?.[d] as Partial<Best> | undefined;
      if (b && typeof b.grade === 'string' && rank(scene, b.grade) >= 0 && typeof b.seconds === 'number' && Number.isFinite(b.seconds) && b.seconds >= 0) out.best[scene][d] = { grade: b.grade, seconds: b.seconds };
    }
    const badges = (r.badges as Record<string, unknown> | undefined)?.[scene] as Record<string, unknown> | undefined;
    for (const { id } of BADGES[scene]) {
      const list = badges?.[id];
      if (Array.isArray(list)) {
        const ds = DIFFICULTIES.filter((d) => list.includes(d));
        if (ds.length > 0) out.badges[scene][id] = ds;
      }
    }
  }
  return out;
}

/** The saved records, or empty ones: a slot that cannot be read is ignored (and kept until the next filing). */
export function loadRecords(storage: StorageLike | undefined): Records {
  try {
    return parseRecords(storage?.getItem(RECORDS_KEY) ?? null) ?? newRecords();
  } catch {
    return newRecords();
  }
}

/** Storage can be missing or throw: saving then quietly fails. */
export function saveRecords(storage: StorageLike | undefined, r: Records): boolean {
  try {
    storage?.setItem(RECORDS_KEY, JSON.stringify(r));
    return storage !== undefined;
  } catch {
    return false;
  }
}

/**
 * Files a won run into the stored records and saves them. Returns what changed, for the debrief.
 */
export function recordRun(storage: StorageLike | undefined, r: Result, difficulty: Difficulty): Filed {
  const filed = fileRun(loadRecords(storage), r, difficulty);
  saveRecords(storage, filed.records);
  return filed;
}
