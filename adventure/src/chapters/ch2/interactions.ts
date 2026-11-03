import { ROOMS } from './rooms';
import { SECRET_FLAGS } from './flags';
import { applyRules, cycleLook, type Rule } from '../../engine/rules';
import type { ActorId, Command, Condition, GameState, Point, Verb } from '../../engine/types';

/** Verbs offered for the characters (hotspot verbs live in rooms.ts). */
export const ACTOR_VERBS: Partial<Record<ActorId, Verb[]>> = {
  hero: ['look', 'talk', 'crouch', 'lie', 'stand'],
  bryn: ['look', 'talk'],
};

/** Inventory items offer these verbs in the action ring. */
export const ITEM_VERBS: Verb[] = ['look', 'use'];

const say = (text: string, actor: ActorId = 'hero', at?: Point): Command => (at ? { type: 'say', actor, text, at } : { type: 'say', actor, text });
const flag = (name: string): Command => ({ type: 'setFlag', flag: name, value: true });
const pose = (actor: ActorId, p: 'stand' | 'crouch' | 'dead'): Command => ({ type: 'pose', actor, pose: p });
const wait = (ms: number): Command => ({ type: 'wait', ms });
const go = (room: string, entry: string): Command => ({ type: 'room', room, entry });
const shake = (ms: number): Command => ({ type: 'shake', ms });
const F = (name: string): Condition[] => [{ flag: name }];
const NOT = (name: string): Condition[] => [{ notFlag: name }];

/** Bryn's voice through the door, before it opens. */
const DOOR_VOICE = { x: 410, y: 150 };

/** Items with their own reply when used on something that doesn't take them (chapter 1's lines). */
const ITEM_FAILS = ['gauntlet', 'notebook', 'regulator', 'bread', 'scarf'];

function fallback(verb: Verb, item?: string): Command[] {
  if (item) return [say(ITEM_FAILS.includes(item) ? `line.useFails.${item}` : 'line.useFails')];
  if (verb === 'look') return [say('line.nothingSpecial')];
  return [say('line.cannot')];
}

/** An inventory item: its look line; anything else done to it can't be. */
const inventoryItem = (id: string, look: Rule['do']): Rule[] => [
  { target: `item:${id}`, verb: 'look', do: look },
  { target: `item:${id}`, do: [say('line.cannot')] },
  { target: `item:${id}`, item: '*', do: [say('line.cannot')] },
];

/** A line that changes once a flag is set: `[when set, otherwise]`. */
const either = (target: string, verb: Verb | Verb[], name: string, set: string, unset: string, walk = false): Rule[] => [
  { target, verb, when: F(name), walk, do: [say(set)] },
  { target, verb, walk, do: [say(unset)] },
];

/** Secrets: the first look marks them found. */
const SECRETS: Record<string, { flag: (typeof SECRET_FLAGS)[number]; line: string; again: string }> = {
  doorframe: { flag: 'secretDoorframe', line: 'line2.secretDoorframe', again: 'line2.secretDoorframeAgain' },
  crucible: { flag: 'secretCrucible', line: 'line2.secretCrucible', again: 'line2.secretCrucibleAgain' },
};

/** Knocking: Bryn calls through the door, opens it, and takes him in. */
const KNOCK: Command[] = [
  say('line2.knock'), wait(500), say('line2.brynDoor1', 'bryn', DOOR_VOICE), say('line2.maraDoor'), say('line2.brynDoor2', 'bryn', DOOR_VOICE),
  flag('knocked'), flag('metBryn'), go('workshop', 'fromRoad'),
];

