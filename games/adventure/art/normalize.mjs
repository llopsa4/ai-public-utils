// Normalising an image to the style bible: snap to the master palette (art/style/palette.json),
// hard alpha, an optional 1 px dark outline. Used by the importer (art/import.mjs) and the
// checker's palette test.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
/** The master palette as [r, g, b] triples: the warm colours of the tent reference, plus Ironhaven's set. */
const PALETTE_FILE = JSON.parse(readFileSync(join(here, 'style', 'palette.json'), 'utf8'));
export const PALETTE = [...PALETTE_FILE.colours, ...(PALETTE_FILE.ironhaven ?? [])]
  .map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
export const OUTLINE = [30, 20, 18];

const cache = new Map();
/** Nearest palette colour (squared RGB distance, weighted toward green like the eye). */
export function nearest(r, g, b) {
  const key = (r << 16) | (g << 8) | b;
  let hit = cache.get(key);
  if (hit) return hit;
  let best = PALETTE[0], bd = Infinity;
  for (const c of PALETTE) {
    const d = 2 * (r - c[0]) ** 2 + 4 * (g - c[1]) ** 2 + 3 * (b - c[2]) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  hit = best;
  if (cache.size < 200000) cache.set(key, hit);
  return hit;
}

// 4x4 ordered dither, for paintings (keeps gradients from banding).
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v / 16 - 0.5) * 18);

/**
 * Snaps RGBA pixels in place: alpha becomes 0 or 255 (cut at 128), colours become palette colours.
 * `dither` adds a light ordered dither (rooms).
 */
export function snapToPalette(data, width, { dither = false } = {}) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) { data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0; continue; }
    const p = i / 4, x = p % width, y = Math.floor(p / width);
    const d = dither ? BAYER[(y % 4) * 4 + (x % 4)] : 0;
    const c = nearest(Math.max(0, Math.min(255, data[i] + d)), Math.max(0, Math.min(255, data[i + 1] + d)), Math.max(0, Math.min(255, data[i + 2] + d)));
    data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
  }
}

/** Adds a 1 px dark outline around opaque pixels (sprites: readable on busy rooms). */
export function addOutline(data, width, height) {
  const solid = new Uint8Array(width * height);
  for (let p = 0; p < solid.length; p++) solid[p] = data[p * 4 + 3] >= 128 ? 1 : 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x;
    if (solid[p]) continue;
    const near = (x > 0 && solid[p - 1]) || (x < width - 1 && solid[p + 1]) || (y > 0 && solid[p - width]) || (y < height - 1 && solid[p + width]);
    if (!near) continue;
    data[p * 4] = OUTLINE[0]; data[p * 4 + 1] = OUTLINE[1]; data[p * 4 + 2] = OUTLINE[2]; data[p * 4 + 3] = 255;
  }
}

/** Share of opaque pixels whose colour is in the palette (or the outline colour): 1 = conforming. */
export function paletteConformity(data) {
  const allowed = new Set([...PALETTE, OUTLINE].map(([r, g, b]) => (r << 16) | (g << 8) | b));
  let opaque = 0, ok = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    opaque++;
    if (allowed.has((data[i] << 16) | (data[i + 1] << 8) | data[i + 2])) ok++;
  }
  return opaque ? ok / opaque : 1;
}
