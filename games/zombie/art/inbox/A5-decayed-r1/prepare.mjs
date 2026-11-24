import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PNG } from 'pngjs';
import { readSheet, silhouetteComponents } from '../A4-full-r1/components.mjs';

const review = 'art/inbox/A5-decayed-r1';
const candidate = join(review, 'candidate');
const palette = JSON.parse(readFileSync('art/palette.json')).map(hex =>
  [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
const heights = { a: 96, b: 92, c: 88 };
const facings = ['se', 'ne'];
const clips = ['idle', 'shamble', 'reach', 'lurch', 'bite', 'death'];
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const checks = [];
const gallery = {};
const size = 128;
const index = (x, y) => (y * size + x) * 4;

function rowsOf(letter, name, rowCounts) {
  const source = readSheet(join(review, letter + '-' + name + '.png'));
  const brightMatte = [0, source.width - 1, source.width * (source.height - 1),
    source.width * source.height - 1].every(pixel => {
    const [r, g, b, alpha] = source.data.subarray(pixel * 4, pixel * 4 + 4);
    return alpha >= 160 && Math.min(r, g, b) > 220;
  });
  if (brightMatte) {
    // Strip an opaque white matte on a generated sheet before finding silhouettes.
    for (let i = 0; i < source.data.length; i += 4) {
      const [r, g, b] = source.data.subarray(i, i + 3);
      if (Math.min(r, g, b) > 165 && Math.max(r, g, b) - Math.min(r, g, b) < 22) {
        source.data[i + 3] = 0;
      }
    }
  }
  const components = silhouetteComponents(source).sort((a, b) => b.pixels.length - a.pixels.length);
  // Match the brighter generated cardigan walk to its darker idle and chase.
  const exposure = letter === 'b' && name === 'shamble' ? -13 : 0;
  const count = rowCounts.reduce((sum, n) => sum + n, 0);
  assert(components.length >= count, `${letter} ${name}: found ${components.length}/${count} distinct silhouettes`);
  const figures = components.slice(0, count).sort((a, b) => (a.top + a.bottom) - (b.top + b.bottom));
  return rowCounts.map(n => figures.splice(0, n).sort((a, b) => a.left - b.left).map(figure => ({
    ...figure, source, exposure, mask: new Set(figure.pixels),
  })));
}

function corpseProjection(figure, facing) {
  const { left, right, pixels, source } = figure;
  const width = right - left;
  const ends = [{ x: 0, y: 0, count: 0 }, { x: 0, y: 0, count: 0 }];
  for (const pixel of pixels) {
    const x = pixel % source.width;
    const end = x < left + width * .27 ? ends[0] : x > right - width * .27 ? ends[1] : null;
    if (!end) continue;
    end.x += x;
    end.y += Math.floor(pixel / source.width);
    end.count++;
  }
  const [head, foot] = ends.map(end => ({ x: end.x / end.count, y: end.y / end.count }));
  const slope = (foot.y - head.y) / (foot.x - head.x);
  const target = facing === 'se' ? .32 : -.32;
  const shear = target - slope;
  const center = (left + right) / 2;
  let top = Infinity, bottom = -Infinity;
  for (const pixel of pixels) {
    const y = Math.floor(pixel / source.width) + (pixel % source.width - center) * shear;
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  return { shear, top, bottom };
}

function sample(figure, targetHeight, downFacing) {
  const out = new PNG({ width: size, height: size });
  const { left, right, top, bottom, source, exposure, mask, pixels } = figure;
  const down = Boolean(downFacing);
  const projected = down ? corpseProjection(figure, downFacing) : { top, bottom, shear: 0 };
  const sourceHeight = projected.bottom - projected.top;
  const lowFeet = pixels.filter(p => Math.floor(p / source.width) >= bottom - sourceHeight * .14);
  let leftFoot = right, rightFoot = left;
  for (const pixel of lowFeet) {
    const x = pixel % source.width;
    leftFoot = Math.min(leftFoot, x);
    rightFoot = Math.max(rightFoot, x);
  }
  const center = down ? (left + right) / 2 : (leftFoot + rightFoot) / 2;
  const factor = Math.min(targetHeight / sourceHeight, (down ? 55 : 60) / Math.max(center - left, right - center));
  const baseline = down ? 120 : 112;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sx = Math.round(center + (x - 64) / factor);
    const sy = Math.round(projected.bottom + (y - baseline) / factor - (sx - center) * projected.shear);
    if (sx < left || sx > right || sy < top || sy > bottom) continue;
    const p = sy * source.width + sx;
    if (!mask.has(p)) continue;
    const src = p * 4;
    let color = palette[0], lowest = Infinity;
    for (const rgb of palette) {
      const distance = rgb.reduce((sum, channel, i) => sum + (channel - Math.max(0, source.data[src + i] + exposure)) ** 2, 0);
      if (distance < lowest) { color = rgb; lowest = distance; }
    }
    out.data.set([...color, 255], index(x, y));
  }
  const offset = baseline - scanBounds(out).bottom;
  if (offset > 0 && offset <= 2) {
    const stride = size * 4;
    out.data.copyWithin(offset * stride, 0, (size - offset) * stride);
    out.data.fill(0, 0, offset * stride);
  }
  return out;
}

function stripBounds(image, y) {
  let left = size, right = -1;
  for (let x = 0; x < size; x++) if (image.data[index(x, y) + 3]) {
    left = Math.min(left, x);
    right = Math.max(right, x);
  }
  return { left, right };
}

function lowerLegs(image, seam) {
  const mask = new Uint8Array(size * size);
  const queue = [];
  for (let y = 105; y <= 112; y++) for (let x = 0; x < size; x++) {
    const p = y * size + x;
    if (!image.data[p * 4 + 3]) continue;
    mask[p] = 1;
    queue.push(p);
  }
  for (const p of queue) {
    const x = p % size, y = Math.floor(p / size);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const sx = x + dx, sy = y + dy;
      if (sx < 0 || sx >= size || sy < seam || sy >= size) continue;
      const next = sy * size + sx;
      if (mask[next] || !image.data[next * 4 + 3]) continue;
      mask[next] = 1;
      queue.push(next);
    }
  }
  return mask;
}

function matchReachLegs(shamble, reach, height) {
  const waist = 112 - Math.round(height * .28);
  const armsPose = new PNG({ width: size, height: size });
  let best = { cost: Infinity };
  // Use only the portions connected to the supporting legs below the seam.
  // Otherwise dangling shamble hands can show up beneath the two raised arms.
  for (let y = waist - 2; y <= waist + 3; y++) {
    const mask = lowerLegs(shamble, y);
    const row = mask.subarray(y * size, (y + 1) * size);
    const lower = { left: row.indexOf(1), right: row.lastIndexOf(1) };
    if (lower.left < 0) continue;
    for (let dy = -2; dy <= 2; dy++) {
      const upper = stripBounds(reach, y + dy);
      if (upper.right < 0) continue;
      const dx = Math.round((lower.left + lower.right - upper.left - upper.right) / 2);
      if (Math.abs(dx) > 10) continue;
      const cost = Math.abs((lower.right - lower.left) - (upper.right - upper.left)) +
        .45 * Math.abs(y - waist) + .7 * Math.abs(dy) + .3 * Math.abs(dx);
      if (cost < best.cost) best = { cost, y, dx, dy, mask };
    }
  }
  assert(Number.isFinite(best.cost), 'Could not register reach to shamble legs');
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const upper = y < best.y;
    const sx = upper ? x - best.dx : x;
    const sy = upper ? y + best.dy : y;
    if (sx < 0 || sx >= size || sy < 0 || sy >= size) continue;
    if (!upper && !best.mask[y * size + x]) continue;
    const source = upper ? reach : shamble;
    const at = index(sx, sy);
    armsPose.data.set(source.data.subarray(at, at + 4), index(x, y));
  }
  assert(armsPose.data.subarray(index(0, 105)).equals(shamble.data.subarray(index(0, 105))),
    'Reach and shamble feet differ');
  return { image: armsPose, y: best.y, dx: best.dx, dy: best.dy };
}
function scanBounds(png) {
  const bounds = { left: size, top: size, right: -1, bottom: -1, pixels: 0 };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!png.data[index(x, y) + 3]) continue;
    bounds.left = Math.min(bounds.left, x); bounds.right = Math.max(bounds.right, x);
    bounds.top = Math.min(bounds.top, y); bounds.bottom = Math.max(bounds.bottom, y);
    bounds.pixels++;
  }
  return bounds;
}

