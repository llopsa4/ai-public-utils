// Draws the people from the simulation state. Reads state, never changes it.
import Phaser from 'phaser';
import type { Person } from '../sim/state';
import { entry } from './manifest';
import { tileToWorld } from './iso';

interface View {
  img: Phaser.GameObjects.Image;
  /** Smoothed ground position (the sim moves at 10 ticks per second, the screen at 60 frames). */
  bx: number;
  by: number;
}

export class PeopleView {
  private views = new Map<number, View>();

  constructor(private scene: Phaser.Scene, private size: number) {}

  /** Creates, moves and removes sprites to match `people`. */
  sync(people: Person[], dtMs: number, timeMs: number): void {
    const k = 1 - Math.exp(-dtMs / 60);
    const alive = new Set<number>();
    for (const p of people) {
      alive.add(p.id);
      const w = tileToWorld(p.x, p.y, this.size);
      let v = this.views.get(p.id);
      if (!v) {
        const base = `person_${p.age}`;
        const key = p.family === 1 && this.scene.textures.exists(`${base}__b`) ? `${base}__b` : base;
        const a = entry(base).anchor;
        v = { img: this.scene.add.image(w.x, w.y, key).setOrigin(a[0], a[1]), bx: w.x, by: w.y };
        this.views.set(p.id, v);
      }
      v.bx += (w.x - v.bx) * k;
      v.by += (w.y - v.by) * k;
      const bob = p.task.step === 'walk' ? -Math.abs(Math.sin(timeMs / 110 + p.id)) * 2 : 0;
      v.img.setPosition(v.bx, v.by + bob).setDepth(v.by);
    }
    for (const [id, v] of this.views) {
      if (!alive.has(id)) {
        v.img.destroy();
        this.views.delete(id);
      }
    }
  }
}
