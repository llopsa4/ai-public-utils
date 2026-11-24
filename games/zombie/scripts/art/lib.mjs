// Shared by pack.mjs and standins.mjs: the figure frame contract (art/STYLE.md *Atlas contract*,
// machine-readable in art/manifest.json `figures` and `atlases`).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

export const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const COLUMNS = 8;
const FRAME_FILE = /^(.+)_(se|sw|ne|nw)_(\d+)\.png$/;

/** `--root <dir>` overrides the project folder (the tests use a temp copy). */
export function parseArgs(argv) {
  const args = { root: defaultRoot, rest: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') args.root = resolve(argv[++i] ?? '');
    else args.rest.push(argv[i]);
  }
  return args;
}

export function loadManifest(root) {
  return JSON.parse(readFileSync(join(root, 'art', 'manifest.json'), 'utf8'));
}

/** The resolution of an atlas group: 1 (64 px cells) or 2 (128 px cells, drawn at half scale). Default 1. */
export function atlasScale(manifest, group) {
  return manifest.atlases[group]?.scale ?? 1;
}

/** The cell size `[w, h]` of a figure key's frames: the figure cell times its atlas's scale. */
export function cellOf(manifest, key) {
  const k = atlasScale(manifest, manifest.figures.keys[key].atlas);
  return [manifest.figures.cell[0] * k, manifest.figures.cell[1] * k];
}

export const framesDir = (root, key) => join(root, 'art', 'frames', key);
export const standinsFile = (root) => join(root, 'art', 'frames', 'standins.json');

/** Every contract frame of one figure key: `{ anim, facing, n, file }` in atlas order. */
export function expectedFrames(manifest, key) {
  const out = [];
  for (const [anim, count] of Object.entries(manifest.figures.keys[key].anims)) {
    for (const facing of manifest.figures.drawnFacings) {
      for (let n = 0; n < count; n++) out.push({ anim, facing, n, file: `${anim}_${facing}_${n}.png` });
    }
  }
  return out;
}

/** Splits `walk_se_3.png` into its parts, or null when the name is not shaped like a frame. */
export function parseFrameFile(file) {
  const m = FRAME_FILE.exec(file);
  return m ? { anim: m[1], facing: m[2], n: Number(m[3]) } : null;
}

/** The shared palette from `art/palette.json` (an array of "#rrggbb"), or null when not delivered yet. */
export function loadPalette(root) {
  const file = join(root, 'art', 'palette.json');
  if (!existsSync(file)) return null;
  const list = JSON.parse(readFileSync(file, 'utf8'));
  const set = new Set();
  for (const hex of list) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) throw new Error(`art/palette.json: "${hex}" is not #rrggbb`);
    const v = parseInt(m[1], 16);
    set.add((v >> 16) * 65536 + ((v >> 8) & 255) * 256 + (v & 255));
  }
  return set;
}

/** Why a PNG breaks the palette rule (alpha 0 or 255 only, every opaque pixel in the palette), or null. */
export function paletteProblem(png, palette) {
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3];
    if (a === 0) continue;
    const px = (i / 4) % png.width;
    const py = Math.floor(i / 4 / png.width);
    if (a !== 255) return `semi-transparent pixel at (${px},${py}); pixel art uses alpha 0 or 255`;
    if (!palette.has(png.data[i] * 65536 + png.data[i + 1] * 256 + png.data[i + 2])) {
      const hex = [0, 1, 2].map((c) => png.data[i + c].toString(16).padStart(2, '0')).join('');
      return `off-palette colour #${hex} at (${px},${py})`;
    }
  }
  return null;
}

export function readStandins(root) {
  const file = standinsFile(root);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
}

export function writeStandins(root, standins) {
  const sorted = {};
  for (const key of Object.keys(standins).sort()) if (standins[key].length) sorted[key] = [...standins[key]].sort();
  mkdirSync(join(root, 'art', 'frames'), { recursive: true });
  writeFileSync(standinsFile(root), JSON.stringify(sorted, null, 2) + '\n');
}

