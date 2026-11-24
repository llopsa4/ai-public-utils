// Extract the generated sheets into the game's fixed-size cells.
import assert from 'node:assert/strict';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PNG } from 'pngjs';

const review = 'art/inbox/A7-full-r1';
const candidate = join(review, 'candidate/fighter');
const palette = JSON.parse(readFileSync('art/palette.json')).map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
const manifest = JSON.parse(readFileSync('art/manifest.json'));
const poses = (name, count, maxHeight) => Array.from({ length: count }, (_, i) => ({ name, i, maxHeight }));
const pair = (name, count, maxHeight) => [poses(name, count, maxHeight), poses(name, count, maxHeight)];
const working = [...poses('hold', 1, 91), { name: 'work', i: 0, maxHeight: 75 }, { name: 'work', i: 1, maxHeight: 67 }];
const down = [94, 78, 63, 43].map((maxHeight, i) => ({ name: 'death', i, maxHeight }));
const sheets = {
  move: { columns: 4, rows: [...pair('walk', 4, 96), ...pair('run', 4, 92)] },
  low: { columns: 4, rows: [...pair('crouch', 4, 68), ...pair('crawl', 4, 32)] },
  states: { columns: 4, rows: [working, working, down, down] },
  attacks: { columns: 3, rows: [...pair('stab', 3, 94), ...pair('pistol_shot', 3, 96)] },
  carry: { columns: 4, rows: [...pair('takedown', 4, 94), ...pair('carry', 4, 98)] },
};

function bounds(png, [left, top, right, bottom]) {
  const box = { l: right, t: bottom, r: -1, b: -1, pixels: 0 };
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] < 160) continue;
    box.l = Math.min(box.l, x);
    box.t = Math.min(box.t, y);
    box.r = Math.max(box.r, x);
    box.b = Math.max(box.b, y);
    box.pixels++;
  }
  return box;
}

function cleanAlpha(png) {
  const seen = new Uint8Array(png.width * png.height);
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] || png.data[i * 4 + 3] < 160) continue;
    const component = [i];
    seen[i] = 1;
    for (const n of component) {
      const x = n % png.width;
      for (const next of [x > 0 ? n - 1 : -1, x < png.width - 1 ? n + 1 : -1, n - png.width, n + png.width]) {
        if (next < 0 || next >= seen.length || seen[next] || png.data[next * 4 + 3] < 160) continue;
        seen[next] = 1;
        component.push(next);
      }
    }
    if (component.length < 18) for (const n of component) png.data[n * 4 + 3] = 0;
  }
}

function nearestColor(rgb) {
  let best = palette[0];
  let lowest = Infinity;
  for (const color of palette) {
    const distance = color.reduce((sum, value, k) => sum + (value - rgb[k]) ** 2, 0);
    if (distance < lowest) {
      lowest = distance;
      best = color;
    }
  }
  return best;
}

function place(png, box, scale, pose, adjustment) {
  const out = new PNG({ width: 128, height: 128 });
  const prone = pose.name === 'crawl' || (pose.name === 'death' && pose.i >= 2);
  const width = box.r - box.l + 1;
  const height = box.b - box.t + 1;
  // Align standing frames around the base of the legs, ignoring the silhouette of carried props.
  const legs = bounds(png, [box.l, box.b - Math.floor(height * .26), box.r + 1, box.b + 1]);
  const pivot = prone ? box : legs;
  const baseline = pose.name === 'death' && pose.i === 3 ? 120 : 112;
  const cx = (pivot.l + pivot.r) / 2 + (adjustment?.x ?? 0);
  const safeWidth = 120 / Math.max(width, 2 * Math.max(cx - box.l, box.r - cx) + 1);
  const factor = Math.min(scale, safeWidth);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const sx = Math.round(cx + (x - 64) / factor);
    const sy = Math.round(box.b + (y - baseline) / factor);
    if (sx < box.l || sx > box.r || sy < box.t || sy > box.b) continue;
    const i = (sy * png.width + sx) * 4;
    if (png.data[i + 3] < 160) continue;
    out.data.set([...nearestColor(png.data.subarray(i, i + 3)), 255], (y * 128 + x) * 4);
  }
  return out;
}

