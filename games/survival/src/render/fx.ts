// One-shot painted effects (art/SPEC.md section 4, DESIGN-art.md *Effects and UI*): hit dust where a blow lands, foot
// dust behind anything running, a sparkle when a building is finished, and a fish leaping now and then in the river
// in view. Drawn only, never in the sim state, and only for keys that have art (final, or a stand-in with
// `?standins`): without art nothing is shown, as before.
import Phaser from 'phaser';
import { alliesOf } from '../sim/allies';
import { animalsOf } from '../sim/animals';
import { BISON_HALF_WIDTH, effectsOf } from '../sim/effects';
import type { GameState } from '../sim/state';
import buildingsData from '../data/buildings.json';
import { applyArt, fromAtlas, spriteFor } from './art';
import { herdSpots, onceFrame, onceLength, RUN_FROM } from './creatureArt';
import { tileToWorld } from './iso';

const FX = {
  hit: ['fx_hit', 'burst'],
  dust: ['fx_dust', 'puff'],
  sparkle: ['fx_sparkle', 'rise'],
  fish: ['animal_fish', 'jump'],
} as const;
export type FxKind = keyof typeof FX;

/** A runner kicks up a puff this often (ms of scene time). */
const DUST_EVERY = 220;
/** A fish leaps somewhere in view every 2.5 to 5 s. */
const FISH_MIN = 2500;
const FISH_SPREAD = 2500;
/** A person's health drop counts as a bite (not hunger or cold) only with a wolf this close (tiles). */
const BITE_NEAR = 1.5;

const SIZES = buildingsData.types as unknown as Record<string, { size: number[] }>;

interface Shot {
  img: Phaser.GameObjects.Image;
  key: string;
  anim: string;
  start: number;
}

interface Seen {
  x: number;
  y: number;
  tick: number;
  hp: number;
}

export class FxView {
  private shots: Shot[] = [];
  private seen = new Map<string, Seen>();
  private lastDust = new Map<string, number>();
  private done: Set<number> | null = null;
  private river: number[] | null = null;
  private nextFish = 0;
  private has: Record<FxKind, boolean>;
  /** How many of each effect were started (checks). */
  readonly counts: Record<FxKind, number> = { hit: 0, dust: 0, sparkle: 0, fish: 0 };

  constructor(private scene: Phaser.Scene, private size: number) {
    const has = (k: FxKind) => fromAtlas(scene, FX[k][0], onceFrame(FX[k][0], FX[k][1], 0));
    this.has = { hit: has('hit'), dust: has('dust'), sparkle: has('sparkle'), fish: has('fish') };
  }

  /** Starts an effect at a tile position; `lift` raises it (px) and `depthBias` sorts it before (-) or after (+) the creature. */
  private spawn(kind: FxKind, x: number, y: number, now: number, depthBias = 0, lift = 0): void {
    if (!this.has[kind]) return;
    const [key, anim] = FX[kind];
    const w = tileToWorld(x, y, this.size);
    const img = spriteFor(this.scene, key, w.x, w.y - lift, onceFrame(key, anim, 0)).setDepth(w.y + depthBias);
    this.shots.push({ img, key, anim, start: now });
    this.counts[kind]++;
  }

  /** Remembers a thing's position and health; returns what it was the last frame (undefined the first time). */
  private watch(id: string, x: number, y: number, hp: number, tick: number): Seen | undefined {
    const before = this.seen.get(id);
    this.seen.set(id, { x, y, hp, tick });
    return before;
  }

  /** Foot dust behind a runner (moving at least `RUN_FROM` tiles per tick since the last frame it moved). */
  private runner(id: string, before: Seen | undefined, x: number, y: number, tick: number, now: number, always = false): void {
    if (!this.has.dust || !before || tick <= before.tick) return;
    const speed = Math.hypot(x - before.x, y - before.y) / (tick - before.tick);
    if (!always && speed < RUN_FROM) return;
    if (speed < 1e-6 || now - (this.lastDust.get(id) ?? -Infinity) < DUST_EVERY) return;
    this.lastDust.set(id, now);
    this.spawn('dust', x, y, now, -0.5);
  }

