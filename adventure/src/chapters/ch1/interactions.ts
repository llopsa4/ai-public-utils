import { ROOMS } from './rooms';
import { SECRET_FLAGS } from './flags';
import { applyRules, cycleLook, type Rule } from '../../engine/rules';
import type { ActorId, Command, Condition, GameState, NpcId, Point, Verb } from '../../engine/types';

/**
 * What follows the release: the hatch blows, the fight, Oren's advice and the gear menu, then his
 * send-off. Also used to pick up where a reload left off (fight not yet won, gear not yet checked).
 */
export function afterRelease(f: Record<string, boolean>): Command[] {
  const out: Command[] = [];
  if (!f.fought) {
    out.push({ type: 'hatch' }, say('line.maraWatchOut'), { type: 'fight', id: 'hatchScavenger' }, flag('fought'),
      say('line.orenAfterFight', 'oren'), say('line.maraAfterFight'));
  }
  if (!f.gearChecked) {
    out.push(say('line.orenGear', 'oren'), { type: 'giveSpares' }, { type: 'awaitGear' }, flag('gearChecked'), say('line.orenShelter', 'oren'));
  }
  return out;
}

/** Verbs offered for the characters (hotspot verbs live in rooms.ts). */
export const ACTOR_VERBS: Partial<Record<ActorId, Verb[]>> = {
  hero: ['look', 'talk', 'crouch', 'lie', 'stand'],
  oren: ['look', 'talk', 'crouch', 'lie', 'stand'],
  nell: ['look', 'talk', 'crouch', 'lie', 'stand'],
};

/** Where Mara stands to talk to each character. */
const TALK_SPOTS: Partial<Record<NpcId, { at: Point; face: 'left' | 'right'; npcFace: 'left' | 'right' }>> = {
  oren: { at: { x: 470, y: 304 }, face: 'right', npcFace: 'left' },
  nell: { at: { x: 346, y: 298 }, face: 'left', npcFace: 'right' },
};

/** Inventory items offer these verbs in the action ring. */
export const ITEM_VERBS: Verb[] = ['look', 'use'];

/** Off-screen voice position for Oren calling down the stairs. */
const STAIRS_VOICE = { x: 560, y: 120 };

/** The sweeper by the valve, and the same creature once it has moved to the pipe. */
const SWEEPER = ['sweeper', 'sweeperAtPipe'];

const say = (text: string, actor: ActorId = 'hero', at?: Point): Command => (at ? { type: 'say', actor, text, at } : { type: 'say', actor, text });
const flag = (name: string, value = true): Command => ({ type: 'setFlag', flag: name, value });
const pose = (actor: ActorId, p: 'stand' | 'crouch' | 'dead'): Command => ({ type: 'pose', actor, pose: p });
const wait = (ms: number): Command => ({ type: 'wait', ms });
const go = (room: string, entry: string): Command => ({ type: 'room', room, entry });

function toNpc(id: NpcId): Command[] {
  const s = TALK_SPOTS[id]!;
  return [{ type: 'walk', to: s.at, face: s.face }, { type: 'face', actor: id, face: s.npcFace }];
}

/** Look lines with a second and third variant (`<key>.2`, `<key>.3`); repeated looks cycle through them. */
const VARIED_LOOKS = [
  'line.rackLook', 'line.notebookOnBench', 'line.jarLook', 'line.workbenchLook', 'line.stoolLook', 'line.drumLook', 'line.tentFlapLook',
  'line.toTentLook', 'line.nicheLook', 'line.pulleysLook', 'line.jarsLook', 'line.cartLook', 'line.roomCurtainLook',
  'line.latchLook', 'line.soupLook', 'line.shoesLook', 'line.hearthLook', 'line.stairsLook', 'line.gateLook', 'line.toRoomLook',
  'line.regulatorLook', 'line.gaugeLook', 'line.logbookLook', 'line.lanternLook', 'line.galleryStairsLook',
  'line.valveLook', 'line.passageLook', 'line.pipesLook', 'line.wayBackLook',
  'line.heroLook', 'line.orenLook', 'line.nellLook',
];
const VARIANT_KEYS = VARIED_LOOKS.flatMap(k => [`${k}.2`, `${k}.3`]);

