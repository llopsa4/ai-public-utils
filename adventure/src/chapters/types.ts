import type { EncounterDefinition } from '../combat/types';
import type { Reward } from '../content/kit';
import type { DialogueTree } from '../engine/dialogue';
import type { CrowdDef, ExtraDef } from '../engine/crowd';
import type { ActorId, ActorState, Command, GameState, NpcId, RoomDef, Verb } from '../engine/types';
import type { Mood as MusicMood } from '../game/assets';
import type { StoryRules } from '../engine/story';

export interface Objective { key: string; done: boolean; optional: boolean }

/** When and through whose eyes a chapter happens: one of STORY.md's five days (string keys). */
export interface ChapterWhen { day: number; time: string; place: string; viewpoint: string }

/**
 * Who the player plays in a chapter (Mara unless given): the name key, portrait, default sprite
 * sheet, whether it is Mara (her gauntlet and armour sheets), and special abilities ('read').
 */
export interface ChapterHero { name: string; portrait: string; sheet: string; mara: boolean; abilities: readonly string[] }

/** A diary entry in the viewpoint character's voice, written once all its flags are set. */
export interface DiaryEntry { key: string; after: readonly string[] }

/** The world map (src/content/world.ts): where the viewpoint character is, and the places they know. */
export interface ChapterMap {
  at(state: GameState): string;
  /** Places known from this chapter (with its flags); earlier chapters' places stay known. */
  known(flags: Record<string, boolean>, room: string | null): readonly string[];
}

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
  /** The day, time, place and viewpoint (title card, notebook, diary). */
  when: ChapterWhen;
  /** Who is played; absent means Mara. */
  hero?: ChapterHero;
  /** Where the chapter's pin sits on the chapter map (a place in src/content/world.ts). */
  pin: string;
  /** The viewpoint character's diary for this chapter, in story order. */
  diary: readonly DiaryEntry[];
  map: ChapterMap;
  objectives(state: GameState): Objective[];
  reflections?: (state: GameState) => string[];
  objectiveKeys: readonly string[];
  /** Music mood of particular spoken lines. */
  lineMoods: Record<string, MusicMood>;
  strings: Record<string, string>;
  story: StoryRules;
}
