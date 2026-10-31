import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const project = fileURLToPath(new URL('..', import.meta.url));
const html = await readFile(resolve(project, 'index.html'), 'utf8');
assert.equal(html, await readFile(resolve(project, 'dist/index.html'), 'utf8'));
assert.ok(html.includes('id="root"'));
const links = [...html.matchAll(/(?:src|href)="(\.\/build\/[^"?#]+)"/g)].map(match => match[1]);
assert.ok(links.some(path => path.endsWith('.js')) && links.some(path => path.endsWith('.css')));
const files = await readdir(resolve(project, 'dist/build'));
assert.ok(files.some(name => name.startsWith('hero-') && name.endsWith('.png')));
assert.ok(files.some(name => name.startsWith('guardian-') && name.endsWith('.png')));
assert.ok(files.some(name => name.startsWith('kiln-hall-') && name.endsWith('.png')));
assert.ok(files.some(name => name.startsWith('card-atlas-') && name.endsWith('.png')));
for (const family of ['Cinzel', 'CormorantGaramond']) {
  assert.ok(files.some(name => name.startsWith(`${family}-`) && name.endsWith('.ttf')), `Missing font: ${family}`);
  assert.ok(files.some(name => name.startsWith(`${family}-OFL-`) && name.endsWith('.txt')), `Missing font license: ${family}`);
}
assert.deepEqual((await readdir(resolve(project, 'dist'))).sort(), ['build', 'index.html']);
for (const path of links) assert.ok(files.includes(path.slice('./build/'.length)));
for (const name of files) {
  assert.match(name, /^[\w.-]+\.(js|css|png|svg|webp|ttf|txt)$/);
  const built = await readFile(resolve(project, 'dist/build', name));
  assert.ok(built.equals(await readFile(resolve(project, 'build', name))), `Stale published asset: ${name}`);
  if (name.endsWith('.js') || name.endsWith('.css')) {
    assert.doesNotMatch(built.toString(), /(?:STORY|PLAN)\.md|\/local\/|sourceMappingURL=/);
    assert.doesNotMatch(built.toString(), /cooling-rig-fixture|signature-practice-fixture|Development fixture controls/, 'Development fixtures leaked into the shipped runtime');
  }
}
console.log('Build verified: relative entry URLs, published assets match, private documents excluded.');
