// Every art file the game loads. Room backgrounds and foreground cut-outs are WebP copies of the
// PNGs (art/webp.mjs), everything else is palette-indexed PNG. Replacing a PNG/JSON pair in art/src is all that is needed to
// upgrade the art: the code only depends on frame tag names and the bottom-centre anchor.
import maraJson from '../../art/src/characters/mara.json';
import maraPng from '../../art/src/characters/mara.png';
import maraGauntletJson from '../../art/src/characters/mara-gauntlet.json';
import maraGauntletPng from '../../art/src/characters/mara-gauntlet.png';
import orenJson from '../../art/src/characters/oren.json';
import orenPng from '../../art/src/characters/oren.png';
import nellJson from '../../art/src/characters/nell.json';
import nellPng from '../../art/src/characters/nell.png';
import extraStokerJson from '../../art/src/characters/extra-stoker.json';
import extraStokerPng from '../../art/src/characters/extra-stoker.webp';
import extraTallyJson from '../../art/src/characters/extra-tally.json';
import extraTallyPng from '../../art/src/characters/extra-tally.webp';
import extraHaulerJson from '../../art/src/characters/extra-hauler.json';
import extraHaulerPng from '../../art/src/characters/extra-hauler.webp';
import extraRunnerJson from '../../art/src/characters/extra-runner.json';
import extraRunnerPng from '../../art/src/characters/extra-runner.webp';
import extraHoistJson from '../../art/src/characters/extra-hoist.json';
import extraHoistPng from '../../art/src/characters/extra-hoist.webp';
import extraMerchantJson from '../../art/src/characters/extra-merchant.json';
import extraMerchantPng from '../../art/src/characters/extra-merchant.webp';
import extraKidJson from '../../art/src/characters/extra-kid.json';
import extraKidPng from '../../art/src/characters/extra-kid.webp';
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
import maraRoomPng from '../../art/src/rooms/mara-room.webp';
import tentRoomPng from '../../art/src/rooms/tent.webp';
import tentJson from '../../art/src/objects/tent.json';
import tentPng from '../../art/src/objects/tent.png';
import firingHousePng from '../../art/src/rooms/firing-house.webp';
import galleryPng from '../../art/src/rooms/gallery.webp';
import ashwaysPng from '../../art/src/rooms/ashways.webp';
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
  // Background people (kiln hall, firing house) (placeholder art; WebP copies of the PNGs, art/webp.mjs).
  'extra-stoker': { png: extraStokerPng, json: extraStokerJson },
  'extra-tally': { png: extraTallyPng, json: extraTallyJson },
  'extra-hauler': { png: extraHaulerPng, json: extraHaulerJson },
  'extra-runner': { png: extraRunnerPng, json: extraRunnerJson },
  'extra-hoist': { png: extraHoistPng, json: extraHoistJson },
  'extra-kid': { png: extraKidPng, json: extraKidJson },
  'extra-merchant': { png: extraMerchantPng, json: extraMerchantJson },
};

/** Sheets loaded only when a room needs them (the rest load at boot): saves ~550 KB before the title. */
export const LAZY_SHEETS = new Set(['mara-gauntlet', 'oren', 'nell', ...Object.keys(SHEETS).filter(k => k.startsWith('extra-'))]);

/** Sheet used for each non-player character. */
export const NPC_SHEETS: Partial<Record<NpcId, string>> = { oren: 'oren', nell: 'nell' };

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

const foregroundFiles = import.meta.glob('../../art/src/foreground/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** Foreground cut-outs keyed by file name (texture key `fg-<name>`). */
export const FOREGROUND_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(foregroundFiles).map(([path, url]) => [path.replace(/^.*\/([\w-]+)\.webp$/, '$1'), url]),
);

const propFiles = import.meta.glob('../../art/src/props/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** Animated set pieces keyed by file name (texture key `prop-<name>`). */
export const PROP_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(propFiles).map(([path, url]) => [path.replace(/^.*\/([\w-]+)\.webp$/, '$1'), url]),
);

const portraitFiles = import.meta.glob('../../art/src/portraits/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export { PORTRAIT_MOODS, type Mood } from '../content/art';

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