function alignToFresh(frame, fresh) {
  const bounds = scanBounds(frame);
  const original = scanBounds(fresh);
  const alphaOverlap = dx => {
    let count = 0;
    for (let y = Math.max(bounds.top, original.top); y <= Math.min(bounds.bottom, original.bottom); y++) {
      for (let x = bounds.left; x <= bounds.right; x++) {
        if (frame.data[index(x, y) + 3] && fresh.data[index(x + dx, y) + 3]) count++;
      }
    }
    return count;
  };
  const current = alphaOverlap(0);
  let best = current;
  let move = 0;
  for (let dx = Math.max(-24, 3 - bounds.left); dx <= Math.min(24, 124 - bounds.right); dx++) {
    const overlap = alphaOverlap(dx);
    if (overlap > best) {
      best = overlap;
      move = dx;
    }
  }
  // Retain deliberate silhouette differences unless the original pose is visibly off its anchor.
  if (best - current < bounds.pixels * .08) return frame;
  const aligned = new PNG({ width: size, height: size });
  for (let y = bounds.top; y <= bounds.bottom; y++) {
    const first = index(bounds.left, y);
    const last = index(bounds.right + 1, y);
    aligned.data.set(frame.data.subarray(first, last), index(bounds.left + move, y));
  }
  return aligned;
}