/** Items with their own reply when used on something that doesn't take them. */
const ITEM_FAILS = ['gauntlet', 'notebook', 'regulator', 'bread', 'scarf'];

/** Secrets: looking at them for the first time marks them found. */
const SECRETS: Record<string, { flag: (typeof SECRET_FLAGS)[number]; line: string; again: string }> = {
  tally: { flag: 'secretTally', line: 'line.secretTally', again: 'line.secretTallyAgain' },
  chalk: { flag: 'secretChalk', line: 'line.secretChalk', again: 'line.secretChalkAgain' },
  sign: { flag: 'secretSign', line: 'line.secretSign', again: 'line.secretSignAgain' },
  railNames: { flag: 'secretRail', line: 'line.secretRail', again: 'line.secretRailAgain' },
};

function fallback(verb: Verb, item?: string): Command[] {
  if (item) return [say(ITEM_FAILS.includes(item) ? `line.useFails.${item}` : 'line.useFails')];
  if (verb === 'look') return [say('line.nothingSpecial')];
  return [say('line.cannot')];
}

const F = (name: string): Condition[] => [{ flag: name }];
const NOT = (name: string): Condition[] => [{ notFlag: name }];
const addItem = (item: string): Command => ({ type: 'addItem', item });
const shake = (ms: number): Command => ({ type: 'shake', ms });

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

/** Talking to, posing and handing things to Nell and Oren. */
function npcRules(id: NpcId): Rule[] {
  const getUp = (s: GameState): Command[] => ((s.npcs[id]?.pose ?? 'stand') === 'stand' ? [] : [pose(id, 'stand')]);
  return [
    { target: id, item: '*', do: ({ state }) => [...toNpc(id), ...getUp(state), say(`line.${id}Item`, id)] },
    { target: id, verb: 'look', do: ({ state }) => [say(state.npcs[id]?.pose === 'dead' ? `line.${id}LookDown` : `line.${id}Look${state.flags.kilnCold ? 'Cold' : ''}`)] },
    { target: id, verb: 'talk', do: ({ state }) => [...toNpc(id), ...getUp(state), { type: 'dialogue', id }] },
    { target: id, verb: 'crouch', do: ({ state }) => [...toNpc(id), ...getUp(state), say(`line.askCrouch.${id}`), pose(id, 'crouch'), say(`line.${id}Crouch`, id)] },
    { target: id, verb: 'lie', do: ({ state }) => [...toNpc(id), ...getUp(state), say(`line.askLie.${id}`), say(`line.${id}Lie`, id), pose(id, 'dead')] },
    { target: id, verb: 'stand', do: ({ state }) => ((state.npcs[id]?.pose ?? 'stand') === 'stand' ? [say('line.alreadyStanding')]
      : [...toNpc(id), say('line.askStand'), pose(id, 'stand'), say(`line.${id}Stand`, id)]) },
  ];
}

