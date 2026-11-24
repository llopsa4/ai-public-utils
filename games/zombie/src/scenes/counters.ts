import type Phaser from 'phaser';
import { uiFactor } from '../render/cues';
import { type Counter, layoutCounters } from '../render/uiview';
import { options } from '../sim/options';
import { kitSlice, resizeSlice, uiImage } from './kit';
import { ui } from './uiScale';

// The HUD's number row (Z54): a small icon beside each number on a kit panel, in the top-left corner. The
// scenes publish `Counter[]` (render/uiview.ts `lootCounters`); this draws them and follows the text size.

const ICON = 24; // display px at 100% (art/STYLE.md *UI art*)
const FONT_PX = 20;
const PAD = 6; // icon to number
const GAP = 22; // between counters
const INSET_X = 14; // inside the panel's rim
const INSET_Y = 5;

export class CounterRow {
  private readonly panel: Phaser.GameObjects.NineSlice;
  private icons: (Phaser.GameObjects.Image | null)[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private signature = '';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly font: string,
  ) {
    this.panel = kitSlice(scene, 'kit_panel', 0, 0, 40, 40).setAlpha(0.94).setVisible(false);
  }

  /** Draws `counters` with the panel's top-left at (x, baseY at the current text size); an empty list hides the row. */
  update(counters: readonly Counter[], x: number, baseY: number): void {
    const f = uiFactor(options().textSize);
    if (counters.length === 0) {
      this.panel.setVisible(false);
      this.clear();
      return;
    }
    const sig = counters.map((c) => c.icon ?? '-').join(',');
    if (sig !== this.signature) {
      this.clear();
      this.signature = sig;
      this.icons = counters.map((c) => (c.icon ? uiImage(this.scene, c.icon, 0, 0, ui(ICON)) : null));
      this.texts = counters.map(() => this.scene.add.text(0, 0, '', { fontFamily: this.font, fontSize: '20px', color: '#e8e6de' }));
    }
    const px = ui(FONT_PX);
    const widths = new Map<string, number>();
    counters.forEach((c, i) => {
      const t = this.texts[i];
      if (t.style.fontSize !== `${px}px`) t.setFontSize(px);
      t.setText(c.text);
      widths.set(c.text, t.width);
    });
    const rowH = ui(ICON);
    const row = layoutCounters(counters, (text) => widths.get(text) ?? 0, ui(ICON), rowH, ui(PAD), ui(GAP));
    const ix = ui(INSET_X);
    const iy = ui(INSET_Y);
    const y = ui(baseY);
    this.panel.setPosition(x, y).setVisible(true);
    resizeSlice(this.panel, row.width + 2 * ix, rowH + 2 * iy + Math.round(4 * f));
    counters.forEach((_c, i) => {
      const place = row.items[i];
      const t = this.texts[i];
      const icon = this.icons[i];
      if (icon && place.icon) {
        icon.setDisplaySize(place.icon.w, place.icon.h).setPosition(x + ix + place.icon.x, y + iy + place.icon.y + Math.round(2 * f));
      }
      t.setPosition(x + ix + place.text.x, y + iy + Math.round((rowH - t.height) / 2) + Math.round(2 * f));
    });
  }

  /** The row's right edge in screen px (so a scene can place something after it), 0 when it is hidden. */
  get right(): number {
    return this.panel.visible ? this.panel.x + this.panel.width * this.panel.scaleX : 0;
  }

  private clear(): void {
    for (const i of this.icons) i?.destroy();
    for (const t of this.texts) t.destroy();
    this.icons = [];
    this.texts = [];
    this.signature = '';
  }
}
