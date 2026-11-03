import { addStrings } from '../engine/i18n';
import { CH1 } from './ch1';
import type { Chapter } from './types';

export type { Chapter } from './types';

/** Chapters already loaded, by id. Chapter 1 comes with the game; later ones load on demand. */
export const CHAPTERS: Record<string, Chapter> = { ch1: CH1 };
export const FIRST_CHAPTER = 'ch1';
addStrings(CH1.strings);

/** Later chapters, each its own download (fetched the first time it is needed). */
const LOADERS: Record<string, () => Promise<Chapter>> = {};

/** Every chapter id, in story order (loaded or not). */
export const CHAPTER_IDS: readonly string[] = [FIRST_CHAPTER, ...Object.keys(LOADERS)];

let active: Chapter = CH1;

/** The chapter being played (the saved game's chapter). */
export function chapter(): Chapter {
  return active;
}

/** Makes a loaded chapter the one being played. */
export function setChapter(id: string): Chapter {
  const next = CHAPTERS[id];
  if (!next) throw new Error(`Chapter not loaded: ${id}`);
  active = next;
  return next;
}

/** Fetches a chapter (its code, strings and art list) if it isn't loaded yet. */
export async function loadChapter(id: string): Promise<Chapter> {
  if (CHAPTERS[id]) return CHAPTERS[id];
  const load = LOADERS[id];
  if (!load) throw new Error(`Unknown chapter: ${id}`);
  const loaded = await load();
  CHAPTERS[id] = loaded;
  addStrings(loaded.strings);
  return loaded;
}

/** Every chapter (for tests and tools). */
export async function loadAllChapters(): Promise<Chapter[]> {
  return Promise.all(CHAPTER_IDS.map(loadChapter));
}

/** Loads the chapter a save is in, before it is read (a save of a later chapter needs it). */
export async function loadChapterOf(saveText: string | null): Promise<void> {
  let id: unknown;
  try { id = saveText ? JSON.parse(saveText)?.state?.chapter : undefined; } catch { return; }
  if (typeof id === 'string' && Object.hasOwn(LOADERS, id)) await loadChapter(id).catch(() => undefined);
}

/** A room of the active chapter. */
export function room(id: string) {
  return active.rooms[id];
}