/** Chapter 1's click rules, first match wins (src/engine/rules.ts); unmatched clicks get `fallback`. */
export const RULES: readonly Rule[] = [
  // ------------------------------------------------------------ secrets ---
  ...Object.entries(SECRETS).flatMap(([target, s]): Rule[] => [
    { target, verb: 'look', when: F(s.flag), do: [say(s.again)] },
    { target, verb: 'look', walk: true, do: [say(s.line), flag(s.flag)] },
  ]),

  // ---------------------------------------------------------- inventory ---
  ...inventoryItem('gauntlet', [say('line.gauntletLook')]),
  ...inventoryItem('notebook', ({ state }) => [say(state.flags.procedureKnown ? 'line.notebookLookAfter' : 'line.notebookLook')]),
  ...inventoryItem('regulator', [say('line.regulatorItemLook')]),
  ...inventoryItem('bread', [say('line.breadLook')]),
  ...inventoryItem('scarf', [say('line.scarfLook')]),

  // ---------------------------------------------------------------- Mara ---
  { target: 'hero', item: 'bread', do: [say('line.breadEat')] },
  { target: 'hero', item: 'scarf', do: [say('line.scarfWear')] },
  { target: 'hero', item: '*', do: [say('line.heroUseItem')] },
  ...either('hero', 'look', 'kilnCold', 'line.heroLookCold', 'line.heroLook'),
  { target: 'hero', verb: 'talk', do: [say('line.heroTalk')] },
  { target: 'hero', verb: 'crouch', do: [pose('hero', 'crouch')] },
  { target: 'hero', verb: 'lie', do: [pose('hero', 'dead'), wait(400), say('line.heroLie')] },
  { target: 'hero', verb: 'stand', do: ({ state }) => (state.hero.pose === 'stand' ? [say('line.heroAlreadyStanding')] : [pose('hero', 'stand')]) },

  // --------------------------------------------------------- Mara's tent ---
  ...either('rack', 'look', 'hasGauntlet', 'line.rackLookEmpty', 'line.rackLook'),
  { target: 'rack', verb: ['take', 'use'], when: F('hasGauntlet'), do: [say('line.rackEmpty')] },
  { target: 'rack', verb: ['take', 'use'], walk: true, do: [wait(150), flag('hasGauntlet'), addItem('gauntlet'), wait(250), say('line.rackTake')] },
  { target: 'notebook', verb: 'look', do: [say('line.notebookOnBench')] },
  { target: 'notebook', verb: 'open', walk: true, do: [say('line.notebookOpen')] },
  { target: 'notebook', verb: 'take', walk: true, do: [flag('hasNotebook'), addItem('notebook'), say('line.notebookTake')] },
  { target: 'tentFlap', verb: 'look', do: [say('line.tentFlapLook')] },
  { target: 'tentFlap', verb: ['go', 'open'], when: NOT('hasGauntlet'), walk: true, do: [say('line.tentNotYet')] },
  { target: 'tentFlap', verb: ['go', 'open'], walk: true, do: [go('maraRoom', 'fromTent')] },
  { target: 'workbench', verb: 'look', do: [say('line.workbenchLook')] },
  { target: 'workbench', verb: 'use', walk: true, do: [say('line.workbenchUse')] },
  { target: 'jar', verb: 'look', do: [say('line.jarLook')] },
  { target: 'jar', verb: 'take', do: [say('line.jarTake')] },
  { target: 'stool', verb: 'look', do: [say('line.stoolLook')] },
  { target: 'stool', verb: 'use', do: [say('line.stoolUse')] },
  { target: 'drum', verb: 'look', do: [say('line.drumLook')] },
  { target: 'drum', verb: 'use', walk: true, do: [say('line.drumUse')] },

  // ------------------------------------------------------------ kiln hall ---
  { target: 'toTent', verb: 'look', do: [say('line.toTentLook')] },
  { target: 'toTent', verb: 'go', walk: true, do: [go('tent', 'fromKilnHall')] },
  ...either('niche', 'look', 'kilnCold', 'line.nicheLookCold', 'line.nicheLook'), // the kiln mouths
  ...either('niche', 'use', 'kilnCold', 'line.nicheUseCold', 'line.nicheUse'),
  { target: 'pulleys', verb: 'look', do: [say('line.pulleysLook')] },
  { target: 'pulleys', verb: 'use', walk: true, do: [say('line.pulleysUse')] },
  { target: 'jars', verb: 'look', do: [say('line.jarsLook')] },
  { target: 'jars', verb: 'take', do: [say('line.jarsTake')] },
  { target: 'cart', verb: 'look', do: [say('line.cartLook')] },
  { target: 'cart', verb: 'use', do: [say('line.cartUse')] },
  { target: 'roomCurtain', verb: 'look', do: [say('line.roomCurtainLook')] },
  { target: 'roomCurtain', verb: 'go', walk: true, do: [go('firingHouse', 'fromMaraRoom')] },

  // -------------------------------------------------------- firing house ---
  { target: 'pantryDoor', item: 'gauntlet', when: F('latchFixed'), do: [say('line.latchAlreadyFixed')] },
  { target: 'pantryDoor', item: 'gauntlet', walk: true, do: [
    pose('hero', 'crouch'), wait(350), flag('latchFixed'), wait(250), pose('hero', 'stand'),
    { type: 'face', actor: 'nell', face: 'right' },
    say('line.nellFixed', 'nell'), say('line.maraLatch'), say('line.nellSoup', 'nell'), say('line.maraNightShift'),
    wait(400), shake(700), say('line.kilnGroans'),
    say('line.orenCalls', 'oren', STAIRS_VOICE), flag('alarm'), say('line.maraAlarm'),
  ] },
  ...either('pantryDoor', 'look', 'latchFixed', 'line.latchLookFixed', 'line.latchLook'),
  { target: 'pantryDoor', verb: ['open', 'use'], when: F('latchFixed'), do: [say('line.latchOpenFixed')] },
  ...either('pantryDoor', ['open', 'use'], 'hasGauntlet', 'line.latchStuckHint', 'line.latchStuck', true),
  { target: 'soup', item: 'bread', do: [say('line.soupBread')] },
  ...either('soup', 'look', 'kilnCold', 'line.soupLookCold', 'line.soupLook'),
  { target: 'soup', verb: 'take', do: [say('line.soupTake')] },
  { target: 'soup', verb: 'use', do: [say('line.soupUse')] },
  ...either('shoes', 'look', 'kilnCold', 'line.shoesLookCold', 'line.shoesLook'),
  { target: 'shoes', verb: 'take', do: [say('line.shoesTake')] },
  ...either('hearth', 'look', 'kilnCold', 'line.hearthLookCold', 'line.hearthLook'),
  ...either('hearth', 'use', 'kilnCold', 'line.hearthUseCold', 'line.hearthUse'),
  ...either('stairs', 'look', 'alarm', 'line.stairsLookAlarm', 'line.stairsLook'),
  { target: 'stairs', verb: 'go', when: NOT('alarm'), do: [say('line.stairsNotYet')] },
  { target: 'stairs', verb: 'go', walk: true, do: [go('gallery', 'fromFiringHouse')] },
  { target: 'kilnGate', verb: 'look', when: [{ has: 'regulator' }], do: [say('line.gateLookReady')] },
  { target: 'kilnGate', verb: 'look', do: [say('line.gateLook')] },
  { target: 'kilnGate', verb: ['open', 'go'], when: [{ has: 'regulator' }], walk: true, do: [say('line.gateLeave'), go('ashways', 'fromFiringHouse')] },
  { target: 'kilnGate', verb: ['open', 'go'], walk: true, do: [say('line.gateNotYet')] },
  { target: 'toRoom', verb: 'look', do: [say('line.toRoomLook')] },
  { target: 'toRoom', verb: 'go', walk: true, do: [go('maraRoom', 'fromFiringHouse')] },

  // ---------------------------------------------------- regulator gallery ---
  { target: 'regulator', item: 'gauntlet', when: F('kilnCold'), do: [say('line.regulatorGone')] },
  { target: 'regulator', item: 'gauntlet', when: NOT('patchFailed'), walk: true, do: [
    pose('hero', 'crouch'), wait(500), shake(300), pose('hero', 'stand'), say('line.maraPatch'), say('line.orenLockingRing', 'oren'), flag('patchFailed'),
  ] },
  { target: 'regulator', item: 'gauntlet', when: NOT('decided'), do: [say('line.notReady')] },
  { target: 'regulator', item: 'gauntlet', when: NOT('procedureKnown'), do: [say('line.needProcedure')] },
  { target: 'regulator', item: 'gauntlet', walk: true, do: ({ state }) => [
    pose('hero', 'crouch'), wait(500), say('line.releaseOne'), wait(300),
    shake(900), flag('kilnCold'), addItem('regulator'), wait(400), pose('hero', 'stand'),
    say('line.releaseDone'), say('line.maraPulse'), ...afterRelease(state.flags),
  ] },
  { target: 'regulator', item: 'notebook', when: F('kilnCold'), do: [say('line.regulatorGone')] },
  { target: 'regulator', item: 'notebook', when: NOT('patchFailed'), do: [say('line.notebookTooSoon')] },
  { target: 'regulator', item: 'notebook', when: NOT('decided'), do: [say('line.notebookNotReady')] },
  { target: 'regulator', item: 'notebook', when: F('procedureKnown'), do: [say('line.procedureAlready')] },
  { target: 'regulator', item: 'notebook', walk: true, do: [say('line.notebookProcedure1'), say('line.notebookProcedure2'), flag('procedureKnown')] },
  { target: 'regulator', verb: 'look', when: F('kilnCold'), do: [say('line.regulatorLookCold')] },
  ...either('regulator', 'look', 'patchFailed', 'line.regulatorLookRing', 'line.regulatorLook'),
  ...either('regulator', ['use', 'take', 'open'], 'kilnCold', 'line.regulatorGone', 'line.regulatorBareHands'),
  ...either('gauge', 'look', 'kilnCold', 'line.gaugeLookCold', 'line.gaugeLook'),
  { target: 'gauge', verb: 'use', do: [say('line.gaugeUse')] },
  { target: 'logbook', verb: 'look', do: [say('line.logbookLook')] },
  { target: 'logbook', verb: 'take', do: [say('line.logbookTake')] },
  { target: 'lantern', verb: 'look', do: [say('line.lanternLook')] },
  { target: 'lantern', verb: 'take', do: [say('line.lanternTake')] },
  { target: 'galleryStairs', verb: 'look', do: [say('line.galleryStairsLook')] },
  { target: 'galleryStairs', verb: 'go', walk: true, do: [go('firingHouse', 'fromGallery')] },

  // ------------------------------------------------------------- ashways ---
  { target: SWEEPER, item: 'gauntlet', do: [say('line.sweeperFight')] },
  { target: SWEEPER, item: 'regulator', do: [say('line.sweeperRegulator')] },
  { target: SWEEPER, verb: 'look', when: F('valveVented'), do: [say('line.sweeperLookPipe')] },
  { target: SWEEPER, verb: 'look', do: [say('line.sweeperLook1'), flag('sawSweeper'), say('line.sweeperLook2')] },
  { target: SWEEPER, verb: 'talk', do: [say('line.sweeperTalk')] },
  { target: SWEEPER, verb: 'use', do: [say('line.sweeperUse')] },
  { target: 'valve', item: 'gauntlet', when: F('valveVented'), do: [say('line.valveAlready')] },
  { target: 'valve', item: 'gauntlet', walk: true, do: [wait(200), shake(250), flag('valveVented'),
    { type: 'moveObject', id: 'sweeper', x: 172, y: 266, ms: 1600 }, say('line.valveVented')] },
  ...either('valve', 'look', 'valveVented', 'line.valveLookVented', 'line.valveLook'),
  ...either('valve', ['open', 'use'], 'valveVented', 'line.valveAlready', 'line.valveStiff', true),
  { target: 'valve', verb: 'close', do: [say('line.valveClose')] },
  ...either('passage', 'look', 'valveVented', 'line.passageLookClear', 'line.passageLook'),
  { target: 'passage', verb: 'go', when: NOT('valveVented'), do: [say('line.passageBlocked')] },
  { target: 'passage', verb: 'go', walk: true, do: [say('line.farewell'), wait(300), { type: 'end' }] },
  { target: 'pipes', verb: 'look', do: [say('line.pipesLook')] },
  { target: 'pipes', verb: 'use', do: [say('line.pipesUse')] },
  { target: 'wayBack', verb: 'look', do: [say('line.wayBackLook')] },
  { target: 'wayBack', verb: 'go', do: [say('line.wayBackGo')] },

  // -------------------------------------------------------------- people ---
  ...npcRules('oren'),
  ...npcRules('nell'),
];

