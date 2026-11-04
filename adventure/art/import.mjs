// Imports Codex art from art/inbox into the game, normalised to the style bible (art/STYLE.md):
// size and anchor from the manifest, the master palette, a 1 px outline on sprites, walk-behind
// pieces re-cut from new rooms, WebP copies, and a before/after preview to approve. Imported
// assets become 'final' (art/status.json) and no generator overwrites them again.
//
//   npm run art:import            (every file in art/inbox)
//
// Inbox names (see each brief in art/briefs): <id>.png for single images; <id>-<state>.png for
// each state of an object (rack-full.png, rack-empty.png); <id>/body.png and <id>/arm.png (and
// back/sit/lie) for characters.
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import { MANIFEST } from './manifest.mjs';
import { addOutline, snapToPalette } from './normalize.mjs';
import { encodeIndexed } from './png.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const CARD_ORDER = ['strike', 'guard', 'pulse', 'vent', 'cycle', 'piston', 'shield', 'draw-back', 'discard-back'];

/**
 * The game's pixel grid: rooms, objects, props, creatures and fight pictures are pixel art whose
 * pixels are GRID art pixels (4 screen pixels in a 1280x720 room, the tent reference's size). People
 * are put on a finer 2-pixel grid by the rig (art/rig.mjs). UI icons, satchel items, cards, gear and
 * portraits keep their finer detail.
 */
export const GRID = 4;
const GRID_KINDS = new Set(['room', 'battle-backdrop', 'object', 'prop', 'battle-portrait', 'battle']);

/**
 * Codex may deliver a sprite on a flat magenta background (#FF00FF) instead of transparency: every
 * pixel close to magenta (and the pink fringe where it was blended with the subject) is cleared.
 */
export function keyMagenta(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Distance from pure magenta; the fringe is a blend, so magenta-ish hue with green well below red and blue.
    const d = Math.hypot(255 - r, g, 255 - b);
    if (d < 90 || (r > 150 && b > 150 && g < Math.min(r, b) * 0.45)) data[i + 3] = 0;
  }
  return data;
}

/**
 * Snaps an image to the pixel grid: each GRID x GRID block becomes one colour (the average of its
 * solid pixels), solid when most of the block is, then scaled back to the same size with hard
 * edges. Palette snapping and outlines are applied on the small image, so they match the grid.
 */
export function toGrid(img, { outline = false, dither = false } = {}) {
  const bw = Math.ceil(img.width / GRID), bh = Math.ceil(img.height / GRID);
  const small = Buffer.alloc(bw * bh * 4);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    let n = 0, a = 0, r = 0, g = 0, b = 0;
    for (let y = by * GRID; y < Math.min(img.height, (by + 1) * GRID); y++) for (let x = bx * GRID; x < Math.min(img.width, (bx + 1) * GRID); x++) {
      const o = (y * img.width + x) * 4;
      n++;
      if (img.data[o + 3] < 128) continue;
      a++; r += img.data[o]; g += img.data[o + 1]; b += img.data[o + 2];
    }
    if (a * 2 < n) continue;
    const o = (by * bw + bx) * 4;
    small[o] = r / a; small[o + 1] = g / a; small[o + 2] = b / a; small[o + 3] = 255;
  }
  snapToPalette(small, bw, { dither });
  if (outline) addOutline(small, bw, bh);
  const out = Buffer.alloc(img.width * img.height * 4);
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const s = (Math.floor(y / GRID) * bw + Math.floor(x / GRID)) * 4, o = (y * img.width + x) * 4;
    small.copy(out, o, s, s + 4);
  }
  return { data: out, width: img.width, height: img.height };
}

