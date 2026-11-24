// Pure camera maths (no Phaser): pan, edge scroll, wheel zoom around the cursor.
export interface Bounds {
  w: number;
  h: number;
}

/** Keeps the view centre on the map. */
export function clampCenter(cx: number, cy: number, b: Bounds): [number, number] {
  return [Math.min(b.w, Math.max(0, cx)), Math.min(b.h, Math.max(0, cy))];
}

/**
 * Next zoom stop in a direction (`dir` > 0 zooms in, < 0 out). From a value between stops it goes to
 * the nearest stop beyond it; at either end it stays.
 */
export function stepZoom(z: number, dir: number, steps: readonly number[]): number {
  const sorted = [...steps].sort((a, b) => a - b);
  if (dir > 0) return sorted.find((s) => s > z + 1e-9) ?? sorted[sorted.length - 1]!;
  if (dir < 0) return [...sorted].reverse().find((s) => s < z - 1e-9) ?? sorted[0]!;
  return z;
}

/** The stop closest to `z` (used for the start zoom). */
export function snapZoom(z: number, steps: readonly number[]): number {
  return steps.reduce((best, s) => (Math.abs(s - z) < Math.abs(best - z) ? s : best));
}

/**
 * Wheel input to whole zoom steps. A mouse notch is ~100 px and a touchpad sends many small deltas, so
 * deltas add up until they are worth one step. Returns the new accumulator and the signed step count
 * (positive zooms in: scrolling up has a negative `deltaY`). `deltaMode` 1 is lines, 2 is pages.
 */
export function wheelSteps(acc: number, deltaY: number, deltaMode: number, threshold: number): [number, number] {
  const px = deltaY * (deltaMode === 1 ? 33 : deltaMode === 2 ? 400 : 1);
  if (px === 0) return [acc, 0];
  const base = Math.sign(acc) === Math.sign(px) ? acc : 0; // a change of direction starts over
  const total = base + px;
  const n = Math.trunc(Math.abs(total) / threshold);
  const left = total - Math.sign(total) * n * threshold;
  return [left, n === 0 ? 0 : -Math.sign(total) * n];
}

/** True when the pointer is inside the w x h canvas (the browser keeps the last position after it leaves). */
export function pointerInside(px: number, py: number, w: number, h: number): boolean {
  return px >= 0 && py >= 0 && px < w && py < h;
}

/** Direction (-1, 0 or 1 per axis) of edge scrolling for a pointer inside a w x h view. */
export function edgeDirection(px: number, py: number, w: number, h: number, edge: number): [number, number] {
  return [px <= edge ? -1 : px >= w - edge ? 1 : 0, py <= edge ? -1 : py >= h - edge ? 1 : 0];
}

/** World-pixel movement for a held direction; diagonals are not faster; slower when zoomed in. */
export function panVector(dx: number, dy: number, dtMs: number, zoom: number, pxPerSec: number): [number, number] {
  if (dx === 0 && dy === 0) return [0, 0];
  const len = Math.hypot(dx, dy);
  const d = (pxPerSec * dtMs) / 1000 / zoom;
  return [(dx / len) * d, (dy / len) * d];
}

/**
 * New view centre after zooming from `zoom` to `newZoom` so the world point under the pointer
 * (px, py in a vw x vh viewport) stays under the pointer.
 */
export function zoomAtCursor(
  cx: number, cy: number, zoom: number, px: number, py: number, vw: number, vh: number, newZoom: number,
): [number, number] {
  const ox = px - vw / 2;
  const oy = py - vh / 2;
  return [cx + ox / zoom - ox / newZoom, cy + oy / zoom - oy / newZoom];
}