  /** Looks at the state for new hits, runners, finished buildings and a fish, then plays every effect on. */
  update(s: GameState, now: number): void {
    const tick = s.tick;
    const keep = new Set<string>();
    const look = (id: string, x: number, y: number, hp: number): Seen | undefined => {
      keep.add(id);
      return this.watch(id, x, y, hp, tick);
    };
    for (const e of s.enemies) {
      const b = look(`e${e.id}`, e.x, e.y, e.hp);
      if (b && e.hp < b.hp) this.spawn('hit', e.x, e.y, now, 1);
      this.runner(`e${e.id}`, b, e.x, e.y, tick, now, e.fleeing);
    }
    for (const a of animalsOf(s)) {
      const b = look(`a${a.id}`, a.x, a.y, a.hp);
      if (b && a.hp < b.hp) this.spawn('hit', a.x, a.y, now, 1);
      if (!a.dead && a.fleeing > 0) this.runner(`a${a.id}`, b, a.x, a.y, tick, now, true);
    }
    for (const a of alliesOf(s)) {
      const b = look(`l${a.id}`, a.x, a.y, a.hp);
      if (b && a.hp < b.hp) this.spawn('hit', a.x, a.y, now, 1);
      if (a.kind === 'guardian') this.runner(`l${a.id}`, b, a.x, a.y, tick, now);
    }
    for (const p of s.people) {
      const b = look(`p${p.id}`, p.x, p.y, p.health);
      if (b && p.health < b.hp && s.enemies.some((e) => Math.hypot(e.x - p.x, e.y - p.y) <= BITE_NEAR)) this.spawn('hit', p.x, p.y, now, 1);
      if (p.mounted) this.runner(`p${p.id}`, b, p.x, p.y, tick, now);
    }
    for (const bd of s.buildings) {
      if (bd.hp == null) continue;
      const [w, h] = SIZES[bd.type]?.size ?? [1, 1];
      const cx = bd.x + (w - 1) / 2;
      const cy = bd.y + (h - 1) / 2;
      const b = look(`b${bd.id}`, cx, cy, bd.hp);
      if (b && bd.hp < b.hp) this.spawn('hit', cx, cy, now, 1);
    }
    for (const f of effectsOf(s)) {
      if (f.kind !== 'bison') continue;
      // The whole stampede raises dust along its front.
      herdSpots(f, BISON_HALF_WIDTH).forEach((p, i) => {
        const id = `h${f.id}.${i}`;
        keep.add(id);
        if (now - (this.lastDust.get(id) ?? -Infinity) < DUST_EVERY) return;
        this.lastDust.set(id, now + i * 30);
        this.spawn('dust', p.x, p.y, now, -0.5);
      });
    }
    for (const id of this.seen.keys()) if (!keep.has(id)) this.seen.delete(id);
    for (const id of this.lastDust.keys()) if (!keep.has(id)) this.lastDust.delete(id);
    this.sparkles(s, now);
    this.fish(s, now);
    this.play(now);
  }

  /** A sparkle on every building that turned finished since the last frame (not those built at the start). */
  private sparkles(s: GameState, now: number): void {
    const done = new Set(s.buildings.filter((b) => b.done).map((b) => b.id));
    if (this.done) {
      for (const b of s.buildings) {
        if (!b.done || this.done.has(b.id)) continue;
        const [w, h] = SIZES[b.type]?.size ?? [1, 1];
        this.spawn('sparkle', b.x + (w - 1) / 2, b.y + (h - 1) / 2, now, 2);
      }
    }
    this.done = done;
  }

  /** Now and then a fish leaps from a river tile inside the camera's view. */
  private fish(s: GameState, now: number): void {
    if (!this.has.fish || now < this.nextFish) return;
    this.nextFish = now + FISH_MIN + Math.random() * FISH_SPREAD;
    if (!this.river) {
      this.river = [];
      s.map.tiles.forEach((t, i) => {
        if (t === 'river') this.river!.push(i);
      });
    }
    const view = this.scene.cameras.main.worldView;
    const n = s.map.size;
    const shown = this.river.filter((i) => {
      const w = tileToWorld(i % n, Math.floor(i / n), this.size);
      return view.contains(w.x, w.y);
    });
    if (shown.length === 0) return;
    const i = shown[Math.floor(Math.random() * shown.length)];
    this.spawn('fish', (i % n) + (Math.random() - 0.5) * 0.6, Math.floor(i / n) + (Math.random() - 0.5) * 0.6, now);
  }

  /** Steps every effect's frame and removes those that have played out. */
  private play(now: number): void {
    this.shots = this.shots.filter((f) => {
      const t = now - f.start;
      if (t >= onceLength(f.key, f.anim)) {
        f.img.destroy();
        return false;
      }
      applyArt(f.img, f.key, onceFrame(f.key, f.anim, t));
      return true;
    });
  }

  /** Effects playing now, by key (checks). */
  playing(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const f of this.shots) out[f.key] = (out[f.key] ?? 0) + 1;
    return out;
  }
}