/** RGBA pixels of an image, fitted into w x h (contain, anchored as given) on transparency. */
async function fit(file, w, h, anchor = 'centre', cover = false) {
  let img = sharp(file).ensureAlpha();
  if (!cover) {
    // A magenta background (instead of transparency) is keyed out before trimming.
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    img = sharp(keyMagenta(Buffer.from(data)), { raw: { width: info.width, height: info.height, channels: 4 } });
  }
  const trimmed = cover ? img : sharp(await img.png().trim().toBuffer());
  const position = anchor === 'bottom-centre' ? 'south' : anchor === 'top-left' ? 'northwest' : anchor === 'top-centre' ? 'north' : 'centre';
  const { data, info } = await trimmed.resize(w, h, { fit: cover ? 'cover' : 'contain', position, background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), width: info.width, height: info.height };
}

const toPng = ({ data, width, height }) => { const png = new PNG({ width, height }); data.copy(png.data); return png; };
const pngOf = (rgba) => encodeIndexed(toPng(rgba));

/** Size of an existing placeholder (to keep a prop or object frame the same size). */
function placeholderSize(root, file) {
  const path = join(root, 'src', file);
  if (!existsSync(path)) return null;
  const b = readFileSync(path);
  return b.readUInt32BE(0) === 0x89504e47 ? { w: b.readUInt32BE(16), h: b.readUInt32BE(20) } : null;
}

async function preview(root, id, before, after) {
  const dir = join(root, 'inbox', 'preview');
  mkdirSync(dir, { recursive: true });
  const H = 360;
  const panel = async buf => sharp(buf).resize({ height: H, fit: 'inside' }).png().toBuffer();
  const parts = [];
  for (const buf of [before, after]) if (buf) parts.push(await panel(buf));
  const metas = await Promise.all(parts.map(p => sharp(p).metadata()));
  const W = metas.reduce((s, m) => s + m.width + 20, 20);
  let x = 20;
  const comps = parts.map((p, i) => { const c = { input: p, left: x, top: 20 }; x += metas[i].width + 20; return c; });
  await sharp({ create: { width: W, height: H + 40, channels: 4, background: '#2a2420' } }).composite(comps).png().toFile(join(dir, `${id}.png`));
}

/** Writes an image under art/src (and its WebP copy when the game loads WebP). */
async function write(root, file, rgba, { webp = false, quality = 88 } = {}) {
  const path = join(root, 'src', file);
  mkdirSync(dirname(path), { recursive: true });
  if (file.endsWith('.webp')) {
    await sharp(rgba.data, { raw: { width: rgba.width, height: rgba.height, channels: 4 } }).webp({ quality, alphaQuality: 100, effort: 6 }).toFile(path);
    return readFileSync(path);
  }
  const png = pngOf(rgba);
  writeFileSync(path, png);
  if (webp) await sharp(png).webp({ quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true }).toFile(path.replace(/\.png$/, '.webp'));
  return png;
}

/** Cuts a walk-behind piece from a room painting (same pixels, transparent outside its polygons). */
function cut(room, entry) {
  const [x0, y0, x1, y1] = entry.cut.box;
  const w = x1 - x0, h = y1 - y0;
  const out = Buffer.alloc(w * h * 4);
  const inside = (x, y) => entry.cut.polygons.some(points => {
    let hit = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inside(x0 + x, y0 + y)) continue;
    const s = ((y0 + y) * room.width + x0 + x) * 4, o = (y * w + x) * 4;
    room.data.copy(out, o, s, s + 4);
  }
  return { data: out, width: w, height: h };
}

function sheetJson(image, frames, tags, w, h) {
  return {
    frames: frames.map((_, n) => ({ filename: String(n), frame: { x: n * w, y: 0, w, h }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w, h }, sourceSize: { w, h }, duration: 1000 })),
    meta: { app: 'adventure art/import.mjs (Aseprite JSON-array compatible)', version: '1', image, format: 'RGBA8888', size: { w: w * frames.length, h }, scale: '1', frameTags: tags.map((name, n) => ({ name, from: n, to: n, direction: 'forward' })) },
  };
}

/**
 * Imports everything waiting in `<root>/inbox`. Returns one line per asset. `root` defaults to
 * art/ (tests pass a temporary copy).
 */
