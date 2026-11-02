import { ROOMS, START_ENTRY, START_ROOM } from '../content/rooms';
import type { Command, GameState } from './types';

export const FLAGS = ['suitcaseOpen', 'keyTaken', 'doorUnlocked', 'doorOpen', 'metKeeper', 'askedWho', 'toldKey'] as const;
export const ITEMS = ['key'] as const;

export function newGame(): GameState {
  const entry = ROOMS[START_ROOM].entries[START_ENTRY];
  return {
    room: START_ROOM,
    hero: { x: entry.x, y: entry.y, face: entry.face, pose: 'stand' },
    keeper: { face: 'left', pose: 'stand' },
    flags: {},
    inventory: [],
  };
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

/** Applies the state-changing part of a command. Presentation-only commands leave the state untouched. */
export function applyCommand(state: GameState, command: Command): void {
  switch (command.type) {
    case 'setFlag':
      if (command.value) state.flags[command.flag] = true;
      else delete state.flags[command.flag];
      break;
    case 'addItem':
      if (!state.inventory.includes(command.item)) state.inventory.push(command.item);
      break;
    case 'removeItem':
      state.inventory = state.inventory.filter(i => i !== command.item);
      break;
    case 'pose':
      state[command.actor].pose = command.pose;
      break;
    case 'face':
      state[command.actor].face = command.face;
      break;
    case 'walk':
      state.hero.x = command.to.x;
      state.hero.y = command.to.y;
      if (command.face) state.hero.face = command.face;
      break;
    case 'room': {
      const entry = ROOMS[command.room].entries[command.entry];
      state.room = command.room;
      state.hero.x = entry.x;
      state.hero.y = entry.y;
      state.hero.face = entry.face;
      state.hero.pose = 'stand';
      break;
    }
    default:
      break;
  }
}
