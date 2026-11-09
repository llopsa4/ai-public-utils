import { addStrings } from '../engine/i18n';
import { CH1 } from './ch1';
import type { Chapter } from './types';

export type { Chapter } from './types';

/** Chapters already loaded, by id. Chapter 1 comes with the game; later ones load on demand. */
export const CHAPTERS: Record<string, Chapter> = { ch1: CH1 };
export const FIRST_CHAPTER = 'ch1';
addStrings(CH1.strings);

/** Later chapters, each its own download (fetched the first time it is needed). */
const LOADERS: Record<string, () => Promise<Chapter>> = {
  intro: () => import('./intro').then(m => m.INTRO),
  ch2: () => import('./ch2').then(m => m.CH2),
};

/**
 * Every chapter id, in the order of play (loaded or not): the intro (Silas, a flash-forward to
 * Day 3), then Mara's chapters. The diary sorts entries by day, whatever the order of play.
 */
export const CHAPTER_IDS: readonly string[] = ['intro', FIRST_CHAPTER, ...Object.keys(LOADERS).filter(id => id !== 'intro')];

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

const artLoaded = new Set<string>();

/**
 * Fetches a chapter (its code and strings) if it isn't loaded yet. With `art` (the game, in the
 * browser) its pictures are registered too; tests and tools load chapters without them.
 */
export async function loadChapter(id: string, { art = false } = {}): Promise<Chapter> {
  let loaded = CHAPTERS[id];
  if (!loaded) {
    const load = LOADERS[id];
    if (!load) throw new Error(`Unknown chapter: ${id}`);
    loaded = await load();
    CHAPTERS[id] = loaded;
    addStrings(loaded.strings);
  }
  if (art && loaded.art && !artLoaded.has(id)) { await loaded.art(); artLoaded.add(id); }
  return loaded;
}

/** Every chapter (for tests and tools). */
export async function loadAllChapters(): Promise<Chapter[]> {
  return Promise.all(CHAPTER_IDS.map(id => loadChapter(id)));
}

/** Loads the chapter a save is in, before it is read (a save of a later chapter needs it). */
export async function loadChapterOf(saveText: string | null): Promise<void> {
  let id: unknown;
  try { id = saveText ? JSON.parse(saveText)?.state?.chapter : undefined; } catch { return; }
  if (typeof id === 'string' && Object.hasOwn(LOADERS, id)) await loadChapter(id, { art: true }).catch(() => undefined);
}

/** A room of the active chapter. */
export function room(id: string) {
  return active.rooms[id];
}
