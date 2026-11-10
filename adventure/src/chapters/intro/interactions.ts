import { ROOMS } from './rooms';
import { applyRules, cycleLook, type Rule } from '../../engine/rules';
import type { ActorId, Command, Condition, GameState, Verb } from '../../engine/types';
import { say, flag, add, drop, pose, wait, go, walk, F, NOT } from '../script';

/** Verbs offered for the people (hotspot verbs live in rooms.ts). Silas can read people. */
export const ACTOR_VERBS: Partial<Record<ActorId, Verb[]>> = {
  hero: ['look', 'talk', 'crouch', 'stand'],
  guard: ['look', 'talk', 'read'],
  warden: ['look', 'talk', 'read'],
  sigrid: ['look', 'read'],
};

export const ITEM_VERBS: Verb[] = ['look', 'use'];


/** Where Silas stands to speak to the guard through the bars, and to the guardroom's guard. */
const AT_BARS = walk(350, 300, 'right');
/** Where "Harrow" calls Benn over: the middle of the cage, by the bars at the front. */
const AT_FRONT = walk(232, 322, 'right');
// Silas comes up behind Kell, from the left; Kell turns round to talk.
const AT_DESK = walk(214, 306, 'right');

function fallback(verb: Verb, item?: string): Command[] {
  if (item) return [say('line.i.useFails')];
  if (verb === 'look') return [say('line.i.nothing')];
  if (verb === 'read') return [say('line.i.readNothing')];
  return [say('line.i.cannot')];
}

/** An inventory item: its look line; anything else done to it can't be (crafting rules come first). */
const inventoryItem = (id: string): Rule[] => [
  { target: `item:${id}`, verb: 'look', do: [say(`line.i.${id}Look`)] },
  { target: `item:${id}`, do: [say('line.i.cannot')] },
  { target: `item:${id}`, item: '*', do: [say('line.i.useFails')] },
];

/** Two items that make something together, used either way round. */
const combine = (a: string, b: string, then: Rule['do'], when?: Condition[]): Rule[] => [
  { target: `item:${a}`, item: b, when, do: then },
  { target: `item:${b}`, item: a, when, do: then },
];

/** Fishing the frame off the guard's table through the bars (the hook line: the nail tied to a blanket strip). */
const FISH: Command[] = [
  AT_BARS, say('line.i.fish1'), pose('hero', 'crouch'), wait(700), say('line.i.fish2'), wait(500), pose('hero', 'stand'),
  drop('hookLine'), add('nail'), add('frame'), flag('gotFrame'), say('line.i.fish3'),
];

/** Wearing a mask: on, off, or swapped for the other one (the persona's name, portrait and sprite follow). */
const wear = (mask: 'maskHarrow'): Rule[] => {
  const on = 'wearingHarrow';
  const other = 'wearingClerk';
  return [
    ...(mask === 'maskHarrow' ? [{ target: 'hero', item: mask, when: F('harrowCracked'), do: [say('line.i.harrowCracked')] }] : []),
    { target: 'hero', item: mask, when: F(on), do: [flag(on, false), say(`line.i.${mask}Off`)] },
    { target: 'hero', item: mask, do: [flag(other, false), flag(on), say(`line.i.${mask}On`)] },
  ];
};

