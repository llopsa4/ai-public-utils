import type { EncounterDefinition } from '../combat/types';
import type { Reward } from '../content/kit';
import type { DialogueTree } from '../engine/dialogue';
import type { CrowdDef, ExtraDef } from '../engine/crowd';
import type { ActorId, ActorState, Command, GameState, NpcId, RoomDef, Verb } from '../engine/types';
import type { Mood as MusicMood } from '../game/assets';
import type { StoryRules } from '../engine/story';

export interface Objective { key: string; done: boolean; optional: boolean }

/**
 * Everything one chapter of the story brings: its rooms, people, click rules, conversations,
 * fights and strings. The engine, scene and interface read the active chapter through
 * src/chapters/index.ts and never name a chapter's rooms, flags or lines themselves.
 */
export interface Chapter {
  id: string;
  /** String key of the chapter's title. */
  title: string;
  start: { room: string; entry: string };
  /** The chapter's cast and how each stands at the start. */
  npcs: Partial<Record<NpcId, ActorState>>;
  /** Items a fresh start of the chapter hands over (a debug jump); a chapter change keeps Mara's own too. */
  startItems?: readonly string[];
  /** The end card's title and text (string keys); without them the game's own. */
  end?: { title: string; text: string };
  /** The chapter's art, loaded with it in the browser (later chapters; chapter 1's is the game's). */
  art?: () => Promise<void>;
  rooms: Record<string, RoomDef>;
  /** Story flags saves accept for this chapter. */
  flags: readonly string[];
  items: readonly string[];
  /** Items Mara takes into the next chapter. */
  keptItems: readonly string[];
  /** Optional finds counted in the notebook. */
  secretFlags: readonly string[];
  /** Background people Mara has talked to (counted in the notebook). */
  metFlags: readonly string[];
  /** What a verb, or an item, does to a target: commands for the scene to play. */
  interact(state: GameState, verb: Verb, target: string, item?: string): Command[];
  actorVerbs: Partial<Record<ActorId, Verb[]>>;
  itemVerbs: Verb[];
  /** Every string key the click rules can say (checked by the tests). */
  interactionKeys: readonly string[];
  dialogues: Record<string, DialogueTree>;
  crowds: Record<string, CrowdDef>;
  extras: ExtraDef[];
  encounters: Record<string, EncounterDefinition>;
  rewards: Record<string, Reward>;
  /**
   * Lines over black when the chapter is first entered (string keys; the first is its title).
   * Chapter 1's opening is the game's own intro, played on New game.
   */
  intro?: readonly string[];
  /** Random fights: a pool name to the encounters it draws from (`creatureFight`). */
  encounterPools?: Record<string, readonly string[]>;
  /** Kiln Courier's lesson prompts reworded for this chapter's first enemy, by step index. */
  lessonPrompts?: Readonly<Record<number, string>>;
  /** Gear handed over by the `giveSpares` command. */
  spares: readonly string[];
  objectives(state: GameState): Objective[];
  objectiveKeys: readonly string[];
  /** Music mood of particular spoken lines. */
  lineMoods: Record<string, MusicMood>;
  strings: Record<string, string>;
  story: StoryRules;
}
