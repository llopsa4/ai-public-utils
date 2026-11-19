// Pure camera maths (no Phaser): pan, edge scroll, wheel zoom around the cursor.
export interface Bounds {
  w: number;
  h: number;
}

/** Keeps the view centre on the map. */
export function clampCenter(cx: number, cy: number, b: Bounds): [number, number] {
  return [Math.min(b.w, Math.max(0, cx)), Math.min(b.h, Math.max(0, cy))];
}

export function clampZoom(z: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, z));
}

/** One wheel notch: scrolling up (negative deltaY) zooms in. */
export function zoomStep(z: number, deltaY: number, step: number, min: number, max: number): number {
  if (deltaY === 0) return z;
  const next = Math.round((z + (deltaY < 0 ? step : -step)) * 100) / 100;
  return clampZoom(next, min, max);
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