export async function importArt(root = here) {
  const inbox = join(root, 'inbox');
  if (!existsSync(inbox)) return [];
  const names = readdirSync(inbox).filter(n => n !== 'preview' && n !== 'done');
  const report = [];
  const statusFile = join(root, 'status.json');
  const status = existsSync(statusFile) ? JSON.parse(readFileSync(statusFile, 'utf8')) : {};
  const done = [];
  const byId = new Map(MANIFEST.map(e => [e.id, e]));

  // Objects: collect their state images first.
  const objectFrames = new Map();
  for (const name of names) {
    const { name: stem, ext } = parse(name);
    if (ext !== '.png') continue;
    const obj = MANIFEST.find(e => e.kind === 'object' && stem.startsWith(`${e.id}-`) && e.tags?.includes(stem.slice(e.id.length + 1)));
    if (obj) { if (!objectFrames.has(obj.id)) objectFrames.set(obj.id, {}); objectFrames.get(obj.id)[stem.slice(obj.id.length + 1)] = join(inbox, name); done.push(name); }
  }
  for (const [id, frames] of objectFrames) {
    const entry = byId.get(id);
    const missing = entry.tags.filter(t => !frames[t]);
    if (missing.length) { report.push(`${id}: waiting for ${missing.map(t => `${id}-${t}.png`).join(', ')}`); done.splice(0, done.length, ...done.filter(n => !n.startsWith(`${id}-`))); continue; }
    const json = existsSync(join(root, 'src', entry.sheet)) ? JSON.parse(readFileSync(join(root, 'src', entry.sheet), 'utf8')) : null;
    // The manifest's frame (true proportions), else the placeholder's.
    const w = entry.frame?.w ?? json?.frames[0].frame.w ?? 256, h = entry.frame?.h ?? json?.frames[0].frame.h ?? 256;
    const imgs = [];
    for (const tag of entry.tags) imgs.push(toGrid(await fit(frames[tag], w, h, 'bottom-centre'), { outline: true }));
    const sheet = { data: Buffer.alloc(w * h * 4 * imgs.length), width: w * imgs.length, height: h };
    imgs.forEach((f, n) => { for (let y = 0; y < h; y++) f.data.copy(sheet.data, (y * sheet.width + n * w) * 4, y * w * 4, (y + 1) * w * 4); });
    const before = existsSync(join(root, 'src', entry.file)) ? readFileSync(join(root, 'src', entry.file)) : null;
    const after = await write(root, entry.file, sheet);
    writeFileSync(join(root, 'src', entry.sheet), JSON.stringify(sheetJson(parse(entry.file).base, imgs, entry.tags, w, h), null, 1) + '\n');
    await preview(root, id, before, after);
    status[id] = 'final';
    report.push(`${id}: ${entry.tags.length} states → ${entry.file}`);
  }

  for (const name of names) {
    const path = join(inbox, name);
    const { name: stem, ext } = parse(name);
    const entry = byId.get(stem);
    if (!entry) { if (!done.includes(name)) report.push(`${name}: no manifest entry with that id (see art/briefs/INDEX.md)`); continue; }
    if (entry.kind === 'character' || entry.kind === 'extra') {
      if (!statSync(path).isDirectory()) { report.push(`${name}: characters come as a folder ${stem}/ with body.png and arm.png`); continue; }
      const dest = join(root, 'sources', 'characters', stem);
      mkdirSync(dest, { recursive: true });
      for (const layer of readdirSync(path).filter(n => n.endsWith('.png'))) {
        // A magenta background is keyed out first (as for every sprite).
        const raw = await sharp(join(path, layer)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const keyed = await sharp(keyMagenta(Buffer.from(raw.data)), { raw: { width: raw.info.width, height: raw.info.height, channels: 4 } }).png().toBuffer();
        const { data, info } = await sharp(keyed).resize(1024, 1536, { fit: 'contain', position: 'south', background: { r: 0, g: 0, b: 0, alpha: 0 } }).raw().toBuffer({ resolveWithObject: true });
        const img = { data: Buffer.from(data), width: info.width, height: info.height };
        snapToPalette(img.data, img.width);
        writeFileSync(join(dest, layer), pngOf(img));
      }
      done.push(name);
      report.push(`${stem}: layers saved to art/sources/characters/${stem}/. Next: measure its joints and face in art/manifest.mjs (RIGS), point its source there, then npm run rig.`);
      continue;
    }
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext.toLowerCase())) { report.push(`${name}: not an image this importer reads (PNG, JPG or WebP)`); continue; }
    const before = existsSync(join(root, 'src', entry.file)) ? readFileSync(join(root, 'src', entry.file)) : null;
    let after;
    if (entry.kind === 'room' || entry.kind === 'battle-backdrop') {
      const img = toGrid(await fit(path, 1280, 720, 'top-left', true));
      after = await write(root, entry.file, img, { webp: entry.webp, quality: 80 });
      for (const piece of MANIFEST.filter(e => e.kind === 'foreground' && e.room === entry.id && e.cut)) {
        await write(root, piece.file, cut(img, piece), { webp: piece.webp });
        status[piece.id] = 'final';
        report.push(`${piece.id}: re-cut from ${entry.id}`);
      }
    } else {
      const size = entry.size ?? placeholderSize(root, entry.file) ?? (entry.width ? { w: entry.width, h: entry.width } : { w: 256, h: 256 });
      // Sized by one side only (fight portraits, creatures): trimmed, magenta keyed out, scaled to it.
      let img = (entry.width || entry.height) && !entry.size
        ? await (async () => {
          const raw = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
          const keyed = sharp(keyMagenta(Buffer.from(raw.data)), { raw: { width: raw.info.width, height: raw.info.height, channels: 4 } });
          const buf = await sharp(await sharp(await keyed.png().toBuffer()).trim().toBuffer())
            .resize(entry.height ? { height: entry.height } : { width: entry.width }).raw().toBuffer({ resolveWithObject: true });
          return { data: Buffer.from(buf.data), width: buf.info.width, height: buf.info.height };
        })()
        : await fit(path, size.w, size.h, entry.anchor === 'none' ? 'centre' : entry.anchor);
      if (GRID_KINDS.has(entry.kind)) img = toGrid(img, { outline: true });
      else {
        snapToPalette(img.data, img.width);
        if (entry.kind !== 'card') addOutline(img.data, img.width, img.height);
      }
      after = await write(root, entry.file, img, { webp: entry.webp });
    }
    await preview(root, entry.id, before, after);
    status[entry.id] = 'final';
    done.push(name);
    report.push(`${entry.id}: → ${entry.file}`);
  }

  // The card atlas, once every card is final: 3x3 tiles of 256 px.
  const cards = CARD_ORDER.map(c => byId.get(`card-${c}`));
  if (cards.every(c => status[c.id] === 'final' && existsSync(join(root, 'src', c.file)))) {
    const comps = await Promise.all(cards.map(async (c, n) => ({ input: join(root, 'src', c.file), left: (n % 3) * 256, top: Math.floor(n / 3) * 256 })));
    await sharp({ create: { width: 768, height: 768, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comps).webp({ quality: 88, effort: 6 }).toFile(join(root, 'src', 'kc', 'card-atlas.webp'));
    status['card-atlas'] = 'final';
    report.push('card-atlas: assembled from the nine cards');
  }

  writeFileSync(statusFile, JSON.stringify(status, null, 1) + '\n');
  const doneDir = join(inbox, 'done');
  mkdirSync(doneDir, { recursive: true });
  for (const name of new Set(done)) if (existsSync(join(inbox, name))) renameSync(join(inbox, name), join(doneDir, name));
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = await importArt();
  console.log(report.length ? report.join('\n') : 'Nothing in art/inbox.');
  if (report.length) console.log('\nPreviews: art/inbox/preview/. Then npm run art:check and look at it in the game.');
}
