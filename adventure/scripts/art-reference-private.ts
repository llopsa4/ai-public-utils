/** Explicitly requested private authoring input only; no game or public catalog dependency. */
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { renderReference, writeReferences, type ReferenceSpec } from './art-reference';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function privateReferenceLocation(specPath: string, root = ROOT): { source: string; output: string } {
  const source = realpathSync(resolve(root,specPath));
  const privateRoot = realpathSync(join(root,'private'));
  const rel = relative(privateRoot,source);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error('Private specification must be inside the permanent private directory');
  const output = join(dirname(source),'reference');
  // The user approved tracking this prologue-only pack. Other authoring inputs stay local.
  const approvedPrologue = rel.split(sep).join('/') === 'kofi1/spec.json';
  for (const path of approvedPrologue ? [] : [source,join(output,'INDEX.md')]) {
    try { execFileSync('git',['check-ignore','--quiet','--',path],{cwd:root,stdio:'pipe'}); }
    catch { throw new Error(`Private reference path is not git-ignored: ${path}`); }
  }
  return {source,output};
}

export async function runPrivateReferences(specPath: string, check = false, root = ROOT) {
  const location = privateReferenceLocation(specPath,root);
  const spec = JSON.parse(readFileSync(location.source,'utf8')) as ReferenceSpec;
  if (spec.private !== true) throw new Error('Private authoring input must declare private: true');
  const files = renderReference(spec,{outputDir:location.output,rootDir:root});
  writeReferences(files,{check});
  console.log(`${check?'Checked':'Generated'} private references: ${spec.rooms.length} rooms, ${spec.assets.length} assets. Public catalogs and gameplay unchanged.`);
  return files;
}
