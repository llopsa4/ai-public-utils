// Builds with Vite into dist/, then publishes dist/index.html -> adventure/index.html and
// dist/build/* -> adventure/build/, because GitHub Pages serves the main branch as-is.
import { build } from 'vite';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(project, 'dist');
const published = resolve(project, 'build');
if (relative(project, dist) !== 'dist' || relative(project, published) !== 'build') {
  throw new Error('Build output must stay inside the adventure folder.');
}

await build({ configFile: join(project, 'vite.config.ts'), logLevel: 'warn' });
const files = await readdir(join(dist, 'build'));
const safeName = /^[\w.-]+$/;
for (const name of files) if (!safeName.test(name)) throw new Error(`Unexpected generated asset name: ${name}`);

await mkdir(published, { recursive: true });
for (const name of files) await cp(join(dist, 'build', name), join(published, name));
// Remove assets from earlier builds that the new index.html no longer references.
for (const name of await readdir(published)) {
  if (!files.includes(name)) await rm(join(published, name));
}
// Publish the page last so it never points at assets that are not there yet.
await writeFile(join(project, 'index.html'), await readFile(join(dist, 'index.html')));
console.log(`Published adventure/index.html and ${files.length} files in adventure/build/.`);
