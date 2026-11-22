// npm run art:validate [-- --inbox ABn]
// Without --inbox: checks art/manifest.json against SPEC.md. With it: also checks art/inbox/<batch>/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateInbox, validateManifest } from './lib.mjs';

const artDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../art');
const args = process.argv.slice(2);
const at = args.indexOf('--inbox');
const batch = at >= 0 ? args[at + 1] : null;
if (at >= 0 && !batch) {
  console.error('Usage: npm run art:validate [-- --inbox ABn]');
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(path.join(artDir, 'manifest.json'), 'utf8'));
const errors = validateManifest(manifest).map((m) => `manifest: ${m}`);
let frames = 0;
if (batch) {
  const r = validateInbox(artDir, batch, manifest);
  frames = r.frames;
  errors.push(...r.errors.map((m) => `${batch}: ${m}`));
}

const show = errors.slice(0, 60);
for (const m of show) console.error(m);
if (errors.length > show.length) console.error(`... and ${errors.length - show.length} more`);
if (errors.length) {
  console.error(`art:validate failed: ${errors.length} problem(s).`);
  process.exit(1);
}
const keys = Object.keys(manifest).length;
console.log(batch ? `art:validate ok: manifest (${keys} keys) and ${batch} (${frames} frames).` : `art:validate ok: manifest (${keys} keys).`);
