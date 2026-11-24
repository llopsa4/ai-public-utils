import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { PNG } from 'pngjs';
import { buildUiAtlas, loadPalette, paletteProblem, readStandins, writeStandins } from '../../../scripts/art/lib.mjs';

const batch = import.meta.dirname;
const root = join(batch, '../../..');
const preview = readFileSync(join(batch, 'local-preview-root.txt'), 'utf8').trim();
const candidate = join(batch, 'candidate', basename(batch), 'ui');
const reviewed = JSON.parse(readFileSync(join(batch, 'pack-checks.json'), 'utf8'));
const manifestPath = join(root, 'art/manifest.json');
const before = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(before);
const names = Object.keys(manifest.ui.items).filter((name) => manifest.ui.items[name].group === 'kit');
assert.deepEqual(names.toSorted(), Object.keys(reviewed).toSorted());
const sha = (data) => createHash('sha256').update(data).digest('hex');
const digest = (path) => sha(readFileSync(path));
const palette = loadPalette(root);
assert.ok(palette);

const staged = mkdtempSync(join(tmpdir(), 'dead-woods-install-a8-'));
const uiDir = manifest.ui.dir;
mkdirSync(join(staged, uiDir, '..'), { recursive: true });
cpSync(join(root, uiDir), join(staged, uiDir), { recursive: true });
const frames = new Map();
for (const name of names) {
  const source = readFileSync(join(candidate, `${name}.png`));
  assert.equal(sha(source), reviewed[name].sha256, name);
  const png = PNG.sync.read(source);
  assert.deepEqual([png.width, png.height], manifest.ui.items[name].size, name);
  assert.equal(paletteProblem(png, palette), null, name);
  frames.set(name, source);
  writeFileSync(join(staged, uiDir, `${name}.png`), source);
}

assert.ok(buildUiAtlas(staged, manifest));
const atlasPaths = [manifest.ui.atlas.png, manifest.ui.atlas.json];
for (const path of atlasPaths) assert.equal(digest(join(staged, path)), digest(join(preview, path)), path);

const protectedPaths = ['index.html', ...Object.values(manifest.atlases).flatMap(({ png, json }) => [png, json])];
const protectedDigests = Object.fromEntries(protectedPaths.map((path) => [path, digest(join(root, path))]));
const standins = readStandins(root);
standins.ui = standins.ui.filter((file) => !frames.has(basename(file, '.png')));
const finalManifest = before.replace(/("(kit_[a-z_]+)": \{[^\r\n]*"status": ")placeholder(?=")/g,
  (match, prefix, name) => frames.has(name) ? `${prefix}final` : match);
const finalItems = JSON.parse(finalManifest).ui.items;
for (const name of names) assert.equal(finalItems[name].status, 'final', name);

for (const [name, png] of frames) writeFileSync(join(root, uiDir, `${name}.png`), png);
for (const path of atlasPaths) cpSync(join(staged, path), join(root, path));
writeStandins(root, standins);
writeFileSync(manifestPath, finalManifest);

for (const [path, hash] of Object.entries(protectedDigests)) assert.equal(digest(join(root, path)), hash, path);
const atlas = Object.fromEntries(atlasPaths.map((path) => [path, digest(join(root, path))]));
writeFileSync(join(batch, 'installation-atlas-checks.json'), `${JSON.stringify({ atlas, protectedDigests }, null, 2)}\n`);
console.log(`Installed ${frames.size} approved kit frames and both byte-identical preview atlas files.`);
