// Draws the wolves as placeholder shapes (final art comes later, art/PIPELINE.md). Reads state only.
import Phaser from 'phaser';
import { ANIMALS, type Animal } from '../sim/animals';
import { BISON_HALF_WIDTH, STORM_RADIUS } from '../sim/effects';
import type { Ally, Enemy, PowerEffect } from '../sim/state';
import { tileToWorld } from './iso';

export class EnemiesView {
  private gfx: Phaser.GameObjects.Graphics;
  private allyGfx: Phaser.GameObjects.Graphics;
  private fxGfx: Phaser.GameObjects.Graphics;
  private gameGfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, private size: number) {
    this.gfx = scene.add.graphics();
    this.gameGfx = scene.add.graphics();
    this.allyGfx = scene.add.graphics();
    this.fxGfx = scene.add.graphics().setDepth(100000);
  }

  /**
   * Redraws the wild game (placeholders): tan deer and big dark bison, a hurt one with a health bar, a calm one standing
   * still and a fleeing one stretched out; a carcass lies flat and shrinks as its meat is carried off.
   */
  syncAnimals(animals: Animal[]): void {
    const g = this.gameGfx.clear();
    for (const a of animals) {
      const w = tileToWorld(a.x, a.y, this.size);
      const bison = a.kind === 'bison';
      const k = bison ? 1.45 : 1;
      const def = ANIMALS[a.kind];
      if (a.dead) {
        if (a.meat <= 1e-9 && a.hides <= 0) continue;
        const left = Math.max(0.35, a.meat / def.meat);
        g.fillStyle(0x000000, 0.25).fillEllipse(w.x, w.y, 26 * k, 10 * k);
        g.fillStyle(bison ? 0x3a2819 : 0x9b7a52, 1).fillEllipse(w.x, w.y - 3 * k, 24 * k * left, 9 * k * left + 3);
        g.fillStyle(0x8a3b2a, 1).fillEllipse(w.x + 2, w.y - 4 * k, 11 * k * left, 4 * k * left + 1);
        g.lineStyle(1.5, 0x6b4a2e, 1).lineBetween(w.x - 10 * k * left, w.y - 2, w.x - 14 * k * left, w.y + 3);
        g.lineBetween(w.x + 10 * k * left, w.y - 2, w.x + 14 * k * left, w.y + 3);
        continue;
      }
      const run = a.fleeing > 0 ? 1.15 : 1;
      g.fillStyle(0x000000, 0.25).fillEllipse(w.x, w.y, 26 * k * run, 10 * k);
      if (bison) {
        g.fillStyle(0x4a3322, 1).fillEllipse(w.x, w.y - 11, 30 * run, 16);
        g.fillStyle(0x2f2015, 1).fillEllipse(w.x + 9 * run, w.y - 14, 15, 14);
        g.fillStyle(0x4a3322, 1).fillCircle(w.x - 4, w.y - 19, 6);
        g.fillStyle(0xe8e0c8, 1).fillTriangle(w.x + 15 * run, w.y - 19, w.x + 18 * run, w.y - 23, w.x + 13 * run, w.y - 15);
      } else {
        g.fillStyle(0xb98d5c, 1).fillEllipse(w.x, w.y - 9, 20 * run, 9);
        g.lineStyle(2, 0xb98d5c, 1).lineBetween(w.x - 6, w.y - 6, w.x - 7, w.y).lineBetween(w.x + 6, w.y - 6, w.x + 7, w.y);
        g.lineBetween(w.x + 8 * run, w.y - 11, w.x + 11 * run, w.y - 17);
        g.fillStyle(0xa57b4c, 1).fillCircle(w.x + 12 * run, w.y - 18, 3);
        g.lineStyle(1, 0x6b4a2e, 1).lineBetween(w.x + 11 * run, w.y - 21, w.x + 9 * run, w.y - 26).lineBetween(w.x + 13 * run, w.y - 21, w.x + 15 * run, w.y - 26);
      }
      const hp = a.hp / def.hp;
      if (hp < 1) {
        const top = w.y - (bison ? 30 : 29);
        g.fillStyle(0x000000, 0.6).fillRect(w.x - 11, top, 22, 4);
        g.fillStyle(0xc0392b, 1).fillRect(w.x - 10, top + 1, 20 * Math.max(0, hp), 2);
      }
    }
    // One layer for all game, like the wolves: sorting each among the people is not worth a sprite.
    g.setDepth(animals.length > 0 ? Math.max(...animals.map((a) => tileToWorld(a.x, a.y, this.size).y)) : 0);
  }

  /** Redraws the running storms (a dark blue ring and swirl) and bison herds (a row of brown bison). Placeholders. */
  syncEffects(effects: PowerEffect[], now: number): void {
    const g = this.fxGfx.clear();
    for (const f of effects) {
      if (f.kind === 'storm') {
        const c = tileToWorld(f.x, f.y, this.size);
        // A circle of r tiles shows as an ellipse with semi-axes r * 45 (across) and r * 22.6 (down).
        const rx = STORM_RADIUS * 45.25;
        g.fillStyle(0x3b4a6b, 0.28).fillEllipse(c.x, c.y, rx * 2, rx);
        g.lineStyle(2, 0xcfd8ee, 0.7).strokeEllipse(c.x, c.y, rx * 2, rx);
        for (let i = 0; i < 6; i++) {
          const a = now / 300 + (i * Math.PI) / 3;
          g.lineStyle(2, 0xe8eefc, 0.6).lineBetween(
            c.x + Math.cos(a) * rx * 0.3, c.y + Math.sin(a) * rx * 0.15,
            c.x + Math.cos(a + 0.6) * rx * 0.75, c.y + Math.sin(a + 0.6) * rx * 0.375,
          );
        }
      } else {
        // Seven bison abreast across the lane, side by side along the perpendicular of the run.
        for (let i = -3; i <= 3; i++) {
          const t = (i / 3) * BISON_HALF_WIDTH;
          const w = tileToWorld(f.x + t * f.dy, f.y - t * f.dx, this.size);
          g.fillStyle(0x000000, 0.25).fillEllipse(w.x, w.y, 30, 12);
          g.fillStyle(0x4a3322, 1).fillEllipse(w.x, w.y - 9, 28, 15);
          g.fillStyle(0x2f2015, 1).fillEllipse(w.x + 8, w.y - 12, 14, 13);
          g.fillStyle(0x4a3322, 1).fillCircle(w.x + 14, w.y - 8, 4);
        }
      }
    }
  }

  /** Redraws the called allies: a pale blue spirit figure, or a glowing white wolf, each with a health bar when hurt. */
  syncAllies(allies: Ally[], maxHp: (kind: Ally['kind']) => number): void {
    const g = this.allyGfx.clear();
    for (const a of allies) {
      const w = tileToWorld(a.x, a.y, this.size);
      g.fillStyle(0x000000, 0.2).fillEllipse(w.x, w.y, 22, 9);
      if (a.kind === 'spirit') {
        g.fillStyle(0x9ad7ff, 0.75).fillEllipse(w.x, w.y - 10, 12, 22);
        g.fillStyle(0xe8f6ff, 0.9).fillCircle(w.x, w.y - 22, 5);
      } else {
        g.fillStyle(0xf2f6ff, 0.85).fillEllipse(w.x, w.y - 6, 22, 11);
        g.fillTriangle(w.x + 9, w.y - 9, w.x + 14, w.y - 15, w.x + 5, w.y - 14);
        g.fillStyle(0x5aa9ff, 1).fillCircle(w.x + 12, w.y - 11, 1.2);
      }
      const hp = a.hp / maxHp(a.kind);
      if (hp < 1) {
        g.fillStyle(0x000000, 0.6).fillRect(w.x - 11, w.y - 30, 22, 4);
        g.fillStyle(0x4aa3e0, 1).fillRect(w.x - 10, w.y - 29, 20 * Math.max(0, hp), 2);
      }
    }
    g.setDepth(allies.length > 0 ? Math.max(...allies.map((a) => tileToWorld(a.x, a.y, this.size).y)) : 0);
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
