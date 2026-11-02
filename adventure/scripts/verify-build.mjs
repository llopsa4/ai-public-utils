// Checks that the published page only uses relative URLs into build/ and matches the fresh build.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('..', import.meta.url));
const html = await readFile(resolve(project, 'index.html'), 'utf8');
assert.equal(html, await readFile(resolve(project, 'dist/index.html'), 'utf8'), 'index.html is stale');
const links = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
for (const link of links) assert.match(link, /^\.\/build\/[\w.-]+$/, `non-relative or unexpected URL: ${link}`);
assert.ok(links.some(l => l.endsWith('.js')) && links.some(l => l.endsWith('.css')));

const built = await readdir(resolve(project, 'dist/build'));
const published = await readdir(resolve(project, 'build'));
assert.deepEqual(published.sort(), built.sort(), 'build/ differs from dist/build/');
for (const name of built) {
  const a = await readFile(resolve(project, 'dist/build', name));
  assert.ok(a.equals(await readFile(resolve(project, 'build', name))), `stale asset ${name}`);
  assert.match(name, /\.(js|css|png)$/, `unexpected asset type ${name}`);
}
for (const art of ['mara', 'mara-gauntlet', 'oren', 'nell', 'sweeper', 'valve', 'socket', 'rack', 'pantry-door', 'notebook', 'mara-room', 'firing-house', 'gallery', 'ashways', 'gauntlet', 'regulator', 'bread', 'scarf']) {
  assert.ok(built.some(n => n.startsWith(`${art}-`) && n.endsWith('.png')), `missing art: ${art}`);
}
for (const verb of ['look', 'open', 'close', 'take', 'use', 'talk', 'go', 'crouch', 'lie', 'stand']) {
  assert.ok(built.some(n => n.startsWith(`${verb}-`) && n.endsWith('.png')), `missing icon: ${verb}`);
}
const js = built.filter(n => n.endsWith('.js'));
for (const name of js) assert.doesNotMatch(await readFile(resolve(project, 'build', name), 'utf8'), /sourceMappingURL=/);
// Size budget: everything, and what the first room needs (shared art plus the tent).
const { statSync } = await import('node:fs');
const size = name => statSync(resolve(project, 'build', name)).size;
const total = built.reduce((sum, n) => sum + size(n), 0);
const perRoom = /^(mara-room|firing-house|gallery|ashways|hall-left|hall-right|gallery-railing)-/;
const firstLoad = built.filter(n => !perRoom.test(n)).reduce((sum, n) => sum + size(n), 0);
const MB = 1024 * 1024;
assert.ok(total < 4.5 * MB, `build is ${(total / MB).toFixed(2)} MB (budget 4.5 MB)`);
assert.ok(firstLoad < 3 * MB, `first load is ${(firstLoad / MB).toFixed(2)} MB (budget 3 MB)`);
console.log(`Build verified: ${built.length} assets, relative URLs only, ${(total / MB).toFixed(2)} MB total, ${(firstLoad / MB).toFixed(2)} MB before the first room.`);
