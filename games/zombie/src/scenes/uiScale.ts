import type Phaser from 'phaser';
import { scaled } from '../render/cues';
import { options } from '../sim/options';

// Text size option (DESIGN §19): every HUD, bar, panel and dialogue length is a base length at 100%
// times the chosen factor. Scenes call these each frame, so a change made in the pause menu applies at once.

/** A base length (pixels at 100%) at the current text size. */
export const ui = (px: number): number => scaled(px, options().textSize);

/** Sets a text's font size and padding for the current text size; cheap when nothing changed. */
export function scaleText(t: Phaser.GameObjects.Text, basePx: number, padX = 0, padY = 0): void {
  const px = ui(basePx);
  if (t.style.fontSize !== `${px}px`) t.setFontSize(px);
  const x = ui(padX);
  const y = ui(padY);
  if (t.padding.left !== x || t.padding.top !== y) t.setPadding(x, y);
}

/** Moves a text to a screen x and a base y (pixels at 100%) scaled for the current text size. */
export function placeText(t: Phaser.GameObjects.Text, x: number, baseY: number): void {
  t.setPosition(x, ui(baseY));
}

/**
 * Sizes the centred banner (pause, fail, win). At 100% it never wraps; at larger sizes it wraps in the
 * space between the squad panel and the right edge, so it does not cover the panel.
 */
export function sizeBanner(t: Phaser.GameObjects.Text, screenW: number): void {
  const wrap = options().textSize > 100 ? screenW - 2 * (16 + ui(214) + 16) : 0;
  if ((t.style.wordWrapWidth ?? 0) !== wrap) t.setWordWrapWidth(wrap > 0 ? wrap : null);
}
