// `npm run art:pack -- <batch>`: validates art/inbox/<batch>/, installs it into art/frames/<key>/ and
// rebuilds the atlases. Nothing is copied unless every file in the batch passes.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { buildAtlases, cellOf, envItems, framesDir, listDir, loadManifest, loadPalette, paletteProblem, parseArgs, parseFrameFile, readStandins, uiItems, writeStandinFrames, writeStandins } from './lib.mjs';

const { root, rest } = parseArgs(process.argv.slice(2));
const batch = rest[0];
if (!batch || !/^[\w.-]+$/.test(batch)) {
  console.error('Usage: npm run art:pack -- <batch>   (a folder name in art/inbox/, for example A1)');
  process.exit(1);
}
const manifest = loadManifest(root);
const inbox = join(root, 'art', 'inbox', batch);
if (!existsSync(inbox)) {
  console.error(`No such batch folder: art/inbox/${batch}`);
  process.exit(1);
}

const palette = loadPalette(root);
if (!palette) console.warn('Warning: art/palette.json not found, palette check skipped.');

const errors = [];
const accepted = []; // { key, file, from }
const rel = (...p) => ['art', 'inbox', batch, ...p].join('/');

for (const entry of listDir(inbox)) {
  if (!entry.isDirectory()) {
    errors.push(`${rel(entry.name)}: a file at the batch root; frames go in art/inbox/${batch}/<key>/.`);
    continue;
  }
  const key = entry.name;
  if (key === 'ui' || key === 'env') {
    // UI art (manifest `ui`) and environment art (manifest `keys` with group env): flat files
    // art/inbox/<batch>/<ui|env>/<item>.png at the item's exact source size.
    const known = new Map((key === 'ui' ? uiItems(manifest, root) : envItems(manifest)).map((i) => [i.name, i]));
    for (const f of listDir(join(inbox, key))) {
      const where = rel(key, f.name);
      const item = f.isFile() && f.name.endsWith('.png') ? known.get(f.name.slice(0, -4)) : null;
      if (!item) {
        errors.push(key === 'ui'
          ? `${where}: not a UI item; expected <item>.png with an item name from art/manifest.json ui.items (for example kit_panel.png).`
          : `${where}: not an environment key; expected <key>.png with a key whose group is env in art/manifest.json (for example tree_a.png).`);
        continue;
      }
      let png;
      try {
        png = PNG.sync.read(readFileSync(join(inbox, key, f.name)));
      } catch (e) {
        errors.push(`${where}: not a readable PNG (${e.message}).`);
        continue;
      }
      if (png.width !== item.size[0] || png.height !== item.size[1]) {
        errors.push(`${where}: size ${png.width}x${png.height}, expected ${item.size[0]}x${item.size[1]}.`);
        continue;
      }
      const bad = palette ? paletteProblem(png, palette) : null;
      if (bad) {
        errors.push(`${where}: ${bad}.`);
        continue;
      }
      accepted.push({ key, file: f.name, from: join(inbox, key, f.name) });
    }
    continue;
  }
  const figure = manifest.figures.keys[key];
  if (!figure) {
    errors.push(`${rel(key)}: unknown figure key (expected one of ${Object.keys(manifest.figures.keys).join(', ')}).`);
    continue;
  }
  for (const f of listDir(join(inbox, key))) {
    const where = rel(key, f.name);
    const parsed = f.isFile() ? parseFrameFile(f.name) : null;
    if (!parsed) {
      errors.push(`${where}: misnamed; expected <anim>_<facing>_<n>.png (for example walk_se_0.png).`);
      continue;
    }
    if (!manifest.figures.drawnFacings.includes(parsed.facing)) {
      errors.push(`${where}: facing "${parsed.facing}" is not drawn; only ${manifest.figures.drawnFacings.join(' and ')} (code mirrors the rest).`);
      continue;
    }
    const count = figure.anims[parsed.anim];
    if (count === undefined) {
      errors.push(`${where}: unknown anim "${parsed.anim}" for ${key} (expected ${Object.keys(figure.anims).join(', ')}).`);
      continue;
    }
    if (parsed.n >= count) {
      errors.push(`${where}: frame index ${parsed.n} out of range; ${key} ${parsed.anim} has ${count} frames (0-${count - 1}).`);
      continue;
    }
    if (f.name !== `${parsed.anim}_${parsed.facing}_${parsed.n}.png`) {
      errors.push(`${where}: frame numbers must be written without leading zeros.`);
      continue;
    }
    let png;
    try {
      png = PNG.sync.read(readFileSync(join(inbox, key, f.name)));
    } catch (e) {
      errors.push(`${where}: not a readable PNG (${e.message}).`);
      continue;
    }
    const [cw, ch] = cellOf(manifest, key);
    if (png.width !== cw || png.height !== ch) {
      errors.push(`${where}: size ${png.width}x${png.height}, expected ${cw}x${ch}.`);
      continue;
    }
    const bad = palette ? paletteProblem(png, palette) : null;
    if (bad) {
      errors.push(`${where}: ${bad}.`);
      continue;
    }
    accepted.push({ key, file: f.name, from: join(inbox, key, f.name) });
  }
}

if (errors.length) {
  console.error(`art:pack ${batch} failed, nothing installed:`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
if (!accepted.length) {
  console.error(`art/inbox/${batch} holds no frames; nothing to install.`);
  process.exit(1);
}

const standins = readStandins(root);
for (const a of accepted) {
  mkdirSync(framesDir(root, a.key), { recursive: true });
  copyFileSync(a.from, join(framesDir(root, a.key), a.file));
  if (standins[a.key]) standins[a.key] = standins[a.key].filter((n) => n !== a.file);
}
writeStandinFrames(root, manifest, standins, { createMissing: false }); // a stand-in left at an old scale is redrawn at the sheet's scale
writeStandins(root, standins);
const groups = buildAtlases(root, manifest);
const left = Object.values(standins).reduce((n, list) => n + list.length, 0);
console.log(`Installed ${accepted.length} frames from batch ${batch}; rebuilt ${groups.join(', ')}. Stand-ins left: ${left}.`);