/**
 * Resolves what happens when the player applies a verb (or an inventory item) to a target.
 * Pure: it reads the state and returns commands; the scene plays them and applies their effects.
 * Targets are hotspot ids, character ids, or `item:<id>` for things in the inventory.
 */
export function interact(state: GameState, verb: Verb, target: string, item?: string): Command[] {
  const commands = applyRules(RULES, ROOMS, state, verb, target, item) ?? fallback(verb, item);
  return verb === 'look' && !item ? cycleLook(state, target, commands, VARIED_LOOKS) : commands;
}

const NPC_KEYS = ['Item', 'Look', 'LookCold', 'LookDown', 'Crouch', 'Lie', 'Stand'];

/** Every string key that interactions can emit (used by the translation completeness test). */
export const INTERACTION_KEYS = [
  'line.useFails', 'line.nothingSpecial', 'line.cannot', 'line.alreadyStanding', 'line.askStand',
  'line.gauntletLook', 'line.notebookLook', 'line.notebookLookAfter', 'line.regulatorItemLook', 'line.breadLook', 'line.scarfLook',
  'line.breadEat', 'line.scarfWear', 'line.heroUseItem', 'line.heroLook', 'line.heroLookCold', 'line.heroTalk', 'line.heroLie', 'line.heroAlreadyStanding',
  'line.rackLook', 'line.rackLookEmpty', 'line.rackEmpty', 'line.rackTake',
  'line.notebookOnBench', 'line.notebookOpen', 'line.notebookTake',
  'line.nicheLook', 'line.nicheLookCold', 'line.nicheUse', 'line.nicheUseCold', 'line.roomCurtainLook',
  'line.tentFlapLook', 'line.tentNotYet', 'line.workbenchLook', 'line.workbenchUse', 'line.jarLook', 'line.jarTake',
  'line.stoolLook', 'line.stoolUse', 'line.drumLook', 'line.drumUse', 'line.toTentLook',
  'line.pulleysLook', 'line.pulleysUse', 'line.jarsLook', 'line.jarsTake', 'line.cartLook', 'line.cartUse',
  'line.latchAlreadyFixed', 'line.nellFixed', 'line.maraLatch', 'line.nellSoup', 'line.maraNightShift', 'line.kilnGroans', 'line.orenCalls', 'line.maraAlarm',
  'line.latchLook', 'line.latchLookFixed', 'line.latchOpenFixed', 'line.latchStuck', 'line.latchStuckHint',
  'line.soupBread', 'line.soupLook', 'line.soupLookCold', 'line.soupTake', 'line.soupUse',
  'line.shoesLook', 'line.shoesLookCold', 'line.shoesTake', 'line.hearthLook', 'line.hearthLookCold', 'line.hearthUse', 'line.hearthUseCold',
  'line.stairsLook', 'line.stairsLookAlarm', 'line.stairsNotYet', 'line.gateLook', 'line.gateLookReady', 'line.gateNotYet', 'line.gateLeave', 'line.toRoomLook',
  'line.maraWatchOut', 'line.orenAfterFight', 'line.maraAfterFight', 'line.orenGear',
  'line.regulatorGone', 'line.maraPatch', 'line.orenLockingRing', 'line.notReady', 'line.needProcedure', 'line.releaseOne', 'line.releaseDone',
  'line.orenShelter', 'line.maraPulse', 'line.notebookTooSoon', 'line.notebookNotReady', 'line.procedureAlready', 'line.notebookProcedure1', 'line.notebookProcedure2',
  'line.regulatorLook', 'line.regulatorLookRing', 'line.regulatorLookCold', 'line.regulatorBareHands',
  'line.gaugeLook', 'line.gaugeLookCold', 'line.gaugeUse', 'line.logbookLook', 'line.logbookTake', 'line.lanternLook', 'line.lanternTake', 'line.galleryStairsLook',
  'line.sweeperFight', 'line.sweeperRegulator', 'line.sweeperLookPipe', 'line.sweeperLook1', 'line.sweeperLook2', 'line.sweeperTalk', 'line.sweeperUse',
  'line.valveAlready', 'line.valveVented', 'line.valveLook', 'line.valveLookVented', 'line.valveStiff', 'line.valveClose',
  'line.passageLook', 'line.passageLookClear', 'line.passageBlocked', 'line.farewell', 'line.pipesLook', 'line.pipesUse', 'line.wayBackLook', 'line.wayBackGo',
  ...(['oren', 'nell'] as const).flatMap(id => [...NPC_KEYS.map(k => `line.${id}${k}`), `line.askCrouch.${id}`, `line.askLie.${id}`]),
  ...VARIANT_KEYS,
  ...ITEM_FAILS.map(i => `line.useFails.${i}`),
  ...Object.values(SECRETS).flatMap(s => [s.line, s.again]),
];
