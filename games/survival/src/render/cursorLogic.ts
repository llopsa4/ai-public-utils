// The pure part of the cursors (no Phaser, so a test can import it): which cursor shows, its hotspot and its CSS value.
import { entry } from './manifest';

export type CursorKind = 'pointer' | 'move' | 'attack' | 'build' | 'invalid';
export const CURSOR_KINDS: CursorKind[] = ['pointer', 'move', 'attack', 'build', 'invalid'];

/** What the cursor depends on (all read by the Select scene each frame). */
export interface CursorContext {
  /** The pointer is over a panel, button, minimap or the top bar. */
  overUi: boolean;
  /** A building is being placed, and whether the ghost's tile is valid. */
  placing: boolean;
  placeOk: boolean;
  /** A power is being aimed at the map. */
  aiming: boolean;
  /** Somebody is selected (a right-click would move or order them). */
  hasSelection: boolean;
  /** At least one selected person is drafted. */
  hasDrafted: boolean;
  /** The pointer is over a wolf. */
  overEnemy: boolean;
}

/** Which cursor the pointer shows (pure). */
export function pickCursor(c: CursorContext): CursorKind {
  if (c.overUi) return 'pointer';
  if (c.placing) return c.placeOk ? 'build' : 'invalid';
  if (c.aiming) return 'attack';
  if (c.hasDrafted && c.overEnemy) return 'attack';
  if (c.hasSelection) return 'move';
  return 'pointer';
}

/** The hotspot in CSS px (1x), from the manifest anchor of the 32 x 32 cursor. */
export function cursorHotspot(kind: CursorKind): [number, number] {
  const e = entry(`cursor_${kind}`);
  const [ax, ay] = e.anchor ?? [0, 0];
  const [cw, ch] = e.cell ?? [32, 32];
  return [Math.round(ax * cw), Math.round(ay * ch)];
}

/** The CSS `cursor` value: an image-set (1x and 2x) or a plain url, then the hotspot and a fallback keyword. */
export function cursorCss(url1: string, url2: string | null, hotspot: [number, number], fallback = 'default'): string {
  const image = url2 ? `image-set(url("${url1}") 1x, url("${url2}") 2x)` : `url("${url1}")`;
  return `${image} ${hotspot[0]} ${hotspot[1]}, ${fallback}`;
}

