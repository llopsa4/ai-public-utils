export type ArtKind =
  | 'room' | 'foreground' | 'prop' | 'object' | 'character' | 'extra' | 'portrait' | 'item' | 'icon'
  | 'battle' | 'battle-portrait' | 'battle-backdrop' | 'card' | 'card-atlas' | 'equipment';

export type Anchor = 'top-left' | 'top-centre' | 'centre' | 'bottom-centre' | 'none';

export interface ArtEntry {
  /** Stable id (briefs and inbox files use it: art/inbox/<id>.png). */
  id: string;
  kind: ArtKind;
  /** Path under art/src. */
  file: string;
  /** Aseprite JSON-array sheet beside the image, for animated things. */
  sheet?: string;
  /** The game loads a WebP copy of the PNG (art/webp.mjs). */
  webp?: boolean;
  /** Exact size in art pixels (2x the world). Placeholders may differ; finals must match. */
  size?: { w: number; h: number };
  /** Width for sprites whose height follows the drawing. */
  width?: number;
  /** Standing height in art pixels at the front of a room (characters). */
  height?: number;
  anchor: Anchor;
  /** Frame tags an object sheet must have. */
  tags?: string[];
  /** Portrait moods, in strip order. */
  moods?: string[];
  /** Rig settings key in RIGS (characters made by art/rig.mjs). */
  rig?: string;
  /** Placeholder body a background person is recoloured from. */
  base?: string;
  /** The room a foreground piece belongs to. */
  room?: string;
  /** How a foreground piece is cut from its room: polygons and box [x0, y0, x1, y1]. */
  cut?: { polygons: number[][][]; box: [number, number, number, number] };
  chapter: 'game' | 'ch1';
  status: 'placeholder' | 'final' | 'requested';
  /** Script that makes the placeholder. */
  generator: string;
  /** What the image shows (goes into the Codex brief). */
  subject: string;
  /** Where the light comes from (rooms). */
  light?: string;
  /** Part of the pilot pack. */
  pilot?: boolean;
}

export declare const MANIFEST: ArtEntry[];
export declare const RIGS: Record<string, Record<string, unknown>>;
export declare const PILOT: string[];
export declare function byFile(file: string): ArtEntry | undefined;
