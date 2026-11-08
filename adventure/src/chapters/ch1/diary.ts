import type { ChapterMap, DiaryEntry } from '../types';

/**
 * Mara's diary for Day 1, in his own words: an entry at each milestone of the chapter (shown in the
 * notebook's Diary tab once its flags are set). Nothing he hasn't seen or heard yet.
 */
export const DIARY: readonly DiaryEntry[] = [
  { key: 'diary.ch1.morning', after: [] },
  { key: 'diary.ch1.hoist', after: ['hoistHelped'] },
  { key: 'diary.ch1.bread', after: ['nellFed'] },
  { key: 'diary.ch1.alarm', after: ['latchFixed'] },
  { key: 'diary.ch1.crack', after: ['patchFailed'] },
  { key: 'diary.ch1.asked', after: ['decided'] },
  { key: 'diary.ch1.cold', after: ['kilnCold'] },
  { key: 'diary.ch1.hatch', after: ['fought'] },
  { key: 'diary.ch1.scarf', after: ['gotScarf'] },
  { key: 'diary.ch1.sweeper', after: ['sawSweeper'] },
  { key: 'diary.ch1.corvin', after: ['ashwaysWon'] },
];

/** Where Mara is on the world map, and what he knows of it, on Day 1. */
export const MAP: ChapterMap = {
  at: s => (s.room === 'ashways' ? 'ashways' : 'cinderfold'),
  // Home and the Ashways he knows; the First Hearth once Oren names it.
  known: flags => ['cinderfold', 'ashways', ...(flags.decided ? ['firstHearth'] : [])],
};
