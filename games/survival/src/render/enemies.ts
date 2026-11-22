// Draws the wolves, wild game and carcasses, corral horses, called allies and the stampede and storm (art/SPEC.md
// sections 3 and 4). Reads state only. A kind whose key has art in the atlas (final, or a stand-in with `?standins`)
// is a sprite per creature playing the animation `creatureArt.ts` picks; otherwise it keeps its code placeholder
// (and corral horses, which have none, are not drawn). Health bars and the storm's ring stay code-drawn.
import Phaser from 'phaser';
import jobsData from '../data/jobs.json';
import { ALLIES, alliesOf } from '../sim/allies';
import { ANIMALS, animalsOf, type Animal } from '../sim/animals';
import { ENEMIES } from '../sim/combat';
import { BISON_HALF_WIDTH, effectsOf, STORM_RADIUS } from '../sim/effects';
import { freeHorses, type Ally, type Enemy, type GameState, type PowerEffect } from '../sim/state';
import { applyArt, fromAtlas, spriteFor } from './art';
import {
  carcassFrame, carcassKey, carcassStage, corralHorses, gameAnim, herdSpots, offMap, onceFrame, restAnim, screenDir,
  wolfAnim, wolfLook, type Motion,
} from './creatureArt';
import { defaultFrame } from './frames';
import { tileToWorld } from './iso';
import { animLength, facingFrom, frameAt, personFrame, type Facing } from './personArt';

/** One drawn creature: its sprite and what it shows, its smoothed ground point and the last sim position seen. */
interface Body {
  img: Phaser.GameObjects.Image;
  key: string;
  facing: Facing;
  anim: string;
  animStart: number;
  frame: string;
  bx: number;
  by: number;
  sx: number;
  sy: number;
  tick: number;
  motion: Motion;
  /** A deer or bison: when it died (scene ms), -Infinity when first seen already dead; null while alive. */
  deadAt: number | null;
}

/** A body that left the state and plays out: a wolf's death and carcass, a carcass's bones, an ally fading. */
interface Fall {
  body: Body;
  start: number;
  scale: number;
  /** Plays `die` first (a wolf drawn from art). */
  dies: boolean;
  /** A still to lie as after the death: a wolf carcass or the bones of an emptied carcass. */
  still: { key: string; frame: string } | null;
  stillMs: number;
  /** The fade at the end, and the alpha it fades from. */
  fadeMs: number;
  alpha0: number;
}

/** How long a death lies still before what follows, how long a wolf carcass or bones stay, and the fade, in ms. */
const LIE_MS = 1500;
const CARCASS_MS = 5000;
const BONES_MS = 6000;
const FADE_MS = 1000;
const ALLY_FADE_MS = 400;
/** A dying deer or bison lies a moment on its last `die` frame before the carcass still takes over. */
const DIE_HOLD_MS = 400;
/** A health bar sits this far above the feet: the drawn height of the model at scale 1 (display px). */
const BAR_UP: Record<string, number> = { animal_wolf: 38, animal_deer: 52, animal_bison: 64 };
/** The storm art (384 px at 2x) is stretched so its width is the storm's circle across. */
const STORM_CELL = 384;
const TILE_ACROSS = 45.25;

export class EnemiesView {
  private gfx: Phaser.GameObjects.Graphics;
  private allyGfx: Phaser.GameObjects.Graphics;
  private fxGfx: Phaser.GameObjects.Graphics;
  private gameGfx: Phaser.GameObjects.Graphics;
  /** Health bars and the guardians' glow over the sprites. */
  private barGfx: Phaser.GameObjects.Graphics;
  private glowGfx: Phaser.GameObjects.Graphics;
  private wolves = new Map<number, Body>();
  private animals = new Map<number, Body>();
  private allies = new Map<number, Body>();
  private horses = new Map<string, Body>();
  private herds = new Map<string, Body>();
  private storms = new Map<number, Body>();
  private falls: Fall[] = [];
  /** Which keys have art, read once (the atlases do not change during a run). */
  private art: Record<string, boolean> = {};