/** Rebuilds `art/atlas/<group>.png` + `.json` (Phaser JSON hash) from `art/frames/`. Returns the groups written. */
export function buildAtlases(root, manifest) {
  const written = [];
  for (const [group, atlas] of Object.entries(manifest.atlases)) {
    const scale = atlasScale(manifest, group);
    const [cw, ch] = [manifest.figures.cell[0] * scale, manifest.figures.cell[1] * scale];
    const frames = [];
    for (const key of atlas.keys) {
      for (const f of expectedFrames(manifest, key)) {
        const path = join(framesDir(root, key), f.file);
        if (existsSync(path)) frames.push({ name: `${key}_${f.anim}_${f.facing}_${f.n}`, path });
      }
    }
    if (!frames.length) continue;
    const cols = Math.min(COLUMNS, frames.length);
    const rows = Math.ceil(frames.length / cols);
    const sheet = new PNG({ width: cols * cw, height: rows * ch });
    const hash = {};
    frames.forEach((f, i) => {
      const x = (i % cols) * cw;
      const y = Math.floor(i / cols) * ch;
      const src = PNG.sync.read(readFileSync(f.path));
      if (src.width !== cw || src.height !== ch) {
        throw new Error(`${f.path}: size ${src.width}x${src.height}, expected ${cw}x${ch} (the ${group} atlas is ${scale}x); run npm run art:standins to redraw stand-ins.`);
      }
      PNG.bitblt(src, sheet, 0, 0, cw, ch, x, y);
      hash[f.name] = {
        frame: { x, y, w: cw, h: ch },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: cw, h: ch },
        sourceSize: { w: cw, h: ch },
      };
    });
    const pngPath = join(root, atlas.png);
    mkdirSync(dirname(pngPath), { recursive: true });
    writeFileSync(pngPath, PNG.sync.write(sheet));
    const meta = { app: 'dead-woods art:pack', version: '1', image: `${group}.png`, format: 'RGBA8888', size: { w: sheet.width, h: sheet.height }, scale: String(scale) };
    writeFileSync(join(root, atlas.json), JSON.stringify({ frames: hash, meta }, null, 2) + '\n');
    written.push(`${group} (${frames.length} frames)`);
  }
  const ui = buildUiAtlas(root, manifest);
  if (ui) written.push(ui);
  return written;
}

// ---- UI art (manifest `ui`, art/STYLE.md *UI art*): flat items `art/frames/ui/<name>.png`, shelf-packed into one atlas.

/** The UI items as `{ name, group, size: [w, h] source px, scale, packed, file }` in manifest order; [] when the manifest has no `ui`. */
export function uiItems(manifest, root) {
  const ui = manifest.ui;
  if (!ui) return [];
  return Object.entries(ui.items).map(([name, it]) => {
    const g = ui.groups[it.group];
    if (!g) throw new Error(`art/manifest.json ui.items.${name}: unknown group "${it.group}"`);
    return { name, group: it.group, size: it.size, scale: g.scale, packed: g.packed, hotspot: it.hotspot, inset: it.inset, file: join(root, ui.dir, `${name}.png`) };
  });
}

/** Writes `art/atlas/ui.png` + `.json` (Phaser JSON hash, frame = item name) from the packed items. Returns a summary or null. */
export function buildUiAtlas(root, manifest) {
  const items = uiItems(manifest, root).filter((i) => i.packed);
  if (!items.length || !items.every((i) => existsSync(i.file))) return null;
  const maxW = manifest.ui.atlas.maxWidth ?? 2048;
  // Shelf packing in manifest order: fill a row left to right, start a new row when the next item does not fit.
  const placed = [];
  let x = 0, y = 0, rowH = 0, width = 0;
  for (const it of items) {
    const [w, h] = it.size;
    if (x + w > maxW) { x = 0; y += rowH; rowH = 0; }
    placed.push({ it, x, y });
    x += w;
    rowH = Math.max(rowH, h);
    width = Math.max(width, x);
  }
  const sheet = new PNG({ width, height: y + rowH });
  const hash = {};
  for (const { it, x: px, y: py } of placed) {
    const src = PNG.sync.read(readFileSync(it.file));
    if (src.width !== it.size[0] || src.height !== it.size[1]) throw new Error(`${it.file}: size ${src.width}x${src.height}, expected ${it.size[0]}x${it.size[1]}; run npm run art:standins to redraw stand-ins.`);
    PNG.bitblt(src, sheet, 0, 0, src.width, src.height, px, py);
    hash[it.name] = { frame: { x: px, y: py, w: it.size[0], h: it.size[1] }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: it.size[0], h: it.size[1] }, sourceSize: { w: it.size[0], h: it.size[1] } };
  }
  const atlas = manifest.ui.atlas;
  mkdirSync(dirname(join(root, atlas.png)), { recursive: true });
  writeFileSync(join(root, atlas.png), PNG.sync.write(sheet));
  const meta = { app: 'dead-woods art:pack', version: '1', image: `${atlas.texture}.png`, format: 'RGBA8888', size: { w: sheet.width, h: sheet.height }, scale: '2' };
  writeFileSync(join(root, atlas.json), JSON.stringify({ frames: hash, meta }, null, 2) + '\n');
  return `${atlas.texture} (${items.length} items)`;
}

