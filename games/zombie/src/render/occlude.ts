// Seeing figures through walls and trees (art/STYLE.md *Occlusion*, Z63): a wall or tree standing in front of a
// survivor fades to ~40%; no cut-away or low wall pieces. Pure: it only needs a fade target with `setAlpha`.
import { tileToWorld } from './iso';

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Fadable {
  setAlpha(alpha: number): unknown;
}

/** Alpha of a wall or tree with a figure behind it. */
export const FADE_ALPHA = 0.4;
/** A full fade (1 -> 0.4 or back) takes this long. */
export const FADE_MS = 160;
/** Tiles in front of a figure that can hold something tall enough to cover it (a tree is ~2 tiles high on screen). */
const REACH = 4;
/** A figure's feet-anchored screen box in world px, a little smaller than the sprite so a graze does not fade a wall. */
const FIG = { halfW: 10, up: 50, down: 4 };

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

/** The box a figure standing at world (x, y) covers on screen. */
export function figureRect(wx: number, wy: number): Rect {
  return { x0: wx - FIG.halfW, x1: wx + FIG.halfW, y0: wy - FIG.up, y1: wy - FIG.down };
}

/** The box of an image of `w` x `h` world px whose anchor (ax, ay) sits at world (x, y). */
export function spriteRect(x: number, y: number, w: number, h: number, ax: number, ay: number): Rect {
  return { x0: x - ax * w, x1: x + (1 - ax) * w, y0: y - ay * h, y1: y + (1 - ay) * h };
}

/** `current` moved toward 1 (clear) or FADE_ALPHA (fading) by `dtMs` of the fade. */
export function easeAlpha(current: number, fading: boolean, dtMs: number): number {
  const step = ((1 - FADE_ALPHA) * dtMs) / FADE_MS;
  return fading ? Math.max(FADE_ALPHA, current - step) : Math.min(1, current + step);
}

interface Entry<T extends Fadable> {
  obj: T;
  rect: Rect;
  /** World y of the sprite's foot: it is drawn over every figure whose feet are higher up the screen than this. */
  footY: number;
  alpha: number;
  want: boolean;
}

/** The tall things of one scene (walls, trees) by tile, and the fade that keeps the survivors behind them visible. */
export class Occlusion<T extends Fadable> {
  private readonly entries = new Map<number, Entry<T>>();
  private readonly active = new Set<Entry<T>>();

  constructor(private readonly n: number) {}

  /** Registers the sprite standing on tile (tx, ty); `rect` is its world-px box. */
  add(tx: number, ty: number, obj: T, rect: Rect): void {
    const foot = tileToWorld(tx, ty, this.n);
    this.entries.set(ty * this.n + tx, { obj, rect, footY: foot.y, alpha: 1, want: false });
  }

  /**
   * Fades what stands in front of any of `figs` (feet at tile coordinates, fractional while walking) and clears
   * the rest, easing over `dtMs`. Returns, per figure, whether something covers it (the scene outlines those that are selected).
   */
  update(figs: readonly { x: number; y: number }[], dtMs: number): boolean[] {
    for (const e of this.active) e.want = false;
    const covered = figs.map((f) => this.cover(f.x, f.y));
    for (const e of this.active) {
      e.alpha = easeAlpha(e.alpha, e.want, dtMs);
      e.obj.setAlpha(e.alpha);
      if (!e.want && e.alpha >= 1) this.active.delete(e);
    }
    return covered;
  }

  private cover(fx: number, fy: number): boolean {
    const feet = tileToWorld(fx, fy, this.n);
    const fig = figureRect(feet.x, feet.y);
    const bx = Math.round(fx);
    const by = Math.round(fy);
    let any = false;
    for (let a = 0; a <= REACH; a++) {
      for (let b = 0; a + b <= REACH + 1 && b <= REACH; b++) {
        const tx = bx + a;
        const ty = by + b;
        if (tx < 0 || ty < 0 || tx >= this.n || ty >= this.n) continue;
        const e = this.entries.get(ty * this.n + tx);
        if (!e || e.footY <= feet.y || !overlaps(e.rect, fig)) continue;
        e.want = true;
        this.active.add(e);
        any = true;
      }
    }
    return any;
  }

  /** How many things are fading or faded right now (for tests). */
  get fading(): number {
    return this.active.size;
  }
}
