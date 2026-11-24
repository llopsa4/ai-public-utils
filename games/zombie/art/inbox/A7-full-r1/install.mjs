// Install the A7-full-r1 revision approved on 2026-11-24.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const review = 'art/inbox/A7-full-r1';
const candidate = join(review, 'candidate/fighter');
const preview = readFileSync(join(review, 'local-preview-root.txt'), 'utf8').trim();
const stage = mkdtempSync(join(tmpdir(), 'dead-woods-A7-install-'));
const batch = 'A7-approved-r1';
const manifestPath = 'art/manifest.json';
const original = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(original);
assert.equal(manifest.atlases.fighter.scale, 1);
assert.equal(manifest.figures.keys.fighter.status, 'final');
assert.deepEqual(manifest.keys.survivor_fighter.size, [24, 48]);
const expected = Object.entries(manifest.figures.keys.fighter.anims).flatMap(([anim, count]) =>
  ['se', 'ne'].flatMap(facing => Array.from({ length: count }, (_, i) => `${anim}_${facing}_${i}.png`))).sort();
assert.equal(expected.length, 76);
assert.deepEqual(readdirSync(candidate).sort(), expected);
assert.deepEqual(readdirSync('art/frames/fighter').sort(), expected);

const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const atlas = ['art/atlas/fighter.png', 'art/atlas/fighter.json'];
const framePaths = expected.map(file => 'art/frames/fighter/' + file);
const otherArt = ['art/atlas/scout.png', 'art/atlas/scout.json', 'art/atlas/zombies.png', 'art/atlas/zombies.json',
  'art/frames/standins.json', ...readdirSync('art/frames/scout').map(file => 'art/frames/scout/' + file)];
const untouched = Object.fromEntries(otherArt.map(path => [path, hash(path)]));
for (const file of expected) {
  assert.equal(hash(join(candidate, file)), hash(join(preview, 'art/frames/fighter', file)), `Candidate changed since preview: ${file}`);
}

for (const name of ['manifest.json', 'palette.json', 'frames', 'atlas']) {
  cpSync(join('art', name), join(stage, 'art', name), { recursive: true });
}
cpSync(candidate, join(stage, 'art/inbox', batch, 'fighter'), { recursive: true });
const updated = original.replace(/("fighter":\s*\{\s*"scale":\s*)1/, (_, prefix) => prefix + '2');
assert.equal(JSON.parse(updated).atlases.fighter.scale, 2);
writeFileSync(join(stage, manifestPath), updated);
for (const args of [['scripts/art/pack.mjs', batch], ['scripts/art/standins.mjs']]) {
  execFileSync(process.execPath, [...args, '--root', stage], { stdio: 'inherit' });
}
for (const path of atlas) assert.equal(hash(join(stage, path)), hash(join(preview, path)), `Atlas changed since preview: ${path}`);
for (const [path, digest] of Object.entries(untouched)) {
  assert.equal(hash(join(stage, path)), digest, `Unrelated staged art changed: ${path}`);
  assert.equal(hash(path), digest, `Unrelated working art changed: ${path}`);
}
assert.equal(readFileSync(manifestPath, 'utf8'), original);
const batchPath = join('art/inbox', batch, 'fighter');
mkdirSync(batchPath, { recursive: true });
for (const file of expected) copyFileSync(join(candidate, file), join(batchPath, file));
for (const path of [...framePaths, ...atlas, manifestPath]) copyFileSync(join(stage, path), path);
const frames = expected.map(file => {
  const sha256 = hash(join('art/frames/fighter', file));
  assert.equal(sha256, hash(join(candidate, file)));
  return { file, sha256 };
});
for (const path of atlas) assert.equal(hash(path), hash(join(preview, path)));
writeFileSync(join(review, 'installation-checks.json'), JSON.stringify({
  approved: '2026-11-24, user approved full-set installation',
  frames, atlasMatchesApprovedPreview: true, unrelatedArtUnchanged: untouched, publishedOutputRebuilt: false,
}, null, 2) + '\n');
console.log('Installed 76 approved frames. Fighter atlas matches the preview byte for byte.');
