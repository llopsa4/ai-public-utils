// npm run art:standins [-- --no-pack]
// Writes a grey stand-in for every frame of every manifest key into art/standins/<key>/ (git-ignored),
// then packs them into art/standins/atlas/<group>-<n>.png + <group>.json (what `?standins` loads, AC3).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GROUPS } from './lib.mjs';
import { packGroup } from './pack-lib.mjs';
import { writeStandins } from './standin-lib.mjs';

const artDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../art');
const out = path.join(artDir, 'standins');
const manifest = JSON.parse(fs.readFileSync(path.join(artDir, 'manifest.json'), 'utf8'));

fs.rmSync(path.join(out, 'atlas'), { recursive: true, force: true });
const files = writeStandins(manifest, out);
console.log(`art:standins wrote ${files} grey frames into art/standins/.`);
if (process.argv.includes('--no-pack')) process.exit(0);

let pages = 0;
let bytes = 0;
for (const group of GROUPS) {
  const keys = Object.keys(manifest).filter((k) => !manifest[k].legacy && manifest[k].atlas === group);
  if (!keys.length) continue;
  const r = packGroup(manifest, group, keys, (k) => path.join(out, k), path.join(out, 'atlas'));
  console.log(`  ${group}: ${r.frames} frames, ${r.pages} page(s), ${(r.bytes / 1048576).toFixed(1)} MB`);
  pages += r.pages;
  bytes += r.bytes;
}
console.log(`art:standins packed ${pages} page(s) (budget 16), ${(bytes / 1048576).toFixed(1)} MB, into art/standins/atlas/.`);