export const listDir = (dir) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []);

// Grey numbered stand-ins (npm run art:standins). 3x5 digits, one string per row.
const FONT = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111',
};

function fill(png, x0, y0, w, h, grey) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
      const i = (y * png.width + x) * 4;
      png.data[i] = png.data[i + 1] = png.data[i + 2] = grey;
      png.data[i + 3] = 255;
    }
  }
}

function text(png, str, x, y, scale, grey) {
  [...str.toUpperCase()].forEach((ch, k) => {
    const bits = FONT[ch];
    if (!bits) return; // a space or a character the font lacks
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (bits[r * 3 + c] === '1') fill(png, x + k * 4 * scale + c * scale, y + r * scale, scale, scale, grey);
  });
}

/**
 * A grey box standing on the feet anchor: 24x48 world px, so 24x48 source px in a 1x cell and 48x96 in a
 * 2x cell. Shade = anim, big digit = frame n, small digits = anim index.
 */
function standin(cell, anchor, k, animIndex, facing, n) {
  const [cw, ch] = cell;
  const png = new PNG({ width: cw, height: ch });
  const feetX = Math.round(cw * anchor[0]);
  const feetY = Math.round(ch * anchor[1]);
  const w = 24 * k;
  const h = 48 * k;
  const bob = n % 2 ? 2 * k : 0; // odd frames hop so a played loop visibly moves
  const x0 = feetX - w / 2;
  const y0 = feetY - h - bob;
  const shade = 120 + (animIndex % 8) * 14;
  fill(png, x0, y0, w, h, 60);
  fill(png, x0 + k, y0 + k, w - 2 * k, h - 2 * k, shade);
  text(png, String(animIndex), x0 + 3 * k, y0 + 4 * k, 2 * k, 40);
  text(png, String(n), x0 + 7 * k, y0 + 20 * k, 3 * k, 30);
  // Facing: a notch on the right edge, low for se, high for ne.
  fill(png, x0 + w - k, facing === 'se' ? y0 + h - 12 * k : y0 + 2 * k, 5 * k, 10 * k, 60);
  fill(png, feetX - 3 * k, feetY, 7 * k, k, 30); // the feet anchor
  return png;
}

/**
 * Writes a grey stand-in for every contract frame with no file yet (unless `createMissing` is false),
 * and redraws a listed stand-in whose size no longer matches its atlas's scale. Real art is never
 * overwritten. Updates `standins` in place; returns how many files were written.
 */
export function writeStandinFrames(root, manifest, standins, { createMissing = true } = {}) {
  let made = 0;
  for (const key of Object.keys(manifest.figures.keys)) {
    const animNames = Object.keys(manifest.figures.keys[key].anims);
    const [cw, ch] = cellOf(manifest, key);
    const k = cw / manifest.figures.cell[0];
    for (const f of expectedFrames(manifest, key)) {
      const path = join(framesDir(root, key), f.file);
      const listed = standins[key]?.includes(f.file);
      if (existsSync(path)) {
        if (!listed) continue; // real art
        const png = PNG.sync.read(readFileSync(path));
        if (png.width === cw && png.height === ch) continue;
      } else if (!createMissing) continue;
      mkdirSync(framesDir(root, key), { recursive: true });
      writeFileSync(path, PNG.sync.write(standin([cw, ch], manifest.figures.anchor, k, animNames.indexOf(f.anim), f.facing, f.n)));
      if (!listed) (standins[key] ??= []).push(f.file);
      made++;
    }
  }
  return made + writeUiStandinFrames(root, manifest, standins, { createMissing });
}

