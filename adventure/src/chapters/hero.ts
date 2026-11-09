// Who the player is playing: the chapter's hero (Mara unless the chapter says otherwise), and the
// persona a worn mask gives them (StoryRules.heroName / heroPortrait).
import type { GameState } from '../engine/types';
import { heroIdentityFor } from '../engine/story';
import { chapter } from './index';
import type { ChapterHero } from './types';

export const MARA: ChapterHero = { name: 'speaker.hero', portrait: 'mara', sheet: 'mara', mara: true, abilities: [] };

/** The chapter's hero (Mara by default). */
export const heroOf = (): ChapterHero => chapter().hero ?? MARA;

/** The name key and portrait shown for the hero now (a persona if a mask is worn). */
export function heroIdentity(state: GameState): { name: string; portrait: string } {
  const ch = chapter(), base = heroOf(), room = ch.rooms[state.room];
  if (!room) return { name: base.name, portrait: base.portrait };
  return heroIdentityFor(ch.story, { state, room, cold: false }, base);
}
