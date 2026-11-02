// Turns Kiln Courier illustrations into runtime art for the adventure.
//
//   npm run pixelate
//
// Art is produced at 2x the 640x360 world (1280x720 rooms). Sources are read from
// ../FFCardGame/assets (same repository, already public); only outputs are committed, and each
// one is listed in art/PROVENANCE.md.
// Method: crop -> optional mask -> area-average downscale (alpha-weighted) -> light grade ->
// k-means palette reduction -> hard alpha -> optional 1px outline.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const here = dirname(fileURLToPath(import.meta.url));
const kiln = join(here, '..', '..', 'FFCardGame', 'assets');
const out = join(here, 'src');

function load(path) {
  const full = join(kiln, path);
  if (!existsSync(full)) throw new Error(`Missing source ${full}. The Kiln Courier folder must sit next to adventure/.`);
  return PNG.sync.read(readFileSync(full));
}

/** Applies a mask function (x, y) -> 0..1 to a copy of the image's alpha. */
function masked(src, mask) {
  const img = { width: src.width, height: src.height, data: Buffer.from(src.data) };
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const i = (y * img.width + x) * 4;
    img.data[i + 3] = Math.round(img.data[i + 3] * mask(x, y));
  }
  return img;
}

const circle = (cx, cy, r, feather = 3) => (x, y) => Math.max(0, Math.min(1, (r - Math.hypot(x - cx, y - cy)) / feather));
const ellipseMask = (cx, cy, rx, ry) => (x, y) => (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 ? 1 : 0);
function polygonMask(points) {
  return (x, y) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside ? 1 : 0;
  };
}

/** Area-average resample of a crop to w x h. Colour is weighted by alpha so halos do not darken edges. */
function resample(src, crop, w, h) {
  const [cx, cy, cw, ch] = crop ?? [0, 0, src.width, src.height];
  const px = new Float64Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const y0 = cy + (y * ch) / h, y1 = cy + ((y + 1) * ch) / h;
    for (let x = 0; x < w; x++) {
      const x0 = cx + (x * cw) / w, x1 = cx + ((x + 1) * cw) / w;
      let r = 0, g = 0, b = 0, a = 0, area = 0;
      for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) {
        if (sy < 0 || sy >= src.height) continue;
        const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);
        for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
          if (sx < 0 || sx >= src.width) continue;
          const wx = Math.min(sx + 1, x1) - Math.max(sx, x0);
          const k = wx * wy, i = (sy * src.width + sx) * 4, al = src.data[i + 3] / 255;
          r += src.data[i] * al * k; g += src.data[i + 1] * al * k; b += src.data[i + 2] * al * k;
          a += al * k; area += k;
        }
      }
      const o = (y * w + x) * 4;
      px[o] = a ? r / a : 0; px[o + 1] = a ? g / a : 0; px[o + 2] = a ? b / a : 0; px[o + 3] = area ? (a / area) * 255 : 0;
    }
  }
  return px;
}

function grade(px, { saturation = 1, contrast = 1, lift = 0 } = {}) {
  for (let i = 0; i < px.length; i += 4) {
    const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, (l + (px[i + c] - l) * saturation - 128) * contrast + 128 + lift));
  }
}

/** Deterministic k-means over opaque pixels. */
function palette(px, k, alphaCut) {
  const samples = [];
  const step = Math.max(1, Math.floor(px.length / 4 / 60000));
  for (let i = 0; i < px.length; i += 4 * step) if (px[i + 3] >= alphaCut) samples.push([px[i], px[i + 1], px[i + 2]]);
  const sorted = [...samples].sort((a, b) => (a[0] * 3 + a[1] * 6 + a[2]) - (b[0] * 3 + b[1] * 6 + b[2]));
  let centers = Array.from({ length: k }, (_, j) => [...sorted[Math.floor(((j + 0.5) / k) * sorted.length)]]);
  for (let iter = 0; iter < 12; iter++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const p of samples) {
      let best = 0, bestD = Infinity;
      for (let j = 0; j < k; j++) { const c = centers[j]; const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bestD) { bestD = d; best = j; } }
      const t = sums[best]; t[0] += p[0]; t[1] += p[1]; t[2] += p[2]; t[3]++;
    }
    centers = centers.map((c, j) => (sums[j][3] ? [sums[j][0] / sums[j][3], sums[j][1] / sums[j][3], sums[j][2] / sums[j][3]] : c));
  }
  return centers.map(c => c.map(Math.round));
}

