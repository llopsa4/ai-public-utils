// Atlas packing (AC2): trims frames, packs them into 2048 x 2048 pages (maxrects-packer, MIT) with a 2 px
// extrude and 2 px padding, and writes Phaser multiatlas JSON. Format: art/SPEC.md section 8.
import fs from 'node:fs';
import path from 'node:path';
import pngjs from 'pngjs';
import { MaxRectsPacker } from 'maxrects-packer';
import { deliveryFrames } from './lib.mjs';

const { PNG } = pngjs;

export const PAGE_SIZE = 2048;
export const EXTRUDE = 2;
export const PADDING = 2;
export const PAGE_BUDGET = 16;
export const PAGE_MAX_BYTES = 4 * 1024 * 1024;

/** The box of pixels with any alpha, or a 1 x 1 box at the origin for an empty frame. */
export function trimBox(png) {
  let x0 = png.width;
  let y0 = png.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] !== 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * Packs frames ({ name, png }) into pages. Returns { pages } where each page is
 * { width, height, png, frames: [{ name, frame, spriteSourceSize, sourceSize, trimmed }] }.
 * Frames are added in name order so the result does not depend on the order they were read in.
 */
export function packFrames(frames, { pageSize = PAGE_SIZE, extrude = EXTRUDE, padding = PADDING } = {}) {
  const sorted = [...frames].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const names = new Set();
  for (const f of sorted) {
    if (names.has(f.name)) throw new Error(`Duplicate frame name ${f.name}`);
    names.add(f.name);
  }
  const packer = new MaxRectsPacker(pageSize, pageSize, padding, { smart: true, pot: false, square: false, allowRotation: false });
  const items = sorted.map((f) => {
    const box = trimBox(f.png);
    if (box.w + 2 * extrude > pageSize || box.h + 2 * extrude > pageSize) throw new Error(`Frame ${f.name} is too big for a ${pageSize} px page`);
    return { width: box.w + 2 * extrude, height: box.h + 2 * extrude, data: { name: f.name, png: f.png, box } };
  });
  for (const item of items) packer.add(item.width, item.height, item.data);
  if (packer.bins.some((b) => b.rects.length === 0)) throw new Error('The packer left an empty page');

  const pages = packer.bins.map((bin) => {
    let width = 1;
    let height = 1;
    for (const r of bin.rects) {
      width = Math.max(width, r.x + r.width);
      height = Math.max(height, r.y + r.height);
    }
    const page = new PNG({ width, height });
    page.data.fill(0);
    const out = [];
    for (const r of bin.rects) {
      const { name, png, box } = r.data;
      blitExtruded(page, png, box, r.x, r.y, extrude);
      out.push({
        name,
        frame: { x: r.x + extrude, y: r.y + extrude, w: box.w, h: box.h },
        spriteSourceSize: { x: box.x, y: box.y, w: box.w, h: box.h },
        sourceSize: { w: png.width, h: png.height },
        trimmed: box.w !== png.width || box.h !== png.height,
      });
    }
    out.sort((a, b) => (a.name < b.name ? -1 : 1));
    return { width, height, png: page, frames: out };
  });
  return { pages };
}

/** Copies the trimmed box into the page at (px + extrude, py + extrude) and repeats its edge pixels outward. */
function blitExtruded(page, src, box, px, py, extrude) {
  const w = box.w + 2 * extrude;
  const h = box.h + 2 * extrude;
  for (let y = 0; y < h; y++) {
    const sy = Math.min(box.h - 1, Math.max(0, y - extrude)) + box.y;
    for (let x = 0; x < w; x++) {
      const sx = Math.min(box.w - 1, Math.max(0, x - extrude)) + box.x;
      const s = (sy * src.width + sx) * 4;
      const d = ((py + y) * page.width + px + x) * 4;
      page.data[d] = src.data[s];
      page.data[d + 1] = src.data[s + 1];
      page.data[d + 2] = src.data[s + 2];
      page.data[d + 3] = src.data[s + 3];
    }
  }
}

/** The Phaser multiatlas JSON for pages named `<group>-<n>.png`. */
export function atlasJson(group, packed) {
  return {
    textures: packed.pages.map((p, i) => ({
      image: `${group}-${i}.png`,
      format: 'RGBA8888',
      size: { w: p.width, h: p.height },
      scale: 1,
      frames: p.frames.map((f) => ({
        filename: f.name,
        rotated: false,
        trimmed: f.trimmed,
        sourceSize: f.sourceSize,
        spriteSourceSize: f.spriteSourceSize,
        frame: f.frame,
      })),
    })),
    meta: { app: 'survival art:pack', version: '1.0' },
  };
}

/** Deletes a group's old pages and JSON in `outDir`, then writes the new ones. Returns the PNG sizes in bytes. */
export function writeGroup(outDir, group, packed) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) {
    if (new RegExp(`^${group}-\\d+\\.png$`).test(f) || f === `${group}.json`) fs.rmSync(path.join(outDir, f));
  }
  const sizes = packed.pages.map((p, i) => {
    const buf = PNG.sync.write(p.png);
    fs.writeFileSync(path.join(outDir, `${group}-${i}.png`), buf);
    return buf.length;
  });
  fs.writeFileSync(path.join(outDir, `${group}.json`), `${JSON.stringify(atlasJson(group, packed))}\n`);
  return sizes;
}

/** Pages written by the other groups in `outDir` (read from their JSON files). */
export function pagesOfOtherGroups(outDir, group) {
  if (!fs.existsSync(outDir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(outDir)) {
    if (!f.endsWith('.json') || f === `${group}.json`) continue;
    n += JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8')).textures?.length ?? 0;
  }
  return n;
}

/**
 * Reads every frame of `keys` (manifest entries of one atlas group) from `dirFor(key)`, the folder with
 * that key's PNGs, and returns [{ name, png }]. A key whose folder is null is skipped.
 */
export function readGroupFrames(manifest, keys, dirFor, batchFor = () => undefined) {
  const frames = [];
  for (const key of keys) {
    const dir = dirFor(key);
    if (!dir) continue;
    for (const f of deliveryFrames(key, manifest[key], batchFor(key))) {
      const file = path.join(dir, f.file);
      if (!fs.existsSync(file)) throw new Error(`${key}: missing ${f.file} in ${dir}`);
      frames.push({ name: f.name, png: PNG.sync.read(fs.readFileSync(file)) });
    }
  }
  return frames;
}

/** Packs and writes one group, checking the page and budget limits. Returns { pages, bytes }. */
export function packGroup(manifest, group, keys, dirFor, outDir, budget = PAGE_BUDGET, batchFor) {
  const frames = readGroupFrames(manifest, keys, dirFor, batchFor);
  if (!frames.length) throw new Error(`Group ${group} has no frames to pack`);
  const packed = packFrames(frames);
  const total = packed.pages.length + pagesOfOtherGroups(outDir, group);
  if (total > budget) throw new Error(`Group ${group} makes ${packed.pages.length} page(s); ${total} in all is over the budget of ${budget}`);
  const sizes = writeGroup(outDir, group, packed);
  sizes.forEach((bytes, i) => {
    if (bytes > PAGE_MAX_BYTES) throw new Error(`${group}-${i}.png is ${(bytes / 1048576).toFixed(1)} MB, over the 4 MB limit`);
  });
  return { pages: packed.pages.length, frames: frames.length, bytes: sizes.reduce((a, b) => a + b, 0) };
}
