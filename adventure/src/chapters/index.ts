import { CH1 } from './ch1';
import type { Chapter } from './types';

export type { Chapter } from './types';

/** Every chapter, in story order. */
export const CHAPTERS: Record<string, Chapter> = { ch1: CH1 };
export const FIRST_CHAPTER = 'ch1';

let active: Chapter = CH1;

/** The chapter being played (the saved game's chapter). */
export function chapter(): Chapter {
  return active;
}

export function setChapter(id: string): Chapter {
  const next = CHAPTERS[id];
  if (!next) throw new Error(`Unknown chapter: ${id}`);
  active = next;
  return next;
}

/** A room of the active chapter. */
export function room(id: string) {
  return active.rooms[id];
}
