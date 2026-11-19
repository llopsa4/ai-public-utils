// Headless story integration. No Phaser, DOM, image imports, timers or implicit fight victories.
import { CHAPTERS, CHAPTER_IDS } from '../../src/chapters';
import { applyDialogueEffects, resolveNode, type ResolvedNode } from '../../src/engine/dialogue';
import { conditionsHold } from '../../src/engine/geometry';
import { applyCommand } from '../../src/engine/state';
import { onEnter } from '../../src/engine/story';
import type { Command, GameState, Verb } from '../../src/engine/types';
import { REGULATOR_FLAGS } from '../../src/chapters/ch1/progression';

type FightCommand = Extract<Command, { type: 'fight' | 'creatureFight' }>;
type ScreenCommand = Extract<Command, { type: 'gear' | 'awaitGear' | 'shop' }>;
export interface StoryFixtures {
  puzzle?: (state: GameState) => 'completed' | 'interrupted';
  farewell?: (state: GameState) => 'leave' | 'return';
  fight?: (state: GameState, command: FightCommand) => 'won' | 'interrupted';
  screen?: (state: GameState, command: ScreenCommand) => 'closed' | 'interrupted';
}
export interface StoryOptions {
  /** Required whenever a dialogue presents choices; return a visible choice's next node. */
  choose?: (next: (string | null)[], node: ResolvedNode, state: GameState) => string | null;
  fixtures?: StoryFixtures;
  /** Match the browser's debug-only chapter advance on `end`. Chapters must be loaded first. */
  debug?: boolean;
}
export interface StoryTrace {
  commands: Command[];
  spoken: string[];
  visited: string[];
  ended: boolean;
  stopped: 'room' | 'chapter' | 'end' | 'chooseChapter' | 'interrupted' | null;
}
const trace = (): StoryTrace => ({ commands: [], spoken: [], visited: [], ended: false, stopped: null });

function chapterFor(state: GameState) {
  const chapter = CHAPTERS[state.chapter];
  if (!chapter) throw new Error(`Load chapter ${state.chapter} before driving its story`);
  return chapter;
}

/** Shared with the graph's branching traversal: resolve first, record speech, then apply effects. */
export function visitStoryDialogueNode(state: GameState, id: string, nodeId: string): { node: ResolvedNode; trace: StoryTrace } {
  const tree = chapterFor(state).dialogues[id];
  if (!tree) throw new Error(`Unknown dialogue ${state.chapter}/${id}`);
  const node = resolveNode(tree, nodeId, state);
  const result = trace();
  result.visited.push(node.id);
  result.commands.push(...node.run);
  for (const line of node.lines) {
    result.commands.push({ type: 'say', ...line });
    result.spoken.push(line.text);
  }
  applyDialogueEffects(state, node);
  return { node, trace: result };
}

function append(into: StoryTrace, from: StoryTrace): void {
  into.commands.push(...from.commands);
  into.spoken.push(...from.spoken);
  into.visited.push(...from.visited);
  into.ended ||= from.ended;
  if (from.stopped) into.stopped = from.stopped;
}

function entry(state: GameState): Command[] {
  const chapter = chapterFor(state), room = chapter.rooms[state.room];
  if (!room) throw new Error(`Unknown room ${state.chapter}/${state.room}`);
  return onEnter(chapter.story, { state, room, cold: !!room.coldIf && conditionsHold(state, room.coldIf) });
}

