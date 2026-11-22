// The asset manifest v2 (art/manifest.json, format in art/SPEC.md section 9). `cell`, `anchor` and the
// frame lists describe the final art (2x). Until a key is `final` the game draws its code placeholder,
// whose own size and anchor are in `placeholder`; keys with no `placeholder` get a grey stand-in (AC2).
import raw from '../../art/manifest.json';

export interface AnimDef {
  frames: number;
  fps: number;
  loop: boolean;
}

export interface ManifestEntry {
  /** Atlas group (`ground`, `plants`, `buildings`, `man`, ...); null only for `legacy` keys. */
  atlas: string | null;
  /** Cell size of one frame at 2x, in px. */
  cell: [number, number] | null;
  /** Phaser origin as a fraction of the cell; always a whole pixel. */
  anchor: [number, number] | null;
  layers: string[];
  facings: 1 | 8;
  anims: Record<string, AnimDef> | null;
  seasons: boolean;
  states: string[] | null;
  /** Variants, masks or edges; for building keys with states, per state. */
  variants: number | null;
  /** Explicit index names when they are not 0..variants-1 (bank masks 1-15, spill edges). */
  indices?: string[];
  /** 9-slice corner size, for interface pieces. */
  slice?: number;
  /** Cursors also come as a 2x file. */
  retina?: boolean;
  /** Transparent border every frame keeps, in px (0 for tiles and 9-slice pieces). */
  border: number;
  /** True when the validator checks the ground point (alpha near the anchor pixel). */
  ground: boolean;
  status: 'placeholder' | 'final';
  batch: string | null;
  revision: number;
  approvedBy: 'user' | 'claude' | null;
  /** Today's code-drawn placeholder: its size and anchor (used until the key is final). */
  placeholder?: { size: [number, number]; anchor: [number, number] };
  /** An old key the code still draws, kept only as a placeholder (none today: AC4 and AC5 retired them all). */
  legacy?: boolean;
}

export const FACINGS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'] as const;
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export const BUILDING_STATES = ['stage1', 'stage2', 'stage3', 'finished', 'winter'] as const;

export const manifest = raw as unknown as Record<string, ManifestEntry>;

export function entry(key: string): ManifestEntry {
  const e = manifest[key];
  if (!e) throw new Error(`Unknown art key: ${key}`);
  return e;
}

/** The origin the game draws a key with: the placeholder's until the key is final. */
export function anchorOf(key: string): [number, number] {
  const e = entry(key);
  const a = e.status === 'final' || !e.placeholder ? e.anchor : e.placeholder.anchor;
  if (!a) throw new Error(`Art key ${key} has no anchor`);
  return a;
}
