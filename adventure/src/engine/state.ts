import { ROOMS, START_ENTRY, START_ROOM } from '../content/rooms';
import { newBag, newKit, giveSpares } from './kit';
import type { ActorId, ActorState, Command, GameState } from './types';

export const FLAGS = [
  // Mara's room
  'hasGauntlet', 'hasNotebook',
  // firing house
  'latchFixed', 'alarm', 'metNell', 'gotBread', 'gotScarf',
  // regulator gallery
  'metOren', 'patchFailed', 'toldRepair', 'toldMother', 'toldLeaving', 'toldWhyMe', 'decided', 'procedureKnown', 'kilnCold',
  // ashways
  'valveVented', 'sawSweeper',
  // optional secrets (none gate progress)
  'secretTally', 'secretChalk', 'secretSign', 'secretRail',
  // the first fight and what follows it
  'fought', 'gearChecked', 'metMerchant',
  // optional: background people Mara has talked to
  'metHollis', 'metWren', 'metDace', 'metAnsel', 'metPip', 'metBea',
] as const;

export const SECRET_FLAGS = ['secretTally', 'secretChalk', 'secretSign', 'secretRail'] as const;

/** Set the first time Mara talks to each background person (counted in the notebook). */
export const MET_FLAGS = ['metHollis', 'metWren', 'metDace', 'metAnsel', 'metPip', 'metBea'] as const;

export const ITEMS = ['gauntlet', 'notebook', 'regulator', 'bread', 'scarf'] as const;

const standing = (face: ActorState['face']): ActorState => ({ pose: 'stand', face });

export function newGame(): GameState {
  const entry = ROOMS[START_ROOM].entries[START_ENTRY];
  return {
    room: START_ROOM,
    hero: { x: entry.x, y: entry.y, face: entry.face, pose: 'stand' },
    npcs: { oren: standing('left'), nell: standing('right') },
    flags: {},
    inventory: [],
    looks: {},
    kit: newKit(),
    bag: newBag(),
  };
}

function actorState(state: GameState, actor: ActorId): ActorState {
  return actor === 'hero' ? state.hero : state.npcs[actor];
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
    case 'giveSpares':
      giveSpares(state.kit);
      break;
    case 'pose':
      actorState(state, command.actor).pose = command.pose;
      break;
    case 'face':
      actorState(state, command.actor).face = command.face;
      break;
    case 'walk':
      state.hero.x = command.to.x;
      state.hero.y = command.to.y;
      if (command.face) state.hero.face = command.face;
      break;
    case 'looked':
      state.looks[command.id] = Math.min(99, (state.looks[command.id] ?? 0) + 1);
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
