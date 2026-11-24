// Slice generation sheets into fixed cells without touching the approved walk/run frames.
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';

const review = 'art/inbox/A2-review';
const destination = 'art/inbox/A2/fighter';
const palette = JSON.parse(readFileSync('art/palette.json', 'utf8'))
  .map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
const names = (anim, count) => Array.from({ length: count }, (_, i) => [anim, i]);
const lowWalk = [...names('crouch', 4), ...names('crawl', 4)];
const kneeling = [...names('hold', 1), ...names('work', 2)];
const sheets = [
  ['low', [lowWalk.slice(0, 4), lowWalk.slice(0, 4), lowWalk.slice(4), lowWalk.slice(4)], [34, 34, 16, 16]],
  ['states', [kneeling, kneeling, names('death', 4), names('death', 4)], [46, 46, 47, 47]],
  ['attacks', [names('stab', 3), names('stab', 3), names('pistol_shot', 3), names('pistol_shot', 3)], [47, 47, 47, 47]],
  ['carry', [names('takedown', 4), names('takedown', 4), names('carry', 4), names('carry', 4)], [47, 47, 49, 49]],
];

function bounds(png, left, top, right, bottom) {
  const box = { left: right, top: bottom, right: -1, bottom: -1 };
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] < 160) continue;
      box.left = Math.min(box.left, x);
      box.top = Math.min(box.top, y);
      box.right = Math.max(box.right, x);
      box.bottom = Math.max(box.bottom, y);
    }
  }
  return box;
}

const checks = [];
for (const [label, rows, heights] of sheets) {
  if (process.argv.length > 2 && !process.argv.slice(2).includes(label)) continue;
  const src = PNG.sync.read(readFileSync(`${review}/${label}.png`));
  const contact = new PNG({ width: 256, height: 256 });
  for (const [row, poses] of rows.entries()) {
    const top = Math.round(row * src.height / 4);
    const bottom = Math.round((row + 1) * src.height / 4);
    const boxes = poses.map((_, col) => bounds(src, Math.round(col * src.width / 4), top, Math.round((col + 1) * src.width / 4), bottom));
    const tallest = Math.max(...boxes.map(b => b.bottom - b.top + 1));
    const widest = Math.max(...boxes.map(b => b.right - b.left + 1));
    const scale = Math.min(heights[row] / tallest, 56 / widest);
    for (const [col, [anim, n]] of poses.entries()) {
      const box = boxes[col];
      if (box.right < 0) throw Error(`Missing pose ${label} ${row},${col}`);
      const cx = (col + 0.5) * src.width / 4;
      const cy = box.bottom;
      const frame = new PNG({ width: 64, height: 64 });
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const sx = Math.round(cx + (x - 32) / scale);
          const sy = Math.round(cy + (y - 56) / scale);
          if (sx < box.left || sx > box.right || sy < box.top || sy > box.bottom) continue;
          const from = (sy * src.width + sx) * 4;
          if (src.data[from + 3] < 160) continue;
          const distance = rgb => rgb.reduce((sum, c, k) => sum + (c - src.data[from + k]) ** 2, 0);
          const nearest = palette.reduce((a, b) => distance(a) <= distance(b) ? a : b);
          frame.data.set([...nearest, 255], (y * 64 + x) * 4);
        }
      }
      const frameBounds = bounds(frame, 0, 0, 64, 64);
      if (frameBounds.left < 2 || frameBounds.right > 61 || frameBounds.top < 2 || frameBounds.bottom < 54) {
        throw Error(`Check bounds of ${label} ${row},${col}: ${JSON.stringify(frameBounds)}`);
      }
      const facing = row % 2 === 0 ? 'se' : 'ne';
      const name = `${anim}_${facing}_${n}.png`;
      writeFileSync(`${destination}/${name}`, PNG.sync.write(frame));
      PNG.bitblt(frame, contact, 0, 0, 64, 64, col * 64, row * 64);
      checks.push({ name, bounds: frameBounds });
    }
  }
  writeFileSync(`${review}/${label}-contact.png`, PNG.sync.write(contact));
}
writeFileSync(`${review}/full-checks.json`, JSON.stringify(checks, null, 2) + '\n');
console.log(`Prepared ${checks.length} additional Cass frames.`);
