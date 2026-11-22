// Shared art tooling (AC1): what files a manifest key must have, and checks of the manifest and of an
// inbox delivery. Format: art/SPEC.md sections 3, 4, 8, 9; procedure: art/PIPELINE.md *Delivering*.
import fs from 'node:fs';
import path from 'node:path';
import pngjs from 'pngjs';

const { PNG } = pngjs;

export const FACINGS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const GROUPS = ['ground', 'plants', 'buildings', 'man', 'woman', 'elder_man', 'elder_woman', 'child', 'rider', 'animals', 'fx', 'ui'];
export const KINDS = ['tile', 'bank', 'spill', 'tree', 'bush', 'rock', 'tuft', 'stump', 'item', 'building', 'fire', 'person', 'animal', 'carcass', 'ally', 'fx', 'icon', 'cursor', 'ui'];
const STATES = ['stage1', 'stage2', 'stage3', 'finished', 'winter', 'normal', 'hover', 'pressed', 'disabled'];
const FILE_NAME = /^[\w.-]+$/;
const pad = (n) => String(n).padStart(2, '0');
const range = (n) => Array.from({ length: n }, (_, i) => i);

/** Index names of a key's variants: explicit `indices`, else 0..variants-1. */
function indicesOf(e) {
  if (e.indices) return e.indices;
  return range(e.variants ?? 1).map(String);
}

/**
 * Every frame a key must deliver: `name` (atlas frame name), `file` (relative to the key's folder),
 * `size` (expected [w, h]), and `layer` for pattern A. SPEC.md section 8.
 */
export function expectedFrames(key, e) {
  const out = [];
  const [cw, ch] = e.cell;
  const add = (name, file, layer = null, size = [cw, ch]) => out.push({ name, file, layer, size });
  const still = !e.anims && !e.states && !e.seasons && e.facings === 1;
  if (e.facings === 8) {
    // Pattern A: <key>/<layer>/<anim>/<facing>/<nn>
    for (const layer of e.layers) {
      for (const [anim, d] of Object.entries(e.anims ?? {})) {
        for (const f of FACINGS) {
          for (let i = 0; i < d.frames; i++) {
            add(`${key}/${layer}/${anim}/${f}/${pad(i)}`, `${layer}_${anim}_${f}_${pad(i)}.png`, layer);
          }
        }
      }
    }
  } else if (e.seasons) {
    // Pattern C: <key>/<season>/<index>
    for (const s of SEASONS) {
      for (const idx of indicesOf(e)) add(`${key}/${s}/${idx}`, `${s}_${idx}.png`);
    }
  } else if (e.atlas === 'ui' || still) {
    // Pattern D: single images; ui states are <state>.png
    if (e.states) {
      for (const s of e.states) add(`${key}/${s}`, `${s}.png`);
    } else {
      add(key, `${key}.png`);
      if (e.retina) add(`${key}@2x`, `${key}_2x.png`, null, [cw * 2, ch * 2]);
    }
  } else if (e.states) {
    // Pattern B with states: <key>/<state>/<nn>; with `variants` (barricade masks) <state>_<mask>.png
    for (const s of e.states) {
      if (e.variants) {
        for (const idx of indicesOf({ ...e, indices: e.indices ?? range(e.variants).map(String) })) {
          add(`${key}/${s}/${idx}`, `${s}_${idx}.png`);
        }
      } else {
        const n = e.anims?.[s]?.frames ?? 1;
        for (let i = 0; i < n; i++) add(`${key}/${s}/${pad(i)}`, `${s}_${pad(i)}.png`);
      }
    }
  } else {
    // Pattern B with animations only (one facing): <key>/<anim>/<nn>
    for (const [anim, d] of Object.entries(e.anims ?? {})) {
      for (let i = 0; i < d.frames; i++) add(`${key}/${anim}/${pad(i)}`, `${anim}_${pad(i)}.png`);
    }
  }
  return out;
}

/** AB0 establishes the grass style in summer. AB3 delivers the complete seasonal set. */
export function deliveryFrames(key, entry, batch) {
  const frames = expectedFrames(key, entry);
  // AB12 is the approved rig's walk-only style gate; AB13 supplies the full man.
  if (batch === 'AB12' && key === 'person_man') return frames.filter((frame) => /^(base|cloth)_walk_/.test(frame.file));
  return batch === 'AB0' && key === 'tile_grass'
    ? frames.filter((frame) => frame.file.startsWith('summer_'))
    : frames;
}

const isInt = (n) => Number.isInteger(n);
const isPair = (a) => Array.isArray(a) && a.length === 2 && a.every((n) => typeof n === 'number');