/** Chapter 2's click rules, first match wins (src/engine/rules.ts); unmatched clicks get `fallback`. */
export const RULES: readonly Rule[] = [
  // ------------------------------------------------------------ secrets ---
  ...Object.entries(SECRETS).flatMap(([target, s]): Rule[] => [
    { target, verb: 'look', when: F(s.flag), do: [say(s.again)] },
    { target, verb: 'look', walk: true, do: [say(s.line), flag(s.flag)] },
  ]),

  // ---------------------------------------------------------- inventory ---
  ...inventoryItem('gauntlet', ({ state }) => [say(state.flags.retuned ? 'line2.gauntletTempered' : 'line2.gauntletLook')]),
  ...inventoryItem('notebook', ({ state }) => [say(state.flags.letterSent ? 'line2.notebookAfterLetter' : 'line2.notebookLook')]),
  ...inventoryItem('regulator', ({ state }) => [say(state.flags.recordsRead ? 'line2.regulatorAfter' : 'line2.regulatorLook')]),
  ...inventoryItem('bread', [say('line.breadLook')]),
  ...inventoryItem('scarf', [say('line.scarfLook')]),

  // ---------------------------------------------------------------- Mara ---
  { target: 'hero', item: 'bread', do: [say('line2.breadEat')] },
  { target: 'hero', item: 'scarf', do: [say('line2.scarfWear')] },
  { target: 'hero', item: '*', do: [say('line.heroUseItem')] },
  ...either('hero', 'look', 'retuned', 'line2.heroLookAfter', 'line2.heroLook'),
  { target: 'hero', verb: 'talk', do: [say('line2.heroTalk')] },
  { target: 'hero', verb: 'crouch', do: [pose('hero', 'crouch')] },
  { target: 'hero', verb: 'lie', do: [pose('hero', 'dead'), wait(400), say('line2.heroLie')] },
  { target: 'hero', verb: 'stand', do: ({ state }) => (state.hero.pose === 'stand' ? [say('line.heroAlreadyStanding')] : [pose('hero', 'stand')]) },

  // ------------------------------------------------------------- the road ---
  { target: 'bell', verb: 'look', do: [say('line2.bellLook')] },
  { target: 'bell', verb: 'use', when: F('knocked'), do: [say('line2.bellAgain')] },
  { target: 'bell', verb: 'use', walk: true, do: KNOCK },
  ...either('door', 'look', 'knocked', 'line2.doorLookOpen', 'line2.doorLook'),
  { target: 'door', verb: ['open', 'use', 'go'], when: F('knocked'), walk: true, do: [go('workshop', 'fromRoad')] },
  { target: 'door', verb: ['open', 'use', 'go'], walk: true, do: KNOCK },
  { target: 'window', verb: 'look', do: [say('line2.windowLook')] },
  { target: 'signpost', verb: 'look', do: [say('line2.signpostLook')] },
  { target: 'farPipes', verb: 'look', do: [say('line2.farPipesLook')] },
  { target: 'roadBack', verb: 'look', do: [say('line2.roadBackLook')] },
  { target: 'roadBack', verb: 'go', do: [say('line2.roadBackGo')] },

  // --------------------------------------------------------- the workshop ---
  { target: 'readingValve', item: 'regulator', when: F('recordsRead'), do: [say('line2.recordsAgain')] },
  { target: 'readingValve', item: 'regulator', when: NOT('namedNeed'), do: [say('line2.recordsNotYet', 'bryn')] },
  { target: 'readingValve', item: 'regulator', walk: true, do: [
    say('line2.records1', 'bryn'), wait(400), shake(250), say('line2.records2', 'bryn'), say('line2.records3'),
    say('line2.records4', 'bryn'), say('line2.records5'), flag('recordsRead'),
  ] },
  ...either('readingValve', 'look', 'recordsRead', 'line2.valveLookAfter', 'line2.valveLook'),
  { target: 'readingValve', verb: ['use', 'open'], do: [say('line2.valveUse')] },
  { target: 'bench', item: 'gauntlet', when: F('retuned'), do: [say('line2.benchDone')] },
  { target: 'bench', item: 'gauntlet', when: NOT('namedNeed'), do: [say('line2.benchNotYet', 'bryn')] },
  { target: 'bench', item: 'gauntlet', when: NOT('recordsRead'), do: [say('line2.benchRecordsFirst', 'bryn')] },
  { target: 'bench', item: 'gauntlet', walk: true, do: [
    say('line2.retune1', 'bryn'), pose('hero', 'crouch'), wait(500), shake(300), wait(300), pose('hero', 'stand'),
    say('line2.retune2', 'bryn'), { type: 'learn', technique: 'tempered-flow' }, flag('retuned'),
    say('line2.retune3'), say('line2.retune4', 'bryn'), wait(300), go('backroom', 'fromWorkshop'),
  ] },
  { target: 'bench', verb: 'look', do: [say('line2.benchLook')] },
  { target: 'bench', verb: 'use', do: [say('line2.benchUse')] },
  { target: 'cage', verb: 'look', do: [say('line2.cageLook')] },
  { target: 'cage', verb: ['use', 'open'], when: F('sparred'), do: [say('line2.cageAgain')] },
  { target: 'cage', verb: ['use', 'open'], when: NOT('offeredPractice'), do: [say('line2.cageNotYet')] },
  { target: 'cage', verb: ['use', 'open'], walk: true, do: [
    say('line2.sparStart', 'bryn'), { type: 'fight', id: 'trainingRig' }, flag('sparred'),
    say('line2.sparAfter1', 'bryn'), say('line2.sparAfter2'),
  ] },
  { target: 'stool2', verb: 'look', do: [say('line2.stoolLook')] },
  { target: 'stool2', verb: 'use', do: [say('line2.stoolUse')] },
  { target: 'coal', verb: 'look', do: [say('line2.coalLook')] },
  { target: 'coal', verb: 'take', do: [say('line2.coalTake')] },
  { target: 'view', verb: 'look', do: [say('line2.viewLook')] },
  { target: 'returnPipe', verb: 'look', do: [say('line2.returnPipeLook')] },
  { target: 'returnPipe', verb: 'use', do: [say('line2.returnPipeUse')] },
  { target: 'toBackroom', verb: 'look', do: [say('line2.toBackroomLook')] },
  { target: 'toBackroom', verb: 'go', when: F('retuned'), walk: true, do: [go('backroom', 'fromWorkshop')] },
  { target: 'toBackroom', verb: 'go', do: [say('line2.toBackroomNotYet', 'bryn')] },
  { target: 'toRoad', verb: 'look', do: [say('line2.toRoadLook')] },
  { target: 'toRoad', verb: 'go', do: [say('line2.toRoadGo')] },

  // -------------------------------------------------------- the back room ---
  { target: 'pouch', item: 'notebook', when: F('letterSent'), do: [say('line2.letterAlready')] },
  { target: 'pouch', item: 'notebook', walk: true, do: [say('line2.letter1'), wait(600), say('line2.letter2'), say('line2.letter3'), flag('letterSent')] },
  ...either('pouch', 'look', 'letterSent', 'line2.pouchLookAfter', 'line2.pouchLook'),
  { target: 'pouch', verb: ['open', 'take'], do: [say('line2.pouchTake')] },
  { target: 'map', verb: 'look', when: F('sawValley'), do: [say('line2.mapAgain')] },
  { target: 'map', verb: 'look', walk: true, do: [say('line2.map1'), say('line2.map2'), flag('sawValley')] },
  { target: 'map', verb: 'take', do: [say('line2.mapTake')] },
  { target: 'farDoor', verb: 'look', do: [say('line2.farDoorLook')] },
  { target: 'farDoor', verb: ['open', 'go'], when: NOT('letterSent'), do: [say('line2.leaveLetter')] },
  { target: 'farDoor', verb: ['open', 'go'], when: NOT('askedForHelp'), do: [say('line2.leaveSupplies')] },
  { target: 'farDoor', verb: ['open', 'go'], when: NOT('sawValley'), do: [say('line2.leaveMap')] },
  { target: 'farDoor', verb: ['open', 'go'], walk: true, do: [say('line2.leave1'), say('line2.leave2', 'bryn'), say('line2.leave3'), wait(300), { type: 'end' }] },
  { target: 'shelf', verb: 'look', do: [say('line2.shelfLook')] },
  { target: 'shelf', verb: 'take', do: [say('line2.shelfTake')] },
  ...either('hearth2', 'look', 'ate', 'line2.hearthLookAfter', 'line2.hearthLook'),
  { target: 'hearth2', verb: 'use', when: F('ate'), do: [say('line2.eatAgain')] },
  { target: 'hearth2', verb: 'use', walk: true, do: [say('line2.eat1'), say('line2.eat2', 'bryn'), flag('ate')] },
  { target: 'table', item: 'bread', do: [say('line2.tableBread')] },
  { target: 'table', verb: 'look', do: [say('line2.tableLook')] },
  { target: 'table', verb: ['use', 'take'], do: [say('line2.tableUse')] },
  { target: 'cot', verb: 'look', do: [say('line2.cotLook')] },
  { target: 'cot', verb: 'use', walk: true, do: [pose('hero', 'dead'), wait(900), say('line2.cotUse'), pose('hero', 'stand'), flag('rested')] },
  { target: 'toWorkshop', verb: 'look', do: [say('line2.toWorkshopLook')] },
  { target: 'toWorkshop', verb: 'go', walk: true, do: [go('workshop', 'fromBackroom')] },

  // ---------------------------------------------------------------- Bryn ---
  { target: 'bryn', item: 'bread', do: [say('line2.brynBread', 'bryn')] },
  { target: 'bryn', item: 'regulator', when: NOT('namedNeed'), do: [say('line2.recordsNotYet', 'bryn')] },
  { target: 'bryn', item: '*', do: [say('line2.brynItem', 'bryn')] },
  ...either('bryn', 'look', 'retuned', 'line2.brynLookEvening', 'line2.brynLook'),
  { target: 'bryn', verb: 'talk', do: [{ type: 'dialogue', id: 'bryn' }] },
];

/**
 * Resolves what happens when the player applies a verb (or an inventory item) to a target.
 * Pure: it reads the state and returns commands; the scene plays them and applies their effects.
 */
export function interact(state: GameState, verb: Verb, target: string, item?: string): Command[] {
  const commands = applyRules(RULES, ROOMS, state, verb, target, item) ?? fallback(verb, item);
  return verb === 'look' && !item ? cycleLook(state, target, commands, []) : commands;
}
