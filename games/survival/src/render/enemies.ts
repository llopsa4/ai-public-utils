// Draws the wolves as placeholder shapes (final art comes later, art/PIPELINE.md). Reads state only.
import Phaser from 'phaser';
import type { Enemy } from '../sim/state';
import { tileToWorld } from './iso';

export class EnemiesView {
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, private size: number) {
    this.gfx = scene.add.graphics();
  }

  /** Redraws every wolf; a hurt one shows a health bar, a fleeing one is paler. */
  sync(enemies: Enemy[], maxHp: (kind: string) => number): void {
    const g = this.gfx.clear().setDepth(0);
    for (const e of enemies) {
      const w = tileToWorld(e.x, e.y, this.size);
      const big = e.kind === 'pack_leader';
      const k = big ? 1.4 : 1;
      const body = e.fleeing ? 0x8d8a85 : big ? 0x2b2622 : 0x5b5650;
      g.fillStyle(0x000000, 0.25).fillEllipse(w.x, w.y, 24 * k, 10 * k);
      g.fillStyle(body, 1).fillEllipse(w.x, w.y - 6 * k, 22 * k, 11 * k);
      g.fillTriangle(w.x + 9 * k, w.y - 9 * k, w.x + 14 * k, w.y - 15 * k, w.x + 5 * k, w.y - 14 * k);
      g.fillStyle(0xd9534f, 1).fillCircle(w.x + 12 * k, w.y - 11 * k, 1.2);
      const hp = e.hp / maxHp(e.kind);
      if (hp < 1) {
        g.fillStyle(0x000000, 0.6).fillRect(w.x - 11, w.y - 24 * k, 22, 4);
        g.fillStyle(0xc0392b, 1).fillRect(w.x - 10, w.y - 23 * k, 20 * Math.max(0, hp), 2);
      }
    }
    // Wolves are drawn above the ground in one layer; sorting them among the people is not worth a sprite each.
    g.setDepth(enemies.length > 0 ? Math.max(...enemies.map((e) => tileToWorld(e.x, e.y, this.size).y)) : 0);
  }
}
