import type { Chapter } from '../types';
import { DIALOGUES } from './dialogue';
import { FLAGS, ITEMS, KEPT_ITEMS, MET_FLAGS, SECRET_FLAGS } from './flags';
import { ACTOR_VERBS, ITEM_VERBS, RULES, interact } from './interactions';
import { OBJECTIVE_KEYS, objectives, reflections } from './objectives';
import { ROOMS, START_ENTRY, START_ROOM } from './rooms';
import { STORY } from './story';
import strings from './strings.en.json';
import { DIARY, MAP } from './diary';
import { makeRevealScene } from './reveal';

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
    warden: { pose: 'stand', face: 'right' },
    sigrid: { pose: 'stand', face: 'left' },
  },
  startItems: [],
  end: { title: 'introI.title', text: 'end.intro.text' },
  // Its own keys: the game's intro.1..4 are Mara's chapter 1 opening.
  intro: ['introI.title', 'introI.1', 'introI.2'],
  rooms: ROOMS,
  flags: FLAGS,
  items: ITEMS,
  keptItems: KEPT_ITEMS,
  secretFlags: SECRET_FLAGS,
  metFlags: MET_FLAGS,
  interact,
  rules: RULES,
  flagRooms: { harrowMade: 'cell', clerkMade: 'guardroom', tookHood: 'guardroom', tookPlaster: 'cell' },
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
  mapName: 'chapter.intro.short',
  diary: DIARY,
  map: MAP,
  objectives,
  objectiveKeys: OBJECTIVE_KEYS,
  reflections,
  // Benn frightened, Kell suspicious then hard (Codex's drawn faces); the rest neutral.
  lineMoods: {
    'dlgI.guard.wake1': 'worried', 'dlgI.guard.wake2': 'worried', 'dlgI.guard.keysAsk': 'angry', 'dlgI.guard.friend': 'worried',
    'dlgI.guard.again': 'worried', 'dlgI.guard.again2': 'worried', 'dlgI.guard.again3': 'worried',
    'dlgI.guard.scolded1': 'worried', 'dlgI.guard.scolded2': 'worried', 'dlgI.guard.whatPrisoner': 'angry', 'dlgI.guard.underCot': 'angry',
    'dlgI.guard.moved1': 'worried', 'dlgI.guard.moved2': 'worried', 'dlgI.guard.report': 'worried', 'dlgI.guard.stay': 'worried',
    'line.i.caught.guard': 'angry', 'line.i.snore': 'neutral',
    'dlgI.warden.start': 'worried', 'dlgI.warden.passing': 'worried', 'dlgI.warden.orders': 'angry', 'dlgI.warden.again': 'worried',
    'dlgI.warden.tally1': 'worried', 'dlgI.warden.tally2': 'worried', 'dlgI.warden.grate': 'angry', 'line.i.caught.warden': 'angry', 'line.i.kellSees': 'angry',
  },
  strings,
  story: STORY,
  art: () => import('./art').then(m => m.registerChapterArt()),
  scenes: { reveal: makeRevealScene },
};
