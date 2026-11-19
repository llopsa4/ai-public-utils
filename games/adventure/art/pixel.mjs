// A small pixel painter for hand-made pixel art drawn in code (art/tent.mjs): layers of pixels in
// a fixed palette, lines, filled shapes, ordered dithering, and selective outlines (darker on the
// shadow side, dropped where the light falls). Layers composite onto each other; the result is
// scaled up with hard edges by sharp.
import sharp from 'sharp';

const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

/** 4x4 Bayer matrix (0..15) for ordered dithering. */
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

/** True on the dither pattern's pixels for a coverage of `level` (0..1). */
export const dithered = (x, y, level) => (BAYER[y & 3][x & 3] + 0.5) / 16 < level;

export class Layer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    /** Colours as '#rrggbb' strings, or null for transparent. */
    this.px = new Array(w * h).fill(null);
  }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inside(x, y) ? this.px[y * this.w + x] : null; }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (this.inside(x, y) && c) this.px[y * this.w + x] = c; }
  clear(x, y) { if (this.inside(x, y)) this.px[y * this.w + x] = null; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  hline(x0, x1, y, c) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, c); }
  vline(x, y0, y1, c) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, c); }
  /** Bresenham line. */
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /** Fills a polygon (scanline, pixel centres). `c` may be a function (x, y) => colour. */
  poly(points, c) {
    const ys = points.map(p => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const cy = y + 0.5, xs = [];
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i], [bx, by] = points[(i + 1) % points.length];
        if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + ((cy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
      }
    }
  }
  /** Filled ellipse. `c` may be a function (x, y) => colour. */
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
      }
    }
  }
  /** Repaints every opaque pixel through `f(x, y, colour)` (return a colour, or the same). */
  map(f) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.px[y * this.w + x];
      if (c) this.px[y * this.w + x] = f(x, y, c) ?? c;
    }
  }
  /**
   * Selective outline: transparent pixels touching the drawing become `dark` (below and to the
   * right, the shadow side) or `light`/nothing (above and to the left, facing the light).
   */
  outline(dark, light = null) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      const below = this.get(x, y - 1), right = this.get(x - 1, y), above = this.get(x, y + 1), left = this.get(x + 1, y);
      if (below || right) add.push([x, y, dark]);
      else if ((above || left) && light) add.push([x, y, light]);
    }
    for (const [x, y, c] of add) this.set(x, y, c);
  }
  /** Draws another layer onto this one at (dx, dy); `mode` 'over' or 'shade' (darkens by a map). */
  draw(other, dx = 0, dy = 0) {
    for (let y = 0; y < other.h; y++) for (let x = 0; x < other.w; x++) {
      const c = other.px[y * other.w + x];
      if (c) this.set(x + dx, y + dy, c);
    }
  }
  /** RGBA bytes (transparent pixels fully transparent). */
  rgba() {
    const out = Buffer.alloc(this.w * this.h * 4);
    this.px.forEach((c, i) => {
      if (!c) return;
      const [r, g, b] = hex(c);
      out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = 255;
    });
    return out;
  }
  /** Scaled up `scale` times with hard edges, as a sharp pipeline. */
  image(scale) {
    return sharp(this.rgba(), { raw: { width: this.w, height: this.h, channels: 4 } })
      .resize(this.w * scale, this.h * scale, { kernel: 'nearest' });
  }
}

/**
 * A ramp: colours from darkest to lightest. `at(t)` picks one for a light level 0..1; with
 * (x, y) it gives flat bands of each shade with a narrow dithered seam where two meet.
 */
export function ramp(colours) {
  const n = colours.length;
  const at = (t, x, y) => {
    const v = Math.max(0, Math.min(1, t)) * (n - 1);
    const i = Math.floor(v), f = v - i;
    if (x === undefined || i >= n - 1) return colours[Math.min(n - 1, Math.round(v))];
    // Flat bands with only a narrow dithered seam between shades (not a checkerboard everywhere).
    if (f < 0.4) return colours[i];
    if (f > 0.6) return colours[i + 1];
    return dithered(x, y, (f - 0.4) / 0.2) ? colours[i + 1] : colours[i];
  };
  return Object.assign(at, { colours, dark: colours[0], light: colours[n - 1] });
}
