import Phaser from 'phaser';
import { circlePoints } from '../render/cones';
import { tileToWorld } from '../render/iso';
import { addSprite } from '../render/placeholders';
import type { MissionState } from '../sim/mission';
import { trackedEnemies } from '../sim/traits';

// Ray and June on screen (DESIGN §5), shared by Mission 1 and Base 1: arrows lying where they hit (shown once
// their 0.2 s flight has landed) and Ray's Tracker markers, a faint ring under each zombie within his radius,
// drawn above walls, trees and the closed roof so it shows what they hide. The flight itself is `Feel`.

const FLIGHT_TICKS = 2; // 0.2 s at 10 Hz
const MARK = 0xd8d4c4;

export class BowView {
  private readonly ground: Phaser.GameObjects.Image[] = [];
  private readonly marks: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly n: () => number,
    private readonly hidden: (x: number, y: number) => boolean = () => false,
  ) {
    this.marks = scene.add.graphics().setDepth(1e6);
  }

  /** Call once a frame after the units are synced. `at` gives a unit's drawn (interpolated) tile point. */
  sync(s: MissionState, at: (u: { id: string; x: number; y: number }) => [number, number]): void {
    const n = this.n();
    const shown = s.looseArrows.filter((a) => s.tick - a.tick >= FLIGHT_TICKS && !this.hidden(a.x, a.y));
    while (this.ground.length < shown.length) this.ground.push(addSprite(this.scene, 'arrow_ground', 0, 0));
    this.ground.forEach((img, i) => {
      const a = shown[i];
      img.setVisible(!!a);
      if (!a) return;
      const w = tileToWorld(a.x, a.y, n);
      img.setPosition(w.x, w.y).setDepth(w.y - 1); // on the ground, under the figures
    });
    const g = this.marks.clear();
    for (const e of trackedEnemies(s)) {
      const [x, y] = at(e);
      const ring = circlePoints(x, y, 0.45, 14).map(([px, py]) => tileToWorld(px, py, n));
      g.fillStyle(MARK, 0.12).fillPoints(ring, true);
      g.lineStyle(1.5, MARK, 0.45).strokePoints(ring, true);
    }
  }
}
