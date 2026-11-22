// npm run art:pack -- ABn
// Installs a validated, approved batch: repacks every atlas group the batch touches into
// art/atlas/<group>-<n>.png + <group>.json. The whole group is repacked from the frames of its final keys:
// the new batch from art/inbox/<batch>/, the others from art/inbox/done/<batch>-r<revision>/ (PIPELINE.md).
// It does not change manifest.json or move the inbox: that is the next steps of PIPELINE.md *Installing*.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateInbox, validateManifest } from './lib.mjs';
import { packGroup } from './pack-lib.mjs';

const artDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../art');
const batch = process.argv[2];
if (!batch || batch.startsWith('-')) {
  console.error('Usage: npm run art:pack -- ABn');
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(path.join(artDir, 'manifest.json'), 'utf8'));
const problems = [...validateManifest(manifest).map((m) => `manifest: ${m}`), ...validateInbox(artDir, batch, manifest).errors.map((m) => `${batch}: ${m}`)];
if (problems.length) {
  for (const m of problems.slice(0, 40)) console.error(m);
  console.error(`art:pack stopped: ${problems.length} problem(s); fix them and run art:validate -- --inbox ${batch}.`);
  process.exit(1);
}
const delivery = JSON.parse(fs.readFileSync(path.join(artDir, 'inbox', batch, 'delivery.json'), 'utf8'));
const groups = [...new Set(delivery.keys.map((k) => manifest[k].atlas))];
const outDir = path.join(artDir, 'atlas');

for (const group of groups) {
  const keys = Object.keys(manifest).filter((k) => !manifest[k].legacy && manifest[k].atlas === group && (delivery.keys.includes(k) || manifest[k].status === 'final'));
  const dirFor = (k) => {
    if (delivery.keys.includes(k)) return path.join(artDir, 'inbox', batch, k);
    const e = manifest[k];
    return path.join(artDir, 'inbox', 'done', `${e.batch}-r${e.revision}`, k);
  };
  const batchFor = (key) => delivery.keys.includes(key) ? batch : manifest[key].batch;
  const r = packGroup(manifest, group, keys, dirFor, outDir, undefined, batchFor);
  console.log(`  ${group}: ${keys.length} key(s), ${r.frames} frames, ${r.pages} page(s), ${(r.bytes / 1048576).toFixed(1)} MB`);
}
console.log(`art:pack ok: ${batch} packed into art/atlas/. Next: set status final in manifest.json, run the checks, move the inbox to done.`);
