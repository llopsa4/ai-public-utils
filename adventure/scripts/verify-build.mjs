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
for (const art of ['hero', 'keeper', 'door', 'suitcase', 'key', 'hall', 'street']) {
  assert.ok(built.some(n => n.startsWith(`${art}-`) && n.endsWith('.png')), `missing art: ${art}`);
}
for (const verb of ['look', 'open', 'close', 'take', 'use', 'talk', 'go', 'crouch', 'lie', 'stand']) {
  assert.ok(built.some(n => n.startsWith(`${verb}-`) && n.endsWith('.png')), `missing icon: ${verb}`);
}
const js = built.filter(n => n.endsWith('.js'));
for (const name of js) assert.doesNotMatch(await readFile(resolve(project, 'build', name), 'utf8'), /sourceMappingURL=/);
console.log(`Build verified: ${built.length} assets, relative URLs only.`);