  constructor(private scene: Phaser.Scene, private size: number) {
    this.gfx = scene.add.graphics();
    this.gameGfx = scene.add.graphics();
    this.allyGfx = scene.add.graphics();
    this.fxGfx = scene.add.graphics().setDepth(100000);
    this.barGfx = scene.add.graphics().setDepth(100002);
    this.glowGfx = scene.add.graphics();
    for (const key of [
      'animal_wolf', 'animal_deer', 'animal_bison', 'animal_horse', 'carcass_wolf', 'carcass_deer', 'carcass_bison',
      'ally_spirit', 'fx_storm',
    ]) {
      this.art[key] = fromAtlas(scene, key, defaultFrame(key));
    }
  }

  /** Redraws everything this view owns for the frame. */
  sync(s: GameState, dtMs: number, now: number): void {
    const k = 1 - Math.exp(-dtMs / 60);
    this.barGfx.clear();
    this.glowGfx.clear();
    this.syncWolves(s.enemies, s.tick, k, now);
    this.syncAnimals(animalsOf(s), s.tick, k, now);
    this.syncAllies(alliesOf(s), s.tick, k, now);
    this.syncEffects(effectsOf(s), now);
    this.syncHorses(s, now);
    this.playFalls(now);
  }

  private body(key: string, x: number, y: number, tick: number, frame?: string): Body {
    const w = tileToWorld(x, y, this.size);
    const img = spriteFor(this.scene, key, w.x, w.y, frame ?? defaultFrame(key));
    return {
      img, key, facing: 's', anim: '', animStart: 0, frame: '', bx: w.x, by: w.y, sx: x, sy: y, tick,
      motion: { moving: false, speed: 0 }, deadAt: null,
    };
  }

  /** Follows the sim position: the facing from where the drawn body still has to go, smoothing, and the motion per tick. */
  private drive(v: Body, x: number, y: number, tick: number, k: number): void {
    const w = tileToWorld(x, y, this.size);
    v.facing = facingFrom(w.x - v.bx, w.y - v.by, v.facing);
    v.bx += (w.x - v.bx) * k;
    v.by += (w.y - v.by) * k;
    if (tick > v.tick) {
      const d = Math.hypot(x - v.sx, y - v.sy);
      v.motion = { moving: d > 1e-4, speed: d / (tick - v.tick) };
      v.sx = x;
      v.sy = y;
      v.tick = tick;
    }
  }

  /** Shows an 8-facing animation (pattern A, the base layer); a new animation starts at `since` (default now). */
  private pose(v: Body, key: string, anim: string, rate: number, now: number, since = now): void {
    if (anim !== v.anim || key !== v.key) {
      v.anim = anim;
      v.animStart = since;
    }
    v.key = key;
    const frame = personFrame(key, 'base', anim, v.facing, frameAt(key, anim, now - v.animStart, rate));
    if (frame !== v.frame) {
      v.frame = frame;
      applyArt(v.img, key, frame);
    }
  }

  /** Shows a one-facing frame (a carcass stage, an ally's float, the storm). */
  private still(v: Body, key: string, frame: string): void {
    v.key = key;
    v.anim = '';
    if (frame === v.frame) return;
    v.frame = frame;
    applyArt(v.img, key, frame);
  }

  private bar(x: number, y: number, frac: number, colour: number): void {
    this.barGfx.fillStyle(0x000000, 0.6).fillRect(x - 11, y, 22, 4);
    this.barGfx.fillStyle(colour, 1).fillRect(x - 10, y + 1, 20 * Math.max(0, frac), 2);
  }

  // ---- wolves ----

