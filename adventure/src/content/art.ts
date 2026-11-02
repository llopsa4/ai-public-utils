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
};

/** Room background texture keys → file names in art/src/rooms (the game loads the .webp copy). */
export const ROOM_FILES: Record<string, string> = {
  'room-tent': 'tent',
  'room-mara': 'mara-room',
  'room-firing-house': 'firing-house',
  'room-gallery': 'gallery',
  'room-ashways': 'ashways',
};
