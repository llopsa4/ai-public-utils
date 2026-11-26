import Phaser from 'phaser';
import type { Enemy, EnemyKind } from '../sim/mission';

// Theo's enemy highlight on screen (DESIGN §5): a coloured outline glow around every marked enemy, above walls,
// trees and the closed roof. Each colour is one layer of figure copies with one knockout glow on the whole layer,
// so a herd costs two shader passes, not one per zombie. A canvas renderer has no glow: it draws a box instead.

export const HIGHLIGHT_COLOR: Record<EnemyKind, number> = { zombie: 0xff3b30, human: 0xff7000 };
const STRENGTH = 5;
const DEPTH = 1e6;
const BOX_W = 26;
const BOX_H = 56;

export class EnemyHighlight {
  private readonly layers: Record<EnemyKind, Phaser.GameObjects.Container> | null = null;
  private readonly copies = new Map<string, Phaser.GameObjects.Image>();
  private readonly boxes: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene) {
    this.boxes = scene.add.graphics().setDepth(DEPTH);
    if (scene.game.renderer.type !== Phaser.WEBGL) return;
    const layer = (kind: EnemyKind): Phaser.GameObjects.Container => {
      const c = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
      c.postFX.addGlow(HIGHLIGHT_COLOR[kind], STRENGTH, 0, true, 0.1, 8); // knockout: the outline only
      return c;
    };
    this.layers = { zombie: layer('zombie'), human: layer('human') };
  }

  /**
   * Call once a frame after the units are synced, with the enemies to mark (none: all off). `body` is the
   * enemy's own sprite, whose frame is copied even when a roof hides it; `at` is its feet in world px.
   */
  sync(enemies: readonly Enemy[], body: (e: Enemy) => Phaser.GameObjects.Image, at: (e: Enemy) => { x: number; y: number }): void {
    const boxes = this.boxes.clear();
    for (const img of this.copies.values()) img.setVisible(false);
    const used = { zombie: false, human: false };
    for (const e of enemies) {
      const { x, y } = at(e);
      if (!this.layers) {
        boxes.lineStyle(2, HIGHLIGHT_COLOR[e.kind], 0.9).strokeRect(x - BOX_W / 2, y - BOX_H, BOX_W, BOX_H);
        continue;
      }
      const src = body(e);
      let img = this.copies.get(e.id);
      if (!img) {
        img = this.scene.add.image(0, 0, src.texture.key);
        this.layers[e.kind].add(img);
        this.copies.set(e.id, img);
      }
      if (img.texture.key !== src.texture.key || img.frame.name !== src.frame.name) img.setTexture(src.texture.key, src.frame.name);
      img.setOrigin(src.originX, src.originY).setScale(src.scaleX, src.scaleY).setFlipX(src.flipX).setPosition(x, y).setVisible(true);
      used[e.kind] = true;
    }
    // An empty layer is hidden, so its glow pass costs nothing.
    this.layers?.zombie.setVisible(used.zombie);
    this.layers?.human.setVisible(used.human);
  }
}
