// Every art file the game loads. Replacing a PNG/JSON pair in art/src is all that is needed to
// upgrade the placeholders: the code only depends on frame tag names and the bottom-centre anchor.
import doorJson from '../../art/src/objects/door.json';
import doorPng from '../../art/src/objects/door.png';
import keyJson from '../../art/src/objects/key.json';
import keyPng from '../../art/src/objects/key.png';
import suitcaseJson from '../../art/src/objects/suitcase.json';
import suitcasePng from '../../art/src/objects/suitcase.png';
import heroJson from '../../art/src/characters/hero.json';
import heroPng from '../../art/src/characters/hero.png';
import keeperJson from '../../art/src/characters/keeper.json';
import keeperPng from '../../art/src/characters/keeper.png';
import hallPng from '../../art/src/rooms/hall.png';
import streetPng from '../../art/src/rooms/street.png';
import keyIcon from '../../art/src/items/key.png';
import type { Verb } from '../engine/types';

/** Aseprite "JSON array" export (also produced by LibreSprite and the placeholder generator). */
export interface AsepriteSheet {
  frames: { filename: string; frame: { x: number; y: number; w: number; h: number }; duration: number }[];
  meta: { frameTags: { name: string; from: number; to: number; direction?: string }[] };
}

export const SHEETS: Record<string, { png: string; json: AsepriteSheet }> = {
  hero: { png: heroPng, json: heroJson },
  keeper: { png: keeperPng, json: keeperJson },
  door: { png: doorPng, json: doorJson },
  suitcase: { png: suitcasePng, json: suitcaseJson },
  key: { png: keyPng, json: keyJson },
};

export const ROOM_IMAGES: Record<string, string> = {
  'room-hall': hallPng,
  'room-street': streetPng,
};

const iconFiles = import.meta.glob('../../art/src/icons/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const VERB_ICONS = Object.fromEntries(
  Object.entries(iconFiles).map(([path, url]) => [path.replace(/^.*\/(\w+)\.png$/, '$1'), url]),
) as Record<Verb, string>;

export const ITEM_ICONS: Record<string, string> = { key: keyIcon };

/** First frame name of a tag, for single-frame object states. */
export function tagFrame(sheet: string, tag: string): string {
  const json = SHEETS[sheet].json;
  const found = json.meta.frameTags.find(t => t.name === tag);
  if (!found) throw new Error(`Sheet ${sheet} has no tag ${tag}`);
  return json.frames[found.from].filename;
}
