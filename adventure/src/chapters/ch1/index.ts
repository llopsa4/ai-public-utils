import type { Chapter } from '../types';
import { ENCOUNTERS, LESSON_PROMPTS, OREN_SPARES, REWARDS } from './combat';
import { CROWDS, EXTRAS } from './crowd';
import { DIALOGUES } from './dialogue';
import { FLAGS, ITEMS, KEPT_ITEMS, MET_FLAGS, SECRET_FLAGS } from './flags';
import { ACTOR_VERBS, INTERACTION_KEYS, ITEM_VERBS, interact } from './interactions';
import { LINE_MOODS } from './moods';
import { OBJECTIVE_KEYS, objectives } from './objectives';
import { ROOMS, START_ENTRY, START_ROOM } from './rooms';
import { STORY } from './story';
import strings from './strings.en.json';
import { concernKey } from './progression';
import { DIARY, MAP } from './diary';

/** Chapter 1, Kiln Courier: from Mara's tent to the ashways. */
export const CH1: Chapter = {
  id: 'ch1',
  title: 'chapter.ch1',
  start: { room: START_ROOM, entry: START_ENTRY },
  npcs: { oren: { pose: 'stand', face: 'left' }, nell: { pose: 'stand', face: 'right' }, tobi: { pose: 'stand', face: 'right' } },
  rooms: ROOMS,
  flags: FLAGS,
  items: ITEMS,
  keptItems: KEPT_ITEMS,
  secretFlags: SECRET_FLAGS,
  metFlags: MET_FLAGS,
  interact,
  actorVerbs: ACTOR_VERBS,
  itemVerbs: ITEM_VERBS,
  interactionKeys: INTERACTION_KEYS,
  dialogues: DIALOGUES,
  crowds: CROWDS,
  extras: EXTRAS,
  encounters: ENCOUNTERS,
  rewards: REWARDS,
  lessonPrompts: LESSON_PROMPTS,
  spares: OREN_SPARES,
  // Day 1 of STORY.md's five: the first malfunctions, seen by Mara in Cinderfold.
  when: { day: 1, time: 'when.ch1.time', place: 'when.ch1.place', viewpoint: 'when.ch1.viewpoint' },
  diary: DIARY,
  map: MAP,
  objectives,
  reflections:s=>s.flags.decided?[concernKey(s.flags,'note.concern')]:[],
  objectiveKeys: OBJECTIVE_KEYS,
  lineMoods: LINE_MOODS,
  strings,
  story: STORY,
};
