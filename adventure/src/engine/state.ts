import { CHAPTERS, FIRST_CHAPTER } from '../chapters';
import { newBag, newKit, giveSpares } from './kit';
import type { ActorId, ActorState, Command, GameState } from './types';

const standing = (face: ActorState['face']): ActorState => ({ pose: 'stand', face });

/** A new game at the start of a chapter (the first by default). */
export function newGame(id = FIRST_CHAPTER): GameState {
  const { start, rooms } = CHAPTERS[id];
  const entry = rooms[start.room].entries[start.entry];
  return {
    chapter: id,
    reached: [id],
    earlier: {},
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
      giveSpares(state.kit, CHAPTERS[state.chapter].spares);
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
      const entry = CHAPTERS[state.chapter].rooms[command.room].entries[command.entry];
      state.room = command.room;
      state.hero.x = entry.x;
      state.hero.y = entry.y;
      state.hero.face = entry.face;
      state.hero.pose = 'stand';
      break;
    }
    case 'chapter': {
      // Mara walks into the next chapter with his kit, bag and kept items; this chapter's flags
      // are kept for later chapters to read.
      const kept = CHAPTERS[state.chapter].keptItems;
      const next = newGame(command.id);
      state.earlier[state.chapter] = state.flags;
      Object.assign(state, {
        chapter: command.id, room: next.room, hero: next.hero, npcs: next.npcs, flags: {}, looks: {},
        inventory: state.inventory.filter(i => kept.includes(i)),
        reached: state.reached.includes(command.id) ? state.reached : [...state.reached, command.id],
      });
      break;
    }
    default:
      break;
  }
}
