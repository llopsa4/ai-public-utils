import { GAME_FONT } from '../render/font';
import Phaser from 'phaser';
import { flashAlpha } from '../render/fx';
import { keyOf } from './actionKeys';
import type { ArrowModel, FlashModel } from './feelFx';
import { ui } from './uiScale';

// Overlay for hit feedback (DESIGN §19): red arrows on the screen edge for a survivor, window, door or
// barricade attacked out of sight, with the jump key beside the newest, and the herd's arrival flash.
// The playable scene's `Feel` publishes `fx_alerts` and `fx_flash`; this scene only draws them.

const FONT = GAME_FONT;
const ARROW = 0xd8382a;

export class FeelScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('Feel');
  }

  create(): void {
    this.g = this.add.graphics();
    this.labels = [];
  }

  private label(i: number): Phaser.GameObjects.Text {
    let t = this.labels[i];
    if (!t) {
      t = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '14px', color: '#ffb0a0', stroke: '#141614', strokeThickness: 3 }).setOrigin(0.5);
      this.labels[i] = t;
    }
    return t;
  }

  update(): void {
    const g = this.g;
    g.clear();
    const flash = this.registry.get('fx_flash') as FlashModel | null | undefined;
    if (flash) {
      const a = flashAlpha(performance.now() - flash.at, flash.ms, flash.peak);
      if (a > 0) g.fillStyle(flash.color, a).fillRect(0, 0, this.scale.width, this.scale.height);
    }

    const arrows = (this.registry.get('fx_alerts') as ArrowModel[] | undefined) ?? [];
    const size = ui(15);
    const pulse = 0.7 + 0.3 * Math.sin(this.time.now / 140);
    arrows.forEach((a, i) => {
      const [c, s] = [Math.cos(a.angle), Math.sin(a.angle)];
      const pt = (f: number, side: number): { x: number; y: number } => ({ x: a.x + c * f * size - s * side * size, y: a.y + s * f * size + c * side * size });
      const tri = [pt(1, 0), pt(-0.8, 0.9), pt(-0.8, -0.9)];
      g.fillStyle(ARROW, a.alpha * pulse).fillPoints(tri, true);
      g.lineStyle(2, 0x141614, a.alpha).strokePoints(tri, true);
      const t = this.label(i);
      const px = `${ui(14)}px`;
      if (t.style.fontSize !== px) t.setFontSize(ui(14));
      t.setText(a.newest ? `${a.label}  [${keyOf('alert')}]` : a.label).setAlpha(a.alpha).setVisible(true);
      const back = size * 1.4 + Math.abs(c) * (t.width / 2) + Math.abs(s) * (t.height / 2); // clear of the arrow, towards the screen's middle
      t.setPosition(a.x - c * back, a.y - s * back);
    });
    for (let i = arrows.length; i < this.labels.length; i++) this.labels[i]!.setVisible(false);
  }
}
