import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { PNG } from 'pngjs';
import { buildUiAtlas, loadPalette, paletteProblem, readStandins, writeStandins } from '../../../scripts/art/lib.mjs';

const batch = import.meta.dirname;
const root = join(batch, '../../..');
const preview = readFileSync(join(batch, 'local-preview-root.txt'), 'utf8').trim();
const reviewed = JSON.parse(readFileSync(join(batch, 'pack-checks.json'), 'utf8')).portraits;
const manifestPath = 'art/manifest.json';
const standinsPath = 'art/frames/standins.json';
const originalManifest = readFileSync(join(root, manifestPath), 'utf8');
const manifest = JSON.parse(originalManifest);
const groups = new Set(['portrait', 'portrait_small']);
const names = Object.keys(manifest.ui.items).filter((name) => groups.has(manifest.ui.items[name].group));
assert.deepEqual(names.toSorted(), Object.keys(reviewed).toSorted());

const sha = (data) => createHash('sha256').update(data).digest('hex');
const digest = (path) => sha(readFileSync(path));
const palette = loadPalette(root);
assert.ok(palette);

const stage = mkdtempSync(join(tmpdir(), 'dead-woods-install-a10-'));
const uiDir = manifest.ui.dir;
cpSync(join(root, uiDir), join(stage, uiDir), { recursive: true });
const outputs = new Map();
const textures = {};
for (const name of names) {
  const path = join(uiDir, `${name}.png`);
  const data = readFileSync(join(batch, 'candidate/ui', `${name}.png`));
  const hash = sha(data);
  assert.equal(hash, reviewed[name].sha256, name);
  const png = PNG.sync.read(data);
  assert.deepEqual([png.width, png.height], manifest.ui.items[name].size, name);
  assert.equal(paletteProblem(png, palette), null, name);
  writeFileSync(join(stage, path), data);
  outputs.set(path, data);
  textures[name] = hash;
}

assert.ok(buildUiAtlas(stage, manifest));
const atlas = {};
for (const path of [manifest.ui.atlas.png, manifest.ui.atlas.json]) {
  const data = readFileSync(join(stage, path));
  assert.equal(sha(data), digest(join(preview, path)), path);
  outputs.set(path, data);
  atlas[path] = sha(data);
}

const standins = readStandins(root);
const approved = new Set(names);
standins.ui = (standins.ui ?? []).filter((file) => !approved.has(basename(file, '.png')));
writeStandins(stage, standins);
outputs.set(standinsPath, readFileSync(join(stage, standinsPath)));

const nextManifest = originalManifest.replace(
  /("(portrait_[a-z_]+)": \{[^\r\n]*"status": ")placeholder(?=")/g,
  (match, prefix, name) => approved.has(name) ? `${prefix}final` : match,
);
const installedManifest = JSON.parse(nextManifest);
for (const name of names) assert.equal(installedManifest.ui.items[name].status, 'final', name);
outputs.set(manifestPath, Buffer.from(nextManifest));

const protectedPaths = [
  'index.html',
  ...readdirSync(join(root, 'build')).map((file) => join('build', file)),
  ...Object.values(manifest.atlases).flatMap(({ png, json }) => [png, json]),
  ...Object.keys(manifest.ui.items).filter((name) => !approved.has(name)).map((name) => join(uiDir, `${name}.png`)),
];
const protectedDigests = Object.fromEntries(protectedPaths.map((path) => [path, digest(join(root, path))]));
const backups = new Map([...outputs.keys()].map((path) => [path, readFileSync(join(root, path))]));
const written = [];
try {
  for (const [path, data] of outputs) {
    written.push(path);
    writeFileSync(join(root, path), data);
    assert.equal(digest(join(root, path)), sha(data), path);
  }
  for (const [path, hash] of Object.entries(protectedDigests)) assert.equal(digest(join(root, path)), hash, path);
} catch (error) {
  for (const path of written.reverse()) writeFileSync(join(root, path), backups.get(path));
  throw error;
}

writeFileSync(join(batch, 'installation-checks.json'), `${JSON.stringify({ textures, atlas, protectedDigests }, null, 2)}\n`);
console.log(`Installed ${names.length} approved portraits and the byte-identical reviewed UI atlas pair.`);
