import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const review = 'art/inbox/A5-rotting-r1';
const candidate = join(review, 'candidate');
const preview = readFileSync(join(review, 'local-preview-root.txt'), 'utf8').trim();
const stage = mkdtempSync(join(tmpdir(), 'dead-woods-A5-rotting-install-'));
const manifestPath = 'art/manifest.json';
const original = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(original);
const atlas = manifest.atlases.zombies_rotting;
const atlasPaths = [atlas.png, atlas.json];
const standinsPath = 'art/frames/standins.json';
const beforeStandins = JSON.parse(readFileSync(standinsPath, 'utf8'));
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const frames = [];
assert.equal(atlas.scale, 2);
for (const body of atlas.keys) {
  const figure = manifest.figures.keys[body];
  assert.equal(figure.status, 'placeholder');
  const expected = Object.entries(figure.anims).flatMap(([anim, count]) =>
    manifest.figures.drawnFacings.flatMap(facing => Array.from({ length: count }, (_, i) => `${anim}_${facing}_${i}.png`))).sort();
  assert.equal(expected.length, 52);
  assert.deepEqual(readdirSync(join(candidate, body)).sort(), expected);
  for (const file of expected) {
    const installed = join('art/frames', body, file);
    const sha256 = hash(join(candidate, body, file));
    assert.equal(sha256, hash(join(preview, installed)), `Candidate changed since preview: ${installed}`);
    frames.push({ body, file, installed, sha256 });
  }
}
assert.equal(frames.length, 156);
const unrelated = {};
const capture = path => { unrelated[path] = hash(path); };
for (const [group, def] of Object.entries(manifest.atlases)) {
  if (group === 'zombies_rotting') continue;
  capture(def.png);
  capture(def.json);
  for (const body of def.keys) {
    const folder = join('art/frames', body);
    for (const file of readdirSync(folder)) capture(join(folder, file));
  }
}
capture('index.html');
for (const file of readdirSync('build')) capture(join('build', file));
for (const name of ['manifest.json', 'palette.json', 'frames', 'atlas']) {
  cpSync(join('art', name), join(stage, 'art', name), { recursive: true });
}
cpSync(candidate, join(stage, 'art/inbox/A5-rotting-r1'), { recursive: true });
const updated = original.replace(/("zombie_rotting_[abc]":\s*\{[^}]*?"status":\s*)"placeholder"/g, '$1"final"');
const expectedManifest = JSON.parse(original);
for (const body of atlas.keys) expectedManifest.figures.keys[body].status = 'final';
assert.deepEqual(JSON.parse(updated), expectedManifest);
writeFileSync(join(stage, manifestPath), updated);
execFileSync(process.execPath, ['scripts/art/pack.mjs', 'A5-rotting-r1', '--root', stage], { stdio: 'inherit' });
const atlases = atlasPaths.map(file => {
  const sha256 = hash(join(stage, file));
  assert.equal(sha256, hash(join(preview, file)), `Installed atlas differs from approved preview: ${file}`);
  return { file, sha256 };
});
for (const frame of frames) assert.equal(hash(join(stage, frame.installed)), frame.sha256);
for (const [file, digest] of Object.entries(unrelated)) {
  if (file.startsWith('art')) assert.equal(hash(join(stage, file)), digest, `Unrelated staged file changed: ${file}`);
  assert.equal(hash(file), digest, `Unrelated working file changed: ${file}`);
}
const afterStandins = JSON.parse(readFileSync(join(stage, standinsPath), 'utf8'));
for (const body of atlas.keys) delete beforeStandins[body];
assert.deepEqual(afterStandins, beforeStandins);
assert.equal(readFileSync(manifestPath, 'utf8'), original, 'Manifest changed during staging');

for (const { installed } of frames) copyFileSync(join(stage, installed), installed);
for (const file of [...atlasPaths, standinsPath, manifestPath]) copyFileSync(join(stage, file), file);
for (const { installed, sha256 } of frames) assert.equal(hash(installed), sha256);
for (const { file, sha256 } of atlases) assert.equal(hash(file), sha256);
for (const [file, digest] of Object.entries(unrelated)) assert.equal(hash(file), digest);
assert.deepEqual(JSON.parse(readFileSync(manifestPath, 'utf8')), expectedManifest);
writeFileSync(join(review, 'installation-checks.json'), JSON.stringify({
  approvedBatch: 'A5-rotting-r1', approvedOn: '2026-11-24', frames, atlases,
  manifestFinal: atlas.keys, unrelatedFilesVerified: Object.keys(unrelated).length, publishedOutputRebuilt: false,
}, null, 2) + '\n');
console.log('Installed 156 rotting frames and verified both atlas files byte-for-byte against the approved preview.');