/** Chapter rules, first match wins (src/engine/rules.ts); unmatched clicks get `fallback`. */
export const RULES: readonly Rule[] = [
  // --------------------------------------------------------- crafting ---
  ...combine('nail', 'strip', [drop('nail'), drop('strip'), add('hookLine'), say('line.i.hookLine')]),
  ...combine('wetPlaster', 'crust', [drop('wetPlaster'), drop('crust'), add('putty'), say('line.i.putty')]),
  ...combine('frame', 'putty', [say('line.i.needFace')], NOT('sawHarrow')),
  ...combine('frame', 'putty', [drop('frame'), drop('putty'), add('maskHarrow'), flag('harrowMade'), say('line.i.harrowMade1'), say('line.i.harrowMade2')]),
  ...combine('frame', 'plaster', [say('line.i.plasterDry')]),
  ...['plate', 'crust', 'nail', 'strip', 'hookLine', 'frame', 'plaster', 'wetPlaster', 'putty', 'maskHarrow', 'keys', 'ledger'].flatMap(inventoryItem),

  // ------------------------------------------------------------ Silas ---
  ...wear('maskHarrow'),
  // The clerk: his own hood pulled low and the ledger held to the chest.
  { target: 'hero', item: 'ledger', when: F('wearingClerk'), do: [flag('wearingClerk', false), say('line.i.maskClerkOff')] },
  { target: 'hero', item: 'ledger', do: [flag('wearingHarrow', false), flag('wearingClerk'), flag('clerkMade'), say('line.i.clerkMade')] },
  { target: 'hero', item: '*', do: [say('line.i.heroItem')] },
  { target: 'hero', verb: 'look', when: F('wearingHarrow'), do: [say('line.i.heroLookHarrow')] },
  { target: 'hero', verb: 'look', when: F('wearingClerk'), do: [say('line.i.heroLookClerk')] },
  { target: 'hero', verb: 'look', do: [say('line.i.heroLook')] },
  { target: 'hero', verb: 'talk', do: [say('line.i.heroTalk')] },
  { target: 'hero', verb: 'crouch', do: [pose('hero', 'crouch')] },
  { target: 'hero', verb: 'stand', do: [pose('hero', 'stand')] },

  // ------------------------------------------------------------- cell ---
  { target: 'plate', verb: 'look', do: [say('line.i.plateLook')] },
  { target: 'plate', verb: 'take', walk: true, do: [pose('hero', 'crouch'), wait(300), add('plate'), add('crust'), flag('tookPlate'), pose('hero', 'stand'), say('line.i.plateTake')] },
  // The tin plate, wedged in the window bars, throws the moonlight across the cell: the darkness
  // lifts, and the plate stays there.
  { target: 'window', item: 'plate', walk: true, do: [say('line.i.angle1'), wait(500), drop('plate'), flag('cellLit'), wait(900), say('line.i.angle2'), say('line.i.angle3')] },
  { target: 'window', verb: 'look', when: F('cellLit'), do: [say('line.i.windowLookLit')] },
  { target: 'window', verb: 'look', do: [say('line.i.windowLook')] },
  { target: 'window', verb: 'use', do: [say('line.i.windowUse')] },
  { target: 'cot', verb: 'look', do: [say('line.i.cotLook')] },
  // The frame gives a loose nail; the blanket a strip torn off it (either first).
  { target: 'cot', verb: ['take', 'use'], when: NOT('tookNail'), walk: true, do: [pose('hero', 'crouch'), wait(400), add('nail'), flag('tookNail'), pose('hero', 'stand'), say('line.i.nailTake')] },
  { target: 'cot', verb: ['take', 'use'], do: [say('line.i.cotEmpty')] },
  { target: 'blanket', verb: 'look', do: [say('line.i.blanketLook')] },
  { target: 'blanket', verb: ['take', 'use'], when: NOT('tookStrip'), walk: true, do: [add('strip'), flag('tookStrip'), say('line.i.stripTake')] },
  { target: 'blanket', verb: ['take', 'use'], do: [say('line.i.blanketEnough')] },
  { target: 'wall', verb: 'look', do: [say('line.i.wallLook')] },
  { target: 'wall', verb: ['take', 'use'], when: F('tookPlaster'), do: [say('line.i.wallEnough')] },
  { target: 'wall', verb: ['take', 'use'], walk: true, do: [add('plaster'), flag('tookPlaster'), say('line.i.plasterTake')] },
  { target: 'bucket', item: 'plaster', walk: true, do: [drop('plaster'), add('wetPlaster'), say('line.i.wetPlaster')] },
  { target: 'bucket', item: 'crust', do: [say('line.i.soggyBread')] },
  { target: 'bucket', verb: 'look', do: [say('line.i.bucketLook')] },
  { target: 'bucket', verb: ['use', 'take'], do: [say('line.i.bucketUse')] },
  { target: 'candle', verb: 'look', do: [say('line.i.candleLook')] },
  { target: 'candle', verb: 'take', do: [say('line.i.candleTake')] },
  { target: 'table', item: 'hookLine', when: NOT('gotFrame'), do: FISH },
  { target: 'frame', item: 'hookLine', do: FISH },
  { target: 'table', verb: 'look', when: F('gotFrame'), do: [say('line.i.tableLookEmpty')] },
  { target: 'table', verb: 'look', when: F('cellLit'), do: [say('line.i.tableLook')] },
  { target: 'table', verb: 'look', do: [say('line.i.tableLookDark')] },
  { target: 'table', verb: 'take', do: [say('line.i.outOfReach')] },
  { target: 'frame', verb: 'look', do: [say('line.i.frameLook')] },
  { target: 'frame', verb: 'take', do: [say('line.i.frameReach')] },
  // The roster gives Silas a face to copy: Sergeant Harrow's.
  { target: 'roster', verb: 'look', when: F('sawHarrow'), do: [say('line.i.rosterAgain')] },
  { target: 'roster', verb: 'look', do: [say('line.i.roster1'), say('line.i.roster2'), flag('sawHarrow')] },
  // The cell door: Benn's keys (palmed), or the bent nail.
  // The stairs up, at the warm light: through the open door, and not without his cloak.
  { target: 'cellStairs', verb: 'look', do: [say('line.i.stairsLook')] },
  { target: 'cellStairs', verb: 'go', when: NOT('cellOpen'), do: [say('line.i.stairsCaged')] },
  { target: 'cellStairs', verb: 'go', when: NOT('tookCloak'), walk: true, do: [say('line.i.notWithoutCloak')] },
  { target: 'cellStairs', verb: 'go', walk: true, do: [say('line.i.upStairs'), go('guardroom', 'fromCell')] },
  { target: 'cellDoor', item: 'keys', when: NOT('guardGone'), do: [say('line.i.notWatched')] },
  { target: 'cellDoor', item: 'keys', walk: true, do: [say('line.i.keysTurn'), flag('cellOpen'), wait(400), say('line.i.doorOpen')] },
  { target: 'cellDoor', item: 'nail', when: NOT('guardGone'), do: [say('line.i.notWatched')] },
  { target: 'cellDoor', item: 'nail', walk: true, do: [pose('hero', 'crouch'), say('line.i.pick1'), wait(1200), pose('hero', 'stand'), flag('cellOpen'), say('line.i.doorOpen')] },
  { target: 'cellDoor', verb: 'look', do: [say('line.i.cellDoorLook')] },
  { target: 'cellDoor', verb: ['open', 'go', 'use'], do: [say('line.i.cellDoorLocked')] },
  // His own cloak, confiscated, hung on a nail out of reach.
  { target: 'cloak', verb: 'look', do: [say('line.i.cloakLook')] },
  { target: 'cloak', verb: 'take', when: F('cellOpen'), walk: true, do: [{ type: 'fade', to: 'black', ms: 600, sound: 'dress' }, flag('tookCloak'), wait(300), { type: 'fade', to: 'clear', ms: 600 }, say('line.i.cloakOn')] },
  { target: 'cloak', verb: 'take', do: [say('line.i.cloakTake')] },

  // ---------------------------------------- Benn, asleep again by the guardroom stove ---
  { target: 'guard', verb: 'look', when: F('guardGone'), do: [say('line.i.bennDozing')] },
  { target: 'guard', verb: 'read', when: F('guardGone'), do: [say('line.i.snore', 'guard'), say('line.i.readBennAsleep')] },
  { target: 'guard', verb: 'talk', when: F('guardGone'), do: [say('line.i.letHimSleep')] },
  { target: 'guard', item: '*', when: F('guardGone'), do: [say('line.i.letHimSleep')] },

  // ------------------------------------------------------- Benn, the guard ---
  { target: 'guard', verb: 'read', when: F('readGuard'), do: [say('line.i.readGuardAgain')] },
  { target: 'guard', verb: 'read', walk: false, do: [say('line.i.guardMumble', 'guard'), say('line.i.readGuard1'), say('line.i.readGuard2'), flag('readGuard')] },
  { target: 'guard', verb: 'look', when: NOT('cellLit'), do: [say('line.i.guardLookDark')] },
  { target: 'guard', verb: 'look', do: [say('line.i.guardLook')] },
  // Shouting gets nothing but a snore; the Harrow mask gets a sergeant's welcome.
  { target: 'guard', verb: 'talk', when: F('wearingHarrow'), do: [AT_FRONT, { type: 'checkpoint' }, flag('guardAwake'), { type: 'dialogue', id: 'guard' }] },
  { target: 'guard', verb: 'talk', when: NOT('shouted'), do: [AT_BARS, say('line.i.shout1'), say('line.i.snore', 'guard'), say('line.i.shout2'), say('line.i.snore', 'guard'), flag('shouted'), say('line.i.shout3')] },
  { target: 'guard', verb: 'talk', do: [say('line.i.noShout')] },
  { target: 'guard', item: '*', do: [say('line.i.guardItem')] },

  // ------------------------------------------------------------ guardroom ---
  { target: 'ledger', verb: ['look', 'open'], do: [say('line.i.ledgerLook1'), say('line.i.ledgerLook2')] },
  { target: 'ledger', verb: 'take', walk: true, do: [add('ledger'), flag('tookLedger'), say('line.i.ledgerTake')] },
  { target: 'stove', verb: 'look', do: [say('line.i.stoveLook')] },
  { target: 'stove', verb: 'use', do: [say('line.i.stoveUse')] },
  { target: 'downStairs', verb: 'look', do: [say('line.i.downLook')] },
  { target: 'downStairs', verb: 'go', do: [say('line.i.noGoingBack')] },
  { target: 'grate', verb: ['open', 'go', 'use'], when: F('grateOpen'), walk: true, do: [go('outerDoor', 'fromGuardroom')] },
  { target: 'grate', item: 'nail', when: NOT('wardenBusy'), do: [say('line.i.wardenWatching')] },
  { target: 'grate', item: 'nail', walk: true, do: [pose('hero', 'crouch'), say('line.i.pick2'), wait(1400), say('line.i.pick3'), pose('hero', 'stand'), flag('grateOpen'), say('line.i.grateOpen')] },
  { target: 'grate', item: 'keys', do: [say('line.i.keysWrong')] },
  { target: 'grate', verb: 'look', do: [say('line.i.grateLook')] },
  { target: 'grate', verb: ['open', 'go', 'use'], do: [say('line.i.grateLocked')] },

  // ------------------------------------------------------- Kell, the warden ---
  { target: 'warden', verb: 'read', when: F('readWarden'), do: [say('line.i.readWardenAgain')] },
  { target: 'warden', verb: 'read', do: [say('line.i.readWarden1'), say('line.i.readWarden2'), say('line.i.readWarden3'), flag('readWarden')] },
  { target: 'warden', verb: 'look', when: F('wardenBusy'), do: [say('line.i.wardenLookBusy')] },
  { target: 'warden', verb: 'look', do: [say('line.i.wardenLook')] },
  { target: 'warden', verb: 'talk', when: F('wardenBusy'), do: [say('line.i.wardenLeave')] },
  { target: 'warden', verb: 'talk', when: F('wearingHarrow'), do: [say('line.i.notHarrowHere')] },
  { target: 'warden', verb: 'talk', when: NOT('wearingClerk'), do: [say('line.i.notAsMyself')] },
  { target: 'warden', verb: 'talk', do: [AT_DESK, { type: 'face', actor: 'warden', face: 'left' }, { type: 'checkpoint' }, { type: 'dialogue', id: 'warden' }] },
  { target: 'warden', item: '*', do: [say('line.i.wardenItem')] },

  // --------------------------------------------------------------- outside ---
  { target: 'walls', verb: 'look', do: [say('line.i.wallsLook')] },
  { target: 'sigrid', verb: 'look', do: [say('line.i.sigridLook')] },
  { target: 'sigrid', verb: 'read', do: [say('line.i.readSigrid')] },
];

