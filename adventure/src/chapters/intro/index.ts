import type { Chapter } from '../types';
import { DIALOGUES } from './dialogue';
import { FLAGS, ITEMS, KEPT_ITEMS, MET_FLAGS, SECRET_FLAGS } from './flags';
import { ACTOR_VERBS, ITEM_VERBS, interact } from './interactions';
import { OBJECTIVE_KEYS, objectives, reflections } from './objectives';
import { ROOMS, START_ENTRY, START_ROOM } from './rooms';
import { STORY } from './story';
import strings from './strings.en.json';
import { DIARY, MAP } from './diary';

/**
 * The intro, The Man With Many Faces: Silas escapes Ironhaven's cells on the night of Day 3 (a
 * flash-forward; the opening scene of his and Sigrid's Day 3 chapter), ending on the chapter map.
 * Played only from the debug menu for now; New game still starts Mara's chapter 1.
 */
export const INTRO: Chapter = {
  id: 'intro',
  title: 'chapter.intro',
  start: { room: START_ROOM, entry: START_ENTRY },
  npcs: {
    guard: { pose: 'stand', face: 'left' },
    warden: { pose: 'stand', face: 'left' },
    sigrid: { pose: 'stand', face: 'left' },
  },
  startItems: [],
  end: { title: 'intro.title', text: 'end.intro.text' },
  intro: ['intro.title', 'intro.1', 'intro.2'],
  rooms: ROOMS,
  flags: FLAGS,
  items: ITEMS,
  keptItems: KEPT_ITEMS,
  secretFlags: SECRET_FLAGS,
  metFlags: MET_FLAGS,
  interact,
  actorVerbs: ACTOR_VERBS,
  itemVerbs: ITEM_VERBS,
  interactionKeys: Object.keys(strings).filter(k => k.startsWith('line.i.')),
  dialogues: DIALOGUES,
  crowds: {},
  extras: [],
  encounters: {},
  rewards: {},
  spares: [],
  when: { day: 3, time: 'when.intro.time', place: 'when.intro.place', viewpoint: 'when.intro.viewpoint' },
  hero: { name: 'speaker.silas', portrait: 'silas', sheet: 'silas', mara: false, abilities: ['read'] },
  pin: 'ironhaven',
  diary: DIARY,
  map: MAP,
  objectives,
  objectiveKeys: OBJECTIVE_KEYS,
  reflections,
  lineMoods: {},
  strings,
  story: STORY,
  art: () => import('./art').then(m => m.registerChapterArt()),
};
