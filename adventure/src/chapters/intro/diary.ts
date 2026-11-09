import type { ChapterMap, DiaryEntry } from '../types';

/** Silas's diary for the night of Day 3, in his own words: the cell, the masks, Sigrid at the door. */
export const DIARY: readonly DiaryEntry[] = [
  { key: 'diary.intro.cell', after: [] },
  { key: 'diary.intro.frame', after: ['gotFrame'] },
  { key: 'diary.intro.harrow', after: ['guardGone'] },
  { key: 'diary.intro.clerk', after: ['wardenBusy'] },
  { key: 'diary.intro.sigrid', after: ['metSigrid'] },
];

/** Silas is in Ironhaven the whole night. */
export const MAP: ChapterMap = { at: () => 'ironhaven', known: () => ['ironhaven'] };