const crops = JSON.parse(readFileSync(join(review, 'crops.json')));
mkdirSync(candidate, { recursive: true });
const checks = [];
const sources = new Map();
for (const [sheet, { rows, columns }] of Object.entries(sheets)) {
  for (const [row, poses] of rows.entries()) {
    const facing = row % 2 === 0 ? 'se' : 'ne';
    const parts = poses.map((pose, col) => {
      const key = `${pose.name}_${facing}_${pose.i}`;
      const crop = crops[key] ?? {};
      const path = join(review, crop.file ?? `${sheet}-source.png`);
      if (!sources.has(path)) {
        const png = PNG.sync.read(readFileSync(path));
        cleanAlpha(png);
        sources.set(path, png);
      }
      const png = sources.get(path);
      const w = png.width / columns;
      const h = png.height / rows.length;
      const cropRect = crop.box ?? [col * w, row * h, (col + 1) * w, (row + 1) * h].map(Math.round);
      const box = bounds(png, cropRect);
      assert(box.pixels > 100 && box.r - box.l > 12 && box.b - box.t > 12, `Missing ${key} from ${sheet}: ${JSON.stringify(box)}`);
      return { pose, key, crop, png, box };
    });
    const rowScale = Math.min(...parts.filter(p => !p.crop.individual).map(({ pose, box }) => pose.maxHeight / (box.b - box.t + 1)));
    for (const { pose, key, crop, png, box } of parts) {
      const scale = crop.individual ? pose.maxHeight / (box.b - box.t + 1) : rowScale;
      const frame = place(png, box, scale, pose, crop);
      const actual = bounds(frame, [0, 0, 128, 128]);
      assert(actual.pixels > 0 && actual.l > 1 && actual.r < 126 && actual.t > 1 && actual.b < 126, `Frame is empty or clips: ${key}`);
      checks.push({ key, bounds: actual, sourceBox: box });
      writeFileSync(join(candidate, key + '.png'), PNG.sync.write(frame));
    }
  }
}
for (const facing of ['se', 'ne']) {
  const name = `idle_${facing}_0.png`;
  copyFileSync(join('art/inbox/A7-r2/fighter', name), join(candidate, name));
}
const expected = Object.entries(manifest.figures.keys.fighter.anims).flatMap(([name, count]) =>
  ['se', 'ne'].flatMap(facing => Array.from({ length: count }, (_, i) => `${name}_${facing}_${i}.png`)));
assert.equal(expected.length, 76);
assert.deepEqual(readdirSync(candidate).sort(), expected.sort());
writeFileSync(join(review, 'checks.json'), JSON.stringify({ frames: 76, redrawn: checks.length, cell: [128, 128], anchor: [64, 112], checks }, null, 2));

if (process.argv.includes('--preview')) {
  const preview = mkdtempSync(join(tmpdir(), 'dead-woods-A7-full-'));
  for (const name of ['src', 'scripts', 'tests', 'vite.config.ts', 'package.json', 'tsconfig.json', 'playwright.config.ts']) {
    cpSync(name, join(preview, name), { recursive: true });
  }
  for (const name of ['manifest.json', 'palette.json', 'frames', 'atlas']) cpSync(join('art', name), join(preview, 'art', name), { recursive: true });
  cpSync(join(review, 'candidate'), join(preview, 'art/inbox/A7-full-r1'), { recursive: true });
  symlinkSync(resolve('node_modules'), join(preview, 'node_modules'), 'junction');
  manifest.atlases.fighter.scale = 2;
  writeFileSync(join(preview, 'art/manifest.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(review, 'local-preview-root.txt'), preview + '\n');
  console.log(preview);
}
