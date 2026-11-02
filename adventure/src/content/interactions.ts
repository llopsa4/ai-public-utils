import { ROOMS } from './rooms';
import type { Command, GameState, Verb } from '../engine/types';

/** Verbs offered for the two characters (hotspot verbs live in rooms.ts). */
export const ACTOR_VERBS: Record<'hero' | 'keeper', Verb[]> = {
  hero: ['look', 'talk', 'crouch', 'lie', 'stand'],
  keeper: ['look', 'talk', 'crouch', 'lie', 'stand'],
};

export const KEEPER_TALK_SPOT = { x: 366, y: 304 };

const say = (text: string, actor: 'hero' | 'keeper' = 'hero'): Command => ({ type: 'say', actor, text });
const flag = (name: string, value = true): Command => ({ type: 'setFlag', flag: name, value });
const heroPose = (pose: 'stand' | 'crouch' | 'dead'): Command => ({ type: 'pose', actor: 'hero', pose });

function approach(state: GameState, target: string): Command[] {
  const spot = ROOMS[state.room].hotspots.find(h => h.id === target);
  return spot?.walkTo ? [{ type: 'walk', to: spot.walkTo, face: spot.face }] : [];
}

function fallback(verb: Verb, item?: string): Command[] {
  if (item) return [say('line.useFails')];
  if (verb === 'look') return [say('line.nothingSpecial')];
  return [say('line.cannot')];
}

/**
 * Resolves what happens when the player applies a verb (or an inventory item) to a target.
 * Pure: it reads the state and returns commands; the scene plays them and applies their effects.
 */
export function interact(state: GameState, verb: Verb, target: string, item?: string): Command[] {
  const f = state.flags;

  switch (target) {
    // ----------------------------------------------------------- the hero ---
    case 'hero':
      if (item) return [say('line.heroUseItem')];
      switch (verb) {
        case 'look': return [say('line.heroLook')];
        case 'talk': return [say('line.heroTalk')];
        case 'crouch': return [heroPose('crouch')];
        case 'lie': return [heroPose('dead'), { type: 'wait', ms: 400 }, say('line.heroLie')];
        case 'stand': return state.hero.pose === 'stand' ? [say('line.heroAlreadyStanding')] : [heroPose('stand')];
      }
      break;

    // ---------------------------------------------------------------- hall ---
    case 'suitcase':
      if (item === 'key') return [...approach(state, target), say('line.keyNotSuitcase')];
      if (item) break;
      switch (verb) {
        case 'look':
          if (!f.suitcaseOpen) return [say('line.suitcaseLookClosed')];
          return [say(f.keyTaken ? 'line.suitcaseLookEmpty' : 'line.suitcaseLookKey')];
        case 'open':
          if (f.suitcaseOpen) return [say('line.alreadyOpen')];
          return [...approach(state, target), heroPose('crouch'), { type: 'wait', ms: 250 }, flag('suitcaseOpen'),
            { type: 'wait', ms: 200 }, heroPose('stand'), say(f.keyTaken ? 'line.suitcaseOpenEmpty' : 'line.suitcaseOpenKey')];
        case 'close':
          if (!f.suitcaseOpen) return [say('line.alreadyClosed')];
          return [...approach(state, target), heroPose('crouch'), { type: 'wait', ms: 250 }, flag('suitcaseOpen', false),
            { type: 'wait', ms: 200 }, heroPose('stand')];
        case 'take': return [say('line.suitcaseTake')];
        case 'use': return [say('line.useHow')];
      }
      break;

    case 'key':
      if (item) break;
      switch (verb) {
        case 'look': return [say('line.keyLook')];
        case 'take':
          if (f.keyTaken) break;
          return [...approach(state, target), heroPose('crouch'), { type: 'wait', ms: 300 }, flag('keyTaken'), { type: 'addItem', item: 'key' },
            { type: 'wait', ms: 200 }, heroPose('stand'), say('line.keyTaken')];
        case 'use': return [say('line.keyUseInPlace')];
      }
      break;

    case 'door':
      if (item === 'key') {
        if (f.doorUnlocked) return [say('line.doorAlreadyUnlocked')];
        return [...approach(state, target), { type: 'wait', ms: 250 }, flag('doorUnlocked'), { type: 'removeItem', item: 'key' }, say('line.doorUnlocked')];
      }
      if (item) break;
      switch (verb) {
        case 'look':
          if (f.doorOpen) return [say('line.doorLookOpen')];
          return [say(f.doorUnlocked ? 'line.doorLookUnlocked' : 'line.doorLookLocked')];
        case 'open':
          if (f.doorOpen) return [say('line.alreadyOpen')];
          if (!f.doorUnlocked) return [...approach(state, target), say('line.doorLocked')];
          return [...approach(state, target), flag('doorOpen')];
        case 'close':
          if (!f.doorOpen) return [say('line.alreadyClosed')];
          return [...approach(state, target), flag('doorOpen', false)];
        case 'use':
          return [say(f.doorUnlocked ? 'line.doorUseHint' : 'line.doorNeedsKey')];
        case 'go':
          if (!f.doorOpen) return [...approach(state, target), say('line.doorClosedGo')];
          return [...approach(state, target), { type: 'room', room: 'street', entry: 'fromHall' }];
      }
      break;

    case 'window':
      if (item) break;
      if (verb === 'look') return [say('line.windowLook')];
      if (verb === 'open') return [...approach(state, target), say('line.windowOpen')];
      break;

    case 'painting':
      if (item) break;
      if (verb === 'look') return [say('line.paintingLook')];
      if (verb === 'take') return [say('line.paintingTake')];
      break;

    case 'lamp':
      if (item) break;
      if (verb === 'look') return [say('line.lampLook')];
      if (verb === 'use') return [...approach(state, target), say('line.lampUse')];
      break;

    // -------------------------------------------------------------- street ---
    case 'hotelDoor':
      if (item === 'key') return [say('line.hotelDoorKey')];
      if (item) break;
      switch (verb) {
        case 'look': return [say('line.hotelDoorLook')];
        case 'go': return [...approach(state, target), { type: 'room', room: 'hall', entry: 'fromStreet' }];
        case 'open': return [say('line.alreadyOpen')];
        case 'close': return [say('line.hotelDoorClose')];
      }
      break;

    case 'sign':
      if (item) break;
      if (verb === 'look') return [say('line.signLook')];
      break;

    case 'lampPost':
      if (item) break;
      if (verb === 'look') return [say('line.lampPostLook')];
      if (verb === 'use') return [say('line.lampPostUse')];
      break;

    case 'buildings':
      if (item) break;
      if (verb === 'look') return [say('line.buildingsLook')];
      if (verb === 'open') return [say('line.buildingsOpen')];
      break;

    case 'keeper': {
      const toKeeper: Command[] = [{ type: 'walk', to: KEEPER_TALK_SPOT, face: 'right' }, { type: 'face', actor: 'keeper', face: 'left' }];
      const getUp: Command[] = state.keeper.pose === 'stand' ? [] : [{ type: 'pose', actor: 'keeper', pose: 'stand' }];
      if (item) return [...toKeeper, ...getUp, say('line.keeperItem', 'keeper')];
      switch (verb) {
        case 'look':
          return [say(state.keeper.pose === 'dead' ? 'line.keeperLookDead' : 'line.keeperLook')];
        case 'talk':
          return [...toKeeper, ...getUp, { type: 'dialogue', id: 'keeper' }];
        case 'crouch':
          return [...toKeeper, ...getUp, say('line.askCrouch'), { type: 'pose', actor: 'keeper', pose: 'crouch' }, say('line.keeperCrouch', 'keeper')];
        case 'lie':
          return [...toKeeper, ...getUp, say('line.askLie'), say('line.keeperLie', 'keeper'), { type: 'pose', actor: 'keeper', pose: 'dead' }];
        case 'stand':
          if (state.keeper.pose === 'stand') return [say('line.keeperAlreadyStanding')];
          return [...toKeeper, say('line.askStand'), { type: 'pose', actor: 'keeper', pose: 'stand' }, say('line.keeperStand', 'keeper')];
      }
      break;
    }
  }
  return fallback(verb, item);
}

