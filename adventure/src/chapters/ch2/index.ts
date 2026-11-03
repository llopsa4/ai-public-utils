import type { Chapter } from '../types';
import { ENCOUNTERS, POOLS, REWARDS, SPARES } from './combat';
import { DIALOGUES } from './dialogue';
import { FLAGS, ITEMS, KEPT_ITEMS, MET_FLAGS, SECRET_FLAGS, START_ITEMS } from './flags';
import { ACTOR_VERBS, ITEM_VERBS, interact } from './interactions';
import { OBJECTIVE_KEYS, objectives } from './objectives';
import { ROOMS, START_ENTRY, START_ROOM } from './rooms';
import { STORY } from './story';
import strings from './strings.en.json';

/**
 * Chapter 2, Tempered Flow: the tunnels under the ashways, then Bryn's tempering house on the road
 * out of Cinderfold country. Played
 * only in debug mode for now (?debug). Its art loads with it (./art.ts), only in the browser.
 */
export const CH2: Chapter = {
  id: 'ch2',
  title: 'chapter.ch2',
  start: { room: START_ROOM, entry: START_ENTRY },
  npcs: { bryn: { pose: 'stand', face: 'left' } },
  startItems: START_ITEMS,
  end: { title: 'end2.title', text: 'end2.text' },
  intro: ['intro2.title', 'intro2.1', 'intro2.2', 'intro2.3'],
  rooms: ROOMS,
  flags: FLAGS,
  items: ITEMS,
  keptItems: KEPT_ITEMS,
  secretFlags: SECRET_FLAGS,
  metFlags: MET_FLAGS,
  interact,
  actorVerbs: ACTOR_VERBS,
  itemVerbs: ITEM_VERBS,
  interactionKeys: Object.keys(strings).filter(k => k.startsWith('line2.')),
  dialogues: DIALOGUES,
  crowds: {},
  extras: [],
  encounters: ENCOUNTERS,
  rewards: REWARDS,
  encounterPools: POOLS,
  spares: SPARES,
  objectives,
  objectiveKeys: OBJECTIVE_KEYS,
  lineMoods: {},
  strings,
  story: STORY,
  art: () => import('./art').then(m => m.registerChapterArt()),
};
