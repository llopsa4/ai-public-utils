import manifest from '../../art/manifest.json';

/**
 * UI art lookup (art/manifest.json `ui`, art/STYLE.md *UI art*). Pure: no Phaser, so tests run in node.
 * Source sizes are PNG pixels; display sizes are source / the group's scale (kit, icons and portraits are
 * drawn at 2x and shown at half size, cursors and title art are 1x). Items stay `placeholder` (a grey
 * stand-in) until Codex's art is installed and the manifest says `final`.
 */

export type UiGroup = 'kit' | 'icon_bar' | 'icon_hud' | 'portrait' | 'portrait_small' | 'cursor' | 'title';
export type UiStatus = 'placeholder' | 'final';

export interface UiItem {
  readonly name: string;
  readonly group: UiGroup;
  /** Source PNG size in px. */
  readonly size: readonly [number, number];
  /** Size on screen at 100% UI scale: `size / scale`. */
  readonly display: readonly [number, number];
  readonly scale: number;
  /** True when the item lives in the `ui` atlas; false for the separate cursor and title images. */
  readonly packed: boolean;
  /** 9-slice insets [left, top, right, bottom] in display px; null for items that are not stretched. */
  readonly inset: readonly [number, number, number, number] | null;
  /** Cursor hot spot in px, cursors only. */
  readonly hotspot: readonly [number, number] | null;
  readonly status: UiStatus;
}

interface RawItem {
  group: string;
  size: number[];
  inset?: number[];
  hotspot?: number[];
  status: string;
}
interface RawUi {
  atlas: { texture: string };
  groups: Record<string, { scale: number; packed: boolean }>;
  items: Record<string, RawItem>;
}

const RAW = (manifest as unknown as { ui: RawUi }).ui;

/** The texture key of the packed UI atlas. */
export const UI_TEXTURE: string = RAW.atlas.texture;

function build(name: string, raw: RawItem): UiItem {
  const g = RAW.groups[raw.group];
  const [w, h] = raw.size;
  return {
    name,
    group: raw.group as UiGroup,
    size: [w, h],
    display: [w / g.scale, h / g.scale],
    scale: g.scale,
    packed: g.packed,
    inset: raw.inset ? [raw.inset[0], raw.inset[1], raw.inset[2], raw.inset[3]] : null,
    hotspot: raw.hotspot ? [raw.hotspot[0], raw.hotspot[1]] : null,
    status: raw.status === 'final' ? 'final' : 'placeholder',
  };
}

const ITEMS: ReadonlyMap<string, UiItem> = new Map(Object.entries(RAW.items).map(([name, raw]) => [name, build(name, raw)]));

/** Every UI item name, in manifest order. */
export const UI_NAMES: readonly string[] = [...ITEMS.keys()];

/** The item called `name`, or undefined when the manifest has none. */
export function uiItem(name: string): UiItem | undefined {
  return ITEMS.get(name);
}

/** The item called `name`; throws on a typo so a wrong key fails loudly in a test, not silently on screen. */
export function uiOf(name: string): UiItem {
  const it = ITEMS.get(name);
  if (!it) throw new Error(`No UI item "${name}" in art/manifest.json ui.items`);
  return it;
}

/** True once real art is installed for the item (the manifest says `final`). */
export function isFinal(name: string): boolean {
  return ITEMS.get(name)?.status === 'final';
}

/** Every item of one group, in manifest order. */
export function uiGroup(group: UiGroup): UiItem[] {
  return [...ITEMS.values()].filter((i) => i.group === group);
}

// ---- Names -------------------------------------------------------------------------------------------

/** The action bar button ids that have an icon, as `icon_bar_<id>`. */
export function barIconKey(id: string): string | null {
  const name = `icon_bar_${id}`;
  return ITEMS.has(name) ? name : null;
}

/** The HUD icon for a counter (`food`, `scrap`, `ammo`, `hunger`, `zombie`, `herd`, `crate`, `hp`). */
export function hudIconKey(id: string): string | null {
  const name = `icon_hud_${id}`;
  return ITEMS.has(name) ? name : null;
}

export type Who = 'fighter' | 'scout';
export type PortraitMood = 'neutral' | 'afraid' | 'determined' | 'hurt';

/** The 128 px portrait for a survivor in a mood. */
export function portraitKey(who: Who, mood: PortraitMood): string {
  return `portrait_${who}_${mood}`;
}

/** The 36 px squad-card head: only neutral and hurt exist, so any other mood falls back to neutral. */
export function smallPortraitKey(who: Who, hurt: boolean): string {
  return `portrait_small_${who}_${hurt ? 'hurt' : 'neutral'}`;
}

/** A survivor below this share of their HP shows the hurt portrait, whatever the line's mood (DESIGN §6). */
export const HURT_BELOW = 0.35;