/** Every string key that interactions can emit (used by the translation completeness test). */
export const INTERACTION_KEYS = [
  'line.useFails', 'line.nothingSpecial', 'line.cannot',
  'line.heroUseItem', 'line.heroLook', 'line.heroTalk', 'line.heroLie', 'line.heroAlreadyStanding',
  'line.keyNotSuitcase', 'line.suitcaseLookClosed', 'line.suitcaseLookEmpty', 'line.suitcaseLookKey', 'line.alreadyOpen',
  'line.suitcaseOpenEmpty', 'line.suitcaseOpenKey', 'line.alreadyClosed', 'line.suitcaseTake', 'line.useHow',
  'line.keyLook', 'line.keyTaken', 'line.keyUseInPlace',
  'line.doorAlreadyUnlocked', 'line.doorUnlocked', 'line.doorLookOpen', 'line.doorLookUnlocked', 'line.doorLookLocked',
  'line.doorLocked', 'line.doorUseHint', 'line.doorNeedsKey', 'line.doorClosedGo',
  'line.windowLook', 'line.windowOpen', 'line.paintingLook', 'line.paintingTake', 'line.lampLook', 'line.lampUse',
  'line.hotelDoorKey', 'line.hotelDoorLook', 'line.hotelDoorClose', 'line.signLook', 'line.lampPostLook', 'line.lampPostUse',
  'line.buildingsLook', 'line.buildingsOpen',
  'line.keeperItem', 'line.keeperLook', 'line.keeperLookDead', 'line.askCrouch', 'line.keeperCrouch', 'line.askLie',
  'line.keeperLie', 'line.keeperAlreadyStanding', 'line.askStand', 'line.keeperStand',
];
