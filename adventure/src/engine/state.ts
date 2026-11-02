import { chapter } from '../chapters';
import { newBag, newKit, giveSpares } from './kit';
import type { ActorId, ActorState, Command, GameState } from './types';

const standing = (face: ActorState['face']): ActorState => ({ pose: 'stand', face });

export function newGame(): GameState {
  const { start, rooms } = chapter();
  const entry = rooms[start.room].entries[start.entry];
  return {
    room: start.room,
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
      giveSpares(state.kit, chapter().spares);
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
      const entry = chapter().rooms[command.room].entries[command.entry];
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