/** Which survivor a speaker or card name is ("Fighter", "Scout"), or null for anyone else. */
export function speakerWho(name: string): Who | null {
  const n = name.trim().toLowerCase();
  return n === 'fighter' || n === 'scout' ? n : null;
}

/** True when a survivor is under 35% HP (a dead one, at 0, counts). Unknown HP is not hurt. */
export function isHurt(hp: number, maxHp: number): boolean {
  return maxHp > 0 && hp / maxHp < HURT_BELOW;
}

/** The moods a line may carry in `data/story.json` (`hurt` is never written; the game applies it). */
export function lineMood(mood: string | undefined): PortraitMood {
  return mood === 'afraid' || mood === 'determined' ? mood : 'neutral';
}

/**
 * The large portrait key for a dialogue line: the line's mood, replaced by hurt while the speaker is under
 * 35% HP. `hp` is the speaker's current and maximum HP when known. Null when the speaker has no portrait.
 */
export function dialoguePortrait(speaker: string, mood: string | undefined, hp?: { hp: number; maxHp: number }): string | null {
  const who = speakerWho(speaker);
  if (!who) return null;
  return portraitKey(who, hp && isHurt(hp.hp, hp.maxHp) ? 'hurt' : lineMood(mood));
}

/** The small squad-card head key for a card: hurt under 35% HP (and when down), else neutral. Null for an unknown name. */
export function squadPortrait(name: string, hp: number, maxHp: number): string | null {
  const who = speakerWho(name);
  return who ? smallPortraitKey(who, isHurt(hp, maxHp)) : null;
}

// ---- 9-slice -----------------------------------------------------------------------------------------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface SlicePart {
  /** Where the part comes from in the source PNG (source px). */
  readonly src: Rect;
  /** Where it is drawn, relative to the piece's top-left (display px at 100% UI scale, times `factor`). */
  readonly dst: Rect;
}

/**
 * The parts to draw an item stretched to `w` x `h` display px (times `factor` for the text-size options):
 * four corners at their size, four edges stretched along one axis, the middle stretched both ways. An
 * inset of 0 on a side drops that side, so the 3-slice slider track gives left end, stretched middle and
 * right end only. A target smaller than its corners shrinks them in proportion rather than overlapping.
 * Parts of zero size are left out.
 */
export function nineSlice(name: string, w: number, h: number, factor = 1): SlicePart[] {
  const it = uiOf(name);
  const inset = it.inset ?? [0, 0, 0, 0];
  const [sw, sh] = it.size;
  const k = it.scale;
  let [l, t, r, b] = inset.map((v) => v * factor);
  // Corners never overlap when the target is small.
  if (l + r > w) { const s = w / (l + r); l *= s; r *= s; }
  if (t + b > h) { const s = h / (t + b); t *= s; b *= s; }
  const [sl, st, sr, sb] = inset.map((v) => v * k);
  const cols = [
    { sx: 0, sw: sl, dx: 0, dw: l },
    { sx: sl, sw: sw - sl - sr, dx: l, dw: w - l - r },
    { sx: sw - sr, sw: sr, dx: w - r, dw: r },
  ];
  const rows = [
    { sy: 0, sh: st, dy: 0, dh: t },
    { sy: st, sh: sh - st - sb, dy: t, dh: h - t - b },
    { sy: sh - sb, sh: sb, dy: h - b, dh: b },
  ];
  const parts: SlicePart[] = [];
  for (const row of rows) {
    for (const col of cols) {
      if (col.sw <= 0 || row.sh <= 0 || col.dw <= 0 || row.dh <= 0) continue;
      parts.push({ src: { x: col.sx, y: row.sy, w: col.sw, h: row.sh }, dst: { x: col.dx, y: row.dy, w: col.dw, h: row.dh } });
    }
  }
  return parts;
}

// ---- Cursors -----------------------------------------------------------------------------------------

/** The CSS cursor names `render/click.ts` uses, and the cursor art that replaces each one. */
const CURSOR_ART: Readonly<Record<string, string>> = {
  pointer: 'cursor_select',
  crosshair: 'cursor_attack',
  grab: 'cursor_use',
  move: 'cursor_move',
};

/** The cursor art item standing in for a CSS cursor name, or null (`default` over the HUD stays the system arrow). */
export function cursorArtFor(css: string): string | null {
  return CURSOR_ART[css] ?? null;
}

/**
 * The CSS `cursor` value for a click cursor: the art (with its hot spot, the CSS name as fallback) once
 * the item is `final`, else the plain CSS name. `urlOf` turns the item name into the bundled image URL.
 */
export function cursorCss(css: string, urlOf: (name: string) => string | undefined): string {
  const name = cursorArtFor(css);
  if (!name || !isFinal(name)) return css;
  const url = urlOf(name);
  const spot = uiOf(name).hotspot;
  return url && spot ? `url("${url}") ${spot[0]} ${spot[1]}, ${css}` : css;
}
