import type { ChapterMap, DiaryEntry } from '../types';

/** Mara's diary for Day 2, in his own words: the tunnels at dawn, Bryn's house that night. */
export const DIARY: readonly DiaryEntry[] = [
  { key: 'diary.ch2.dawn', after: [] },
  { key: 'diary.ch2.tunnels', after: ['tunnel3Clear'] },
  { key: 'diary.ch2.bryn', after: ['knocked'] },
  { key: 'diary.ch2.retuned', after: ['retuned'] },
  { key: 'diary.ch2.question', after: ['namedNeed'] },
  { key: 'diary.ch2.records', after: ['recordsRead'] },
  { key: 'diary.ch2.letter', after: ['letterSent'] },
  { key: 'diary.ch2.help', after: ['askedForHelp'] },
  { key: 'diary.ch2.valley', after: ['sawValley'] },
  { key: 'diary.ch2.tremor', after: ['tremor'] },
];

const TUNNELS = ['tunnelMouth', 'tunnelCollapse', 'tunnelSteam', 'tunnelCistern'];

/** Where Mara is on Day 2: in the service tunnels, then on the road at Bryn's tempering house. */
export const MAP: ChapterMap = {
  at: s => (TUNNELS.includes(s.room) ? 'tunnels' : 'temperingHouse'),
  known: (flags, room) => [
    'tunnels',
    ...(flags.knocked || (room && !TUNNELS.includes(room)) ? ['temperingHouse'] : []),
    ...(flags.sawValley ? ['valley'] : []),
  ],
};
