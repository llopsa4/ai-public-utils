// Every art file the game loads. Replacing a PNG/JSON pair in art/src is all that is needed to
// upgrade the art: the code only depends on frame tag names and the bottom-centre anchor.
import maraJson from '../../art/src/characters/mara.json';
import maraPng from '../../art/src/characters/mara.png';
import maraGauntletJson from '../../art/src/characters/mara-gauntlet.json';
import maraGauntletPng from '../../art/src/characters/mara-gauntlet.png';
import orenJson from '../../art/src/characters/oren.json';
import orenPng from '../../art/src/characters/oren.png';
import nellJson from '../../art/src/characters/nell.json';
import nellPng from '../../art/src/characters/nell.png';
import notebookJson from '../../art/src/objects/notebook.json';
import notebookPng from '../../art/src/objects/notebook.png';
import pantryDoorJson from '../../art/src/objects/pantry-door.json';
import pantryDoorPng from '../../art/src/objects/pantry-door.png';
import rackJson from '../../art/src/objects/rack.json';
import rackPng from '../../art/src/objects/rack.png';
import socketJson from '../../art/src/objects/socket.json';
import socketPng from '../../art/src/objects/socket.png';
import sweeperJson from '../../art/src/objects/sweeper.json';
import sweeperPng from '../../art/src/objects/sweeper.png';
import valveJson from '../../art/src/objects/valve.json';
import valvePng from '../../art/src/objects/valve.png';
import maraRoomPng from '../../art/src/rooms/mara-room.png';
import tentRoomPng from '../../art/src/rooms/tent.png';
import tentJson from '../../art/src/objects/tent.json';
import tentPng from '../../art/src/objects/tent.png';
import firingHousePng from '../../art/src/rooms/firing-house.png';
import galleryPng from '../../art/src/rooms/gallery.png';
import ashwaysPng from '../../art/src/rooms/ashways.png';
import type { NpcId, Verb } from '../engine/types';

/** Aseprite "JSON array" export (also produced by LibreSprite and the art scripts). */
export interface AsepriteSheet {
  frames: { filename: string; frame: { x: number; y: number; w: number; h: number }; duration: number }[];
  meta: { frameTags: { name: string; from: number; to: number; direction?: string }[] };
}

export const SHEETS: Record<string, { png: string; json: AsepriteSheet }> = {
  mara: { png: maraPng, json: maraJson },
  'mara-gauntlet': { png: maraGauntletPng, json: maraGauntletJson },
  oren: { png: orenPng, json: orenJson },
  nell: { png: nellPng, json: nellJson },
  notebook: { png: notebookPng, json: notebookJson },
  'pantry-door': { png: pantryDoorPng, json: pantryDoorJson },
  rack: { png: rackPng, json: rackJson },
  socket: { png: socketPng, json: socketJson },
  sweeper: { png: sweeperPng, json: sweeperJson },
  valve: { png: valvePng, json: valveJson },
  tent: { png: tentPng, json: tentJson },
};

/** Sheet used for each non-player character. */
export const NPC_SHEETS: Record<NpcId, string> = { oren: 'oren', nell: 'nell' };

export const ROOM_IMAGES: Record<string, string> = {
  'room-tent': tentRoomPng,
  'room-mara': maraRoomPng,
  'room-firing-house': firingHousePng,
  'room-gallery': galleryPng,
  'room-ashways': ashwaysPng,
};

const iconFiles = import.meta.glob('../../art/src/icons/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const VERB_ICONS = Object.fromEntries(
  Object.entries(iconFiles).map(([path, url]) => [path.replace(/^.*\/(\w+)\.png$/, '$1'), url]),
) as Record<Verb, string>;

const foregroundFiles = import.meta.glob('../../art/src/foreground/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** Foreground cut-outs keyed by file name (texture key `fg-<name>`). */
export const FOREGROUND_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(foregroundFiles).map(([path, url]) => [path.replace(/^.*\/([\w-]+)\.png$/, '$1'), url]),
);

const portraitFiles = import.meta.glob('../../art/src/portraits/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** Portrait moods in strip order; each mood has a closed-mouth and an open-mouth frame (art/rig.mjs). */
export type Mood = 'neutral' | 'worried' | 'angry';
export const PORTRAIT_MOODS: Record<string, Mood[]> = {
  mara: ['neutral', 'worried', 'angry'],
  oren: ['neutral', 'worried', 'angry'],
  nell: ['neutral'],
};

/** Dialogue portrait strips keyed by sheet name (mara, oren, nell). */
export const PORTRAITS: Record<string, string> = Object.fromEntries(
  Object.entries(portraitFiles).map(([path, url]) => [path.replace(/^.*\/([\w-]+)\.png$/, '$1'), url]),
);

const itemFiles = import.meta.glob('../../art/src/items/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const ITEM_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(itemFiles).map(([path, url]) => [path.replace(/^.*\/(\w+)\.png$/, '$1'), url]),
);

/** First frame name of a tag, for single-frame object states. */
export function tagFrame(sheet: string, tag: string): string {
  const json = SHEETS[sheet].json;
  const found = json.meta.frameTags.find(t => t.name === tag);
  if (!found) throw new Error(`Sheet ${sheet} has no tag ${tag}`);
  return json.frames[found.from].filename;
}