function toPng(px, w, h, pal, alphaCut) {
  const png = new PNG({ width: w, height: h });
  const cache = new Map();
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (px[o + 3] < alphaCut) { png.data[o + 3] = 0; continue; }
    const key = (Math.round(px[o]) << 16) | (Math.round(px[o + 1]) << 8) | Math.round(px[o + 2]);
    let best = cache.get(key);
    if (!best) {
      let bestD = Infinity;
      for (const c of pal) { const d = (px[o] - c[0]) ** 2 + (px[o + 1] - c[1]) ** 2 + (px[o + 2] - c[2]) ** 2; if (d < bestD) { bestD = d; best = c; } }
      cache.set(key, best);
    }
    png.data[o] = best[0]; png.data[o + 1] = best[1]; png.data[o + 2] = best[2]; png.data[o + 3] = 255;
  }
  return png;
}

function outline(png, color = [30, 20, 18]) {
  const { width: w, height: h, data } = png;
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : data[(y * w + x) * 4 + 3] > 128);
  const marks = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (a(x, y)) continue;
    if (a(x + 1, y) || a(x - 1, y) || a(x, y + 1) || a(x, y - 1)) marks.push((y * w + x) * 4);
  }
  for (const o of marks) { data[o] = color[0]; data[o + 1] = color[1]; data[o + 2] = color[2]; data[o + 3] = 255; }
}

/** Downscales a (masked) crop to w x h with a reduced palette. */
function shrink(src, crop, w, h, { colors = 48, alphaCut = 128, grading, line = false } = {}) {
  const px = resample(src, crop, w, h);
  grade(px, grading);
  const png = toPng(px, w, h, palette(px, colors, alphaCut), alphaCut);
  if (line) outline(png);
  return png;
}

function save(png, path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, PNG.sync.write(png));
}

function blit(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const s = (y * src.width + x) * 4;
    if (!src.data[s + 3]) continue;
    const tx = dx + x, ty = dy + y;
    if (tx < 0 || ty < 0 || tx >= dst.width || ty >= dst.height) continue;
    src.data.copy(dst.data, (ty * dst.width + tx) * 4, s, s + 4);
  }
}

/** Writes an Aseprite JSON-array sheet from same-size frame PNGs laid out in one row. */
function writeSheet(dir, id, frames, tags, durations = []) {
  const FW = frames[0].width, FH = frames[0].height;
  const sheet = new PNG({ width: FW * frames.length, height: FH });
  frames.forEach((f, i) => blit(sheet, f, i * FW, 0));
  save(sheet, join(out, dir, `${id}.png`));
  const json = {
    frames: frames.map((_, i) => ({
      filename: String(i), frame: { x: i * FW, y: 0, w: FW, h: FH }, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: FW, h: FH }, sourceSize: { w: FW, h: FH }, duration: durations[i] ?? 100,
    })),
    meta: {
      app: 'adventure pixelate.mjs (Aseprite JSON-array compatible)', version: '1', image: `${id}.png`, format: 'RGBA8888',
      size: { w: sheet.width, h: FH }, scale: '1',
      frameTags: tags.map(([name, from, to]) => ({ name, from, to, direction: 'forward' })),
    },
  };
  writeFileSync(join(out, dir, `${id}.json`), JSON.stringify(json, null, 1) + '\n');
}

