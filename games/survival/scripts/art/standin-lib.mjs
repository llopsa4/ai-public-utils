// Grey stand-ins (AC2): a plain grey shape with the frame's name on it for every frame of every
// manifest key, at the exact cell, so the loader, animation and tint code can be tested without art.
// They are NOT art (nobody draws them), are written into the git-ignored art/standins/ and never ship.
import fs from 'node:fs';
import path from 'node:path';
import pngjs from 'pngjs';
import { expectedFrames } from './lib.mjs';
import { GLYPH_H, GLYPH_W, glyph, textWidth } from './font.mjs';

const { PNG } = pngjs;

const BASE = [140, 140, 140, 255];
const CLOTH = [214, 214, 214, 255];
const EDGE = [52, 52, 52, 255];
const INK = [16, 16, 16, 255];
const CROSS = [200, 48, 48, 255];

// Upright shapes: [width, height] as fractions of the cell. Small enough that the whole set packs
// into the 16-page budget (SPEC.md section 8); real art is trimmed the same way.
const UPRIGHT = {
  person: [0.28, 0.4],
  animal: [0.3, 0.34],
  carcass: [0.36, 0.22],
  ally: [0.4, 0.5],
  tree: [0.34, 0.62],
  bush: [0.5, 0.5],
  rock: [0.5, 0.5],
  tuft: [0.5, 0.5],
  stump: [0.5, 0.5],
  item: [0.5, 0.5],
  fx: [0.5, 0.5],
};
const DIAMOND = new Set(['tile', 'bank', 'spill']);
const FOOTPRINT = new Set(['building', 'fire']);

/** The shape a key's stand-in takes inside its cell: { shape, x0, y0, x1, y1 } (inclusive pixels). */
export function standinShape(key, e, scale = 1) {
  const kind = key.split('_')[0];
  const [cw, ch] = e.cell.map((n) => n * scale);
  const m = e.border * scale;
  const ax = Math.round(e.anchor[0] * cw);
  const ay = Math.round(e.anchor[1] * ch);
  if (DIAMOND.has(kind)) return { shape: 'diamond', x0: m, y0: m, x1: cw - 1 - m, y1: ch - 1 - m };
  if (FOOTPRINT.has(kind)) {
    // The footprint diamond is centred on the anchor; the cell leaves 64 px (2x) each side for shadow.
    const fw = cw - 128 * scale;
    const fh = fw / 2;
    return { shape: 'diamond', x0: ax - Math.floor(fw / 2), y0: Math.round(ay - fh / 2), x1: ax + Math.floor(fw / 2) - 1, y1: Math.round(ay + fh / 2) - 1 };
  }
  const frac = UPRIGHT[kind];
  if (!frac) return { shape: 'box', x0: m, y0: m, x1: cw - 1 - m, y1: ch - 1 - m };
  const w = Math.max(4, Math.round(cw * frac[0]));
  const h = Math.max(4, Math.round(ch * frac[1]));
  const feet = e.anchor[1] >= 0.7; // feet on the anchor, else the shape is centred on it
  const y1 = feet ? ay : Math.round(ay + h / 2) - 1;
  const x0 = Math.max(m, Math.min(cw - m - w, ax - Math.floor(w / 2)));
  const yTop = Math.max(m, y1 - h + 1);
  return { shape: 'box', x0, y0: yTop, x1: x0 + w - 1, y1: Math.min(ch - 1 - m, y1) };
}

/** Splits a frame name into words and fills lines up to `maxChars`; a long word is cut short. */
function wrapWords(name, maxChars) {
  const words = name.split(/[/_]/).filter(Boolean).map((w) => (w.length > maxChars ? w.slice(0, maxChars) : w));
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && line.length + 1 + w.length <= maxChars) line += ` ${w}`;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function plot(png, x, y, c) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  png.data.set(c, (y * png.width + x) * 4);
}

function fillRect(png, x0, y0, x1, y1, c) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) plot(png, x, y, c);
}

