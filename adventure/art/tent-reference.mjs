// Mara's tent from the user's reference painting (adventure/tent-reference.png, the style master
// for the Codex art): re-gridded to the game's 640x360 pixel grid by sampling each cell's centre,
// with the two things the game draws itself painted out of the bench (the open notebook and the
// charging cradle, which the game shows as objects and removes when taken), then shown 2x with
// hard edges. Also cuts the stool out as the piece Mara walks behind.
//
//   node art/tent-reference.mjs
//
// Grid coordinates below are pixels of the 640x360 grid (= world units).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { isFinal } from './guard.mjs';
import { snapToPalette } from './normalize.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(here, '..', 'tent-reference.png');
const W = 640, H = 360, SCALE = 2;

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

// Paint out the notebook (grid x 40-79, rows 188-199) and the cradle (x 160-185, rows 166-197): the
// canvas wall behind them from the clean wall a few rows up, the bench top from a clean stretch
// of the same plank (x 120-133).
// The wall is lit unevenly (the candle, the lantern), so each copied column is shifted by the
// difference between the row just above the patch and that row's own source: the copy keeps the
// canvas's texture and takes on the brightness around it.
function wallPatch(x0, x1, y0, y1, up) {
  for (let x = x0; x <= x1; x++) {
    // Averaged over a few rows above the patch and the neighbouring columns (one pixel is too noisy).
    const shift = [0, 1, 2].map(c => {
      let sum = 0, n = 0;
      for (let dy = 1; dy <= 4; dy++) for (let dx = -3; dx <= 3; dx++) {
        const xx = Math.max(x0, Math.min(x1, x + dx));
        sum += grid[at(xx, y0 - dy) + c] - grid[at(xx, y0 - dy - up) + c]; n++;
      }
      return sum / n;
    });
    for (let y = y0; y <= y1; y++) for (let c = 0; c < 3; c++) {
      grid[at(x, y) + c] = Math.max(0, Math.min(255, grid[at(x, y - up) + c] + shift[c]));
    }
  }
}
wallPatch(40, 79, 188, 195, 12);
for (let y = 196; y <= 199; y++) for (let x = 40; x <= 79; x++) copy(x, y, 120 + ((x - 40) % 14), y);
wallPatch(160, 185, 166, 195, 28);
for (let y = 196; y <= 199; y++) for (let x = 160; x <= 185; x++) copy(x, y, 120 + ((x - 160) % 14), y);

// Snapped to the master palette (art/style/palette.json), which is derived from this same picture.
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) { rgba[i * 4] = grid[i * 3]; rgba[i * 4 + 1] = grid[i * 3 + 1]; rgba[i * 4 + 2] = grid[i * 3 + 2]; rgba[i * 4 + 3] = 255; }
snapToPalette(rgba, W);
for (let i = 0; i < W * H; i++) { grid[i * 3] = rgba[i * 4]; grid[i * 3 + 1] = rgba[i * 4 + 1]; grid[i * 3 + 2] = rgba[i * 4 + 2]; }
const big = await sharp(grid, { raw: { width: W, height: H, channels: 3 } }).resize(W * SCALE, H * SCALE, { kernel: 'nearest' }).png().toBuffer();
if (!isFinal('rooms/tent.png')) await sharp(big).png({ palette: true, colours: 256, dither: 0, effort: 10 }).toFile(join(here, 'src', 'rooms', 'tent.png'));

// The stool, as a walk-behind piece: its seat, three legs and rung (grid x 88-139, rows 230-275),
// cut from the room's own pixels. Placed by the room at world (88, 230): grid (88, 230).
const STOOL = [
  [[92, 230], [136, 230], [136, 240], [92, 240]],
  [[90, 240], [100, 240], [96, 272], [88, 272]],
  [[126, 240], [136, 240], [140, 272], [132, 272]],
  [[106, 240], [116, 240], [116, 276], [106, 276]],
  [[94, 254], [134, 254], [134, 260], [94, 260]],
];
const box = { x: 88, y: 230, w: 54, h: 48 };
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