/** Checks the manifest for consistency with SPEC.md. Returns a list of error strings. */
export function validateManifest(manifest) {
  const errors = [];
  const names = new Map();
  for (const [key, e] of Object.entries(manifest)) {
    const err = (msg) => errors.push(`${key}: ${msg}`);
    if (e.status !== 'placeholder' && e.status !== 'final') err(`status must be placeholder or final, got ${e.status}`);
    if (e.placeholder && (!isPair(e.placeholder.size) || !isPair(e.placeholder.anchor))) err('placeholder needs size and anchor pairs');
    if (e.legacy) {
      if (!e.placeholder) err('a legacy key needs a placeholder');
      if (e.status === 'final') err('a legacy key cannot be final');
      continue;
    }
    if (!/^[a-z]+(_[a-z0-9]+)+$/.test(key)) err('key must be lowercase <kind>_<name>');
    else if (!KINDS.includes(key.split('_')[0])) err(`unknown kind ${key.split('_')[0]}`);
    if (!GROUPS.includes(e.atlas)) err(`unknown atlas group ${e.atlas}`);
    if (!isPair(e.cell) || !e.cell.every((n) => isInt(n) && n > 0)) {
      err('cell must be two positive integers');
      continue;
    }
    if (!isPair(e.anchor)) {
      err('anchor must be two numbers');
      continue;
    }
    e.anchor.forEach((a, i) => {
      const px = a * e.cell[i];
      if (Math.abs(px - Math.round(px)) > 1e-6) err(`anchor ${a} does not land on a whole pixel of ${e.cell[i]}`);
      if (a < 0 || a > 1) err(`anchor ${a} is outside the cell`);
    });
    if (e.facings !== 1 && e.facings !== 8) err('facings must be 1 or 8');
    if (!Array.isArray(e.layers) || !e.layers.every((l) => l === 'base' || l === 'cloth') || e.layers[0] !== 'base') err('layers must be ["base"] or ["base", "cloth"]');
    if (e.facings === 8 && !e.anims) err('an 8-facing key needs anims');
    for (const [anim, d] of Object.entries(e.anims ?? {})) {
      if (!/^[a-z0-9_]+$/.test(anim)) err(`animation name ${anim} must be lowercase`);
      if (!isInt(d.frames) || d.frames < 1 || !(d.fps > 0) || typeof d.loop !== 'boolean') err(`animation ${anim} needs frames, fps and loop`);
    }
    for (const s of e.states ?? []) if (!STATES.includes(s)) err(`unknown state ${s}`);
    if (e.variants !== null && !(isInt(e.variants) && e.variants >= 1)) err('variants must be a positive integer or null');
    if (e.indices && e.variants !== null && e.indices.length !== e.variants) err('indices must have `variants` names');
    if (!isInt(e.border) || e.border < 0) err('border must be a whole number of px');
    if (e.status === 'final') {
      if (!e.batch || !(e.revision >= 1) || (e.approvedBy !== 'user' && e.approvedBy !== 'claude')) err('a final key needs batch, revision >= 1 and approvedBy');
    }
    for (const f of expectedFrames(key, e)) {
      if (!FILE_NAME.test(f.file)) err(`file name ${f.file} breaks ^[\\w.-]+$`);
      const other = names.get(f.name);
      if (other) err(`frame name ${f.name} is also ${other}`);
      names.set(f.name, key);
    }
  }
  return errors;
}

function readPng(file) {
  const buf = fs.readFileSync(file);
  const sig = buf.subarray(0, 8).toString('hex');
  if (sig !== '89504e470d0a1a0a') throw new Error('not a PNG file');
  const depth = buf[24];
  const colorType = buf[25];
  const png = PNG.sync.read(buf);
  return { width: png.width, height: png.height, depth, colorType, data: png.data };
}

const alphaAt = (img, x, y) => img.data[(y * img.width + x) * 4 + 3];

function borderIssue(img, border) {
  if (border <= 0) return null;
  const { width: w, height: h } = img;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if ((x < border || y < border || x >= w - border || y >= h - border) && alphaAt(img, x, y) !== 0) {
        return `a pixel at (${x}, ${y}) is not transparent inside the ${border} px border`;
      }
    }
  }
  return null;
}

function groundIssue(img, anchorPx) {
  const [ax, ay] = anchorPx;
  for (let y = Math.max(0, ay - 4); y <= Math.min(img.height - 1, ay); y++) {
    for (let x = Math.max(0, ax - 4); x <= Math.min(img.width - 1, ax + 4); x++) {
      if (alphaAt(img, x, y) > 0) return null;
    }
  }
  return `nothing is drawn within 4 px above the anchor pixel (${ax}, ${ay})`;
}

/** Cloth pixels that sit where the base layer is (almost) transparent. */
function clothLeak(cloth, base) {
  let leak = 0;
  let total = 0;
  for (let i = 3; i < cloth.data.length; i += 4) {
    if (cloth.data[i] >= 128) {
      total++;
      if (base.data[i] < 128) leak++;
    }
  }
  return { leak, total, allowed: Math.max(4, Math.floor(total * 0.01)) };
}