// Simple raster helpers for procedural touches (latch, steam, rack).
function fillRect(png, x, y, w, h, [r, g, b, a = 255]) {
  for (let j = Math.max(0, y); j < Math.min(png.height, y + h); j++) for (let i = Math.max(0, x); i < Math.min(png.width, x + w); i++) {
    const o = (j * png.width + i) * 4, t = a / 255;
    png.data[o] = Math.round(png.data[o] * (1 - t) + r * t); png.data[o + 1] = Math.round(png.data[o + 1] * (1 - t) + g * t);
    png.data[o + 2] = Math.round(png.data[o + 2] * (1 - t) + b * t); png.data[o + 3] = Math.max(png.data[o + 3], a);
  }
}
function fillEllipse(png, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) fillRect(png, x, y, 1, 1, color);
  }
}
function line(png, x0, y0, x1, y1, w, color) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let s = 0; s <= n; s++) fillEllipse(png, x0 + ((x1 - x0) * s) / n, y0 + ((y1 - y0) * s) / n, w / 2, w / 2, color);
}

// ----------------------------------------------------------------- rooms ---
const ROOMS = [
  { name: 'mara-room', source: 'kiln-hall.png', grade: { saturation: 1.04, contrast: 1.05, lift: 4 } },
  { name: 'firing-house', source: 'opening/cinderfold.png', grade: { saturation: 1.06, contrast: 1.05, lift: 6 } },
  { name: 'gallery', source: 'opening/regulator-gallery.png', grade: { saturation: 1.04, contrast: 1.03, lift: 3 } },
  { name: 'ashways', source: 'opening/ashways.png', crop: [140, 120, 1392, 783], grade: { saturation: 1.04, contrast: 1.04 } },
];
const roomPngs = {};
for (const room of ROOMS) {
  const src = load(room.source);
  roomPngs[room.name] = shrink(src, room.crop ?? null, 1280, 720, { colors: 128, alphaCut: 1, grading: room.grade });
  save(roomPngs[room.name], join(out, 'rooms', `${room.name}.png`));
}

// ------------------------------------------------------------------ tent ---
// Mara's tent: the left of the tempering-house painting under a canvas ceiling, with a doorway flap.
// The canvas is textured with the painting's own ochre awning cloth so it matches the room.
const awning = load('opening/tempering-house.png');
// Fabric colour sampled from the painting's ochre awning; folds and sag are shaded procedurally.
const CLOTH = (() => {
  const c = resample(awning, [1210, 2, 220, 46], 1, 1);
  return [c[0], c[1], c[2]];
})();
const noise = (x, y) => { const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return n - Math.floor(n); };
function fabric(x, y, light) {
  const folds = 0.8 + 0.14 * Math.sin(x / 26 + 0.5 * Math.sin(y / 70)) + 0.06 * Math.sin(x / 9 + y / 40);
  const k = folds * light * (0.96 + 0.08 * noise(x, y));
  return [CLOTH[0] * k, CLOTH[1] * k, CLOTH[2] * k];
}
function paintCanvas(px, W, points, lightFn) {
  const inside = polygonMask(points);
  const H = px.length / 4 / W;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x, y)) continue;
    const [r, g, b] = fabric(x, y, lightFn(x, y));
    const o = (y * W + x) * 4;
    px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
  }
}
{
  const W = 1280, H = 720;
  const px = resample(awning, [0, 100, 1250, 703], W, H);
  grade(px, { saturation: 1.04, contrast: 1.04, lift: 2 });
  // Ceiling: canvas sagging from a ridge pole down to the side poles; darker toward the top.
  const ceiling = [];
  for (let x = 0; x <= W; x += 20) ceiling.push([x, 70 + 150 * ((x - 640) / 640) ** 2 + 18 * Math.sin((x / W) * Math.PI)]);
  paintCanvas(px, W, [[0, 0], [W, 0], ...ceiling.reverse()], (x, y) => 0.55 + 0.45 * Math.min(1, y / 230));
  for (let y = 0; y < 26; y++) for (let x = 0; x < W; x++) { // ridge pole shadow
    const o = (y * W + x) * 4, t = 0.45 + 0.3 * (y / 26);
    px[o] *= t; px[o + 1] *= t; px[o + 2] *= t;
  }
  // Right canvas wall with a doorway, flap tied back, warm light from the kiln hall beyond.
  paintCanvas(px, W, [[1095, 150], [W, 170], [W, H], [1095, H]], (x, y) => 0.7 + 0.15 * (1 - (x - 1095) / 185));
  const door = polygonMask([[1150, 330], [1232, 322], [1252, H], [1132, H]]);
  for (let y = 300; y < H; y++) for (let x = 1120; x < 1260; x++) {
    if (!door(x, y)) continue;
    const o = (y * W + x) * 4, t = (y - 320) / 400;
    px[o] = 250 - 70 * t; px[o + 1] = 160 - 60 * t; px[o + 2] = 78 - 30 * t;
  }
  paintCanvas(px, W, [[1150, 330], [1100, 420], [1118, 560], [1140, 560]], () => 0.62); // tied-back flap
  for (let y = 330; y < H; y++) for (const x of [1146, 1236]) { const o = (y * W + x) * 4; px[o] = 70; px[o + 1] = 44; px[o + 2] = 26; } // poles
  const png = toPng(px, W, H, palette(px, 128, 1), 1);
  roomPngs.tent = png;
  save(png, join(out, 'rooms', 'tent.png'));
}

