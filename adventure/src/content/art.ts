/**
 * Facts about the art files that both the game and the Node art tools need (kept free of image
 * imports so scripts/art-check.ts can read it).
 */

/** Portrait moods in strip order; each mood has a closed-mouth and an open-mouth frame (art/rig.mjs). */
export type Mood = 'neutral' | 'worried' | 'angry';
export const PORTRAIT_MOODS: Record<string, Mood[]> = {
  mara: ['neutral', 'worried', 'angry'],
  oren: ['neutral', 'worried', 'angry'],
  nell: ['neutral'],
  tobi: ['neutral', 'worried'],
  // Silas (his pack's portraits; his disguises have one mood).
  silas: ['neutral', 'worried', 'angry'],
  // Silas in his cloak (Codex's pack): three moods, like his casual portraits.
  'silas-cloak': ['neutral', 'worried', 'angry'],
  // Benn and Kell: Codex's drawn worried and angry faces.
  guard: ['neutral', 'worried', 'angry'],
  warden: ['neutral', 'worried', 'angry'],
  // Sigrid (Codex's pack): three moods, like Mara's.
  sigrid: ['neutral', 'worried', 'angry'],
};

/** Room background texture keys → file names in art/src/rooms (the game loads the .webp copy). */
/** Satchel items drawn with another item's picture (the loaf for Nell's soup looks like her bread). */
export const ITEM_ART: Record<string, string> = { loaf: 'bread' };

export const ROOM_FILES: Record<string, string> = {
  'room-tent': 'tent',
  'room-mara': 'mara-room',
  'room-firing-house': 'firing-house',
  'room-gallery': 'gallery',
  'room-ashways': 'ashways',
};
