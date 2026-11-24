import type { NoiseKind } from '../sim/noise';
import type { AiMode } from '../sim/ai';
import type { P } from './cones';

// Text size and shape cues (DESIGN §19 Options): pure helpers, nothing here touches Phaser. The scenes
// call them with `options().textSize` and `options().cues`.

/** The factor a text size in percent means (100 → 1, 150 → 1.5). */
export function uiFactor(textSize: number): number {
  return Number.isFinite(textSize) && textSize > 0 ? textSize / 100 : 1;
}

/** A pixel length (font size, offset, box size) scaled by the text size, rounded to whole pixels. */
export function scaled(px: number, textSize: number): number {
  return Math.round(px * uiFactor(textSize));
}

// ---- Zombie state cues ----

/** `!` over a chasing (or alerted) enemy, `?` over one that investigates, searches or has found a body, nothing otherwise. */
export function stateCue(mode: AiMode): '!' | '?' | null {
  if (mode === 'chase' || mode === 'alert') return '!';
  if (mode === 'investigate' || mode === 'search' || mode === 'body') return '?';
  return null;
}

// ---- Noise ring styles ----

/** Dash length and gap in world pixels per noise kind; `gap` 0 is a solid line. Each kind has its own look. */
export const NOISE_DASH: Record<NoiseKind, { on: number; off: number }> = {
  step: { on: 0, off: 0 }, // solid
  shot: { on: 14, off: 5 }, // long dashes
  lure: { on: 2, off: 6 }, // dots
  alarm: { on: 6, off: 4 }, // short dashes
  can: { on: 9, off: 9 }, // even medium dashes
};

/**
 * Cuts a closed outline (points in world pixels) into dash segments: `on` pixels drawn, `off` skipped,
 * starting at the first point. A pattern with no gap returns the whole outline as one closed run.
 */
export function dashSegments(pts: readonly P[], on: number, off: number): P[][] {
  if (pts.length < 2) return [];
  const loop = [...pts, pts[0]!];
  if (off <= 0 || on <= 0) return [loop];
  const out: P[][] = [];
  let run: P[] = [loop[0]!];
  let drawing = true;
  let left = on;
  for (let i = 1; i < loop.length; i++) {
    let [x0, y0] = loop[i - 1]!;
    const [x1, y1] = loop[i]!;
    let len = Math.hypot(x1 - x0, y1 - y0);
    while (len > 1e-9) {
      const step = Math.min(left, len);
      const t = step / len;
      x0 += (x1 - x0) * t;
      y0 += (y1 - y0) * t;
      len -= step;
      left -= step;
      if (drawing) run.push([x0, y0]);
      if (left <= 1e-9) {
        if (drawing) {
          out.push(run);
          run = [];
        } else run = [[x0, y0]];
        drawing = !drawing;
        left = drawing ? on : off;
      }
    }
  }
  if (drawing && run.length > 1) out.push(run);
  return out;
}

// ---- Hunger label ----

export type HungerWord = 'ok' | 'low' | 'critical' | 'starving';

/** A word for the hunger meter, so colour alone is not the only signal. Empty while the survivor is fine. */
export function hungerLabel(level: HungerWord): string {
  switch (level) {
    case 'ok':
      return '';
    case 'low':
      return 'Hungry';
    case 'critical':
      return 'Very hungry';
    case 'starving':
      return 'Starving';
  }
}

// ---- Layout that grows with the text ----

export interface BarMetrics {
  barH: number;
  btnH: number;
  btnW: number;
  portrait: number;
  gap: number;
  /** The icon's side inside a button: 48 px at 100%, never more than the button leaves room for. */
  icon: number;
  /** The font of the key and ammo numbers in a button's corners. */
  keyPx: number;
}

const BASE = { barH: 68, btnH: 56, btnW: 56, portrait: 52, gap: 8, icon: 48, key: 12 };
const BAR_MARGIN = 40; // space kept free at the screen's sides

/**
 * The action bar's sizes (icon buttons, art/STYLE.md *UI art*): heights, the portrait and the icons grow with
 * the text size; the buttons stay square and shrink only as far as `count` of them plus the portrait still fit
 * `screenW` (Base 1 has the most buttons).
 */
export function barMetrics(textSize: number, count: number, screenW: number): BarMetrics {
  const f = uiFactor(textSize);
  const gap = Math.round(BASE.gap * f);
  const portrait = Math.round(BASE.portrait * f);
  const btnH = Math.round(BASE.btnH * f);
  const room = Math.floor((screenW - BAR_MARGIN * 2 - portrait - gap) / Math.max(1, count)) - gap;
  const btnW = Math.max(40, Math.min(Math.round(BASE.btnW * f), room));
  const pad = Math.max(4, Math.round(4 * f));
  return {
    barH: Math.round(BASE.barH * f),
    btnH,
    btnW,
    portrait,
    gap,
    icon: Math.max(16, Math.min(Math.round(BASE.icon * f), btnW - 2 * pad, btnH - 2 * pad)),
    keyPx: Math.max(10, Math.round(BASE.key * f)),
  };
}

export interface SquadMetrics {
  x: number;
  y: number;
  w: number;
  h: number;
  gap: number;
  portrait: number;
}

/** The squad panel's card sizes at a text size; `y` is where the first card starts below the HUD lines. `withHunger` adds the row for the hunger bar's word. */
export function squadMetrics(textSize: number, withHunger = false): SquadMetrics {
  const f = uiFactor(textSize);
  return {
    x: 16,
    y: Math.round(140 * f),
    w: Math.round(214 * f),
    h: Math.round((withHunger ? 62 : 50) * f), // Base 1 cards carry a third row: the hunger word
    gap: Math.round(6 * f),
    portrait: Math.round(36 * f),
  };
}
