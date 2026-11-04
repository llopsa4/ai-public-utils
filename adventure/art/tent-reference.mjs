// Mara's tent from the user's reference painting (adventure/tent-reference.png, the style master
// for the Codex art): re-gridded to the game's 320x180 pixel grid by sampling each cell's centre,
// with the two things the game draws itself painted out of the bench (the open notebook and the
// charging cradle, which the game shows as objects and removes when taken), then shown 4x with
// hard edges. Also cuts the stool out as the piece Mara walks behind.
//
//   node art/tent-reference.mjs
//
// Grid coordinates below are pixels of the 320x180 grid (world units / 2).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { isFinal } from './guard.mjs';
import { snapToPalette } from './normalize.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(here, '..', 'tent-reference.png');
const W = 320, H = 180, SCALE = 4;

const { data, info } = await sharp(readFileSync(SOURCE)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const sx = info.width / W, sy = info.height / H;
const grid = Buffer.alloc(W * H * 3);
const at = (x, y) => (y * W + x) * 3;
// Each grid cell takes the middle value of a 3x3 sample at its centre (robust to the source's own
// pixel edges, which do not fall exactly on this grid).
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const px = [];
  for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) {
    const X = Math.min(info.width - 1, Math.floor((x + 0.5) * sx) + dx), Y = Math.min(info.height - 1, Math.floor((y + 0.5) * sy) + dy);
    const i = (Y * info.width + X) * 3;
    px.push([data[i], data[i + 1], data[i + 2]]);
  }
  px.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  grid.set(px[4], at(x, y));
}
const copy = (x, y, fromX, fromY) => grid.copyWithin(at(x, y), at(fromX, fromY), at(fromX, fromY) + 3);

// Paint out the notebook (grid x 20-38, rows 94-99) and the cradle (x 80-91, rows 83-98): the
// canvas wall behind them from the clean wall a few rows up, the bench top from a clean stretch
// of the same plank (x 60-66).
for (let y = 94; y <= 97; y++) for (let x = 20; x <= 39; x++) copy(x, y, x, y - 6);
for (let y = 98; y <= 99; y++) for (let x = 20; x <= 39; x++) copy(x, y, 60 + ((x - 20) % 7), y);
for (let y = 83; y <= 97; y++) for (let x = 80; x <= 92; x++) copy(x, y, x, y - 14);
for (let y = 98; y <= 99; y++) for (let x = 80; x <= 92; x++) copy(x, y, 60 + ((x - 80) % 7), y);

// Snapped to the master palette (art/style/palette.json), which is derived from this same picture.
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) { rgba[i * 4] = grid[i * 3]; rgba[i * 4 + 1] = grid[i * 3 + 1]; rgba[i * 4 + 2] = grid[i * 3 + 2]; rgba[i * 4 + 3] = 255; }
snapToPalette(rgba, W);
for (let i = 0; i < W * H; i++) { grid[i * 3] = rgba[i * 4]; grid[i * 3 + 1] = rgba[i * 4 + 1]; grid[i * 3 + 2] = rgba[i * 4 + 2]; }
const big = await sharp(grid, { raw: { width: W, height: H, channels: 3 } }).resize(W * SCALE, H * SCALE, { kernel: 'nearest' }).png().toBuffer();
if (!isFinal('rooms/tent.png')) await sharp(big).png({ palette: true, colours: 256, dither: 0, effort: 10 }).toFile(join(here, 'src', 'rooms', 'tent.png'));

// The stool, as a walk-behind piece: its seat, three legs and rung (grid x 44-69, rows 115-137),
// cut from the room's own pixels. Placed by the room at world (88, 230): grid (44, 115).
const STOOL = [
  [[46, 115], [68, 115], [68, 120], [46, 120]],
  [[45, 120], [50, 120], [48, 136], [44, 136]],
  [[63, 120], [68, 120], [70, 136], [66, 136]],
  [[53, 120], [58, 120], [58, 138], [53, 138]],
  [[47, 127], [67, 127], [67, 130], [47, 130]],
];
const box = { x: 44, y: 115, w: 27, h: 24 };
const inside = (px, py, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const cut = Buffer.alloc(box.w * box.h * 4);
for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) {
  const gx = box.x + x, gy = box.y + y;
  if (!STOOL.some(p => inside(gx + 0.5, gy + 0.5, p))) continue;
  const o = (y * box.w + x) * 4;
  cut[o] = grid[at(gx, gy)]; cut[o + 1] = grid[at(gx, gy) + 1]; cut[o + 2] = grid[at(gx, gy) + 2]; cut[o + 3] = 255;
}
if (!isFinal('foreground/tent-stool.png')) {
  await sharp(cut, { raw: { width: box.w, height: box.h, channels: 4 } }).resize(box.w * SCALE, box.h * SCALE, { kernel: 'nearest' })
    .png({ palette: true, colours: 256, dither: 0 }).toFile(join(here, 'src', 'foreground', 'tent-stool.png'));
}
console.log('The tent from tent-reference.png: art/src/rooms/tent.png and foreground/tent-stool.png.');
