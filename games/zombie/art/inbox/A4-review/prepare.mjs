import { PNG } from 'pngjs';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const batch = 'art/inbox/A4';
const review = 'art/inbox/A4-review';
const palette = JSON.parse(readFileSync('art/palette.json')).map(hex =>
  [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)));
const heights = { a: 96, b: 92, c: 88 };
const checks = [];
const contact = new PNG({ width: 640, height: 256 });
for (let i = 0; i < contact.data.length; i += 4) contact.data.set([75, 79, 73, 255], i);
function place(frame, column, row) {
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const at = 4 * (y * 128 + x);
    if (frame.data[at + 3]) contact.data.set(frame.data.subarray(at, at + 4),
      4 * ((row * 128 + y) * contact.width + column * 128 + x));
  }
}
for (const [row, facing] of ['se', 'ne'].entries()) {
  for (const [column, key] of ['fighter', 'scout'].entries()) {
    place(PNG.sync.read(readFileSync(`art/frames/${key}/idle_${facing}_0.png`)), column, row);
  }
}

for (const [column, [letter, height]] of Object.entries(heights).entries()) {
  const key = `zombie_fresh_${letter}`;
  const src = PNG.sync.read(readFileSync(`${review}/source-${letter}.png`));
  const split = Math.floor(src.width / 2);
  mkdirSync(join(batch, key), { recursive: true });
  for (const [row, facing] of ['se', 'ne'].entries()) {
    const start = row === 0 ? 0 : split;
    const end = row === 0 ? split : src.width;
    const opaque = (x, y) => src.data[4 * (y * src.width + x) + 3] >= 160;
    let left = end, right = start, top = src.height, bottom = -1;
    for (let y = 0; y < src.height; y++) for (let x = start; x < end; x++) {
      if (!opaque(x, y)) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    assert(left > start && right < end - 1 && top > 0 && bottom < src.height - 1,
      `${key} ${facing} source touches cell edge: ${[left, top, right, bottom]}`);
    let leftFoot = right, rightFoot = left;
    for (let y = bottom - Math.round((bottom - top) * .09); y <= bottom; y++) {
      for (let x = left; x <= right; x++) if (opaque(x, y)) {
        leftFoot = Math.min(leftFoot, x); rightFoot = Math.max(rightFoot, x);
      }
    }
    const scale = height / (bottom - top);
    const center = (leftFoot + rightFoot) / 2;
    const out = new PNG({ width: 128, height: 128 });
    const bounds = [128, 128, -1, -1];
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const sx = Math.round(center + (x - 64) / scale);
      const sy = Math.round(bottom + (y - 112) / scale);
      if (sx < left || sx > right || sy < top || sy > bottom || !opaque(sx, sy)) continue;
      const at = 4 * (sy * src.width + sx);
      let color, nearest = Infinity;
      for (const rgb of palette) {
        const distance = rgb.reduce((sum, channel, i) => sum + (channel - src.data[at + i]) ** 2, 0);
        if (distance < nearest) { color = rgb; nearest = distance; }
      }
      out.data.set([...color, 255], 4 * (y * 128 + x));
      bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y);
    }
    assert(bounds[0] > 0 && bounds[2] < 127 && bounds[1] === 112 - height && bounds[3] === 112,
      `${key} ${facing} sampled bounds: ${bounds}`);
    writeFileSync(join(batch, key, `idle_${facing}_0.png`), PNG.sync.write(out));
    place(out, column + 2, row);
    checks.push({ key, facing, cell: [128, 128], height, anchor: [64, 112], bounds });
  }
}
writeFileSync(join(review, 'contact.png'), PNG.sync.write(contact));

const preview = mkdtempSync(join(tmpdir(), 'dead-woods-A4-'));
for (const name of ['src', 'vite.config.ts', 'package.json', 'tsconfig.json']) {
  cpSync(name, join(preview, name), { recursive: true });
}
for (const name of ['manifest.json', 'palette.json', 'frames', 'atlas']) {
  cpSync(join('art', name), join(preview, 'art', name), { recursive: true });
}
symlinkSync(resolve('node_modules'), join(preview, 'node_modules'), 'junction');
const manifestPath = join(preview, 'art/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath));
for (const letter of Object.keys(heights)) {
  const key = `zombie_fresh_${letter}`;
  cpSync(join(batch, key), join(preview, batch, key), { recursive: true });
  manifest.figures.keys[key].status = 'final';
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
const pack = spawnSync(process.execPath, ['scripts/art/pack.mjs', '--root', preview, 'A4'], { stdio: 'inherit' });
assert.equal(pack.status, 0);
cpSync(join(review, 'contact.png'), join(preview, 'src/a4-contact.png'));
writeFileSync(join(preview, 'src/a4-review.html'), `<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Dead Woods · Fresh zombies</title>
<style>body{margin:32px;background:#24272a;color:#d9d9cb;font:16px system-ui}a{color:inherit}img{image-rendering:pixelated;max-width:100%}.labels{display:grid;grid-template-columns:repeat(5,1fr);text-align:center;max-width:640px}</style>
<h1>Fresh zombie idle sprites</h1>
<div class="labels"><span>Cass</span><span>Eli</span><span>Worker</span><span>Cardigan</span><span>Hoodie</span></div>
<img src="./a4-contact.png" width="640" height="256" alt="Cass and Eli beside three fresh zombies, southeast above northeast">
<p>Southeast above, northeast below.</p><a href="./?debug">Open the game preview</a></html>`);
writeFileSync(join(review, 'local-preview-root.txt'), preview);
writeFileSync(join(review, 'checks.json'), JSON.stringify({ checks, preview, packed: true }, null, 2));
console.log(preview);