/** Apply commands in place. Room/chapter/end terminate their original script like the scene runner. */
export function runStoryCommands(state: GameState, commands: readonly Command[], options: StoryOptions = {}): StoryTrace {
  const result = trace();
  let budget = 10000;
  const play = (script: readonly Command[]): void => {
    for (const command of script) {
      if (--budget < 0) throw new Error('Story driver command loop');
      result.commands.push(command);
      switch (command.type) {
        case 'regulatorPuzzle': {
          if(!options.fixtures?.puzzle)throw new Error('Puzzle fixture required for regulatorPuzzle');
          const outcome=options.fixtures.puzzle(state);
          if(outcome==='interrupted'){result.stopped='interrupted';return;}
          if(outcome!=='completed')throw new Error('Invalid puzzle fixture outcome');
          for(const flag of REGULATOR_FLAGS)state.flags[flag]=true;
          break;
        }
        case 'farewellReminder': {
          if(state.flags.gotScarf||state.flags.farewellReminded)break;
          if(!options.fixtures?.farewell)throw new Error('Farewell fixture required for farewellReminder');
          state.flags.farewellReminded=true;
          const outcome=options.fixtures.farewell(state);
          if(outcome==='return'){state.hero.x=195;state.hero.y=300;result.stopped='interrupted';return;}
          if(outcome!=='leave')throw new Error('Invalid farewell fixture outcome');
          break;
        }
        case 'quietBeat': result.spoken.push('line.quietKiln');break;
        case 'ashwaysBeat': case 'checkpoint': break;
        case 'dialogue': {
          const tree = chapterFor(state).dialogues[command.id];
          if (!tree) throw new Error(`Unknown dialogue ${state.chapter}/${command.id}`);
          let nodeId: string | null = tree.start;
          while (nodeId !== null) {
            if (--budget < 0) throw new Error(`Story driver dialogue loop: ${command.id}`);
            const visit = visitStoryDialogueNode(state, command.id, nodeId);
            append(result, visit.trace);
            const { node } = visit;
            if (!node.choices.length) { nodeId = node.next; continue; }
            if (!options.choose) throw new Error(`Choice fixture required for ${command.id}/${node.id}`);
            const next = options.choose(node.choices.map(c => c.next), node, state);
            const choice = node.choices.find(c => c.next === next);
            // Letting a timed choice run out is a choice too: on to `timed.next`, the hero silent.
            if (!choice && node.timed && next === node.timed.next) { nodeId = next; continue; }
            if (!choice) throw new Error(`Invalid choice for ${command.id}/${node.id}: ${next}`);
            result.commands.push({ type: 'say', actor: 'hero', text: choice.text });
            result.spoken.push(choice.text);
            nodeId = choice.next;
          }
          // As the game does: the chapter's reaction to how the conversation went.
          play(chapterFor(state).story.afterDialogue?.(command.id, state) ?? []);
          if (result.stopped) return;
          break;
        }
        case 'room':
          applyCommand(state, command);
          result.stopped = 'room';
          play(entry(state));
          return;
        case 'chapter':
          if (!CHAPTERS[command.id]) throw new Error(`Load chapter ${command.id} before driving its story`);
          applyCommand(state, command);
          result.stopped = 'chapter';
          play(entry(state));
          return;
        case 'chooseChapter':
          // The chapter is over: the chapter map picks what is played next.
          result.ended = true;
          result.stopped = 'chooseChapter';
          return;
        case 'end': {
          const next = CHAPTER_IDS[CHAPTER_IDS.indexOf(state.chapter) + 1];
          if (options.debug && next) play([{ type: 'chapter', id: next }]);
          else { result.ended = true; result.stopped = 'end'; }
          return;
        }
        case 'fight': case 'creatureFight': {
          if (!options.fixtures?.fight) throw new Error(`Fight fixture required for ${command.type}`);
          const outcome = options.fixtures.fight(state, command);
          if (outcome === 'interrupted') { result.stopped = 'interrupted'; return; }
          if (outcome !== 'won') throw new Error(`Invalid fight fixture outcome: ${outcome}`);
          break;
        }
        case 'gear': case 'awaitGear': case 'shop': {
          if (!options.fixtures?.screen) throw new Error(`Screen fixture required for ${command.type}`);
          const outcome = options.fixtures.screen(state, command);
          if (outcome === 'interrupted') { result.stopped = 'interrupted'; return; }
          if (outcome !== 'closed') throw new Error(`Invalid screen fixture outcome: ${outcome}`);
          break;
        }
        case 'say': result.spoken.push(command.text); break;
        // Timed waits and rendering commands finish instantly in this model. They have no story effects.
        case 'wait': case 'shake': case 'fade': case 'moveObject': case 'handle': case 'hatch': case 'perform': case 'heroLayers': case 'step': break;
        case 'walk': case 'face': case 'pose': case 'setFlag': case 'addItem': case 'removeItem':
        case 'looked': case 'hurt': case 'heal': case 'giveSpares': case 'learn':
          applyCommand(state, command);
          break;
        default: {
          const unsupported: never = command;
          throw new Error(`Unsupported story command: ${JSON.stringify(unsupported)}`);
        }
      }
    }
  };
  play(commands);
  return result;
}

/** Run this once for a fresh game or a resumed scene; transitions invoke it automatically. */
export function enterStoryRoom(state: GameState, options: StoryOptions = {}): StoryTrace {
  return runStoryCommands(state, entry(state), options);
}

export function interactStory(state: GameState, verb: Verb, target: string, item?: string, options: StoryOptions = {}): StoryTrace {
  return runStoryCommands(state, chapterFor(state).interact(state, verb, target, item), options);
}