// ------------------------------------------------------------ foreground ---
// Pieces of a room cut out (same pixels) and drawn in front of characters standing behind them.
// Coordinates are in room-image pixels (2x the world); the room def places them at half scale.
function foregroundPiece(room, name, polygons, [x0, y0, x1, y1]) {
  const src = roomPngs[room];
  const masks = polygons.map(polygonMask);
  const piece = new PNG({ width: x1 - x0, height: y1 - y0 });
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (!masks.some(m => m(x, y))) continue;
    const s = (y * src.width + x) * 4, d = ((y - y0) * piece.width + (x - x0)) * 4;
    src.data.copy(piece.data, d, s, s + 4);
  }
  save(piece, join(out, 'foreground', `${name}.png`));
}
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
foregroundPiece('tent', 'tent-stool', [[[150, 412], [336, 412], [338, 470], [332, 604], [146, 604], [150, 470]]], [146, 408, 340, 606]);
foregroundPiece('mara-room', 'hall-left', [[[0, 500], [110, 520], [190, 600], [200, 720], [0, 720]]], [0, 496, 202, 720]);
foregroundPiece('mara-room', 'hall-right', [[[1110, 620], [1180, 570], [1280, 560], [1280, 720], [1100, 720]]], [1104, 560, 1280, 720]);
foregroundPiece('gallery', 'gallery-railing', [
  [[620, 415], [945, 432], [945, 450], [620, 435]],
  [[560, 474], [945, 478], [945, 492], [560, 490]],
  rect(615, 415, 45, 155), rect(762, 420, 20, 212), rect(840, 420, 16, 130), rect(918, 430, 14, 170),
], [556, 412, 946, 634]);