/**
 * Until the moonlight is thrown across the cell, only what is in reach of Silas's eyes works: the
 * window and its thread of moonlight, the plate by his feet, the candle-lit table and guard beyond
 * the bars (look, and shouting), and Silas himself. Anything else gets "I can't see", each time a
 * stronger clue towards the plate and the window.
 */
const IN_THE_DARK: Partial<Record<string, readonly Verb[]>> = {
  window: ['look', 'use'], plate: ['look', 'take'], candle: ['look'], table: ['look'],
  guard: ['look', 'talk'], hero: ['look', 'talk', 'crouch', 'stand'], 'item:plate': ['look'], 'item:crust': ['look'],
  cellStairs: ['look', 'go'],
};

function inTheDark(state: GameState, verb: Verb, target: string, item?: string): Command[] | null {
  if (state.room !== 'cell' || state.flags.cellLit) return null;
  if (item === 'plate' && target === 'window') return null;
  if (!item && IN_THE_DARK[target]?.includes(verb)) return null;
  const stage = state.inventory.includes('plate') ? 'plate' : 'noPlate';
  const n = (state.looks['intro.dark'] ?? 0) % 3 + 1;
  return [say(`line.i.dark.${stage}.${n}`), { type: 'looked', id: 'intro.dark' }];
}

export function interact(state: GameState, verb: Verb, target: string, item?: string): Command[] {
  const dark = inTheDark(state, verb, target, item);
  if (dark) return dark;
  const commands = applyRules(RULES, ROOMS, state, verb, target, item) ?? fallback(verb, item);
  return verb === 'look' && !item ? cycleLook(state, target, commands, []) : commands;
}
