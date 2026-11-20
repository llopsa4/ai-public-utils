// Draws the people from the simulation state. Reads state, never changes it.
import Phaser from 'phaser';
import type { Building, Person } from '../sim/state';
import { materialsComplete } from '../sim/buildings';
import { entry } from './manifest';
import { tileToWorld } from './iso';

/** The work overlays drawn on a person while they work (DESIGN-hunting.md `## Work animations`). */
export type WorkTool = 'hammer' | 'axe' | 'pick' | 'dry';

interface View {
  img: Phaser.GameObjects.Image;
  /** The tool overlay, redrawn every frame (placeholder art drawn in code, the same for both families). */
  tool: Phaser.GameObjects.Graphics;
  /** Smoothed ground position (the sim moves at 10 ticks per second, the screen at 60 frames). */
  bx: number;
  by: number;
}

/**
 * Which tool a person is using right now, or null. A builder only swings the hammer while the site has all its
 * materials (otherwise they stand waiting for the haulers); drafted people never work.
 */
export function workTool(p: Person, buildings: Building[]): WorkTool | null {
  if (p.drafted || p.task.step !== 'work' || !p.job) return null;
  switch (p.job.kind) {
    case 'build': {
      const site = buildings.find((b) => b.id === p.job!.building);
      return site && !site.done && materialsComplete(site) ? 'hammer' : null;
    }
    case 'chop':
      return 'axe';
    case 'gather':
      return 'pick';
    case 'dry':
      return 'dry';
    default:
      return null;
  }
}

const DEG = Math.PI / 180;

/** A stroke that comes down fast and goes back up slowly: 0 raised, 1 struck. */
function strike(phase: number): number {
  const d = phase < 0.3 ? phase / 0.3 : 1 - (phase - 0.3) / 0.7;
  return d * d;
}

/** Draws `tool` for a person whose feet are at (0, 0) in the overlay's own space; `k` scales a child. */
function drawTool(g: Phaser.GameObjects.Graphics, tool: WorkTool, timeMs: number, id: number, k: number): void {
  const hx = 8 * k;
  const hy = -21 * k;
  const seed = id * 0.37;
  if (tool === 'hammer' || tool === 'axe') {
    const phase = (timeMs / (tool === 'axe' ? 760 : 520) + seed) % 1;
    const a = (-75 + 105 * strike(phase)) * DEG; // from vertical, clockwise
    const len = (tool === 'axe' ? 15 : 11) * k;
    const sx = Math.sin(a);
    const sy = -Math.cos(a);
    const ex = hx + len * sx;
    const ey = hy + len * sy;
    g.lineStyle(2, 0x6b4a2e, 1).lineBetween(hx, hy, ex, ey);
    if (tool === 'hammer') {
      // A stone head across the handle's end.
      g.lineStyle(5 * k + 1, 0x7d7d78, 1).lineBetween(ex - 3.5 * k * sy, ey + 3.5 * k * sx, ex + 3.5 * k * sy, ey - 3.5 * k * sx);
    } else {
      // A flat blade on the side the stroke goes towards.
      const px = -sy;
      const py = sx;
      g.fillStyle(0x9a9a94, 1).fillTriangle(ex, ey, ex + 6 * k * px, ey + 6 * k * py - 2 * k * sy, ex - 2 * k * sx + 5 * k * px, ey - 2 * k * sy + 5 * k * py + 4 * k * sx);
    }
    return;
  }
  if (tool === 'pick') {
    // The hand reaches down to the ground and brings a tuft up, over and over.
    const phase = (timeMs / 700 + seed) % 1;
    const reach = Math.abs(Math.sin(phase * Math.PI));
    const x = 11 * k;
    const y = -3 * k - reach * 5 * k;
    g.lineStyle(2, 0xd9a066, 1).lineBetween(hx, hy + 8 * k, x, y);
    g.fillStyle(0x4f7a38, 1).fillCircle(x, y - 1, 2.2 * k + 0.5);
    g.fillStyle(0xb8323c, 1).fillCircle(x + 2 * k, y, 1.2);
    return;
  }
  // Tending a drying rack: both hands up, turning a strip of meat on a pole.
  const phase = timeMs / 600 + seed;
  const w = Math.sin(phase * Math.PI * 2);
  const lx = -9 * k;
  const rx = 9 * k;
  const ly = (-31 + w * 3) * k;
  const ry = (-31 - w * 3) * k;
  g.lineStyle(2, 0xd9a066, 1).lineBetween(-7 * k, -23 * k, lx, ly).lineBetween(hx - k, hy - 2 * k, rx, ry);
  g.lineStyle(2, 0x6b4a2e, 1).lineBetween(lx, ly, rx, ry);
  const mx = (lx + rx) / 2;
  const my = (ly + ry) / 2;
  g.fillStyle(0x8a3b2a, 1).fillRect(mx - 3 - w * 1.5, my + 1, 4, 7 * k + 2);
}

export class PeopleView {
  private views = new Map<number, View>();

  constructor(private scene: Phaser.Scene, private size: number) {}

  /** Creates, moves and removes sprites to match `people`. */
  sync(people: Person[], dtMs: number, timeMs: number, buildings: Building[] = []): void {
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
        v = {
          img: this.scene.add.image(w.x, w.y, key).setOrigin(a[0], a[1]),
          tool: this.scene.add.graphics(),
          bx: w.x,
          by: w.y,
        };
        this.views.set(p.id, v);
      }
      v.bx += (w.x - v.bx) * k;
      v.by += (w.y - v.by) * k;
      const bob = p.task.step === 'walk' ? -Math.abs(Math.sin(timeMs / 110 + p.id)) * 2 : 0;
      v.img.setPosition(v.bx, v.by + bob).setDepth(v.by);
      const tool = workTool(p, buildings);
      // Gatherers stoop: the sprite leans forward from the feet.
      v.img.setAngle(tool === 'pick' ? 12 + Math.sin(timeMs / 350 + p.id) * 3 : 0);
      v.tool.clear();
      if (tool) {
        v.tool.setPosition(v.bx, v.by).setDepth(v.by + 0.5);
        drawTool(v.tool, tool, timeMs, p.id, p.age === 'child' ? 0.7 : 1);
      }
    }
    for (const [id, v] of this.views) {
      if (!alive.has(id)) {
        v.img.destroy();
        v.tool.destroy();
        this.views.delete(id);
      }
    }
  }
}