for (const [letter, height] of Object.entries(heights)) {
  const body = 'zombie_decayed_' + letter;
  const fresh = 'zombie_fresh_' + letter;
  const target = join(candidate, body);
  mkdirSync(target, { recursive: true });
  const idles = rowsOf(letter, 'idle', [2])[0];
  const movement = rowsOf(letter, 'shamble', [6, 6]);
  const reaching = rowsOf(letter, 'reach', [6, 6]);
  const chase = rowsOf(letter, 'lurch', [6, 6]);
  const attacks = rowsOf(letter, 'acts', [7, 7]);
  gallery[body] = {};
  gallery[fresh] = {};
  for (const [view, facing] of facings.entries()) {
    function freshFrame(anim, frame) {
      return PNG.sync.read(readFileSync(join('art/frames', fresh, `${anim}_${facing}_${frame}.png`)));
    }
    function heightOf(anim, frame) {
      const { top, bottom } = scanBounds(freshFrame(anim, frame));
      return bottom - top;
    }
    function register(pose, anim, frame) {
      const down = anim === 'death' && frame === 3;
      const image = sample(pose, heightOf(anim, frame), down ? facing : undefined);
      return down ? image : alignToFresh(image, freshFrame(anim, frame));
    }
    const shamble = movement[view].map((pose, n) => register(pose, 'shamble', n));
    const alignedReach = reaching[view].map((pose, n) =>
      matchReachLegs(shamble[n], register(pose, 'reach', n), height));
    const animations = {
      idle: [sample(idles[view], height)],
      shamble,
      reach: alignedReach.map(pose => pose.image),
      lurch: chase[view].map((pose, n) => register(pose, 'lurch', n)),
      bite: attacks[view].slice(0, 3).map((pose, n) => register(pose, 'bite', n)),
      death: attacks[view].slice(3).map((pose, n) => register(pose, 'death', n)),
    };
    assert.deepEqual(Object.keys(animations), clips);
    for (const [anim, frames] of Object.entries(animations)) {
      const frameHashes = new Set();
      for (const [frame, png] of frames.entries()) {
        const b = scanBounds(png);
        assert(b.pixels > 130 && b.left >= 3 && b.right <= 124 && b.top >= 8 && b.bottom <= 120,
          `${body} ${facing} ${anim} ${frame}: clipped or empty ${JSON.stringify(b)}`);
        if (anim === 'death' && frame === 3) {
          assert(b.left >= 8 && b.right <= 120 && b.top >= 72 && b.right - b.left > b.bottom - b.top);
        } else assert.equal(b.bottom, 112, `${body} ${facing} ${anim} ${frame} baseline`);
        const pngFile = join(target, `${anim}_${facing}_${frame}.png`);
        writeFileSync(pngFile, PNG.sync.write(png));
        const sha256 = hash(pngFile);
        assert(!frameHashes.has(sha256), `${body} ${facing} ${anim}: duplicate frame`);
        frameHashes.add(sha256);
        const registration = anim === 'reach' ? (({y, dx, dy}) => ({ y, dx, dy }))(alignedReach[frame]) : undefined;
        const previous = freshFrame(anim, frame);
        let shared = 0, combined = 0;
        for (let i = 3; i < png.data.length; i += 4) {
          if (png.data[i] && previous.data[i]) shared++;
          if (png.data[i] || previous.data[i]) combined++;
        }
        const silhouetteOverlap = Math.round(1000 * shared / combined) / 1000;
        checks.push({ body, facing, anim, frame, sha256, bounds: b, registration, silhouetteOverlap });
      }
    }
  }
  const files = readdirSync(target);
  assert.equal(files.length, 52);
  for (const [key, folder] of [[body, target], [fresh, join('art/frames', fresh)]]) {
    for (const file of files) gallery[key][file] = 'data:image/png;base64,' +
      readFileSync(join(folder, file)).toString('base64');
  }
}
assert.equal(checks.length, 156);
writeFileSync(join(review, 'checks.json'), JSON.stringify({ checks }, null, 2));
writeFileSync(join(review, 'gallery-data.json'), JSON.stringify(gallery));

const preview = mkdtempSync(join(tmpdir(), 'dead-woods-A5-decayed-'));
for (const name of ['src', 'vite.config.ts', 'package.json', 'tsconfig.json']) {
  cpSync(name, join(preview, name), { recursive: true });
}
for (const name of ['manifest.json', 'palette.json', 'frames', 'atlas']) {
  cpSync(join('art', name), join(preview, 'art', name), { recursive: true });
}
symlinkSync(resolve('node_modules'), join(preview, 'node_modules'), 'junction');
const manifestPath = join(preview, 'art/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath));
for (const letter of Object.keys(heights)) manifest.figures.keys['zombie_decayed_' + letter].status = 'final';
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
cpSync(candidate, join(preview, 'art/inbox/A5-decayed-r1'), { recursive: true });
const pack = spawnSync(process.execPath, ['scripts/art/pack.mjs', '--root', preview, 'A5-decayed-r1'], { stdio: 'inherit' });
assert.equal(pack.status, 0);
for (const frame of checks) {
  const file = join(preview, 'art/frames', frame.body, `${frame.anim}_${frame.facing}_${frame.frame}.png`);
  assert.equal(hash(file), frame.sha256);
}
writeFileSync(join(review, 'local-preview-root.txt'), preview);
console.log(preview);