/** Draws `lines` of text centred in the box (x0, y0, x1, y1), largest scale (3, 2, 1) that fits. */
function drawLabel(png, lines, box) {
  const [x0, y0, x1, y1] = box;
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  if (bw < GLYPH_W + 2 || bh < GLYPH_H) return;
  let scale = 1;
  for (const s of [3, 2]) {
    if (lines.length * (GLYPH_H + 1) * s <= bh && Math.max(...lines.map((l) => textWidth(l, s))) <= bw) {
      scale = s;
      break;
    }
  }
  const room = Math.max(1, Math.floor(bh / ((GLYPH_H + 1) * scale)));
  const shown = lines.slice(-room); // when short of room, keep the last words (state, facing, frame number)
  const total = shown.length * (GLYPH_H + 1) * scale - scale;
  let y = y0 + Math.floor((bh - total) / 2);
  for (const line of shown) {
    let x = x0 + Math.floor((bw - textWidth(line, scale)) / 2);
    for (const ch of line) {
      glyph(ch).forEach((row, ry) => row.forEach((on, rx) => on && fillRect(png, x + rx * scale, y + ry * scale, x + (rx + 1) * scale - 1, y + (ry + 1) * scale - 1, INK)));
      x += (GLYPH_W + 1) * scale;
    }
    y += (GLYPH_H + 1) * scale;
  }
}

/**
 * One stand-in frame as a PNG: grey shape with a darker edge, the frame name, and a red cross on the
 * anchor pixel. A `cloth` layer is a lighter patch inside the base shape, so it stays aligned.
 * `frame` is one entry of expectedFrames(); `scale` is 2 for the cursors' @2x files.
 */
export function standinImage(key, e, frame, scale = 1) {
  const [cw, ch] = e.cell.map((n) => n * scale);
  const png = new PNG({ width: frame.size[0], height: frame.size[1] });
  png.data.fill(0);
  const s = standinShape(key, e, scale);
  const hasCloth = e.layers.includes('cloth');
  const w = s.x1 - s.x0 + 1;
  const h = s.y1 - s.y0 + 1;
  // The cloth patch: the middle of the body, lower half.
  const patch = [s.x0 + Math.round(w * 0.2), s.y0 + Math.round(h * 0.58), s.x1 - Math.round(w * 0.2), s.y1 - Math.round(h * 0.12)];
  const inside = (x, y) => {
    if (s.shape === 'diamond') {
      const cx = (s.x0 + s.x1) / 2;
      const cy = (s.y0 + s.y1) / 2;
      return Math.abs(x - cx) / (w / 2) + Math.abs(y - cy) / (h / 2) <= 1;
    }
    return x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1;
  };
  const edge = (x, y) => !(inside(x - 1, y) && inside(x + 1, y) && inside(x, y - 1) && inside(x, y + 1));

  if (frame.layer === 'cloth') {
    fillRect(png, patch[0], patch[1], patch[2], patch[3], CLOTH);
    return png;
  }
  for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) if (inside(x, y)) plot(png, x, y, edge(x, y) ? EDGE : BASE);

  // The label sits in the upper middle of a diamond (the anchor cross is at its centre) and above the cloth patch.
  const inner = s.shape === 'diamond'
    ? [s.x0 + Math.round(w * 0.25), s.y0 + Math.round(h * 0.1), s.x1 - Math.round(w * 0.25), s.y0 + Math.round(h * 0.45)]
    : [s.x0 + 2, s.y0 + 2, s.x1 - 2, (hasCloth ? patch[1] - 2 : s.y1 - 2)];
  const maxChars = Math.max(1, Math.floor((inner[2] - inner[0] + 2) / (GLYPH_W + 1)));
  drawLabel(png, wrapWords(frame.name, maxChars), inner);

  const ax = Math.round(e.anchor[0] * cw);
  const ay = Math.round(e.anchor[1] * ch);
  const m = e.border * scale;
  const keep = (x, y) => x >= m && y >= m && x < png.width - m && y < png.height - m; // never into the empty border
  for (let d = -2; d <= 2; d++) {
    if (keep(ax + d, ay)) plot(png, ax + d, ay, CROSS);
    if (keep(ax, ay + d)) plot(png, ax, ay + d, CROSS);
  }
  return png;
}

/** Writes stand-ins for every (non-legacy) key to `<outDir>/<key>/<file>`; returns the file count. */
export function writeStandins(manifest, outDir) {
  let count = 0;
  for (const [key, e] of Object.entries(manifest)) {
    if (e.legacy) continue;
    const dir = path.join(outDir, key);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    for (const f of expectedFrames(key, e)) {
      const scale = f.size[0] === e.cell[0] * 2 && f.size[1] === e.cell[1] * 2 && f.name.endsWith('@2x') ? 2 : 1;
      fs.writeFileSync(path.join(dir, f.file), PNG.sync.write(standinImage(key, e, f, scale), { deflateLevel: 1, filterType: 0 }));
      count++;
    }
  }
  return count;
}