  private syncWolves(enemies: Enemy[], tick: number, k: number, now: number): void {
    if (!this.art.animal_wolf) {
      this.drawWolfPlaceholders(enemies);
      return;
    }
    this.gfx.clear();
    const alive = new Set<number>();
    for (const e of enemies) {
      alive.add(e.id);
      let v = this.wolves.get(e.id);
      if (!v) {
        v = this.body('animal_wolf', e.x, e.y, tick);
        this.wolves.set(e.id, v);
      }
      this.drive(v, e.x, e.y, tick, k);
      const look = wolfLook(e.kind);
      const pick = wolfAnim(e, v.motion);
      this.pose(v, 'animal_wolf', pick.anim, pick.rate, now);
      v.img.setScale(0.5 * look.scale).setTint(look.tint).setPosition(v.bx, v.by).setDepth(v.by);
      const hp = e.hp / ENEMIES[e.kind].hp;
      if (hp < 1) this.bar(v.bx, v.by - BAR_UP.animal_wolf * look.scale, hp, 0xc0392b);
    }
    for (const [id, v] of this.wolves) {
      if (alive.has(id)) continue;
      this.wolves.delete(id);
      if (offMap(v.sx, v.sy, this.size)) {
        v.img.destroy(); // ran off the map
        continue;
      }
      const carcass = this.art.carcass_wolf ? { key: 'carcass_wolf', frame: carcassFrame('wolf', 'stage1') } : null;
      this.fall(v, now, { dies: true, still: carcass, stillMs: CARCASS_MS });
    }
  }

