// Arrows (DESIGN-hunting.md `## Arrows`): every bow shot flies from the archer to the target, and a miss sticks in
// the ground beside it for a moment. Drawn only: nothing about an arrow is in the sim state. A shot is seen as a
// bow-holder's `cooldown` going up (the sim sets it when it shoots); a hit is seen as the target's hp going down.
import Phaser from 'phaser';
import { animalsOf } from '../sim/animals';
import type { GameState, Person } from '../sim/state';
import { applyArt, fromAtlas, spriteFor } from './art';
import { tileToWorld } from './iso';
import { hasBow } from './people';

const FLIGHT_MS = 170;
const STUCK_MS = 1400;
const FADE_MS = 400;
/** Farthest a bow-holder aims at (tiles): the longest bow range is 5. */
const AIM = 6;
/** Hand height of the archer and body height of the target, in pixels above their feet. */
const FROM_Y = -20;
const TO_Y = -9;

interface Arrow {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t0: number;
  hit: boolean;
  /** A miss lands this far beyond the target. */
  ox: number;
  oy: number;
}

interface Seen {
  x: number;
  y: number;
  hp: number;
}

export class ArrowsView {
  private gfx: Phaser.GameObjects.Graphics;
  private arrows: Arrow[] = [];
  private lastCooldown = new Map<number, number>();
  private enemies = new Map<number, Seen>();
  private animals = new Map<number, Seen>();
  private shots = 0;
  /** Arrow images reused frame to frame (only with art); `used` of them are shown this frame. */
  private pool: Phaser.GameObjects.Image[] = [];
  private used = 0;
  private art: { fly: boolean; stuck: boolean };

  constructor(scene: Phaser.Scene, private size: number) {
    this.gfx = scene.add.graphics().setDepth(100001);
    this.art = { fly: fromAtlas(scene, 'fx_arrow', 'fx_arrow'), stuck: fromAtlas(scene, 'fx_arrow_stuck', 'fx_arrow_stuck') };
  }

  /** Looks for new shots this frame, then redraws every arrow in flight or stuck. `ground` gives a person's drawn feet. */
  update(s: GameState, nowMs: number, ground: (id: number) => { x: number; y: number } | undefined): void {
    for (const p of s.people) {
      const last = this.lastCooldown.get(p.id);
      this.lastCooldown.set(p.id, p.cooldown);
      if (last !== undefined && p.cooldown > last && hasBow(p)) this.shoot(s, p, nowMs, ground(p.id));
    }
    this.cache(s);
    this.draw(nowMs);
  }

  /** Remembers where the targets stood and how healthy they were, so the next frame can tell a hit from a miss. */
  private cache(s: GameState): void {
    this.enemies.clear();
    for (const e of s.enemies) this.enemies.set(e.id, { x: e.x, y: e.y, hp: e.hp });
    this.animals.clear();
    for (const a of animalsOf(s)) this.animals.set(a.id, { x: a.x, y: a.y, hp: a.hp });
  }

  private shoot(s: GameState, p: Person, nowMs: number, feet: { x: number; y: number } | undefined): void {
    const target = this.aim(s, p);
    if (!target) return;
    const from = feet ?? tileToWorld(p.x, p.y, this.size);
    const to = tileToWorld(target.at.x, target.at.y, this.size);
    const dx = to.x - from.x;
    const dy = to.y + TO_Y - (from.y + FROM_Y);
    const d = Math.hypot(dx, dy) || 1;
    // A miss lands a little past the target and to one side, the same every run (the shot count picks the side).
    const side = this.shots++ % 2 === 0 ? 1 : -1;
    this.arrows.push({
      x0: from.x, y0: from.y + FROM_Y, x1: to.x, y1: to.y + TO_Y, t0: nowMs, hit: target.hit,
      ox: (dx / d) * 16 - (dy / d) * 7 * side, oy: (dy / d) * 8 + (dx / d) * 3.5 * side,
    });
  }