/**
 * Checks an inbox delivery `art/inbox/<batch>/` against the manifest (PIPELINE.md *Delivering*).
 * Returns { errors, frames } (frames is the number of PNGs checked).
 */
export function validateInbox(artDir, batch, manifest) {
  const errors = [];
  let frames = 0;
  const dir = path.join(artDir, 'inbox', batch);
  if (!fs.existsSync(dir)) return { errors: [`${dir} does not exist`], frames };
  const deliveryFile = path.join(dir, 'delivery.json');
  let delivery = null;
  if (!fs.existsSync(deliveryFile)) errors.push('delivery.json is missing');
  else {
    try {
      delivery = JSON.parse(fs.readFileSync(deliveryFile, 'utf8'));
    } catch (x) {
      errors.push(`delivery.json is not valid JSON: ${x.message}`);
    }
  }
  if (delivery) {
    if (delivery.batch !== batch) errors.push(`delivery.json batch is ${delivery.batch}, expected ${batch}`);
    if (!isInt(delivery.revision) || delivery.revision < 1) errors.push('delivery.json needs a revision of 1 or more');
    if (!Array.isArray(delivery.keys) || !delivery.keys.length) errors.push('delivery.json needs a non-empty keys list');
    for (const f of ['brief', 'tools', 'prompts']) if (delivery[f] === undefined) errors.push(`delivery.json needs ${f}`);
  }
  if (!fs.existsSync(path.join(dir, 'contact.png'))) errors.push('contact.png is missing');
  const keys = delivery && Array.isArray(delivery.keys) ? delivery.keys : [];
  const folders = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const concept = batch === 'AB0' ? 'concept' : null;
  if (concept) {
    for (const key of ['tile_grass', 'building_tipi', 'ui_panel', 'ui_button', 'icon_food']) {
      if (!keys.includes(key)) errors.push(`AB0 delivery is missing key ${key}`);
    }
    const conceptFile = path.join(dir, concept, 'person_man.png');
    try {
      readPng(conceptFile);
    } catch {
      errors.push('AB0 requires a readable concept/person_man.png');
    }
    if (folders.includes(concept)) {
      for (const file of fs.readdirSync(path.join(dir, concept))) {
        if (file !== 'person_man.png') errors.push(`unexpected file concept/${file}`);
      }
    }
  }
  for (const f of folders) if (f !== concept && !keys.includes(f)) errors.push(`folder ${f} is not listed in delivery.json keys`);
  for (const key of keys) {
    const err = (msg) => errors.push(`${key}: ${msg}`);
    const e = manifest[key];
    if (!e || e.legacy) {
      err('is not a manifest key');
      continue;
    }
    const keyDir = path.join(dir, key);
    if (!fs.existsSync(keyDir)) {
      err('has no folder');
      continue;
    }
    const want = deliveryFrames(key, e, batch);
    const have = new Set(fs.readdirSync(keyDir));
    const wantFiles = new Set(want.map((f) => f.file));
    for (const f of have) if (!wantFiles.has(f)) err(`unexpected file ${f}`);
    const images = new Map();
    for (const f of want) {
      if (!have.has(f.file)) {
        err(`missing ${f.file} (${f.name})`);
        continue;
      }
      const at = `${f.file}`;
      let img;
      try {
        img = readPng(path.join(keyDir, f.file));
      } catch (x) {
        err(`${at}: unreadable (${x.message})`);
        continue;
      }
      frames++;
      images.set(f.file, img);
      if (img.depth !== 8 || img.colorType !== 6) err(`${at}: must be 8-bit RGBA (depth ${img.depth}, colour type ${img.colorType})`);
      if (img.width !== f.size[0] || img.height !== f.size[1]) err(`${at}: size is ${img.width}x${img.height}, expected ${f.size[0]}x${f.size[1]}`);
      else {
        const b = borderIssue(img, e.border);
        if (b) err(`${at}: ${b}`);
        if (e.ground && f.layer !== 'cloth') {
          const g = groundIssue(img, [Math.round(e.anchor[0] * e.cell[0]), Math.round(e.anchor[1] * e.cell[1])]);
          if (g) err(`${at}: ${g}`);
        }
      }
    }
    if (e.layers.includes('cloth')) {
      for (const f of want.filter((w) => w.layer === 'cloth')) {
        const cloth = images.get(f.file);
        const base = images.get(f.file.replace(/^cloth_/, 'base_'));
        if (!cloth || !base || cloth.width !== base.width || cloth.height !== base.height) continue;
        const { leak, total, allowed } = clothLeak(cloth, base);
        if (leak > allowed) err(`${f.file}: ${leak} of ${total} cloth pixels sit outside the base layer (allowed ${allowed})`);
      }
    }
  }
  return { errors, frames };
}