// The tent seen from the kiln hall: the same cloth in a tent silhouette with a dark entrance.
{
  const W = 200, H = 140;
  const px = new Float64Array(W * H * 4);
  paintCanvas(px, W, [[100, 4], [196, 136], [4, 136]], (x, y) => 0.85 + 0.15 * (y / H));
  const entrance = polygonMask([[100, 46], [132, 136], [68, 136]]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (entrance(x, y)) { const o = (y * W + x) * 4; px[o] = 34; px[o + 1] = 20; px[o + 2] = 14; }
  for (let y = 0; y < 140; y++) { const o = (y * W + 100) * 4; px[o] = 70; px[o + 1] = 44; px[o + 2] = 26; px[o + 3] = 255; } // pole
  const png = toPng(px, W, H, palette(px, 24, 128), 128);
  outline(png);
  writeSheet('objects', 'tent', [png], [['idle', 0, 0]]);
}

// --------------------------------------------------------------- sweeper ---
{
  const src = load('opening/ash-sweeper.png');
  const crop = [40, 110, 1460, 780];
  const w = 240, h = Math.round((w * crop[3]) / crop[2]);
  const sprite = shrink(src, crop, w, h, { colors: 48, alphaCut: 235, grading: { saturation: 1.05, contrast: 1.06, lift: 4 }, line: true });
  const FW = 280, FH = 160;
  const frames = [[0, 0], [0, -2], [-2, -2], [2, 0]].map(([dx, dy]) => {
    const f = new PNG({ width: FW, height: FH });
    blit(f, sprite, Math.floor((FW - w) / 2) + dx, FH - h + dy);
    return f;
  });
  writeSheet('objects', 'sweeper', frames, [['idle', 0, 1], ['scurry', 2, 3]], [420, 420, 110, 110]);
}

// ----------------------------------------------------------------- items ---
// 64x64 inventory icons (shown at 44 CSS px).
function icon(name, src, crop, opts = {}) {
  const [, , cw, ch] = crop;
  const s = 60 / Math.max(cw, ch), w = Math.round(cw * s), h = Math.round(ch * s);
  const img = shrink(src, crop, w, h, { colors: 40, alphaCut: 110, line: true, ...opts });
  const pngOut = new PNG({ width: 64, height: 64 });
  blit(pngOut, img, Math.floor((64 - w) / 2), Math.floor((64 - h) / 2));
  save(pngOut, join(out, 'items', `${name}.png`));
}
const gauntletArt = load('equipment/courier-gauntlet.png');
const gallery = load('opening/regulator-gallery.png');
const cinderfold = load('opening/cinderfold.png');
const BOOK = [[312, 762], [405, 690], [640, 684], [737, 792], [700, 812], [384, 846]];
icon('gauntlet', gauntletArt, [60, 40, 1150, 1150]);
icon('notebook', masked(gallery, polygonMask(BOOK)), [305, 678, 440, 175]);
icon('regulator', masked(gallery, circle(650, 375, 168)), [480, 205, 340, 340]);
icon('bread', masked(cinderfold, ellipseMask(270, 548, 66, 46)), [200, 498, 140, 100]);
{
  const iven = load('opening/iven.png');
  const orange = (x, y) => {
    const i = (y * iven.width + x) * 4, r = iven.data[i], g = iven.data[i + 1], b = iven.data[i + 2];
    return r > 140 && g > 60 && g < r * 0.8 && b < g * 0.75 ? 1 : 0;
  };
  icon('scarf', masked(iven, (x, y) => (x >= 330 && x <= 640 && y >= 140 && y <= 340 ? orange(x, y) : 0)), [330, 140, 310, 200]);
}

// --------------------------------------------------------------- objects ---
// Mother's notebook lying on the stone block in the kiln hall.
writeSheet('objects', 'notebook', [shrink(masked(gallery, polygonMask(BOOK)), [305, 678, 440, 175], 76, 30, { colors: 32, alphaCut: 110, line: true })], [['idle', 0, 0]]);

// Charging rack: the gallery's painted lantern used as the ember cell's cradle. Once the cell is
// taken the glass goes dark (orange pixels dimmed).
{
  const lantern = masked(gallery, polygonMask([[52, 416], [80, 416], [86, 440], [112, 468], [118, 640], [126, 690], [4, 690], [12, 640], [18, 468], [44, 440]]));
  const lit = shrink(lantern, [0, 412, 132, 282], 56, 120, { colors: 40, alphaCut: 110, line: true });
  const dark = new PNG({ width: lit.width, height: lit.height });
  lit.data.copy(dark.data);
  for (let i = 0; i < dark.data.length; i += 4) {
    const r = dark.data[i], g = dark.data[i + 1], b = dark.data[i + 2];
    if (r > 150 && r - b > 70) { const l = (r * 0.3 + g * 0.59 + b * 0.11) * 0.38; dark.data[i] = l * 1.1; dark.data[i + 1] = l; dark.data[i + 2] = l * 0.95; }
  }
  const frames = [lit, dark].map(img => { const f = new PNG({ width: 112, height: 140 }); blit(f, img, 28, 140 - img.height); return f; });
  writeSheet('objects', 'rack', frames, [['full', 0, 0], ['empty', 1, 1]]);
}

// Nell's pantry door from the card atlas' door tile, with a crooked or straightened latch.
{
  const atlas = load('card-atlas.png');
  const door = shrink(masked(atlas, polygonMask([[470, 1254], [470, 900], [630, 852], [790, 900], [790, 1254]])), [460, 846, 340, 408], 80, 96, { colors: 40, alphaCut: 110, line: true, grading: { lift: 12, contrast: 1.05 } });
  const frames = [false, true].map(fixed => {
    const f = new PNG({ width: 80, height: 96 });
    blit(f, door, 0, 0);
    const iron = [70, 66, 72], brass = [217, 164, 65];
    if (fixed) { fillRect(f, 50, 50, 22, 5, brass); fillRect(f, 66, 45, 5, 15, brass); }
    else { line(f, 50, 46, 70, 60, 5, iron); fillRect(f, 66, 54, 5, 12, iron); }
    return f;
  });
  writeSheet('objects', 'pantry-door', frames, [['stuck', 0, 0], ['fixed', 1, 1]]);
}

// Steam valve: the atlas valve wheel on a pipe stub; venting adds a plume.
{
  const atlas = load('card-atlas.png');
  const wheel = shrink(masked(atlas, circle(626, 596, 132)), [490, 460, 272, 272], 76, 76, { colors: 40, alphaCut: 110, line: true });
  const stub = shrink(atlas, [70, 560, 115, 240], 52, 90, { colors: 32, alphaCut: 1, line: true });
  const frames = [false, true].map(venting => {
    const f = new PNG({ width: 112, height: 160 });
    blit(f, stub, 30, 70);
    blit(f, wheel, 18, 4);
    outline(f);
    if (venting) for (const [x, y, r] of [[100, 98, 10], [92, 80, 13], [102, 58, 15], [88, 36, 17], [104, 18, 12]]) fillEllipse(f, x, y, r, r, [240, 236, 226, 190]);
    
    return f;
  });
  writeSheet('objects', 'valve', frames, [['closed', 0, 0], ['venting', 1, 1]]);
}

// Regulator socket overlay for the gallery: nothing while installed; once removed, the ring stays
// and the hub is an empty, scorched hollow.
{
  const ring = shrink(masked(gallery, circle(650, 375, 168)), [480, 205, 340, 340], 262, 262, { colors: 64, alphaCut: 110 });
  const removed = new PNG({ width: 262, height: 262 });
  blit(removed, ring, 0, 0);
  const c = 131;
  for (let y = 0; y < 262; y++) for (let x = 0; x < 262; x++) {
    const d = Math.hypot(x - c, y - c);
    if (d > 92) continue;
    const t = d / 92;
    fillRect(removed, x, y, 1, 1, [Math.round(18 + 30 * t), Math.round(13 + 18 * t), Math.round(14 + 12 * t), 255]);
  }
  line(removed, 70, 96, 104, 120, 4, [60, 46, 40]); line(removed, 170, 150, 196, 182, 4, [60, 46, 40]);
  const installed = new PNG({ width: 262, height: 262 });
  writeSheet('objects', 'socket', [installed, removed], [['installed', 0, 0], ['removed', 1, 1]]);
}

console.log('Kiln Courier art written to art/src: rooms (mara-room, firing-house, gallery, ashways), sweeper, items, objects.');