/**
 * A grey labelled stand-in for a UI item at its source size. Shade = group. A 9-slice piece has a dark
 * band as wide as its corner insets (so stretching it shows the slices) around a lighter middle and no
 * label (it would stretch); the label of the other items is the item name without its group prefix, split on `_` and drawn as large as fits. Cursors are a
 * grey disc on transparent with a dark dot at the hotspot (alpha 0 or 255 only).
 */
function uiStandin(item) {
  const [w, h] = item.size;
  const png = new PNG({ width: w, height: h });
  const k = item.scale;
  let shade = { kit: 72, icon_bar: 130, icon_hud: 150, portrait: 90, portrait_small: 100, cursor: 140, title: 70 }[item.group] ?? 120;
  if (item.group === 'cursor') {
    const [cx, cy] = [w / 2, h / 2];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= 12) fill(png, x, y, 1, 1, d > 10 ? 40 : shade);
    }
    fill(png, item.hotspot[0] - 1, item.hotspot[1] - 1, 3, 3, 20);
  } else {
    fill(png, 0, 0, w, h, 40);
    const [l, t, r, b] = (item.inset ?? [0, 0, 0, 0]).map((v) => v * k);
    const band = Math.max(2, k * 2);
    // The kit is dark so the game's light text reads on it. A button's state shows in its grey (the middle of a stretched piece carries no label, see below).
    shade += { kit_button_hover: 30, kit_button_pressed: -16, kit_button_disabled: -6, kit_button_active: 62, kit_check_on: 50 }[item.name] ?? 0;
    // The frame is `band` px thick; a 9-slice piece also keeps its corner zones a little darker than the middle.
    fill(png, band, band, w - 2 * band, h - 2 * band, shade - 20);
    fill(png, Math.max(l, band), Math.max(t, band), w - Math.max(l, band) - Math.max(r, band), h - Math.max(t, band) - Math.max(b, band), shade);
  }
  const name = item.name.slice(item.group.length + 1).toUpperCase().replace(/^(SMALL_)/, '');
  const lines = name.split('_');
  const longest = Math.max(...lines.map((s) => s.length));
  let s = 4;
  while (s > 1 && (longest * 4 * s > w - 4 || lines.length * 6 * s > h - 4)) s--;
  const stretched = (item.inset ?? []).some((v) => v > 0); // a label in the middle of a 9-slice piece would be stretched with it
  if (item.group !== 'cursor' && !stretched && longest * 4 * s <= w - 2 && lines.length * 6 * s <= h - 2) {
    lines.forEach((line, i) => text(png, line, Math.round((w - line.length * 4 * s + s) / 2), Math.round((h - lines.length * 6 * s + s) / 2) + i * 6 * s, s, 20));
  }
  return png;
}

/** UI stand-ins, with the same listed-file rules as the figure frames: real art is never overwritten, a stand-in of the wrong size is redrawn. */
function writeUiStandinFrames(root, manifest, standins, { createMissing }) {
  let made = 0;
  for (const item of uiItems(manifest, root)) {
    const file = `${item.name}.png`;
    const listed = standins.ui?.includes(file);
    if (existsSync(item.file)) {
      if (!listed) continue; // real art
      const png = PNG.sync.read(readFileSync(item.file));
      if (png.width === item.size[0] && png.height === item.size[1]) continue;
    } else if (!createMissing) continue;
    mkdirSync(dirname(item.file), { recursive: true });
    writeFileSync(item.file, PNG.sync.write(uiStandin(item)));
    if (!listed) (standins.ui ??= []).push(file);
    made++;
  }
  return made;
}