  /** The code placeholder: one layer of grey shapes; a hurt wolf shows a health bar, a fleeing one is paler. */
  private drawWolfPlaceholders(enemies: Enemy[]): void {
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
      const hp = e.hp / ENEMIES[e.kind].hp;
      if (hp < 1) {
        g.fillStyle(0x000000, 0.6).fillRect(w.x - 11, w.y - 24 * k, 22, 4);
        g.fillStyle(0xc0392b, 1).fillRect(w.x - 10, w.y - 23 * k, 20 * Math.max(0, hp), 2);
      }
    }
    // Wolves are drawn above the ground in one layer; sorting them among the people is not worth a sprite each.
    g.setDepth(enemies.length > 0 ? Math.max(...enemies.map((e) => tileToWorld(e.x, e.y, this.size).y)) : 0);
  }

  // ---- wild game and carcasses ----

  private syncAnimals(animals: Animal[], tick: number, k: number, now: number): void {
    const g = this.gameGfx.clear();
    const drawn: Animal[] = [];
    const alive = new Set<number>();
    for (const a of animals) {
      const key = `animal_${a.kind}`;
      const art = this.art[key];
      const cArt = this.art[carcassKey(a.kind)];
      if (a.dead ? !art && !cArt : !art) {
        // No art for what it is now: the code placeholder (a sprite it had, if any, goes).
        this.animals.get(a.id)?.img.destroy();
        this.animals.delete(a.id);
        if (!a.dead || a.meat > 1e-9 || a.hides > 0) drawn.push(a);
        continue;
      }
      alive.add(a.id);
      let v = this.animals.get(a.id);
      if (!v) {
        v = this.body(a.dead && cArt ? carcassKey(a.kind) : key, a.x, a.y, tick);
        if (a.dead) v.deadAt = -Infinity;
        this.animals.set(a.id, v);
      }
      this.drive(v, a.x, a.y, tick, k);
      const def = ANIMALS[a.kind];
      if (!a.dead) {
        const pick = gameAnim(a, v.motion, now);
        this.pose(v, key, pick.anim, pick.rate, now);
        const hp = a.hp / def.hp;
        if (hp < 1) this.bar(v.bx, v.by - BAR_UP[key], hp, 0xc0392b);
      } else {
        if (v.deadAt === null) v.deadAt = now;
        const t = now - v.deadAt;
        if (art && t < animLength(key, 'die') + DIE_HOLD_MS) this.pose(v, key, 'die', 1, now, v.deadAt);
        else if (cArt) this.still(v, carcassKey(a.kind), carcassFrame(a.kind, carcassStage(a.meat, def.meat)));
        else this.pose(v, key, 'die', 1, now, v.deadAt === -Infinity ? -1e9 : v.deadAt); // lies on the last die frame
      }
      v.img.setScale(0.5).setPosition(v.bx, v.by).setDepth(v.by);
    }
    for (const [id, v] of this.animals) {
      if (alive.has(id)) continue;
      this.animals.delete(id);
      const kind = v.key.replace(/^(animal|carcass)_/, '');
      if (v.deadAt === null || !this.art[carcassKey(kind)]) {
        // A live animal does not leave the state; a carcass with no carcass art just fades.
        if (v.deadAt === null) v.img.destroy();
        else this.fall(v, now, {});
        continue;
      }
      // The last load was taken: the bones lie a while, then fade.
      this.fall(v, now, { still: { key: carcassKey(kind), frame: carcassFrame(kind, 'stage3') }, stillMs: BONES_MS });
    }
    this.drawAnimalPlaceholders(g, drawn);
  }

  /**
   * The code placeholders: tan deer and big dark bison, a hurt one with a health bar, a calm one standing still and a
   * fleeing one stretched out; a carcass lies flat and shrinks as its meat is carried off.
   */
  private drawAnimalPlaceholders(g: Phaser.GameObjects.Graphics, animals: Animal[]): void {
    for (const a of animals) {
      const w = tileToWorld(a.x, a.y, this.size);
      const bison = a.kind === 'bison';
      const k = bison ? 1.45 : 1;
      const def = ANIMALS[a.kind];
      if (a.dead) {
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

  // ---- allies ----

  private syncAllies(allies: Ally[], tick: number, k: number, now: number): void {
    const g = this.allyGfx.clear();
    const drawn: Ally[] = [];
    const alive = new Set<number>();
    for (const a of allies) {
      const key = a.kind === 'spirit' ? 'ally_spirit' : 'animal_wolf';
      if (!this.art[key]) {
        drawn.push(a);
        continue;
      }
      alive.add(a.id);
      let v = this.allies.get(a.id);
      if (!v) {
        v = this.body(key, a.x, a.y, tick);
        v.animStart = now;
        this.allies.set(a.id, v);
      }
      this.drive(v, a.x, a.y, tick, k);
      if (a.kind === 'spirit') {
        this.still(v, key, onceFrame(key, 'float', now - v.animStart, a.id * 0.37));
        v.img.setScale(0.5).setAlpha(0.9);
      } else {
        const look = wolfLook('guardian');
        const pick = wolfAnim(a, v.motion);
        this.pose(v, key, pick.anim, pick.rate, now);
        v.img.setScale(0.5 * look.scale).setTint(look.tint).setAlpha(look.alpha);
        // The spirit glow under a guardian, breathing slowly.
        const pulse = 0.25 + 0.1 * Math.sin(now / 260 + a.id);
        this.glowGfx.fillStyle(0x9ad7ff, pulse).fillEllipse(v.bx, v.by - 8, 46, 26);
      }
      v.img.setPosition(v.bx, v.by).setDepth(v.by);
      const hp = a.hp / ALLIES[a.kind].hp;
      if (hp < 1) this.bar(v.bx, v.by - BAR_UP.animal_wolf - (a.kind === 'spirit' ? 14 : 0), hp, 0x4aa3e0);
    }
    this.glowGfx.setDepth(allies.length > 0 ? Math.min(...allies.map((a) => tileToWorld(a.x, a.y, this.size).y)) - 1 : 0);
    for (const [id, v] of this.allies) {
      if (alive.has(id)) continue;
      this.allies.delete(id);
      this.fall(v, now, { fadeMs: ALLY_FADE_MS });
    }
    this.drawAllyPlaceholders(g, drawn);
  }

  /** The code placeholders: a pale blue spirit figure, or a glowing white wolf, each with a health bar when hurt. */
  private drawAllyPlaceholders(g: Phaser.GameObjects.Graphics, allies: Ally[]): void {
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
      const hp = a.hp / ALLIES[a.kind].hp;
      if (hp < 1) {
        g.fillStyle(0x000000, 0.6).fillRect(w.x - 11, w.y - 30, 22, 4);
        g.fillStyle(0x4aa3e0, 1).fillRect(w.x - 10, w.y - 29, 20 * Math.max(0, hp), 2);
      }
    }
    g.setDepth(allies.length > 0 ? Math.max(...allies.map((a) => tileToWorld(a.x, a.y, this.size).y)) : 0);
  }

  // ---- stampede and storm ----

  /** The running storms and bison herds: sprites when `fx_storm` / `animal_bison` have art, else the code placeholders. */
  private syncEffects(effects: PowerEffect[], now: number): void {
    const g = this.fxGfx.clear();
    const live = new Set<string>();
    const storms = new Set<number>();
    for (const f of effects) {
      if (f.kind === 'storm') {
        const c = tileToWorld(f.x, f.y, this.size);
        // A circle of r tiles shows as an ellipse with semi-axes r * 45 (across) and r * 22.6 (down).
        const rx = STORM_RADIUS * TILE_ACROSS;
        if (this.art.fx_storm) {
          storms.add(f.id);
          let v = this.storms.get(f.id);
          if (!v) {
            v = this.body('fx_storm', f.x, f.y, 0);
            v.animStart = now;
            this.storms.set(f.id, v);
          }
          this.still(v, 'fx_storm', onceFrame('fx_storm', 'loop', now - v.animStart));
          v.img.setScale((rx * 2) / STORM_CELL).setPosition(c.x, c.y).setDepth(100000);
          g.lineStyle(2, 0xcfd8ee, 0.5).strokeEllipse(c.x, c.y, rx * 2, rx);
          continue;
        }
        g.fillStyle(0x3b4a6b, 0.28).fillEllipse(c.x, c.y, rx * 2, rx);
        g.lineStyle(2, 0xcfd8ee, 0.7).strokeEllipse(c.x, c.y, rx * 2, rx);
        for (let i = 0; i < 6; i++) {
          const a = now / 300 + (i * Math.PI) / 3;
          g.lineStyle(2, 0xe8eefc, 0.6).lineBetween(
            c.x + Math.cos(a) * rx * 0.3, c.y + Math.sin(a) * rx * 0.15,
            c.x + Math.cos(a + 0.6) * rx * 0.75, c.y + Math.sin(a + 0.6) * rx * 0.375,
          );
        }
        continue;
      }
      const spots = herdSpots(f, BISON_HALF_WIDTH);
      if (this.art.animal_bison) {
        const dir = screenDir(f.dx, f.dy);
        spots.forEach((p, i) => {
          const id = `${f.id}.${i}`;
          live.add(id);
          const w = tileToWorld(p.x, p.y, this.size);
          let v = this.herds.get(id);
          if (!v) {
            v = this.body('animal_bison', p.x, p.y, 0);
            v.animStart = now - i * 70; // not all in step
            this.herds.set(id, v);
          }
          v.facing = facingFrom(dir.x, dir.y, v.facing);
          v.anim = 'run';
          this.pose(v, 'animal_bison', 'run', 1, now);
          v.img.setScale(0.5).setPosition(w.x, w.y).setDepth(w.y);
        });
        continue;
      }
      // Seven placeholder bison abreast across the lane.
      for (const p of spots) {
        const w = tileToWorld(p.x, p.y, this.size);
        g.fillStyle(0x000000, 0.25).fillEllipse(w.x, w.y, 30, 12);
        g.fillStyle(0x4a3322, 1).fillEllipse(w.x, w.y - 9, 28, 15);
        g.fillStyle(0x2f2015, 1).fillEllipse(w.x + 8, w.y - 12, 14, 13);
        g.fillStyle(0x4a3322, 1).fillCircle(w.x + 14, w.y - 8, 4);
      }
    }
    for (const [id, v] of this.herds) {
      if (live.has(id)) continue;
      v.img.destroy();
      this.herds.delete(id);
    }
    for (const [id, v] of this.storms) {
      if (storms.has(id)) continue;
      this.fall(v, now, { fadeMs: ALLY_FADE_MS });
      this.storms.delete(id);
    }
  }

  // ---- corral horses ----

  /** The free horses standing in the finished corrals, grazing or resting; only with horse art (there is no placeholder). */
  private syncHorses(s: GameState, now: number): void {
    if (!this.art.animal_horse) return;
    const corrals = s.buildings
      .filter((b) => b.type === 'horse_corral' && b.done)
      .map((b) => ({ id: b.id, cx: b.x + 0.5, cy: b.y + 0.5 }));
    const list = corralHorses(corrals, freeHorses(s), jobsData.jobs.tend.capPerCorral);
    const shown = new Set<string>();
    for (const h of list) {
      const id = `${h.corral}.${h.slot}`;
      shown.add(id);
      let v = this.horses.get(id);
      if (!v) {
        v = this.body('animal_horse', h.x, h.y, 0);
        v.facing = h.facing;
        this.horses.set(id, v);
      }
      const w = tileToWorld(h.x, h.y, this.size);
      const pick = restAnim(h.corral * 7 + h.slot, now);
      this.pose(v, 'animal_horse', pick.anim, pick.rate, now);
      v.img.setScale(0.5).setPosition(w.x, w.y).setDepth(w.y);
    }
    for (const [id, v] of this.horses) {
      if (shown.has(id)) continue;
      v.img.destroy();
      this.horses.delete(id);
    }
  }

  // ---- deaths, bones and fades ----

  /** Starts a body playing out: an optional `die`, an optional still to lie as, then a fade. */
  private fall(v: Body, now: number, opts: { dies?: boolean; still?: Fall['still']; stillMs?: number; fadeMs?: number }): void {
    this.falls.push({
      body: v, start: now, scale: v.img.scaleX / 0.5, dies: !!opts.dies, still: opts.still ?? null,
      stillMs: opts.stillMs ?? 0, fadeMs: opts.fadeMs ?? FADE_MS, alpha0: v.img.alpha,
    });
  }

  private playFalls(now: number): void {
    this.falls = this.falls.filter((f) => {
      const v = f.body;
      const t = now - f.start;
      const dieMs = f.dies ? animLength(v.key, 'die') + LIE_MS : 0;
      if (f.dies && t < dieMs) this.pose(v, v.key, 'die', 1, now, f.start);
      else if (f.still) this.still(v, f.still.key, f.still.frame);
      v.img.setScale(0.5 * f.scale);
      const end = dieMs + (f.still ? f.stillMs : 0);
      const alpha = f.alpha0 * (1 - Math.max(0, t - end) / f.fadeMs);
      if (alpha <= 0) {
        v.img.destroy();
        return false;
      }
      v.img.setAlpha(alpha);
      return true;
    });
  }

  /** What each creature shows now (checks): frame names by id, the horses, herds and storms, and what is playing out. */
  shown(): {
    wolves: Record<number, string>; animals: Record<number, string>; allies: Record<number, string>;
    horses: string[]; herds: string[]; storms: string[]; falls: string[]; art: Record<string, boolean>;
  } {
    const frames = (m: Map<number, Body>) => Object.fromEntries([...m].map(([id, v]) => [id, v.frame]));
    return {
      wolves: frames(this.wolves),
      animals: frames(this.animals),
      allies: frames(this.allies),
      horses: [...this.horses.values()].map((v) => v.frame),
      herds: [...this.herds.values()].map((v) => v.frame),
      storms: [...this.storms.values()].map((v) => v.frame),
      falls: this.falls.map((f) => f.body.frame),
      art: { ...this.art },
    };
  }
}
