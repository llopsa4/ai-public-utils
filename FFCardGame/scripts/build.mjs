import { build } from 'vite';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(project, 'dist');
const published = resolve(project, 'build');

// Validate absolute generated-directory targets before Vite clears dist or we clean files.
if (relative(project, dist) !== 'dist' || relative(project, published) !== 'build') {
  throw new Error('Build output must remain inside FFCardGame.');
}

await build({ configFile: join(project, 'vite.config.ts') });
const files = await readdir(join(dist, 'build'));
if (files.some(name => name !== name.replace(/[^a-zA-Z0-9_.-]/g, ''))) {
  throw new Error('Unexpected generated asset path.');
}

await mkdir(published, { recursive: true });
for (const name of files) await cp(join(dist, 'build', name), join(published, name));
// Publish HTML last. Existing Pages hosting continues to serve FFCardGame/ directly.
await writeFile(join(project, 'index.html'), await readFile(join(dist, 'index.html')));
for (const name of await readdir(published)) {
  if (!files.includes(name) && /^[\w.-]+-[\w-]+\.(js|css|png|svg|webp)$/.test(name)) {
    await rm(join(published, name));
  }
}
console.log('Updated FFCardGame/index.html and build/ for branch-based GitHub Pages.');
