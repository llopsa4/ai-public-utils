import type { Ambience } from '../audio/sound';
import type { MusicMood } from '../audio/music';
import type { Mood } from './crowd';
import { conditionsHold } from './geometry';
import type { Command, Condition, GameState, RoomDef } from './types';

/**
 * A chapter's story rules as data: what plays and how the room's people feel at each point of the
 * story, what restarts on entering a room, and the sounds some flags make. The scene asks these
 * instead of naming rooms or flags itself. Lists are checked in order; the first match wins.
 */

/** When a rule applies: all given parts must hold. */
export interface StoryWhen {
  room?: string;
  /** The room is in its cold state (its `coldIf` holds). */
  cold?: boolean;
  if?: Condition[];
}

export interface StoryPick<T> extends StoryWhen { pick: T }

export type FlagSound = 'latch' | 'hiss';

export interface StoryRules {
  /** The score; without a match, the room's own music (else warm). */
  music: StoryPick<MusicMood>[];
  ambience: StoryPick<Ambience>[];
  defaultAmbience: Ambience;
  /** Background sound (ambience, crowd murmur) goes quiet while any of these holds. */
  hush: StoryWhen[];
  /** What the room's people react to; without a match, an ordinary day. */
  crowdMood: StoryPick<Mood>[];
  /** Flags whose setting changes the crowd's mood on the spot. */
  crowdReactsTo: readonly string[];
  /** Scripts that start on entering a room (e.g. picking up a sequence after a reload). */
  onEnter: (StoryWhen & { run(state: GameState): Command[] })[];
  /** Sounds played when a flag is set. */
  flagSounds: Record<string, FlagSound>;
  /** Mara's sprite sheet; without a match, `mara`. */
  heroSheet: StoryPick<string>[];
  /** The hero's shown name and portrait (a mask's persona); without a match, the chapter hero's. */
  heroName?: StoryPick<string>[];
  heroPortrait?: StoryPick<string>[];
  /** What happens once a conversation ends, given how it went (a guard too suspicious: caught). */
  afterDialogue?: (id: string, state: GameState) => Command[];
  /** How suspicious the person being deceived is, 0 to 3 (the eye above the satchel); null hides it. */
  suspicion?: (state: GameState) => number | null;
  /** Fights are played as the guided lesson while any of these holds. */
  guided: StoryWhen[];
  /** After a fight: the score to play and whether background sound stays quiet (default: the room's). */
  afterFight?: { music?: MusicMood; hush?: boolean };
}

export interface StoryContext { state: GameState; room: RoomDef; cold: boolean }

export function holds(when: StoryWhen, ctx: StoryContext): boolean {
  return (when.room === undefined || when.room === ctx.room.id)
    && (when.cold === undefined || when.cold === ctx.cold)
    && conditionsHold(ctx.state, when.if);
}

function first<T>(rules: StoryPick<T>[], ctx: StoryContext): T | undefined {
  return rules.find(r => holds(r, ctx))?.pick;
}

export function musicFor(story: StoryRules, ctx: StoryContext): MusicMood {
  return first(story.music, ctx) ?? ctx.room.music ?? 'warm';
}

export function ambienceFor(story: StoryRules, ctx: StoryContext): Ambience {
  return first(story.ambience, ctx) ?? story.defaultAmbience;
}

export function crowdMoodFor(story: StoryRules, ctx: StoryContext): Mood {
  return first(story.crowdMood, ctx) ?? 'warm';
}

export function hushed(story: StoryRules, ctx: StoryContext): boolean {
  return story.hush.some(w => holds(w, ctx));
}

/** Mara's sheet for the story so far (the scene falls back to `mara` until it has loaded). */
export function heroSheetFor(story: StoryRules, ctx: StoryContext): string {
  const sheet = first(story.heroSheet, ctx) ?? 'mara';
  if ((sheet === 'mara' || sheet === 'mara-gauntlet') && ctx.state.kit.equipment.armor.id === 'layered-armor') {
    return sheet === 'mara-gauntlet' ? 'mara-medium-gauntlet' : 'mara-medium';
  }
  return sheet;
}

/** The hero's shown name key and portrait: a persona when one matches, else the chapter's hero. */
export function heroIdentityFor(story: StoryRules, ctx: StoryContext, base: { name: string; portrait: string }): { name: string; portrait: string } {
  return { name: first(story.heroName ?? [], ctx) ?? base.name, portrait: first(story.heroPortrait ?? [], ctx) ?? base.portrait };
}

export function guided(story: StoryRules, ctx: StoryContext): boolean {
  return story.guided.some(w => holds(w, ctx));
}

/** The commands to run on entering the room (the first matching rule's), else none. */
export function onEnter(story: StoryRules, ctx: StoryContext): Command[] {
  return story.onEnter.find(r => holds(r, ctx))?.run(ctx.state) ?? [];
}