  /** Where the shooter's arrow goes: a hunter's animal, else the ordered or nearest wolf. */
  private aim(s: GameState, p: Person): { at: Seen; hit: boolean } | null {
    if (!p.drafted && p.job?.kind === 'hunt' && p.job.animal != null) {
      const now = animalsOf(s).find((a) => a.id === p.job!.animal);
      const before = this.animals.get(p.job.animal);
      if (now) return { at: before ?? now, hit: !!before && now.hp < before.hp };
      return null;
    }
    let best: { id: number; seen: Seen } | null = null;
    let bestD = AIM;
    for (const [id, seen] of this.enemies) {
      const d = Math.hypot(seen.x - p.x, seen.y - p.y);
      if (id === p.attackTarget && d <= AIM + 2) {
        best = { id, seen };
        break;
      }
      if (d < bestD) {
        bestD = d;
        best = { id, seen };
      }
    }
    if (!best) return null;
    const now = s.enemies.find((e) => e.id === best!.id);
    // A wolf that is gone was killed by this shot or one in the same frame: draw it as a hit.
    return { at: best.seen, hit: !now || now.hp < best.seen.hp };
  }

  /** The next pooled arrow image this frame, showing `key` (art drawn at scale 0.5, the game turns a flying one). */
  private sprite(key: string): Phaser.GameObjects.Image {
    let img = this.pool[this.used];
    if (!img) {
      img = spriteFor(this.gfx.scene, key, 0, 0).setDepth(100001);
      this.pool.push(img);
    } else if (img.frame.name !== key) {
      applyArt(img, key, key);
    }
    this.used++;
    return img.setVisible(true);
  }

  private draw(nowMs: number): void {
    const g = this.gfx.clear();
    this.used = 0;
    this.arrows = this.arrows.filter((a) => nowMs - a.t0 < FLIGHT_MS + (a.hit ? 0 : STUCK_MS));
    for (const a of this.arrows) {
      const age = nowMs - a.t0;
      if (age < FLIGHT_MS) {
        const u = age / FLIGHT_MS;
        const ex = a.x1 + (a.hit ? 0 : a.ox);
        const ey = a.y1 + (a.hit ? 0 : a.oy);
        const x = a.x0 + (ex - a.x0) * u;
        const y = a.y0 + (ey - a.y0) * u - Math.sin(u * Math.PI) * 10;
        // Pointing along the flight, tilted a little by the rise and fall.
        const ang = Math.atan2(ey - a.y0, ex - a.x0) + (u - 0.5) * 0.5;
        if (this.art.fly) this.sprite('fx_arrow').setPosition(x, y).setRotation(ang).setAlpha(1).setFlipX(false);
        else this.arrow(g, x, y, ang, 1);
      } else {
        const fade = Math.min(1, (a.t0 + FLIGHT_MS + STUCK_MS - nowMs) / FADE_MS);
        // The stuck arrow is painted leaning; it leans the way the arrow flew.
        if (this.art.stuck) this.sprite('fx_arrow_stuck').setPosition(a.x1 + a.ox, a.y1 + a.oy).setRotation(0).setAlpha(fade).setFlipX(a.ox < 0);
        else this.arrow(g, a.x1 + a.ox, a.y1 + a.oy, Math.atan2(a.oy, a.ox) + 0.9, fade, true);
      }
    }
    for (let i = this.used; i < this.pool.length; i++) this.pool[i].setVisible(false);
  }

  /** The arrow frames on screen now (checks). */
  shown(): string[] {
    return this.pool.slice(0, this.used).map((img) => img.frame.name);
  }

  /** One arrow: a shaft with a pale head ahead of it and red feathers behind. A stuck arrow is shorter and stands tilted. */
  private arrow(g: Phaser.GameObjects.Graphics, x: number, y: number, ang: number, alpha: number, stuck = false): void {
    const len = stuck ? 7 : 11;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const tx = x + c * len * 0.5;
    const ty = y + s * len * 0.5;
    const bx = x - c * len * 0.5;
    const by = y - s * len * 0.5;
    g.lineStyle(1.6, 0x6b4a2e, alpha).lineBetween(bx, by, tx, ty);
    g.fillStyle(0xd9d9d2, alpha).fillTriangle(tx + c * 3, ty + s * 3, tx - s * 1.6, ty + c * 1.6, tx + s * 1.6, ty - c * 1.6);
    g.lineStyle(1.4, 0xb8323c, alpha)
      .lineBetween(bx, by, bx - s * 2 - c * 2, by + c * 2 - s * 2)
      .lineBetween(bx, by, bx + s * 2 - c * 2, by - c * 2 - s * 2);
  }
}
