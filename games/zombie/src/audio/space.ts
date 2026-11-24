// Where a sound is heard from (DESIGN §6 *Audio*): every sound is placed from the camera centre. It is panned
// left and right by how far it sits from the centre and fades out about one screen beyond the screen's edge, so a
// faint off-screen groan is a warning. Pure: positions in screen pixels (world offset times the camera zoom).

export const PAN_MAX = 0.9; // a sound at the screen's edge is never fully in one ear

export interface Placed {
  gain: number; // 0..1 factor on the sound's own level
  pan: number; // -1 (left) .. 1 (right)
}

/**
 * Gain and pan of a sound `dx`, `dy` world pixels from the listener (the camera centre) on a screen `w` wide at
 * `zoom`. Full level while it is on screen (within half the screen's width), then a smooth fade to silence at
 * `reach` screen widths further out. `reach` 1 is the rule; a loud sound may use more, a quiet one less.
 */
export function spatial(dx: number, dy: number, zoom: number, w: number, reach = 1): Placed {
  const sx = dx * zoom;
  const sy = dy * zoom;
  const d = Math.hypot(sx, sy);
  const near = w / 2;
  const span = Math.max(1, w * reach);
  const k = d <= near ? 0 : Math.min(1, (d - near) / span);
  const gain = 0.5 + 0.5 * Math.cos(Math.PI * k); // smooth 1 → 0
  const pan = Math.max(-1, Math.min(1, sx / near)) * PAN_MAX;
  return { gain: k >= 1 ? 0 : gain, pan };
}

/** Sounds below this level are not worth starting. */
export const AUDIBLE = 0.02;

/** The shortest time (ms) between two plays of one sound id: a crowd of zombies must not machine-gun a step. */
export const MIN_GAP_MS: Record<string, number> = {
  step: 70,
  stepSoft: 90,
  stepRun: 60,
  stepZombie: 110,
  groan: 250,
  bite: 120,
  chew: 160,
  shot: 40,
  ui: 60,
  blip: 25,
};
const DEFAULT_GAP_MS = 30;
const WINDOW_MS = 1000;
const BUSY = 24; // plays in the last second after which only loud sounds still start

/** Decides whether a sound may start now, from what played in the last second. Keeps its own history. */
export class Throttle {
  private last = new Map<string, number>();
  private recent: number[] = [];

  allow(id: string, now: number, level: number): boolean {
    if (level < AUDIBLE) return false;
    const gap = MIN_GAP_MS[id] ?? DEFAULT_GAP_MS;
    const prev = this.last.get(id);
    if (prev !== undefined && now - prev < gap) return false;
    this.recent = this.recent.filter((t) => now - t < WINDOW_MS);
    if (this.recent.length >= BUSY && level < 0.5) return false;
    this.last.set(id, now);
    this.recent.push(now);
    return true;
  }
}
