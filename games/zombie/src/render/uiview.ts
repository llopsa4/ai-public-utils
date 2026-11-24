import { barIconKey, hudIconKey } from './ui';

/**
 * What the scenes draw from the UI art (Z54, art/STYLE.md *UI art*). Pure: no Phaser, so tests run in node.
 * `render/ui.ts` knows the items; this file decides which item a button or a counter shows.
 */

// ---- Action bar buttons -----------------------------------------------------------------------------

/** The `icon_bar_*` item for an action-bar button id (`weapon:pistol` is the Gun, `build` the Barricade), or null. */
export function barIcon(id: string): string | null {
  if (id.startsWith('weapon:')) {
    const weapon = id.slice('weapon:'.length);
    return barIconKey(weapon === 'pistol' ? 'gun' : weapon);
  }
  return barIconKey(id === 'build' ? 'barricade' : id);
}

/** The ammo a weapon button's label ends with ("Gun 3" gives 3), or null for a button without a count. */
export function ammoCount(label: string): number | null {
  const m = /\s(\d+)$/.exec(label);
  return m ? Number(m[1]) : null;
}

/** The button's name without its ammo count ("Gun 3" gives "Gun"): the tooltip text. */
export function plainName(label: string): string {
  return label.replace(/\s\d+$/, '');
}

export interface ButtonLook {
  enabled: boolean;
  active: boolean;
  hover: boolean;
  down: boolean;
}

/** The `kit_button_*` item for a button's look: disabled beats everything, then pressed, active, hover. */
export function buttonFrame(b: ButtonLook): string {
  if (!b.enabled) return 'kit_button_disabled';
  if (b.down) return 'kit_button_pressed';
  if (b.active) return 'kit_button_active';
  return b.hover ? 'kit_button_hover' : 'kit_button_normal';
}

/** The tooltip line of a button: its name and, when it has one, the key in brackets. */
export function tooltipText(label: string, key: string): string {
  const name = plainName(label);
  return key === '' ? name : `${name}  [${key}]`;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Where a tooltip of `w` x `h` goes for a button: centred above it with `gap` between, kept `margin` inside the
 * screen sideways; below the button instead when there is no room above.
 */
export function tooltipBox(btn: Box, w: number, h: number, screenW: number, gap = 6, margin = 8): Box {
  const x = Math.max(margin, Math.min(screenW - margin - w, Math.round(btn.x + btn.w / 2 - w / 2)));
  const above = btn.y - gap - h;
  return { x, y: above >= margin ? above : btn.y + btn.h + gap, w, h };
}

// ---- HUD counters -----------------------------------------------------------------------------------

export interface Counter {
  /** The `icon_hud_*` item name, or null when the counter has no icon (the text stands alone). */
  icon: string | null;
  text: string;
}

export interface LootNumbers {
  ammo: number;
  food?: number;
  scrap?: number;
  /** Mission 1: crates opened of all. */
  crates?: { opened: number; total: number };
  zombies?: number;
  /** Base 1: the herd line ("Herd in 3:20"), already worded; empty or missing hides it. */
  herd?: string;
}

/** The counters a HUD shows, in a fixed order (ammo, food, scrap, crates, zombies, herd); missing ones are left out. */
export function lootCounters(n: LootNumbers): Counter[] {
  const out: Counter[] = [{ icon: hudIconKey('ammo'), text: String(n.ammo) }];
  if (n.food !== undefined) out.push({ icon: hudIconKey('food'), text: String(n.food) });
  if (n.scrap !== undefined) out.push({ icon: hudIconKey('scrap'), text: String(n.scrap) });
  if (n.crates) out.push({ icon: hudIconKey('crate'), text: `${n.crates.opened}/${n.crates.total}` });
  if (n.zombies !== undefined) out.push({ icon: hudIconKey('zombie'), text: String(n.zombies) });
  if (n.herd) out.push({ icon: hudIconKey('herd'), text: n.herd });
  return out;
}

export interface Placed {
  icon: Box | null;
  text: { x: number; y: number };
}

/**
 * Lays the counters in one row from x 0: an icon of `iconPx`, `pad` of space, the text (`widthOf` gives its
 * width), then `gap` before the next. Returns each counter's icon box and text position (text origin
 * top-left, vertically centred on the icon's row of height `rowH`) and the row's total width.
 */
export function layoutCounters(counters: readonly Counter[], widthOf: (text: string) => number, iconPx: number, rowH: number, pad: number, gap: number): { items: Placed[]; width: number } {
  let x = 0;
  const items: Placed[] = [];
  counters.forEach((c, i) => {
    if (i > 0) x += gap;
    let icon: Box | null = null;
    if (c.icon) {
      icon = { x, y: Math.round((rowH - iconPx) / 2), w: iconPx, h: iconPx };
      x += iconPx + pad;
    }
    items.push({ icon, text: { x, y: 0 } });
    x += widthOf(c.text);
  });
  return { items, width: x };
}
